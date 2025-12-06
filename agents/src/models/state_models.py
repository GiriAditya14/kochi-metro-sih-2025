"""LangGraph state models for workflow management."""

from typing import Dict, List, Optional, Any, TypedDict
from datetime import datetime
from .schemas import AgentType, PlanningMode, ConflictAlert, DecisionRecommendation


class AgentResult(TypedDict):
    """Result from a single agent."""

    agent_type: AgentType
    train_analyses: List[Dict[str, Any]]
    processing_time: float
    errors: List[str]
    completed: bool


class ConflictState(TypedDict):
    """State for conflict tracking."""

    conflicts: List[ConflictAlert]
    resolved_conflicts: List[ConflictAlert]
    unresolved_conflicts: List[ConflictAlert]


class DecisionState(TypedDict):
    """State for final decision generation."""

    recommendations: List[DecisionRecommendation]
    reasoning_generated: bool
    final_output: Optional[Dict[str, Any]]


class AgentState(TypedDict):
    """Main state for LangGraph workflow."""

    # Input
    train_ids: List[int]
    train_numbers: List[str]
    decision_date: str
    mode: PlanningMode
    start_time: datetime

    # Agent Results
    agent_results: Dict[AgentType, AgentResult]
    all_agents_completed: bool

    # Conflict Management
    conflicts: List[ConflictAlert]
    conflicts_resolved: bool

    # Optimization
    composite_scores: Dict[int, float]
    optimization_completed: bool

    # Final Output
    recommendations: List[DecisionRecommendation]
    reasoning: Dict[int, str]
    output_finalized: bool

    # Metadata
    processing_time: float
    errors: List[str]

