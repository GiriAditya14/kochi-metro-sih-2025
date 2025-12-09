"""
AI Copilot Service - Deep Gemini Integration for KMRL
Provides AI-powered explanations, recommendations, and natural language understanding.
"""

import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

from sqlalchemy.orm import Session

from ..models import (
    Train, NightPlan, PlanAssignment, AssignmentType,
    FitnessCertificate, JobCard, BrandingContract,
    MileageMeter, CleaningRecord, Alert, JobStatus
)
from ..config import get_gemini_api_key, is_ai_enabled


class AICopilot:
    """
    AI-powered copilot for KMRL supervisors.
    Uses Google Gemini for intelligent decision support.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.model = None
        self.ai_enabled = False
        
        api_key = get_gemini_api_key()
        if GEMINI_AVAILABLE and api_key and is_ai_enabled():
            try:
                genai.configure(api_key=api_key)
                # Use gemini-2.0-flash-exp for fast responses (gemini-pro deprecated)
                # Also supports: gemini-1.5-pro, gemini-1.5-flash
                self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
                self.ai_enabled = True
                print("✓ Gemini AI initialized successfully (gemini-2.0-flash-exp)")
            except Exception as e:
                print(f"✗ Failed to initialize Gemini: {e}")
        else:
            print("! AI features disabled - Set GEMINI_API_KEY environment variable")
        
        # System context for KMRL domain
        self.system_context = """You are KMRL Copilot, an expert AI assistant for Kochi Metro Rail Limited train operations.

CONTEXT:
- You help supervisors make nightly train induction decisions (21:00-23:00)
- Fleet: 25 trainsets at Muttom Depot, expanding to 40 trains and 2 depots
- Each train needs clearances from: Rolling Stock, Signalling, and Telecom departments

DECISION TYPES:
1. SERVICE - Revenue service tomorrow (assigned to timetable trips)
2. STANDBY - Backup trains ready at depot
3. IBL (Inspection Bay Line) - Maintenance, cleaning, or detailing

KEY FACTORS:
1. Fitness Certificates - Must be valid for all 3 departments
2. Job Cards (Maximo) - Safety-critical jobs block service
3. Branding SLAs - Advertising contracts with exposure requirements
4. Mileage - Balance km across fleet, respect maintenance thresholds
5. Cleaning - Max 2 days without cleaning, VIP prep requirements
6. Stabling Position - Minimize shunting moves

RULES:
- Never assign trains with expired critical certificates to SERVICE
- Safety-critical open jobs block SERVICE assignment
- Explain every decision with specific data points
- Be concise but thorough
- Support Hindi, Malayalam, and English

Always provide actionable, specific recommendations backed by data."""

    async def generate_plan_explanation(self, plan: NightPlan, assignments: List[Dict]) -> str:
        """Generate comprehensive AI explanation for an entire induction plan"""
        
        # Build context about the plan
        plan_summary = f"""
INDUCTION PLAN: {plan.plan_id}
Date: {plan.plan_date.strftime('%Y-%m-%d') if plan.plan_date else 'N/A'}
Depot: {plan.depot_id}

ASSIGNMENT SUMMARY:
- Service: {plan.trains_in_service} trains
- Standby: {plan.trains_standby} trains
- IBL (Maintenance/Cleaning): {plan.trains_ibl} trains
- Out of Service: {plan.trains_out_of_service} trains

OPTIMIZATION METRICS:
- Overall Score: {plan.optimization_score:.1f if plan.optimization_score else 'N/A'}
- Hard Constraints Violated: {plan.hard_constraints_violated or 0}
"""
        
        # Add details about each assignment category
        service_trains = [a for a in assignments if a.get('assignment_type') == 'SERVICE']
        ibl_trains = [a for a in assignments if 'IBL' in (a.get('assignment_type') or '')]
        
        service_details = "\nSERVICE ROSTER (by priority):\n"
        for a in sorted(service_trains, key=lambda x: x.get('service_rank') or 999)[:10]:
            train_id = a.get('train', {}).get('train_id', f"Train #{a.get('train_id')}")
            service_details += f"  {a.get('service_rank', '-')}. {train_id} - Score: {a.get('overall_score', 0):.1f}\n"
        
        ibl_details = "\nIBL ASSIGNMENTS:\n"
        for a in ibl_trains[:5]:
            train_id = a.get('train', {}).get('train_id', f"Train #{a.get('train_id')}")
            ibl_details += f"  - {train_id}: {a.get('assignment_reason', 'Maintenance required')}\n"
        
        prompt = f"""{self.system_context}

TASK: Generate a comprehensive explanation for this induction plan that a supervisor can present to management.

