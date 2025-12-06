"""Job Card Status Agent - Monitors IBM Maximo work orders."""

from typing import List, Dict, Any
from datetime import datetime

from .base_agent import BaseAgent
from ..models.schemas import AgentType, TrainAnalysis, PlanningMode
from ..services.backend_client import BackendClient


class JobCardAgent(BaseAgent):
    """Agent for monitoring job card status and maintenance readiness."""

    def __init__(self, backend_client: BackendClient):
        super().__init__(AgentType.JOB_CARD, backend_client)

    async def analyze(
        self, train_ids: List[int], decision_date: str, mode: PlanningMode = PlanningMode.NORMAL
    ) -> List[TrainAnalysis]:
        """Analyze job card status for trains."""
        analyses = []

        for train_id in train_ids:
            train_data = await self.get_train_data(train_id)
            if not train_data:
                continue

            train_number = train_data.get("trainNumber", f"T{train_id}")
            job_cards = train_data.get("jobCards", [])

            score, reasoning, alerts, recommendations = self._evaluate_job_cards(job_cards, mode)

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

    def _evaluate_job_cards(
        self, job_cards: List[Dict[str, Any]], mode: PlanningMode
    ) -> tuple[float, Dict[str, Any], List[str], List[str]]:
        """Evaluate job cards and calculate score."""
        open_jobs = [job for job in job_cards if job.get("status") in ["open", "in_progress"]]

        if not open_jobs:
            return (
                100.0,
                {"status": "no_open_jobs", "message": "No open job cards"},
                [],
                ["Train ready for service"],
            )

        # Categorize by priority
        critical_jobs = [j for j in open_jobs if j.get("priority") == "critical"]
        high_jobs = [j for j in open_jobs if j.get("priority") == "high"]
        medium_jobs = [j for j in open_jobs if j.get("priority") == "medium"]
        low_jobs = [j for j in open_jobs if j.get("priority") == "low"]

        # Check for blocking jobs
        blocking_jobs = [j for j in critical_jobs if j.get("blockingService", False)]

        # Mode-specific thresholds
        is_emergency = self.is_emergency_mode(mode)
        max_critical_allowed = 3 if is_emergency else 2

        # Calculate score
        score = self._calculate_job_card_score(
            len(blocking_jobs),
            len(critical_jobs),
            len(high_jobs),
            len(medium_jobs),
            len(low_jobs),
            max_critical_allowed,
        )

        # Generate reasoning
        reasoning = {
            "total_open_jobs": len(open_jobs),
            "critical_count": len(critical_jobs),
            "high_count": len(high_jobs),
            "medium_count": len(medium_jobs),
            "low_count": len(low_jobs),
            "blocking_jobs": len(blocking_jobs),
            "job_details": [
                {
                    "job_number": j.get("maximoJobNumber"),
                    "priority": j.get("priority"),
                    "type": j.get("jobType"),
                    "status": j.get("status"),
                    "blocking": j.get("blockingService", False),
                }
                for j in open_jobs
            ],
        }

        # Generate alerts
        alerts = []
        if blocking_jobs:
            alerts.append(f"CRITICAL: {len(blocking_jobs)} blocking job(s) - Cannot enter revenue service")
        if len(critical_jobs) > max_critical_allowed:
            alerts.append(
                f"WARNING: {len(critical_jobs)} critical job(s) exceed threshold ({max_critical_allowed})"
            )

        # Generate recommendations
        recommendations = []
        if blocking_jobs:
            recommendations.append("Complete blocking jobs before revenue service")
        if len(critical_jobs) > max_critical_allowed:
            recommendations.append("Schedule maintenance for critical jobs")
        if high_jobs:
            recommendations.append("Review high priority jobs")

        return score, reasoning, alerts, recommendations

    def _calculate_job_card_score(
        self,
        blocking: int,
        critical: int,
        high: int,
        medium: int,
        low: int,
        max_critical_allowed: int,
    ) -> float:
        """Calculate maintenance readiness score."""
        if blocking > 0:
            return 0.0  # Hard constraint

        if critical > max_critical_allowed:
            return 0.0  # Too many critical jobs

        if critical > 0:
            return 40.0  # High priority maintenance needed

        if high > 0:
            return 70.0  # Review required

        if medium > 0:
            return 90.0  # Can proceed with caution

        if low > 0:
            return 90.0  # Low priority, can proceed

        return 100.0  # No open jobs

    def calculate_score(self, train_data: Dict[str, Any], mode: PlanningMode = PlanningMode.NORMAL) -> float:
        """Calculate job card score for train data."""
        job_cards = train_data.get("jobCards", [])
        _, score, _, _ = self._evaluate_job_cards(job_cards, mode)
        return score

    def generate_reasoning(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate reasoning from analysis result."""
        return analysis_result.get("reasoning", {})

