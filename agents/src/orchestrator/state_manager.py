"""State manager for LangGraph workflow state management."""

from typing import Dict, Any, List
from datetime import datetime
from ..models.state_models import AgentState
from ..models.schemas import AgentType, PlanningMode, AgentResult, ConflictAlert, DecisionRecommendation


class StateManager:
    """Manages shared state for LangGraph workflow."""

    def __init__(self):
        """Initialize state manager."""
        self.state: AgentState = {}

    def initialize_state(
        self, train_ids: List[int], train_numbers: List[str], decision_date: str, mode: PlanningMode
    ) -> AgentState:
        """
        Initialize workflow state.

        Args:
            train_ids: List of train IDs
            train_numbers: List of train numbers (or dict mapping train_id to train_number)
            decision_date: Decision date
            mode: Planning mode

        Returns:
            Initialized state
        """
        # Handle train_numbers as either list or dict
        if isinstance(train_numbers, dict):
            train_numbers_dict = train_numbers
        else:
            train_numbers_dict = {tid: tnum for tid, tnum in zip(train_ids, train_numbers)}

        self.state = {
            "train_ids": train_ids,
            "train_numbers": train_numbers_dict,
            "decision_date": decision_date,
            "mode": mode,
            "start_time": datetime.now(),
            "agent_results": {},
            "all_agents_completed": False,
            "conflicts": [],
            "conflicts_resolved": False,
            "composite_scores": {},
            "optimization_completed": False,
            "recommendations": [],
            "reasoning": {},
            "output_finalized": False,
            "processing_time": 0.0,
            "errors": [],
        }
        return self.state

    def update_agent_result(self, agent_type: AgentType, result: AgentResult):
        """
        Update agent result in state.

        Args:
            agent_type: Agent type
            result: Agent result
        """
        if "agent_results" not in self.state:
            self.state["agent_results"] = {}
        self.state["agent_results"][agent_type] = result

    def check_all_agents_completed(self) -> bool:
        """Check if all agents have completed."""
        if "agent_results" not in self.state:
            return False

        expected_agents = set(AgentType)
        completed_agents = set(self.state["agent_results"].keys())

        all_completed = expected_agents.issubset(completed_agents)
        self.state["all_agents_completed"] = all_completed
        return all_completed

    def update_conflicts(self, conflicts: List[ConflictAlert]):
        """
        Update conflicts in state.

        Args:
            conflicts: List of conflicts
        """
        self.state["conflicts"] = conflicts

    def mark_conflicts_resolved(self):
        """Mark conflicts as resolved."""
        self.state["conflicts_resolved"] = True

    def update_composite_scores(self, scores: Dict[int, float]):
        """
        Update composite scores in state.

        Args:
            scores: Dictionary of train_id to composite score
        """
        self.state["composite_scores"] = scores
        self.state["optimization_completed"] = True

    def update_recommendations(self, recommendations: List[DecisionRecommendation]):
        """
        Update final recommendations in state.

        Args:
            recommendations: List of recommendations
        """
        self.state["recommendations"] = recommendations

    def update_reasoning(self, reasoning: Dict[int, str]):
        """
        Update reasoning for trains.

        Args:
            reasoning: Dictionary of train_id to reasoning text
        """
        self.state["reasoning"] = reasoning

    def finalize_output(self):
        """Mark output as finalized."""
        self.state["output_finalized"] = True
        end_time = datetime.now()
        start_time = self.state.get("start_time", end_time)
        self.state["processing_time"] = (end_time - start_time).total_seconds()

    def get_state(self) -> AgentState:
        """Get current state."""
        return self.state

    def add_error(self, error: str):
        """
        Add error to state.

        Args:
            error: Error message
        """
        if "errors" not in self.state:
            self.state["errors"] = []
        self.state["errors"].append(error)

