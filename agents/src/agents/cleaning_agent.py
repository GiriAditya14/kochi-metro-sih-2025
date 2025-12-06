"""Cleaning & Detailing Slots Agent - Manages cleaning operations."""

from typing import List, Dict, Any
from datetime import datetime, timedelta

from .base_agent import BaseAgent
from ..models.schemas import AgentType, TrainAnalysis, PlanningMode
from ..services.backend_client import BackendClient


class CleaningAgent(BaseAgent):
    """Agent for managing cleaning slot schedules and readiness."""

    def __init__(self, backend_client: BackendClient):
        super().__init__(AgentType.CLEANING, backend_client)

    async def analyze(
        self, train_ids: List[int], decision_date: str, mode: PlanningMode = PlanningMode.NORMAL
    ) -> List[TrainAnalysis]:
        """Analyze cleaning status for trains."""
        decision_dt = self.validate_decision_date(decision_date)
        analyses = []

        for train_id in train_ids:
            train_data = await self.get_train_data(train_id)
            if not train_data:
                continue

            train_number = train_data.get("trainNumber", f"T{train_id}")
            cleaning_slots = train_data.get("cleaningSlots", [])

            score, reasoning, alerts, recommendations = self._evaluate_cleaning(
                cleaning_slots, decision_dt, mode
            )

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

    def _evaluate_cleaning(
        self, cleaning_slots: List[Dict[str, Any]], decision_date: datetime, mode: PlanningMode
    ) -> tuple[float, Dict[str, Any], List[str], List[str]]:
        """Evaluate cleaning status and calculate score."""
        if not cleaning_slots:
            return (
                50.0,
                {"status": "no_cleaning_data", "message": "No cleaning slot data available"},
                [],
                ["Schedule cleaning slot"],
            )

        # Get most recent cleaning
        recent_cleaning = None
        for slot in cleaning_slots:
            slot_date_str = slot.get("slotDate") or slot.get("completedDate")
            if slot_date_str:
                try:
                    slot_date = datetime.strptime(slot_date_str, "%Y-%m-%d")
                    if not recent_cleaning or slot_date > recent_cleaning["date"]:
                        recent_cleaning = {
                            "date": slot_date,
                            "status": slot.get("status"),
                            "type": slot.get("cleaningType"),
                            "bay": slot.get("bayNumber"),
                        }
                except (ValueError, TypeError):
                    continue

        if not recent_cleaning:
            return (
                30.0,
                {"status": "no_recent_cleaning", "message": "No recent cleaning found"},
                ["No cleaning records found"],
                ["Schedule cleaning before service"],
            )

        # Calculate days since last cleaning
        days_since = (decision_date - recent_cleaning["date"]).days
        cleaning_status = recent_cleaning["status"]

        # Mode-specific thresholds
        is_emergency = self.is_emergency_mode(mode)

        # Calculate score
        if cleaning_status == "completed" and days_since <= 1:
            score = 100.0
        elif cleaning_status == "completed" and days_since <= 2:
            score = 90.0
        elif cleaning_status == "scheduled":
            score = 90.0
        elif cleaning_status == "completed" and days_since <= 7:
            score = 75.0 if not is_emergency else 50.0
        elif cleaning_status == "completed" and days_since <= 14:
            score = 50.0 if not is_emergency else 30.0
        elif cleaning_status == "overdue":
            score = 30.0 if not is_emergency else 20.0
        else:
            score = 20.0

        # In emergency mode, relax cleaning requirements
        if is_emergency and days_since <= 2:
            score = max(score, 50.0)  # Minimum acceptable for emergency

        # Generate reasoning
        reasoning = {
            "last_cleaning_date": recent_cleaning["date"].strftime("%Y-%m-%d"),
            "days_since_cleaning": days_since,
            "cleaning_status": cleaning_status,
            "cleaning_type": recent_cleaning.get("type"),
            "bay_number": recent_cleaning.get("bay"),
        }

        # Generate alerts
        alerts = []
        if days_since > 14 and not is_emergency:
            alerts.append("WARNING: Cleaning overdue by more than 14 days")
        elif days_since > 7 and not is_emergency:
            alerts.append("Cleaning due soon")

        # Generate recommendations
        recommendations = []
        if days_since > 7 and not is_emergency:
            recommendations.append("Schedule cleaning before revenue service")
        elif cleaning_status == "overdue":
            recommendations.append("Complete overdue cleaning")

        return score, reasoning, alerts, recommendations

    def calculate_score(self, train_data: Dict[str, Any], mode: PlanningMode = PlanningMode.NORMAL) -> float:
        """Calculate cleaning readiness score for train data."""
        cleaning_slots = train_data.get("cleaningSlots", [])
        decision_date = datetime.now()
        score, _, _, _ = self._evaluate_cleaning(cleaning_slots, decision_date, mode)
        return score

    def generate_reasoning(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate reasoning from analysis result."""
        return analysis_result.get("reasoning", {})

