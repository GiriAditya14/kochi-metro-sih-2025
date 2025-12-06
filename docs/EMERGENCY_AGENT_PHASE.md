# Emergency Scenario Handling - AI Agent Phase Requirements

## Overview

This document outlines the requirements for integrating emergency scenario handling into the AI Agent Phase. The emergency handling system requires specialized agent behavior that differs from normal planning workflows.

---

## 1. Emergency Detection & Agent Triggers

### 1.1 Emergency Event Flow

```
IoT Sensor Alert → Backend Emergency Service → Emergency Log Created → 
Agent Phase Triggered (EMERGENCY MODE) → Quick Replanning → Plan Generated
```

### 1.2 Agent Phase Entry Points

#### Primary Trigger: Emergency Breakdown Alert
- **Endpoint**: `POST /api/v1/emergency/breakdown`
- **Agent Trigger**: When backend receives emergency breakdown, it should trigger agent replanning
- **Mode**: `EMERGENCY_MODE` (different from normal planning)

#### Secondary Trigger: Cascading Crisis Detection
- **Condition**: 3+ trains withdrawn within 30 minutes
- **Agent Trigger**: Full fleet reoptimization workflow
- **Mode**: `CRISIS_MODE` (even faster, more aggressive optimization)

---

## 2. Modified Agent Behavior for Emergency Mode

### 2.1 Agent Eligibility Criteria Relaxation

| Criterion | Normal Planning | Emergency Mode | Crisis Mode |
|-----------|----------------|----------------|-------------|
| **Fitness Certificate Validity** | ≥3 days | ≥1 day | ≥1 day |
| **Critical Job Cards (non-blocking)** | Max 2 | Max 3 | Max 3 |
| **Mileage Above Average** | Deprioritize | Ignore | Ignore |
| **Cleaning Overdue** | Flag for scheduling | Ignore | Ignore |
| **Branding Priority** | High weight | Low weight | Very low weight |
| **Decision Time** | 10 minutes | <5 minutes | <3 minutes |
| **Certificate Expiry Tolerance** | 7-14 days warning | 1 day minimum | 1 day minimum |
| **Preventive Maintenance Deferral** | Not allowed | Up to 7 days | Up to 10 days |

### 2.2 Agent Prompt Modifications

#### Emergency Fitness Certificate Agent

```python
EMERGENCY_FITNESS_AGENT_PROMPT = """
You are operating in EMERGENCY MODE. A train has broken down during service.

MODIFIED RULES FOR EMERGENCY:
- Accept certificates valid for ≥1 day (normal: ≥3 days)
- Prioritize fastest deployment over optimal fitness
- Flag risks but don't auto-reject borderline cases
- Output decision in <30 seconds

Your goal: Find a serviceable train FAST, not perfect.

Emergency Context:
- Withdrawn Train: {withdrawn_train_id}
- Affected Route: {route_affected}
- Urgency: HIGH - Service disruption in progress

Evaluate standby trains with relaxed criteria. Speed is critical.
"""
```

#### Emergency Job Card Agent

```python
EMERGENCY_JOB_CARD_AGENT_PROMPT = """
EMERGENCY MODE: Relaxed criteria for emergency deployment.

RULES:
- ONLY reject if job cards explicitly mark blocking_service = TRUE
- Allow up to 3 critical non-blocking jobs (normal: max 2)
- Preventive maintenance can be deferred by 7 days
- Speed is critical - don't overanalyze

Your goal: Get a train on route within 15 minutes.

Emergency Context:
- Service gap: {service_gap_minutes} minutes and growing
- Passenger impact: Increasing every minute
- Priority: Fastest viable train, not perfect train
"""
```

#### Emergency Branding Agent

```python
EMERGENCY_BRANDING_AGENT_PROMPT = """
EMERGENCY MODE: Branding priorities relaxed for service restoration.

RULES:
- Branding contracts are secondary to service availability
- SLA breach risk acceptable if alternative unavailable
- Weight branding score at 5% (normal: 15%)
- Document branding impact but don't block deployment

Emergency Context:
- Service restoration takes precedence over advertising contracts
- Document branding impact for post-emergency review
"""
```

#### Emergency Mileage Balancing Agent

```python
EMERGENCY_MILEAGE_AGENT_PROMPT = """
EMERGENCY MODE: Mileage balancing ignored for immediate deployment.

RULES:
- Ignore mileage above average for emergency replacements
- Long-term balance less important than immediate service
- Weight mileage score at 5% (normal: 15%)

Emergency Context:
- Service restoration critical
- Mileage imbalance can be corrected after emergency
"""
```

