"""Mileage Balancing Agent - Optimizes wear distribution across fleet."""

from typing import List, Dict, Any
from datetime import datetime

from .base_agent import BaseAgent
from ..models.schemas import AgentType, TrainAnalysis, PlanningMode
from ..services.backend_client import BackendClient


class MileageAgent(BaseAgent):
    """Agent for balancing mileage across the fleet."""

    def __init__(self, backend_client: BackendClient):
        super().__init__(AgentType.MILEAGE, backend_client)
        self._fleet_average_cache: Dict[str, float] = {}

    async def analyze(
        self, train_ids: List[int], decision_date: str, mode: PlanningMode = PlanningMode.NORMAL
    ) -> List[TrainAnalysis]:
        """Analyze mileage balance for trains."""
        # Get all trains to calculate fleet average
        all_trains = await self._get_all_trains_mileage()
        fleet_avg = self._calculate_fleet_average(all_trains)

        analyses = []

        for train_id in train_ids:
            train_data = await self.get_train_data(train_id)
            if not train_data:
                continue

            train_number = train_data.get("trainNumber", f"T{train_id}")
            mileage_data = train_data.get("mileageData", [])

            score, reasoning, alerts, recommendations = self._evaluate_mileage(
                mileage_data, fleet_avg, mode
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

    async def _get_all_trains_mileage(self) -> List[Dict[str, Any]]:
        """Get mileage data for all trains."""
        try:
            # Query backend for all trains' mileage
            all_trains = await self.backend_client.get_all_trains()
            return all_trains
        except Exception as e:
            self.logger.error(f"Error getting all trains mileage: {str(e)}")
            return []

    def _calculate_fleet_average(self, trains: List[Dict[str, Any]]) -> float:
        """Calculate average cumulative mileage across fleet."""
        if not trains:
            return 0.0

        total_mileage = 0.0
        count = 0

        for train in trains:
            mileage_data = train.get("mileageData", [])
            if mileage_data:
                # Get latest mileage record
                latest = mileage_data[0] if isinstance(mileage_data, list) else mileage_data
                cumulative = float(latest.get("cumulativeMileage", 0))
                if cumulative > 0:
                    total_mileage += cumulative
                    count += 1

        return total_mileage / count if count > 0 else 0.0

    def _evaluate_mileage(
        self, mileage_data: List[Dict[str, Any]], fleet_avg: float, mode: PlanningMode
    ) -> tuple[float, Dict[str, Any], List[str], List[str]]:
        """Evaluate mileage balance and calculate score."""
        if not mileage_data:
            return (
                50.0,
                {"status": "no_mileage_data", "message": "No mileage data available"},
                [],
                [],
            )

        # Get latest mileage
        latest = mileage_data[0] if isinstance(mileage_data, list) else mileage_data
        cumulative_mileage = float(latest.get("cumulativeMileage", 0))

        if fleet_avg == 0:
            return (
                50.0,
                {"status": "no_fleet_data", "message": "Cannot calculate fleet average"},
                [],
                [],
            )

        # Calculate deviation from average
        deviation = ((cumulative_mileage - fleet_avg) / fleet_avg) * 100 if fleet_avg > 0 else 0

        # Calculate score based on deviation
        score = self._calculate_mileage_score(deviation, mode)

        # Generate reasoning
        reasoning = {
            "cumulative_mileage": cumulative_mileage,
            "fleet_average": fleet_avg,
            "deviation_percent": deviation,
            "status": "above_average" if deviation > 0 else "below_average",
        }

        # Generate alerts
        alerts = []
        if abs(deviation) > 30:
            alerts.append(f"EXTREME: Mileage deviation {deviation:.1f}% from fleet average")
        elif abs(deviation) > 20:
            alerts.append(f"WARNING: Significant mileage deviation {deviation:.1f}%")

        # Generate recommendations
        recommendations = []
        if deviation > 20:
            recommendations.append("Consider maintenance to balance wear")
            recommendations.append("Prefer standby to reduce mileage")
        elif deviation < -20:
            recommendations.append("High priority for revenue service to balance usage")

        return score, reasoning, alerts, recommendations

    def _calculate_mileage_score(self, deviation_percent: float, mode: PlanningMode) -> float:
        """Calculate mileage balancing score."""
        # In emergency mode, mileage balancing is less important
        if self.is_emergency_mode(mode):
            # Return neutral score for emergency
            return 50.0

        abs_deviation = abs(deviation_percent)

        if abs_deviation <= 5:
            return 100.0  # Optimal balance
        elif abs_deviation <= 10:
            return 90.0 if deviation_percent < 0 else 85.0  # Slight deviation
        elif abs_deviation <= 20:
            return 70.0 if deviation_percent < 0 else 50.0  # Moderate deviation
        elif abs_deviation <= 30:
            return 50.0 if deviation_percent < 0 else 30.0  # Significant deviation
        else:
            return 0.0 if deviation_percent > 0 else 100.0  # Extreme - prioritize opposite

    def calculate_score(self, train_data: Dict[str, Any], mode: PlanningMode = PlanningMode.NORMAL) -> float:
        """Calculate mileage score for train data."""
        mileage_data = train_data.get("mileageData", [])
        fleet_avg = 0.0  # Would need fleet context
        score, _, _, _ = self._evaluate_mileage(mileage_data, fleet_avg, mode)
        return score

    def generate_reasoning(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate reasoning from analysis result."""
        return analysis_result.get("reasoning", {})

