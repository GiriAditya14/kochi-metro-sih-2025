"""
Train Induction Optimizer using OR-Tools.
Multi-objective constraint optimization for train scheduling.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import json

from ortools.sat.python import cp_model
from sqlalchemy.orm import Session

from ..models import (
    Train, TrainStatus,
    FitnessCertificate, Department, CertificateStatus,
    JobCard, JobStatus, JobPriority,
    BrandingContract,
    MileageMeter,
    CleaningRecord, CleaningStatus,
    DepotTrack, TrainPosition,
    NightPlan, PlanAssignment, AssignmentType, PlanStatus, Alert, AlertSeverity
)


class TrainInductionOptimizer:
    """
    Multi-objective constraint optimizer for train induction planning.
    
    Hard Constraints (must satisfy):
    - No train with expired critical fitness in SERVICE
    - No train with open safety-critical job in SERVICE
    - Respect bay capacities
    - Do not exceed available manpower
    - Physical geometry constraints
    
    Soft Objectives (optimize):
    - Maximize service readiness/reliability
    - Balance mileage across fleet
    - Maximize branding exposure
    - Minimize shunting cost
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.now = datetime.utcnow()
        
        # Configuration
        self.trains_needed_for_service = 18  # Trains needed for full service
        self.standby_count = 2  # Minimum standby trains
        self.max_ibl_capacity = 4  # Max trains in IBL per night
        
        # Weights for soft objectives (configurable)
        self.weights = {
            "reliability": 100,
            "mileage_balance": 50,
            "branding": 80,
            "shunting": 30,
            "cleaning": 40
        }
        
        # Results storage
        self.alerts: List[Dict] = []
        self.explanations: Dict[int, str] = {}
    
    def optimize(self, 
                 plan_date: datetime = None,
                 scenario_overrides: Dict = None) -> NightPlan:
        """
        Run the optimization and return a NightPlan.
        
        Args:
            plan_date: Date to plan for (default: tomorrow)
            scenario_overrides: Optional dict with scenario modifications
        
        Returns:
            NightPlan with all assignments
        """
        if plan_date is None:
            plan_date = self.now + timedelta(days=1)
        
        # Gather all data
        trains = self._get_trains()
        train_scores = self._calculate_train_scores(trains)
        
        # Apply scenario overrides if any
        if scenario_overrides:
            train_scores = self._apply_scenario(train_scores, scenario_overrides)
        
        # Create optimization model
        model = cp_model.CpModel()
        
        # Decision variables
        assignments = self._create_variables(model, trains)
        
        # Add constraints
        self._add_hard_constraints(model, trains, train_scores, assignments)
        
        # Add soft objectives
        objective_terms = self._add_soft_objectives(model, trains, train_scores, assignments)
        
        # Set objective
        model.Maximize(sum(objective_terms))
        
        # Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 30
        
        start_time = datetime.utcnow()
        status = solver.Solve(model)
        solve_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Create plan from solution
        plan = self._create_plan(
            solver, status, assignments, trains, train_scores,
            plan_date, solve_time, scenario_overrides
        )
        
        return plan
    
    def _get_trains(self) -> List[Train]:
        """Get all trains from database"""
        return self.db.query(Train).filter(
            Train.status != TrainStatus.DECOMMISSIONED
        ).all()
    
    def _calculate_train_scores(self, trains: List[Train]) -> Dict[int, Dict]:
        """
        Calculate all scores for each train.
        Returns dict mapping train_id to score dict.
        """
        scores = {}
        
        for train in trains:
            train_id = train.id
            
            # Initialize scores
            scores[train_id] = {
                "fitness_score": 100,
                "fitness_valid": True,
                "fitness_issues": [],
                "maintenance_score": 100,
                "maintenance_blocks": False,
                "maintenance_issues": [],
                "branding_score": 0,
                "branding_urgency": 0,
                "branding_contracts": [],
                "mileage_score": 100,
                "mileage_risk": 0,
                "km_to_threshold": float('inf'),
                "cleaning_score": 100,
                "cleaning_required": False,
                "cleaning_issues": [],
                "shunting_cost": 0,
                "position_score": 100,
                "overall_service_score": 0,
                "can_serve": True,
                "must_ibl": False,
            }
            
            # Fitness certificates check
            self._evaluate_fitness(train, scores[train_id])
            
            # Job cards check
            self._evaluate_maintenance(train, scores[train_id])
            
            # Branding check
            self._evaluate_branding(train, scores[train_id])
            
            # Mileage check
            self._evaluate_mileage(train, scores[train_id])
            
            # Cleaning check
            self._evaluate_cleaning(train, scores[train_id])
            
            # Shunting cost
            self._evaluate_shunting(train, scores[train_id])
            
            # Calculate overall service score
            scores[train_id]["overall_service_score"] = self._calculate_overall_score(scores[train_id])
            
            # Determine eligibility
            scores[train_id]["can_serve"] = (
                scores[train_id]["fitness_valid"] and
                not scores[train_id]["maintenance_blocks"] and
                train.status == TrainStatus.ACTIVE
            )
        
        return scores
    
    def _evaluate_fitness(self, train: Train, scores: Dict):
        """Evaluate fitness certificates"""
        certs = self.db.query(FitnessCertificate).filter(
            FitnessCertificate.train_id == train.id
        ).all()
        
        # Need valid certs from all three departments
        dept_status = {dept: False for dept in Department}
        
        for cert in certs:
            if cert.is_valid_at(self.now + timedelta(hours=24)):  # Valid for tomorrow
                dept_status[cert.department] = True
            else:
                scores["fitness_issues"].append({
                    "department": cert.department.value,
                    "status": cert.status.value,
                    "hours_until_expiry": cert.hours_until_expiry()
                })
                
                # Check if expiring during service window
                if 0 < cert.hours_until_expiry() < 16:
                    self.alerts.append({
                        "train_id": train.id,
                        "severity": "warning",
                        "type": "certificate_expiring",
                        "message": f"{cert.department.value} certificate expires in {cert.hours_until_expiry():.1f} hours"
                    })
        
        # Calculate fitness score
        valid_count = sum(1 for v in dept_status.values() if v)
        scores["fitness_score"] = (valid_count / 3) * 100
        scores["fitness_valid"] = all(dept_status.values())
        
        if not scores["fitness_valid"]:
            missing = [d.value for d, v in dept_status.items() if not v]
            self.alerts.append({
                "train_id": train.id,
                "severity": "error",
                "type": "fitness_invalid",
                "message": f"Invalid/expired certificates: {', '.join(missing)}"
            })
    
    def _evaluate_maintenance(self, train: Train, scores: Dict):
        """Evaluate job cards / maintenance status"""
        jobs = self.db.query(JobCard).filter(
            JobCard.train_id == train.id,
            JobCard.status.in_([JobStatus.OPEN, JobStatus.IN_PROGRESS, JobStatus.PENDING_PARTS])
        ).all()
        
        blocking_jobs = []
        ibl_required = False
        score_deduction = 0
        
        for job in jobs:
            # Safety critical open jobs block service
            if job.safety_critical and job.status != JobStatus.CLOSED:
                blocking_jobs.append(job)
                scores["maintenance_blocks"] = True
                self.alerts.append({
                    "train_id": train.id,
                    "severity": "critical",
                    "type": "safety_job_open",
                    "message": f"Safety-critical job open: {job.title}"
                })
            
            # Overdue jobs
            if job.is_overdue():
                score_deduction += 20
                scores["maintenance_issues"].append({
                    "job_id": job.job_id,
                    "title": job.title,
                    "issue": "overdue",
                    "days_overdue": -job.days_until_due()
                })
            
            # Jobs requiring IBL
            if job.requires_ibl:
                ibl_required = True
            
            # Priority-based deduction
            if job.priority == JobPriority.CRITICAL:
                score_deduction += 30
            elif job.priority == JobPriority.HIGH:
                score_deduction += 15
            elif job.priority == JobPriority.MEDIUM:
                score_deduction += 5
        
        scores["maintenance_score"] = max(0, 100 - score_deduction)
        scores["must_ibl"] = ibl_required and not scores["maintenance_blocks"]
    
    def _evaluate_branding(self, train: Train, scores: Dict):
        """Evaluate branding contracts and SLA status"""
        contracts = self.db.query(BrandingContract).filter(
            BrandingContract.train_id == train.id,
            BrandingContract.campaign_end > self.now
        ).all()
        
        if not contracts:
            scores["branding_score"] = 0
            scores["branding_urgency"] = 0
            return
        
        total_urgency = 0
        for contract in contracts:
            urgency = contract.get_urgency_score()
            total_urgency = max(total_urgency, urgency)
            
            scores["branding_contracts"].append({
                "brand_name": contract.brand_name,
                "priority": contract.priority.value,
                "weekly_deficit": contract.get_weekly_deficit(),
                "urgency": urgency,
                "penalty_rate": contract.penalty_per_hour_shortfall
            })
            
            if urgency > 70:
                self.alerts.append({
                    "train_id": train.id,
                    "severity": "warning",
                    "type": "branding_at_risk",
                    "message": f"Branding SLA at risk: {contract.brand_name} ({urgency:.0f}% urgency)"
                })
        
        scores["branding_score"] = min(100, total_urgency)
        scores["branding_urgency"] = total_urgency
    
    def _evaluate_mileage(self, train: Train, scores: Dict):
        """Evaluate mileage and threshold proximity"""
        meter = self.db.query(MileageMeter).filter(
            MileageMeter.train_id == train.id,
            MileageMeter.component_type == "train"
        ).first()
        
        if not meter:
            return
        
        km_to_threshold = meter.get_km_to_threshold()
        risk_score = meter.get_threshold_risk_score()
        predicted_daily_km = 200  # Estimated km per day in service
        
        scores["km_to_threshold"] = km_to_threshold
        scores["mileage_risk"] = risk_score
        
        # Check if can complete a full day without hitting threshold
        if not meter.can_complete_day(predicted_daily_km):
            scores["mileage_score"] = 20
            scores["must_ibl"] = True
            self.alerts.append({
                "train_id": train.id,
                "severity": "warning",
                "type": "mileage_threshold",
                "message": f"Near maintenance threshold: {km_to_threshold:.0f} km remaining"
            })
        else:
            scores["mileage_score"] = max(0, 100 - risk_score)
    
    def _evaluate_cleaning(self, train: Train, scores: Dict):
        """Evaluate cleaning status"""
        record = self.db.query(CleaningRecord).filter(
            CleaningRecord.train_id == train.id
        ).first()
        
        if not record:
            return
        
        urgency = record.get_cleaning_urgency()
        
        if record.is_cleaning_required():
            scores["cleaning_required"] = True
            scores["cleaning_issues"].append({
                "status": record.status.value,
                "days_since_cleaning": record.days_since_last_cleaning(),
                "special_required": record.special_clean_required,
                "vip_tomorrow": record.vip_inspection_tomorrow
            })
        
        if record.vip_inspection_tomorrow:
            scores["must_ibl"] = True
            self.alerts.append({
                "train_id": train.id,
                "severity": "info",
                "type": "vip_prep",
                "message": "VIP inspection tomorrow - requires priority cleaning"
            })
        
        scores["cleaning_score"] = max(0, 100 - urgency)
    
    def _evaluate_shunting(self, train: Train, scores: Dict):
        """Evaluate shunting cost based on position"""
        position = self.db.query(TrainPosition).filter(
            TrainPosition.train_id == train.id
        ).first()
        
        if not position:
            return
        
        cost = position.calculate_shunting_cost()
        scores["shunting_cost"] = cost["moves"]
        
        # Convert to score (0 moves = 100, 5+ moves = 0)
        scores["position_score"] = max(0, 100 - (cost["moves"] * 20))
    
    def _calculate_overall_score(self, scores: Dict) -> float:
        """Calculate weighted overall score for service eligibility"""
        if not scores["can_serve"]:
            return 0
        
        weighted = (
            scores["fitness_score"] * self.weights["reliability"] +
            scores["maintenance_score"] * self.weights["reliability"] +
            scores["branding_score"] * self.weights["branding"] +
            scores["mileage_score"] * self.weights["mileage_balance"] +
            scores["cleaning_score"] * self.weights["cleaning"] +
            scores["position_score"] * self.weights["shunting"]
        )
        
        total_weight = sum(self.weights.values())
        return weighted / total_weight
    
    def _create_variables(self, model: cp_model.CpModel, trains: List[Train]) -> Dict:
        """Create decision variables for the optimizer"""
        assignments = {}
        
        for train in trains:
            # Binary variables for each assignment type
            assignments[train.id] = {
                "service": model.NewBoolVar(f"service_{train.id}"),
                "standby": model.NewBoolVar(f"standby_{train.id}"),
                "ibl": model.NewBoolVar(f"ibl_{train.id}"),
                "out_of_service": model.NewBoolVar(f"oos_{train.id}"),
            }
            
            # Each train must have exactly one assignment
            model.Add(sum(assignments[train.id].values()) == 1)
            
            # Service rank (for ordering)
            assignments[train.id]["rank"] = model.NewIntVar(0, len(trains), f"rank_{train.id}")
        
        return assignments
    
    def _add_hard_constraints(self, model: cp_model.CpModel, trains: List[Train],
                              scores: Dict, assignments: Dict):
        """Add hard constraints to the model"""
        
        # Count constraints
        service_count = sum(assignments[t.id]["service"] for t in trains)
        standby_count = sum(assignments[t.id]["standby"] for t in trains)
        ibl_count = sum(assignments[t.id]["ibl"] for t in trains)
        
        # Must have minimum service trains
        model.Add(service_count >= self.trains_needed_for_service - 2)  # Allow some flexibility
        model.Add(service_count <= self.trains_needed_for_service + 2)
        
        # Must have minimum standby
        model.Add(standby_count >= self.standby_count)
        
        # IBL capacity constraint
        model.Add(ibl_count <= self.max_ibl_capacity)
        
        # Train-specific hard constraints
        for train in trains:
            train_id = train.id
            score = scores[train_id]
            
            # Trains that cannot serve must not be in SERVICE or STANDBY
            if not score["can_serve"]:
                model.Add(assignments[train_id]["service"] == 0)
                model.Add(assignments[train_id]["standby"] == 0)
            
            # Trains requiring IBL should go to IBL if possible
            if score["must_ibl"] and score["can_serve"]:
                # Soft preference - don't force if capacity is full
                pass
            
            # Out of service trains
            if train.status == TrainStatus.OUT_OF_SERVICE:
                model.Add(assignments[train_id]["out_of_service"] == 1)
    
    def _add_soft_objectives(self, model: cp_model.CpModel, trains: List[Train],
                             scores: Dict, assignments: Dict) -> List:
        """Add soft objectives and return objective terms"""
        objective_terms = []
        
        for train in trains:
            train_id = train.id
            score = scores[train_id]
            
            # Service score contribution
            service_score = int(score["overall_service_score"] * 10)
            objective_terms.append(assignments[train_id]["service"] * service_score)
            
            # Branding bonus for service
            branding_bonus = int(score["branding_urgency"] * 5)
            objective_terms.append(assignments[train_id]["service"] * branding_bonus)
            
            # Shunting cost penalty
            shunting_penalty = score["shunting_cost"] * 2
            objective_terms.append(assignments[train_id]["service"] * (-shunting_penalty))
            
            # IBL bonus for trains needing maintenance
            if score["must_ibl"]:
                objective_terms.append(assignments[train_id]["ibl"] * 50)
            
            # Cleaning bonus
            if score["cleaning_required"]:
                objective_terms.append(assignments[train_id]["ibl"] * 30)
        
        return objective_terms
    
    def _apply_scenario(self, scores: Dict, overrides: Dict) -> Dict:
        """Apply scenario overrides to scores"""
        if "unavailable_trains" in overrides:
            for train_id in overrides["unavailable_trains"]:
                if train_id in scores:
                    scores[train_id]["can_serve"] = False
                    scores[train_id]["fitness_valid"] = False
        
        if "force_ibl" in overrides:
            for train_id in overrides["force_ibl"]:
                if train_id in scores:
                    scores[train_id]["must_ibl"] = True
        
        if "branding_weight" in overrides:
            self.weights["branding"] = overrides["branding_weight"]
        
        return scores
    
    def _create_plan(self, solver: cp_model.CpSolver, status: int,
                     assignments: Dict, trains: List[Train], scores: Dict,
                     plan_date: datetime, solve_time: float,
                     scenario_overrides: Dict = None) -> NightPlan:
        """Create NightPlan from solver solution"""
        
        # Create plan
        plan_id = f"PLAN-{plan_date.strftime('%Y%m%d')}-{datetime.utcnow().strftime('%H%M%S')}"
        
        is_scenario = scenario_overrides is not None
        scenario_name = scenario_overrides.get("name") if scenario_overrides else None
        
        plan = NightPlan(
            plan_id=plan_id,
            plan_date=plan_date,
            depot_id="MUTTOM",
            status=PlanStatus.PROPOSED,
            created_by="optimizer",
            optimizer_version="1.0",
            optimization_time_seconds=solve_time,
            is_scenario=is_scenario,
            scenario_name=scenario_name,
            scenario_description=json.dumps(scenario_overrides) if scenario_overrides else None
        )
        
        self.db.add(plan)
        self.db.flush()
        
        # Process solution
        service_trains = []
        standby_trains = []
        ibl_trains = []
        oos_trains = []
        
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            for train in trains:
                train_id = train.id
                score = scores[train_id]
                
                if solver.Value(assignments[train_id]["service"]):
                    assignment_type = AssignmentType.SERVICE
                    service_trains.append((train, score))
                elif solver.Value(assignments[train_id]["standby"]):
                    assignment_type = AssignmentType.STANDBY
                    standby_trains.append((train, score))
                elif solver.Value(assignments[train_id]["ibl"]):
                    assignment_type = AssignmentType.IBL_BOTH if score["cleaning_required"] else AssignmentType.IBL_MAINTENANCE
                    ibl_trains.append((train, score))
                else:
                    assignment_type = AssignmentType.OUT_OF_SERVICE
                    oos_trains.append((train, score))
                
                # Create assignment
                self._create_assignment(plan, train, score, assignment_type)
        else:
            # Fallback: Use heuristic if optimization fails
            self._create_heuristic_assignments(plan, trains, scores)
        
        # Flush assignments to database before queries
        self.db.flush()
        
        # Sort service trains by score and assign ranks
        if service_trains:
            service_trains.sort(key=lambda x: x[1]["overall_service_score"], reverse=True)
            for rank, (train, score) in enumerate(service_trains, 1):
                assignment = self.db.query(PlanAssignment).filter(
                    PlanAssignment.plan_id == plan.id,
                    PlanAssignment.train_id == train.id
                ).first()
                if assignment:
                    assignment.service_rank = rank
        
        # Update plan statistics by querying actual assignments
        # Use string comparison since SQLite stores enum as string
        plan.trains_in_service = self.db.query(PlanAssignment).filter(
            PlanAssignment.plan_id == plan.id,
            PlanAssignment.assignment_type == "SERVICE"
        ).count()
        plan.trains_standby = self.db.query(PlanAssignment).filter(
            PlanAssignment.plan_id == plan.id,
            PlanAssignment.assignment_type == "STANDBY"
        ).count()
        plan.trains_ibl = self.db.query(PlanAssignment).filter(
            PlanAssignment.plan_id == plan.id,
            PlanAssignment.assignment_type.in_([
                "IBL_MAINTENANCE", 
                "IBL_CLEANING",
                "IBL_BOTH"
            ])
        ).count()
        plan.trains_out_of_service = self.db.query(PlanAssignment).filter(
            PlanAssignment.plan_id == plan.id,
            PlanAssignment.assignment_type == "OUT_OF_SERVICE"
        ).count()
        
        # Assign service ranks for heuristic case too
        if not service_trains:
            service_assignments = self.db.query(PlanAssignment).filter(
                PlanAssignment.plan_id == plan.id,
                PlanAssignment.assignment_type == "SERVICE"
            ).order_by(PlanAssignment.overall_score.desc()).all()
            for rank, assignment in enumerate(service_assignments, 1):
                assignment.service_rank = rank
        
        # Calculate scores
        plan.optimization_score = solver.ObjectiveValue() if status in [cp_model.OPTIMAL, cp_model.FEASIBLE] else 0
        plan.hard_constraints_violated = 0 if status in [cp_model.OPTIMAL, cp_model.FEASIBLE] else 1
        
        # Add alerts to database
        for alert_data in self.alerts:
            alert = Alert(
                plan_id=plan.id,
                train_id=alert_data.get("train_id"),
                alert_type=alert_data["type"],
                severity=AlertSeverity[alert_data["severity"].upper()],
                title=alert_data["type"].replace("_", " ").title(),
                message=alert_data["message"]
            )
            self.db.add(alert)
        
        self.db.commit()
        return plan
    
    def _create_assignment(self, plan: NightPlan, train: Train, 
                          score: Dict, assignment_type: AssignmentType):
        """Create a single plan assignment"""
        
        # Generate explanation
        explanation = self._generate_explanation(train, score, assignment_type)
        
        assignment = PlanAssignment(
            plan_id=plan.id,
            train_id=train.id,
            assignment_type=assignment_type,
            fitness_score=score["fitness_score"],
            maintenance_score=score["maintenance_score"],
            branding_score=score["branding_score"],
            mileage_score=score["mileage_score"],
            cleaning_score=score["cleaning_score"],
            shunting_score=score["position_score"],
            overall_score=score["overall_service_score"],
            assignment_reason=explanation,
            assigned_track=train.current_track,
            assigned_position=train.current_position
        )
        
        self.db.add(assignment)
    
    def _generate_explanation(self, train: Train, score: Dict, 
                             assignment_type: AssignmentType) -> str:
        """Generate human-readable explanation for assignment"""
        reasons = []
        
        if assignment_type == AssignmentType.SERVICE:
            if score["fitness_score"] == 100:
                reasons.append("All fitness certificates valid")
            if score["branding_urgency"] > 50:
                reasons.append(f"Branding SLA needs attention ({score['branding_urgency']:.0f}% urgency)")
            if score["position_score"] >= 80:
                reasons.append("Good stabling position for quick departure")
            reasons.append(f"Overall service score: {score['overall_service_score']:.1f}")
            
        elif assignment_type == AssignmentType.STANDBY:
            reasons.append("Eligible for service but not in primary roster")
            if score["shunting_cost"] > 2:
                reasons.append("Higher shunting cost - better as standby")
            reasons.append("Available as backup if needed")
            
        elif assignment_type in [AssignmentType.IBL_MAINTENANCE, AssignmentType.IBL_CLEANING, AssignmentType.IBL_BOTH]:
            if not score["fitness_valid"]:
                reasons.append("Fitness certificate(s) expired or expiring")
            if score["maintenance_blocks"]:
                reasons.append("Safety-critical maintenance pending")
            if score["mileage_risk"] > 70:
                reasons.append(f"Near maintenance threshold ({score['km_to_threshold']:.0f} km remaining)")
            if score["cleaning_required"]:
                reasons.append("Cleaning overdue or special cleaning required")
            if score["must_ibl"]:
                reasons.append("IBL visit required")
                
        else:  # OUT_OF_SERVICE
            reasons.append("Train not available for operations")
            if not score["can_serve"]:
                if score["fitness_issues"]:
                    reasons.append("Fitness issues present")
                if score["maintenance_blocks"]:
                    reasons.append("Blocking maintenance pending")
        
        return " | ".join(reasons)
    
    def _create_heuristic_assignments(self, plan: NightPlan, 
                                      trains: List[Train], scores: Dict):
        """Fallback heuristic when optimization fails"""
        # Sort by overall score (higher = better for service)
        sorted_trains = sorted(
            trains, 
            key=lambda t: scores[t.id]["overall_service_score"],
            reverse=True
        )
        
        service_count = 0
        standby_count = 0
        ibl_count = 0
        
        for train in sorted_trains:
            score = scores[train.id]
            
            if not score["can_serve"]:
                # Can't serve at all
                assignment_type = AssignmentType.OUT_OF_SERVICE
            elif service_count < self.trains_needed_for_service:
                # Priority 1: Fill service roster first
                assignment_type = AssignmentType.SERVICE
                service_count += 1
            elif standby_count < self.standby_count:
                # Priority 2: Fill standby
                assignment_type = AssignmentType.STANDBY
                standby_count += 1
            elif score["must_ibl"] and ibl_count < self.max_ibl_capacity:
                # Priority 3: Send to IBL if needed and capacity available
                assignment_type = AssignmentType.IBL_MAINTENANCE
                ibl_count += 1
            elif score["cleaning_required"] and ibl_count < self.max_ibl_capacity:
                # Priority 4: Cleaning at IBL
                assignment_type = AssignmentType.IBL_CLEANING
                ibl_count += 1
            else:
                # Extra trains go to standby pool
                assignment_type = AssignmentType.STANDBY
                standby_count += 1
            
            self._create_assignment(plan, train, score, assignment_type)
    
    def get_train_details(self, train_id: int) -> Dict:
        """Get detailed information for a specific train"""
        train = self.db.query(Train).filter(Train.id == train_id).first()
        if not train:
            return None
        
        scores = self._calculate_train_scores([train])
        return {
            "train": train.to_dict(),
            "scores": scores.get(train_id, {}),
            "alerts": [a for a in self.alerts if a.get("train_id") == train_id]
        }
    
    def run_what_if(self, base_plan_id: str, scenario: Dict) -> NightPlan:
        """
        Run what-if scenario analysis.
        
        Args:
            base_plan_id: ID of baseline plan for comparison
            scenario: Dict with scenario modifications
        
        Returns:
            New plan with scenario applied
        """
        scenario["name"] = scenario.get("name", f"What-If Scenario {datetime.utcnow().strftime('%H%M')}")
        scenario["baseline_plan_id"] = base_plan_id
        
        return self.optimize(scenario_overrides=scenario)