#### Emergency Cleaning Agent

```python
EMERGENCY_CLEANING_AGENT_PROMPT = """
EMERGENCY MODE: Cleaning requirements relaxed.

RULES:
- Overdue cleaning acceptable if last cleaning within 48 hours
- Skip scheduled cleaning if train is otherwise ready
- Weight cleaning score at 3% (normal: 10%)

Emergency Context:
- Passenger safety through service availability > cleaning schedule
- Document cleaning deferral for follow-up
"""
```

#### Emergency Stabling Geometry Agent

```python
EMERGENCY_STABLING_AGENT_PROMPT = """
EMERGENCY MODE: Optimize for speed, not optimal positioning.

RULES:
- Longer shunting acceptable (up to 20 minutes vs normal 10 min)
- Accept suboptimal positions if train is ready
- Weight stabling score at 5% (normal: 15%)

Emergency Context:
- Service gap more costly than extra shunting time
- Prioritize fastest deployment
"""
```

---

## 3. Emergency Workflow Orchestration

### 3.1 LangGraph Emergency Workflow

```python
async def emergency_replanning_workflow(withdrawn_train_id: str, emergency_log_id: int):
    """
    Emergency mode: Prioritize speed over comprehensive analysis
    Goal: Identify replacement train within 5 minutes
    """
    
    # STATE 1: Emergency Initialization
    state = {
        'mode': 'EMERGENCY',
        'withdrawn_train_id': withdrawn_train_id,
        'emergency_log_id': emergency_log_id,
        'start_time': datetime.now(),
        'timeout_seconds': 300,  # 5 minutes max
    }
    
    # STATE 2: Parallel Quick Checks (FASTER than normal)
    # Execute agents in parallel but with timeouts
    agent_results = await asyncio.gather(
        emergency_fitness_agent.quick_check(state),
        emergency_job_card_agent.quick_check(state),
        emergency_branding_agent.quick_check(state),
        emergency_mileage_agent.quick_check(state),
        emergency_cleaning_agent.quick_check(state),
        emergency_stabling_agent.quick_check(state),
        return_exceptions=True,  # Don't fail if one agent times out
    )
    
    # STATE 3: Fast Eligibility Filtering
    eligible_trains = []
    for train in standby_trains:
        if emergency_eligibility_check(train, agent_results):
            eligible_trains.append({
                'train_id': train.train_number,
                'readiness_minutes': calculate_emergency_readiness(train),
                'confidence': 0.85,  # Lower threshold
            })
    
    # STATE 4: Sort by Readiness (Fastest First)
    eligible_trains.sort(key=lambda t: t['readiness_minutes'])
    
    # STATE 5: Generate Emergency Plan
    if eligible_trains:
        best_option = eligible_trains[0]
        plan = generate_emergency_plan(best_option, withdrawn_train_id)
        
        # STATE 6: Submit Plan (FAST - minimal validation)
        await backend.submit_emergency_plan(plan, emergency_log_id)
        
        return plan
    else:
        # STATE 7: Crisis Mode Activation
        await activate_crisis_mode_workflow(withdrawn_train_id)
        return None
```

### 3.2 Crisis Mode Workflow

```python
async def crisis_mode_workflow(withdrawn_trains: List[str]):
    """
    Crisis mode: Multiple trains down - full fleet reoptimization
    Goal: Restore service with entire fleet reassessment
    """
    
    # STATE 1: Full Fleet Assessment
    all_trains = await get_all_trains()
    in_service = [t for t in all_trains if t.status == 'IN_SERVICE']
    available = [t for t in all_trains if t.status in ('STANDBY', 'DEPOT_READY')]
    withdrawn = [t for t in all_trains if t.status == 'EMERGENCY_WITHDRAWN']
    
    # STATE 2: Critical Route Identification
    critical_routes = identify_critical_routes()  # Peak demand routes
    minimum_trains_needed = calculate_minimum_fleet(critical_routes)
    service_deficit = minimum_trains_needed - (len(in_service) + len(available))
    
    # STATE 3: Action Planning
    actions = []
    
    # Action 1: Deploy ALL available trains (with emergency criteria)
    for train in available:
        if await quick_emergency_eligibility_check(train):
            actions.append({
                'action': 'DEPLOY_STANDBY',
                'train_id': train.train_number,
                'priority': 'IMMEDIATE'
            })
    
    # Action 2: Reassign trains from low-priority routes
    if service_deficit > 0:
        low_priority_trains = get_trains_on_low_demand_routes(in_service)
        for train in low_priority_trains[:service_deficit]:
            actions.append({
                'action': 'REASSIGN_ROUTE',
                'train_id': train.train_number,
                'from_route': train.current_route,
                'to_route': critical_routes[0],
            })
    
    # STATE 4: Submit Crisis Plan
    crisis_plan = {
        'mode': 'CRISIS_OPTIMIZATION',
        'withdrawn_trains': len(withdrawn),
        'actions': actions,
    }
    
    await backend.submit_crisis_plan(crisis_plan)
    return crisis_plan
```

