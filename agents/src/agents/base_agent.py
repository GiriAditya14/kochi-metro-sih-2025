"""Base agent class for all specialized agents."""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from ..models.schemas import AgentType, TrainAnalysis, PlanningMode
from ..services.backend_client import BackendClient

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base class for all specialized agents."""

    def __init__(self, agent_type: AgentType, backend_client: BackendClient):
        """
        Initialize base agent.

        Args:
            agent_type: Type of agent
            backend_client: Backend API client instance
        """
        self.agent_type = agent_type
        self.backend_client = backend_client
        self.logger = logging.getLogger(f"{__name__}.{agent_type.value}")

    @abstractmethod
    async def analyze(
        self, train_ids: List[int], decision_date: str, mode: PlanningMode = PlanningMode.NORMAL
    ) -> List[TrainAnalysis]:
        """
        Perform analysis on a list of trains.

        Args:
            train_ids: List of train IDs to analyze
            decision_date: Decision date in YYYY-MM-DD format
            mode: Planning mode (normal, emergency, crisis)

        Returns:
            List of train analysis results
        """
        pass

    @abstractmethod
    def calculate_score(self, train_data: Dict[str, Any], mode: PlanningMode = PlanningMode.NORMAL) -> float:
        """
        Calculate agent-specific score for a train.

        Args:
            train_data: Train data dictionary
            mode: Planning mode

        Returns:
            Score from 0-100
        """
        pass

    @abstractmethod
    def generate_reasoning(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate human-readable reasoning for analysis result.

        Args:
            analysis_result: Analysis result dictionary

        Returns:
            Reasoning dictionary
        """
        pass

    async def get_train_data(self, train_id: int) -> Dict[str, Any]:
        """
        Get comprehensive train data from backend.

        Args:
            train_id: Train ID

        Returns:
            Train data dictionary
        """
        try:
            return await self.backend_client.get_train_status(train_id)
        except Exception as e:
            self.logger.error(f"Error getting train data for train {train_id}: {str(e)}")
            return {}

    def validate_decision_date(self, decision_date: str) -> datetime:
        """
        Validate and parse decision date.

        Args:
            decision_date: Decision date string in YYYY-MM-DD format

        Returns:
            Parsed datetime object

        Raises:
            ValueError: If date format is invalid
        """
        try:
            return datetime.strptime(decision_date, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Invalid date format: {decision_date}. Expected YYYY-MM-DD")

    def days_until_date(self, target_date: datetime, reference_date: datetime) -> int:
        """
        Calculate days until target date.

        Args:
            target_date: Target date
            reference_date: Reference date (usually decision date)

        Returns:
            Number of days until target date (negative if past)
        """
        delta = target_date - reference_date
        return delta.days

    def is_emergency_mode(self, mode: PlanningMode) -> bool:
        """
        Check if mode is emergency or crisis.

        Args:
            mode: Planning mode

        Returns:
            True if emergency or crisis mode
        """
        return mode in [PlanningMode.EMERGENCY, PlanningMode.CRISIS]

