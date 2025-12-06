"""Emergency replanning workflow for fast train replacement."""

from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
import logging

from ..models.schemas import PlanningMode
from ..services.backend_client import BackendClient
from ..agents import (
    FitnessCertificateAgent,
    JobCardAgent,
    BrandingAgent,
    MileageAgent,
    CleaningAgent,
    StablingAgent,
)
from ..optimization.scoring import calculate_readiness_bonus

logger = logging.getLogger(__name__)


class EmergencyWorkflow:
    """Workflow for emergency replanning (<5 minutes target)."""

    def __init__(self, backend_client: BackendClient):
        """
        Initialize emergency workflow.

        Args:
            backend_client: Backend API client
        """
        self.backend_client = backend_client
        self.agents = {
            "fitness": FitnessCertificateAgent(backend_client),
            "job_card": JobCardAgent(backend_client),
            "branding": BrandingAgent(backend_client),
            "mileage": MileageAgent(backend_client),
            "cleaning": CleaningAgent(backend_client),
            "stabling": StablingAgent(backend_client),
        }

    async def replan(
        self,
        withdrawn_train_id: str,
        emergency_log_id: int,
        affected_route: Optional[str] = None,
        mode: PlanningMode = PlanningMode.EMERGENCY,
    ) -> Dict[str, Any]:
        """
        Execute emergency replanning workflow.

        Args:
            withdrawn_train_id: ID of withdrawn train
            emergency_log_id: Emergency log ID
            affected_route: Affected route (optional)
            mode: Planning mode

        Returns:
            Emergency plan with replacement train
        """
        start_time = datetime.now()

        # Get standby trains
        all_trains = await self.backend_client.get_all_trains()
        standby_trains = [t for t in all_trains if t.get("status") in ["STANDBY", "DEPOT_READY"]]

        if not standby_trains:
            return {
                "success": False,
                "error": "No standby trains available",
                "processing_time_seconds": (datetime.now() - start_time).total_seconds(),
            }

        # Quick eligibility check
        eligible_trains = await self._quick_eligibility_check(standby_trains, mode)

        if not eligible_trains:
            return {
                "success": False,
                "error": "No eligible replacement trains found",
                "processing_time_seconds": (datetime.now() - start_time).total_seconds(),
            }

        # Sort by readiness (fastest first)
        eligible_trains.sort(key=lambda t: t.get("readiness_minutes", 999))

        # Select best option
        best_option = eligible_trains[0]

        # Generate emergency plan
        plan = {
            "replacement_train": best_option.get("train_id"),
            "deployment_time_minutes": best_option.get("readiness_minutes", 15),
            "confidence_score": best_option.get("confidence", 0.85),
            "reasoning": best_option.get("reasoning", []),
            "execution_steps": self._generate_execution_steps(best_option, withdrawn_train_id),
            "fallback_options": eligible_trains[1:4] if len(eligible_trains) > 1 else [],
        }

        processing_time = (datetime.now() - start_time).total_seconds()

        return {
            "success": True,
            "plan": plan,
            "processing_time_seconds": processing_time,
        }

    async def _quick_eligibility_check(
        self, trains: List[Dict[str, Any]], mode: PlanningMode
    ) -> List[Dict[str, Any]]:
        """
        Perform quick eligibility check on trains.

        Args:
            trains: List of train data
            mode: Planning mode

        Returns:
            List of eligible trains with readiness times
        """
        eligible = []

        # Run agents in parallel with timeout
        for train in trains:
            train_id = train.get("id") or train.get("trainId")
            if not train_id:
                continue

            try:
                # Get train status
                train_data = await self.backend_client.get_train_status(train_id)

                # Quick checks with relaxed criteria
                fitness_agent = self.agents["fitness"]
                job_card_agent = self.agents["job_card"]

                fitness_score = fitness_agent.calculate_score(train_data, mode)
                job_card_score = job_card_agent.calculate_score(train_data, mode)

                # Emergency criteria: fitness >= 1 day, no blocking jobs
                if fitness_score > 0 and job_card_score > 0:
                    # Calculate readiness time
                    readiness_minutes = self._calculate_readiness_time(train_data)

                    eligible.append({
                        "train_id": train.get("trainNumber", f"T{train_id}"),
                        "readiness_minutes": readiness_minutes,
                        "fitness_score": fitness_score,
                        "job_card_score": job_card_score,
                        "confidence": 0.85,
                        "reasoning": [
                            f"Fitness score: {fitness_score:.1f}",
                            f"Job card score: {job_card_score:.1f}",
                            f"Readiness: {readiness_minutes} minutes",
                        ],
                    })
            except Exception as e:
                logger.error(f"Error checking train {train_id}: {str(e)}")
                continue

        return eligible

    def _calculate_readiness_time(self, train_data: Dict[str, Any]) -> int:
        """
        Calculate time until train is ready for deployment.

        Args:
            train_data: Train data

        Returns:
            Readiness time in minutes
        """
        # Base readiness time
        base_time = 10  # minutes

        # Check stabling position
        stabling = train_data.get("stablingGeometry", {})
        shunting_time = stabling.get("shuntingTimeMinutes", 10)
        base_time += shunting_time

        # Check cleaning status
        cleaning_slots = train_data.get("cleaningSlots", [])
        if cleaning_slots:
            recent = cleaning_slots[0] if cleaning_slots else {}
            if recent.get("status") != "completed":
                base_time += 5  # Additional time for cleaning

        return base_time

    def _generate_execution_steps(
        self, train_option: Dict[str, Any], withdrawn_train_id: str
    ) -> List[str]:
        """
        Generate execution steps for emergency plan.

        Args:
            train_option: Selected train option
            withdrawn_train_id: Withdrawn train ID

        Returns:
            List of execution steps
        """
        replacement = train_option.get("train_id", "Unknown")
        readiness = train_option.get("readiness_minutes", 15)

        return [
            f"1. Withdraw train {withdrawn_train_id} from service",
            f"2. Prepare replacement train {replacement} for deployment",
            f"3. Complete shunting and positioning (estimated {readiness} minutes)",
            f"4. Verify fitness certificates and job card status",
            f"5. Deploy train {replacement} to replace {withdrawn_train_id}",
            f"6. Monitor service restoration",
        ]