---

## 4. Agent API Endpoints Required

### 4.1 Emergency Replanning Endpoint

**POST** `/api/v1/agents/emergency/replan`

```json
Request Body:
{
  "emergencyLogId": 123,
  "withdrawnTrainId": "KMRL-007",
  "affectedRoute": "Route 2",
  "mode": "EMERGENCY",  // or "CRISIS"
  "urgency": "HIGH"
}

Response:
{
  "success": true,
  "plan": {
    "replacement_train": "KMRL-019",
    "deployment_time_minutes": 12,
    "confidence_score": 0.87,
    "reasoning": [...],
    "execution_steps": [...],
    "fallback_options": [...]
  },
  "processing_time_seconds": 4.2
}
```

### 4.2 Quick Eligibility Check Endpoint

**POST** `/api/v1/agents/emergency/quick-check`

```json
Request Body:
{
  "trainIds": ["KMRL-019", "KMRL-022", "KMRL-015"],
  "mode": "EMERGENCY"
}

Response:
{
  "eligible_trains": [
    {
      "train_id": "KMRL-019",
      "readiness_minutes": 12,
      "fitness_score": 85,
      "job_card_score": 90,
      "overall_eligible": true
    }
  ],
  "processing_time_seconds": 1.5
}
```

### 4.3 Crisis Mode Optimization Endpoint

**POST** `/api/v1/agents/emergency/crisis-optimize`

```json
Request Body:
{
  "withdrawnTrains": ["KMRL-007", "KMRL-012", "KMRL-023"],
  "criticalRoutes": ["Route 1", "Route 2"],
  "serviceDeficit": 3
}

Response:
{
  "crisis_plan": {
    "actions": [...],
    "service_recovery_estimate": "2 hours",
    "projected_punctuality": "97.8%"
  }
}
```

---

## 5. Agent Decision Time Requirements

### 5.1 Emergency Mode Targets

| Phase | Target Time | Maximum Time |
|-------|-------------|--------------|
| **Agent Parallel Execution** | 30 seconds | 60 seconds |
| **Eligibility Filtering** | 10 seconds | 20 seconds |
| **Plan Generation** | 10 seconds | 20 seconds |
| **Total Workflow** | **<5 minutes** | **<7 minutes** |

### 5.2 Crisis Mode Targets

| Phase | Target Time | Maximum Time |
|-------|-------------|--------------|
| **Full Fleet Assessment** | 45 seconds | 90 seconds |
| **Route Reassignment Planning** | 20 seconds | 40 seconds |
| **Crisis Plan Generation** | 15 seconds | 30 seconds |
| **Total Workflow** | **<3 minutes** | **<5 minutes** |

---

## 6. Modified Scoring Algorithms

### 6.1 Emergency Composite Score

```
Emergency Composite Score = 
  (Fitness_Score × 0.30) +  # Higher weight for safety
  (Job_Card_Score × 0.25) + # Higher weight for reliability
  (Branding_Score × 0.05) + # Lower weight
  (Mileage_Score × 0.05) +  # Lower weight
  (Cleaning_Score × 0.03) + # Lower weight
  (Stabling_Score × 0.05) + # Lower weight
  (Readiness_Bonus × 0.27)  # Speed bonus (inverse of readiness time)
```

### 6.2 Readiness Bonus Calculation

```python
def calculate_readiness_bonus(readiness_minutes: int) -> float:
    """
    Bonus for faster deployment
    - 15 minutes or less: 27 points
    - 16-20 minutes: 20 points
    - 21-25 minutes: 10 points
    - 26+ minutes: 0 points
    """
    if readiness_minutes <= 15:
        return 27.0
    elif readiness_minutes <= 20:
        return 20.0
    elif readiness_minutes <= 25:
        return 10.0
    else:
        return 0.0
```