{plan_summary}
{service_details}
{ibl_details}

Provide:
1. EXECUTIVE SUMMARY (2-3 sentences)
2. KEY DECISIONS explained with reasoning
3. RISK FACTORS to monitor
4. RECOMMENDATIONS for tomorrow

Format the response clearly with headers. Be specific and data-driven."""

        return await self._generate_response(prompt)

    async def generate_assignment_explanation(self, assignment: Dict, train_data: Dict) -> str:
        """Generate detailed AI explanation for a single train assignment"""
        
        train = train_data.get('train', {})
        certs = train_data.get('fitness_certificates', [])
        jobs = train_data.get('job_cards', [])
        branding = train_data.get('branding_contracts', [])
        mileage = train_data.get('mileage', {})
        cleaning = train_data.get('cleaning', {})
        
        # Build comprehensive context
        context = f"""
TRAIN: {train.get('train_id', 'Unknown')}
Assignment: {assignment.get('assignment_type', 'Unknown')}
Service Rank: {assignment.get('service_rank', 'N/A')}
Overall Score: {assignment.get('overall_score', 0):.1f}/100

SCORES BREAKDOWN:
- Fitness: {assignment.get('fitness_score', 0):.1f}/100
- Maintenance: {assignment.get('maintenance_score', 0):.1f}/100
- Branding: {assignment.get('branding_score', 0):.1f}/100
- Mileage: {assignment.get('mileage_score', 0):.1f}/100
- Cleaning: {assignment.get('cleaning_score', 0):.1f}/100
- Position: {assignment.get('shunting_score', 0):.1f}/100

FITNESS CERTIFICATES:
"""
        for cert in certs:
            context += f"  - {cert.get('department')}: {cert.get('status')} (expires in {cert.get('hours_until_expiry', 0):.1f}h)\n"
        
        context += "\nOPEN JOB CARDS:\n"
        open_jobs = [j for j in jobs if j.get('status') != 'CLOSED']
        for job in open_jobs[:5]:
            safety = "⚠️ SAFETY CRITICAL" if job.get('safety_critical') else ""
            context += f"  - {job.get('title')} [{job.get('status')}] {safety}\n"
        
        if branding:
            context += "\nBRANDING CONTRACTS:\n"
            for b in branding:
                context += f"  - {b.get('brand_name')}: {b.get('urgency_score', 0):.0f}% urgency, deficit: {b.get('weekly_deficit', 0):.1f}h\n"
        
        if mileage:
            context += f"\nMILEAGE:\n  - Lifetime: {mileage.get('lifetime_km', 0):.0f} km\n"
            context += f"  - To threshold: {mileage.get('km_to_threshold', 0):.0f} km\n"
            context += f"  - Risk score: {mileage.get('threshold_risk_score', 0):.0f}%\n"
        
        if cleaning:
            context += f"\nCLEANING:\n  - Status: {cleaning.get('status')}\n"
            context += f"  - Days since cleaning: {cleaning.get('days_since_last_cleaning', 0):.1f}\n"
            if cleaning.get('vip_inspection_tomorrow'):
                context += "  - ⭐ VIP INSPECTION TOMORROW\n"
        
        prompt = f"""{self.system_context}

TASK: Explain why this train was assigned to {assignment.get('assignment_type', 'this category')}.

{context}

Provide a clear, specific explanation covering:
1. PRIMARY REASON for this assignment
2. SUPPORTING FACTORS
3. Any RISKS or CONCERNS to monitor

Keep it concise (3-5 sentences) but specific with data points."""

        return await self._generate_response(prompt)

    async def validate_data_entry(self, data_type: str, data: Dict) -> Dict:
        """AI-powered validation and suggestions for manual data entry"""
        
        prompt = f"""{self.system_context}

TASK: Validate this {data_type} data entry and suggest any corrections or warnings.

DATA SUBMITTED:
{json.dumps(data, indent=2, default=str)}

Check for:
1. Missing required fields
2. Inconsistent or illogical values
3. Potential data entry errors
4. Safety concerns

Respond in JSON format:
{{
    "is_valid": true/false,
    "warnings": ["list of warnings"],
    "suggestions": ["list of suggestions"],
    "auto_corrections": {{"field": "suggested_value"}}
}}"""

        response = await self._generate_response(prompt)
        
        # Try to parse as JSON, fallback to basic validation
        try:
            # Extract JSON from response
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0]
            else:
                json_str = response
            return json.loads(json_str)
        except:
            return {
                "is_valid": True,
                "warnings": [],
                "suggestions": [response],
                "auto_corrections": {}
            }

    async def parse_natural_language_scenario(self, text: str) -> Dict:
        """Parse natural language scenario description into structured parameters"""
        
        # Get train list for context
        trains = self.db.query(Train).all()
        train_ids = [t.train_id for t in trains]
        
        prompt = f"""{self.system_context}

