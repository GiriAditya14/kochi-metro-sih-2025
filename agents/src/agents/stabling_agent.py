"""Stabling Geometry Agent - Optimizes train positioning in depot."""

from typing import List, Dict, Any
from datetime import datetime

from .base_agent import BaseAgent
from ..models.schemas import AgentType, TrainAnalysis, PlanningMode
from ..services.backend_client import BackendClient


class StablingAgent(BaseAgent):
    """Agent for optimizing stabling positions and shunting efficiency."""

    def __init__(self, backend_client: BackendClient):
        super().__init__(AgentType.STABLING, backend_client)

    async def analyze(
        self, train_ids: List[int], decision_date: str, mode: PlanningMode = PlanningMode.NORMAL
    ) -> List[TrainAnalysis]:
        """Analyze stabling geometry and positioning for trains."""
        analyses = []

        for train_id in train_ids:
            train_data = await self.get_train_data(train_id)
            if not train_data:
                continue

            train_number = train_data.get("trainNumber", f"T{train_id}")
            stabling_geometry = train_data.get("stablingGeometry")

            score, reasoning, alerts, recommendations = self._evaluate_stabling(
                stabling_geometry, mode
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

    def _evaluate_stabling(
        self, stabling_geometry: Dict[str, Any], mode: PlanningMode
    ) -> tuple[float, Dict[str, Any], List[str], List[str]]:
        """Evaluate stabling position and calculate efficiency score."""
        if not stabling_geometry:
            return (
                50.0,
                {"status": "no_stabling_data", "message": "No stabling geometry data available"},
                [],
                [],
            )

        # Extract stabling information
        bay_number = stabling_geometry.get("bayNumber")
        bay_position = stabling_geometry.get("position")
        shunting_distance = float(stabling_geometry.get("shuntingDistance", 0))
        shunting_time_minutes = float(stabling_geometry.get("shuntingTimeMinutes", 0))
        is_blocking = stabling_geometry.get("blockingOtherTrains", False)

        # Calculate efficiency score based on shunting requirements
        score = self._calculate_stabling_score(
            shunting_distance, shunting_time_minutes, is_blocking, mode
        )

        # Generate reasoning
        reasoning = {
            "bay_number": bay_number,
            "bay_position": bay_position,
            "shunting_distance_meters": shunting_distance,
            "shunting_time_minutes": shunting_time_minutes,
            "is_blocking": is_blocking,
            "efficiency": "optimal" if score >= 90 else "good" if score >= 75 else "moderate" if score >= 60 else "poor",
        }

        # Generate alerts
        alerts = []
        if is_blocking:
            alerts.append("WARNING: Train position is blocking other trains")
        if shunting_time_minutes > 20 and not self.is_emergency_mode(mode):
            alerts.append(f"Long shunting time: {shunting_time_minutes} minutes")

        # Generate recommendations
        recommendations = []
        if score < 60 and not self.is_emergency_mode(mode):
            recommendations.append("Consider repositioning for better efficiency")
        if is_blocking:
            recommendations.append("Reposition to avoid blocking other operations")

        return score, reasoning, alerts, recommendations

    def _calculate_stabling_score(
        self, shunting_distance: float, shunting_time: float, is_blocking: bool, mode: PlanningMode
    ) -> float:
        """Calculate stabling efficiency score."""
        # In emergency mode, stabling is less important
        if self.is_emergency_mode(mode):
            # Accept longer shunting in emergency
            if shunting_time <= 20:
                return 50.0  # Acceptable for emergency
            elif shunting_time <= 30:
                return 40.0
            else:
                return 30.0

        if is_blocking:
            return 30.0  # Blocking is problematic

        # Score based on shunting time (shorter is better)
        if shunting_time <= 5:
            return 100.0  # Optimal
        elif shunting_time <= 10:
            return 90.0  # Good
        elif shunting_time <= 15:
            return 75.0  # Moderate
        elif shunting_time <= 20:
            return 60.0  # Poor
        elif shunting_time <= 30:
            return 40.0  # Very poor
        else:
            return 30.0  # Extremely poor

    def calculate_score(self, train_data: Dict[str, Any], mode: PlanningMode = PlanningMode.NORMAL) -> float:
        """Calculate stabling efficiency score for train data."""
        stabling_geometry = train_data.get("stablingGeometry", {})
        score, _, _, _ = self._evaluate_stabling(stabling_geometry, mode)
        return score

    def generate_reasoning(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate reasoning from analysis result."""
        return analysis_result.get("reasoning", {})