---

## 7. Integration with Backend Emergency Service

### 7.1 Agent Callback Flow

```python
# Backend triggers agent replanning
async def trigger_emergency_replanning(train_id: str, emergency_log_id: int):
    # Call agent emergency endpoint
    response = await agent_client.post('/api/v1/agents/emergency/replan', {
        'emergencyLogId': emergency_log_id,
        'withdrawnTrainId': train_id,
        'mode': 'EMERGENCY',
    })
    
    if response.success:
        # Save plan to database
        await prisma.emergencyPlan.create({
            data: {
                emergencyLogId: emergency_log_id,
                ...response.plan,
            }
        })
        
        # Send notification
        await notification_service.send_critical_alert(...)
```

### 7.2 Real-time Updates

- Agents should emit progress updates via WebSocket during emergency processing
- Frontend displays: "Emergency replanning in progress... (2/6 agents completed)"

---

## 8. Fallback and Error Handling

### 8.1 Agent Timeout Handling

```python
# If agent times out during emergency:
- Use cached/last-known data if available
- Proceed with available agent outputs
- Flag incomplete analysis
- Don't block emergency deployment if critical agents (Fitness, Job Card) pass
```

### 8.2 No Eligible Train Found

```python
if no_eligible_trains_found:
    # Activate crisis mode
    crisis_plan = await crisis_mode_workflow([withdrawn_train_id])
    
    # Notify management
    await notify_management({
        'severity': 'CRISIS',
        'message': 'No immediate replacement available. Full fleet reoptimization required.',
    })
```

---

## 9. Testing Requirements

### 9.1 Emergency Mode Test Cases

1. **Single Train Breakdown**
   - Train with valid replacement available
   - Train with borderline replacement (should still deploy)
   - Train with no replacement (crisis mode trigger)

2. **Agent Timeout Simulation**
   - Simulate agent slow response
   - Verify system continues with available data

3. **Cascading Failure**
   - Simulate 3 trains breaking down
   - Verify crisis mode activation
   - Verify full fleet reoptimization

### 9.2 Performance Tests

- Emergency replanning completes in <5 minutes
- Crisis mode completes in <3 minutes
- Agent responses within timeout limits
- System handles concurrent emergencies

---

## 10. Monitoring and Metrics

### 10.1 Emergency Metrics to Track

- **Emergency Response Time**: Time from alert to plan generation
- **Agent Processing Time**: Time each agent takes in emergency mode
- **Replacement Success Rate**: % of emergencies with successful replacements
- **Crisis Mode Frequency**: How often crisis mode is triggered
- **Service Recovery Time**: Time to restore normal operations

### 10.2 Alert Thresholds

- Emergency response time > 7 minutes → Alert
- Crisis mode triggered → Immediate alert to management
- Agent timeout > 3 times in 1 hour → Alert

---

## 11. Summary: Key Differences from Normal Planning

| Aspect | Normal Planning | Emergency Mode |
|--------|----------------|----------------|
| **Goal** | Optimal solution | Fastest viable solution |
| **Time Budget** | 10 minutes | <5 minutes |
| **Criteria Strictness** | Strict | Relaxed |
| **Certificate Validity** | ≥3 days | ≥1 day |
| **Job Card Tolerance** | Max 2 critical | Max 3 critical |
| **Branding Weight** | 15% | 5% |
| **Mileage Weight** | 15% | 5% |
| **Fallback Options** | 2-3 | 3-5 (more critical) |
| **Reasoning Detail** | Comprehensive | Streamlined |
| **Error Handling** | Fail-safe | Proceed with partial data |

---

## 12. Implementation Checklist

- [ ] Modify all 6 agent prompts for emergency mode
- [ ] Implement emergency workflow in LangGraph
- [ ] Create emergency agent API endpoints
- [ ] Implement quick eligibility checks
- [ ] Add emergency scoring algorithm
- [ ] Implement crisis mode workflow
- [ ] Add timeout handling and error recovery
- [ ] Create WebSocket progress updates
- [ ] Add monitoring and metrics
- [ ] Write integration tests
- [ ] Performance testing (<5 min target)
- [ ] Documentation for operators

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-06  
**Related Documents**: 
- `BACKEND_PHASE.md` (Emergency endpoints)
- `AGENT_PHASE.md` (Normal agent behavior)