TASK: Parse this natural language scenario into structured parameters.

USER INPUT: "{text}"

AVAILABLE TRAINS: {', '.join(train_ids[:10])}...

Extract:
1. Which trains should be marked unavailable
2. Which trains should be forced to IBL
3. Any priority weight changes (branding, mileage, etc.)
4. Service level changes

Respond in JSON format:
{{
    "scenario_name": "descriptive name",
    "unavailable_trains": ["TS-201", ...],
    "force_ibl": ["TS-205", ...],
    "branding_weight": null or number (default 80),
    "mileage_weight": null or number (default 50),
    "reduced_service_count": null or number,
    "notes": "any additional interpretation"
}}"""

        response = await self._generate_response(prompt)
        
        try:
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0]
            else:
                json_str = response
            parsed = json.loads(json_str)
            
            # Convert train IDs to database IDs
            if parsed.get('unavailable_trains'):
                train_map = {t.train_id: t.id for t in trains}
                parsed['unavailable_train_ids'] = [
                    train_map.get(tid) for tid in parsed['unavailable_trains'] 
                    if train_map.get(tid)
                ]
            
            if parsed.get('force_ibl'):
                train_map = {t.train_id: t.id for t in trains}
                parsed['force_ibl_ids'] = [
                    train_map.get(tid) for tid in parsed['force_ibl']
                    if train_map.get(tid)
                ]
            
            return parsed
        except:
            return {
                "scenario_name": text[:50],
                "unavailable_trains": [],
                "force_ibl": [],
                "notes": response
            }

    async def generate_daily_briefing(self) -> str:
        """Generate AI-powered daily operations briefing"""
        
        # Gather current system status
        total_trains = self.db.query(Train).count()
        active_trains = self.db.query(Train).filter(Train.status == 'active').count()
        
        expired_certs = self.db.query(FitnessCertificate).filter(
            FitnessCertificate.status == 'Expired'
        ).count()
        
        safety_jobs = self.db.query(JobCard).filter(
            JobCard.safety_critical == True,
            JobCard.status != JobStatus.CLOSED
        ).count()
        
        at_risk_branding = self.db.query(BrandingContract).filter(
            BrandingContract.is_compliant == False
        ).count()
        
        latest_plan = self.db.query(NightPlan).order_by(NightPlan.created_at.desc()).first()
        
        prompt = f"""{self.system_context}

TASK: Generate a professional daily operations briefing for KMRL supervisors.

CURRENT STATUS:
- Total Fleet: {total_trains} trainsets
- Active Trains: {active_trains}
- Expired Certificates: {expired_certs}
- Safety-Critical Jobs Open: {safety_jobs}
- Branding SLAs at Risk: {at_risk_branding}
- Latest Plan: {latest_plan.plan_id if latest_plan else 'None generated'}

Generate a briefing covering:
1. FLEET READINESS summary
2. CRITICAL ISSUES requiring immediate attention
3. TODAY'S PRIORITIES
4. RECOMMENDATIONS

Format professionally for management presentation."""

        return await self._generate_response(prompt)

    async def answer_question(self, question: str, context: Dict = None) -> str:
        """Answer any question about train operations"""
        
        # Build context from provided data or database
        ctx_str = ""
        if context:
            if context.get('train'):
                ctx_str += f"\nSelected Train: {context['train'].get('train_id')}\n"
            if context.get('plan'):
                ctx_str += f"\nCurrent Plan: {context['plan'].get('plan_id')}\n"
            if context.get('scores'):
                ctx_str += f"\nTrain Scores: {json.dumps(context['scores'], indent=2)}\n"
        
        prompt = f"""{self.system_context}

CONTEXT: {ctx_str if ctx_str else 'General query - no specific context'}

USER QUESTION: {question}

Provide a helpful, accurate response. If you need more information, ask clarifying questions.
For data queries, be specific with numbers and train IDs when possible."""

        return await self._generate_response(prompt)

    async def _generate_response(self, prompt: str) -> str:
        """Generate response from Gemini or fallback"""
        
        if not self.ai_enabled or not self.model:
            return self._fallback_response(prompt)
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._fallback_response(prompt)

    def _fallback_response(self, prompt: str) -> str:
        """Generate basic response when AI is not available or rate limited"""
        
        prompt_lower = prompt.lower()
        
        if "plan explanation" in prompt_lower or "explain.*plan" in prompt_lower:
            return """## Plan Explanation

This induction plan was generated by the constraint optimization engine considering:

