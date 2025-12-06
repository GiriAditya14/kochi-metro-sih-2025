"""Branding Priority Agent - Manages advertiser SLA compliance."""

from typing import List, Dict, Any
from datetime import datetime

from .base_agent import BaseAgent
from ..models.schemas import AgentType, TrainAnalysis, PlanningMode
from ..services.backend_client import BackendClient


class BrandingAgent(BaseAgent):
    """Agent for managing branding contract priorities and SLA compliance."""

    def __init__(self, backend_client: BackendClient):
        super().__init__(AgentType.BRANDING, backend_client)

    async def analyze(
        self, train_ids: List[int], decision_date: str, mode: PlanningMode = PlanningMode.NORMAL
    ) -> List[TrainAnalysis]:
        """Analyze branding contracts and priorities for trains."""
        decision_dt = self.validate_decision_date(decision_date)
        analyses = []

        for train_id in train_ids:
            train_data = await self.get_train_data(train_id)
            if not train_data:
                continue

            train_number = train_data.get("trainNumber", f"T{train_id}")
            contracts = train_data.get("brandingContracts", [])

            score, reasoning, alerts, recommendations = self._evaluate_contracts(contracts, decision_dt, mode)

            analyses.append(
                TrainAnalysis(
                    train_id=train_id,
                    train_number=train_number,
                    score=score,
                    reasoning=reasoning,
                    alerts=alerts,
                    recommendations=recommendations,
                )
            )

        return analyses

    def _evaluate_contracts(
        self, contracts: List[Dict[str, Any]], decision_date: datetime, mode: PlanningMode
    ) -> tuple[float, Dict[str, Any], List[str], List[str]]:
        """Evaluate branding contracts and calculate priority score."""
        active_contracts = [c for c in contracts if c.get("status") == "active"]

        if not active_contracts:
            return (
                50.0,
                {"status": "no_active_contracts", "message": "No active branding contracts"},
                [],
                [],
            )

        # Evaluate each contract
        contract_evaluations = []
        total_priority_score = 0.0
        at_risk_count = 0
        breached_count = 0

        for contract in active_contracts:
            required_hours = float(contract.get("requiredExposureHours", 0))
            current_hours = float(contract.get("currentExposureHours", 0))
            end_date_str = contract.get("endDate")

            if not end_date_str:
                continue

            try:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
            except (ValueError, TypeError):
                continue

            days_remaining = self.days_until_date(end_date, decision_date)
            exposure_deficit = required_hours - current_hours
            exposure_ratio = current_hours / required_hours if required_hours > 0 else 0

            # Calculate contract priority
            if exposure_deficit <= 0:
                priority = 50  # Contract fulfilled
            elif days_remaining < 7:
                priority = 100  # Critical - at risk of breach
                at_risk_count += 1
            elif days_remaining < 14:
                priority = 95  # Very high priority
            elif exposure_ratio < 0.5:
                priority = 85  # Behind schedule
            elif exposure_ratio < 0.8:
                priority = 70  # On track but needs attention
            else:
                priority = 50  # On track

            # Check if already breached
            if days_remaining < 0 and exposure_deficit > 0:
                priority = 0
                breached_count += 1

            contract_evaluations.append(
                {
                    "advertiser": contract.get("advertiserName"),
                    "required_hours": required_hours,
                    "current_hours": current_hours,
                    "deficit": exposure_deficit,
                    "days_remaining": days_remaining,
                    "priority": priority,
                    "breached": days_remaining < 0 and exposure_deficit > 0,
                }
            )

            total_priority_score += priority

        # Calculate average priority score
        avg_score = total_priority_score / len(active_contracts) if active_contracts else 50.0

        # Generate reasoning
        reasoning = {
            "total_contracts": len(active_contracts),
            "at_risk_count": at_risk_count,
            "breached_count": breached_count,
            "contract_evaluations": contract_evaluations,
        }

        # Generate alerts
        alerts = []
        if breached_count > 0:
            alerts.append(f"CRITICAL: {breached_count} contract(s) already breached")
        if at_risk_count > 0:
            alerts.append(f"HIGH PRIORITY: {at_risk_count} contract(s) at risk of SLA breach")

        # Generate recommendations
        recommendations = []
        if breached_count > 0:
            recommendations.append("Alert management about breached contracts")
        if at_risk_count > 0:
            recommendations.append("Prioritize trains with at-risk contracts for revenue service")

        return avg_score, reasoning, alerts, recommendations

    def calculate_score(self, train_data: Dict[str, Any], mode: PlanningMode = PlanningMode.NORMAL) -> float:
        """Calculate branding priority score for train data."""
        contracts = train_data.get("brandingContracts", [])
        decision_date = datetime.now()
        score, _, _, _ = self._evaluate_contracts(contracts, decision_date, mode)
        return score

    def generate_reasoning(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate reasoning from analysis result."""
        return analysis_result.get("reasoning", {})