**Key Factors:**
1. **Fitness Certificates** - All SERVICE trains have valid certificates from RS, Signalling, and Telecom
2. **Safety Jobs** - No trains with open safety-critical jobs in SERVICE
3. **Branding SLAs** - Prioritized trains with urgent exposure requirements
4. **Mileage Balance** - Balanced km distribution across fleet
5. **Cleaning Status** - Ensured compliance with cleaning policies

**Recommendations:**
- Review IBL assignments for completion timelines
- Monitor expiring certificates (next 48 hours)
- Check branding SLA compliance weekly

*Note: AI is temporarily rate-limited. Try again in a few seconds for detailed explanations.*"""

        if "why" in prompt_lower and "assign" in prompt_lower:
            return "This assignment was determined by the multi-objective optimization algorithm based on fitness status, maintenance requirements, and operational priorities. AI is rate-limited - try again shortly for detailed explanations."
        
        if "briefing" in prompt_lower:
            return """## Daily Operations Briefing

**Fleet Status:** Review dashboard for current metrics

**Priorities Today:**
1. Check all expiring certificates
2. Review safety-critical job status
3. Confirm IBL slot allocations
4. Verify branding compliance

*AI is rate-limited - try again shortly for intelligent briefings.*"""

        # General questions - try to provide helpful response based on context
        if any(word in prompt_lower for word in ["status", "fleet", "train", "summary"]):
            # Try to get data from database
            try:
                total_trains = self.db.query(Train).count()
                active_trains = self.db.query(Train).filter(Train.status == "ACTIVE").count()
                alerts = self.db.query(Alert).filter(Alert.is_resolved == False).count()
                
                return f"""## Fleet Status Summary

**Current Fleet Statistics:**
- **Total Trains:** {total_trains}
- **Active Trains:** {active_trains}
- **Unresolved Alerts:** {alerts}

**Quick Actions:**
1. Check the Dashboard for detailed metrics
2. Review the Alerts page for critical issues
3. Use the Planner to review tomorrow's assignments

*AI is temporarily rate-limited. Try again in 15-30 seconds for AI-powered analysis.*"""
            except:
                pass

        if any(word in prompt_lower for word in ["help", "what can", "how to"]):
            return """## KMRL Copilot Help

I can help you with:

1. **Fleet Status** - Ask about train availability, health scores, or specific trains
2. **Plan Explanations** - Understand why trains were assigned to specific duties
3. **Alert Analysis** - Get insights on critical issues and recommendations
4. **What-If Scenarios** - Simulate different operational scenarios
5. **Branding Compliance** - Check advertising contract status

**Example Questions:**
- "What is the status of train TS-201?"
- "Why is TS-205 assigned to IBL?"
- "Show me critical alerts"
- "What are today's priorities?"

*AI is rate-limited. Try again shortly for intelligent responses.*"""
        
        return """I'm KMRL Copilot. I can help with fleet status, plan explanations, and operational queries. 

AI is temporarily rate-limited. Please try again in 15-30 seconds, or check the Dashboard for current metrics.

**Quick Links:**
- Dashboard: Overview of fleet status
- Alerts: View critical issues
- Planner: Review assignments"""

    # Synchronous wrappers for non-async contexts
    def chat(self, message: str, context: Dict = None) -> str:
        """Synchronous chat interface - handles event loop properly"""
        import asyncio
        import concurrent.futures
        
        # Define the async work
        async def do_work():
            return await self.answer_question(message, context)
        
        # Try to run in current loop or create new thread
        try:
            loop = asyncio.get_running_loop()
            # Already in async context - run in thread pool
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, do_work())
                return future.result(timeout=60)
        except RuntimeError:
            # No loop running, safe to use asyncio.run
            return asyncio.run(do_work())
    
    def explain_plan(self, plan_id: int) -> str:
        """Synchronous plan explanation - handles event loop properly"""
        plan = self.db.query(NightPlan).filter(NightPlan.id == plan_id).first()
        if not plan:
            return "Plan not found."
        
        assignments = self.db.query(PlanAssignment).filter(
            PlanAssignment.plan_id == plan_id
        ).all()
        
        assignment_dicts = []
        for a in assignments:
            train = self.db.query(Train).filter(Train.id == a.train_id).first()
            assignment_dicts.append({
                **a.to_dict(),
                'train': train.to_dict() if train else None
            })
        
        import asyncio
        import concurrent.futures
        
        async def do_work():
            return await self.generate_plan_explanation(plan, assignment_dicts)
        
        try:
            loop = asyncio.get_running_loop()
            # Already in async context - run in thread pool
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, do_work())
                return future.result(timeout=60)
        except RuntimeError:
            return asyncio.run(do_work())
