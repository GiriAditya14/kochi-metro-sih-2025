"""LangGraph workflow definition for multi-agent coordination."""

import asyncio
from typing import Dict, Any, List
from datetime import datetime

from langgraph.graph import StateGraph, END
from langchain_core.runnables import RunnableConfig

from ..models.state_models import AgentState
from ..models.schemas import AgentType, PlanningMode, TrainAnalysis, AgentResult
from ..agents import (
    FitnessCertificateAgent,
    JobCardAgent,
    BrandingAgent,
    MileageAgent,
    CleaningAgent,
    StablingAgent,
)
from ..services.backend_client import BackendClient
from ..orchestrator.state_manager import StateManager
from ..orchestrator.conflict_resolver import ConflictResolver
from ..optimization.multi_objective import MultiObjectiveOptimizer
from ..services.reasoning_service import ReasoningService


def create_workflow(backend_client: BackendClient) -> StateGraph:
    """
    Create LangGraph workflow for multi-agent planning.

    Args:
        backend_client: Backend API client

    Returns:
        Compiled LangGraph workflow
    """
    # Initialize agents
    agents = {
        AgentType.FITNESS_CERTIFICATE: FitnessCertificateAgent(backend_client),
        AgentType.JOB_CARD: JobCardAgent(backend_client),
        AgentType.BRANDING: BrandingAgent(backend_client),
        AgentType.MILEAGE: MileageAgent(backend_client),
        AgentType.CLEANING: CleaningAgent(backend_client),
        AgentType.STABLING: StablingAgent(backend_client),
    }

    # Initialize services
    state_manager = StateManager()
    conflict_resolver = ConflictResolver(PlanningMode.NORMAL)
    optimizer = MultiObjectiveOptimizer(PlanningMode.NORMAL)
    reasoning_service = ReasoningService()

    # Define workflow graph
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("initialize", lambda state: _initialize_node(state, state_manager))
    workflow.add_node("parallel_analysis", lambda state: _parallel_analysis_node(state, agents, state_manager))
    workflow.add_node("synchronize", lambda state: _synchronize_node(state, state_manager))
    workflow.add_node("detect_conflicts", lambda state: _detect_conflicts_node(state, conflict_resolver, state_manager))
    workflow.add_node("resolve_conflicts", lambda state: _resolve_conflicts_node(state, conflict_resolver, state_manager))
    workflow.add_node("optimize", lambda state: _optimize_node(state, optimizer, state_manager))
    workflow.add_node("generate_reasoning", lambda state: _generate_reasoning_node(state, reasoning_service, state_manager))
    workflow.add_node("finalize", lambda state: _finalize_node(state, state_manager))

    # Define edges
    workflow.set_entry_point("initialize")
    workflow.add_edge("initialize", "parallel_analysis")
    workflow.add_edge("parallel_analysis", "synchronize")
    workflow.add_edge("synchronize", "detect_conflicts")
    workflow.add_edge("detect_conflicts", "resolve_conflicts")
    workflow.add_edge("resolve_conflicts", "optimize")
    workflow.add_edge("optimize", "generate_reasoning")
    workflow.add_edge("generate_reasoning", "finalize")
    workflow.add_edge("finalize", END)

    return workflow.compile()


def _initialize_node(state: AgentState, state_manager: StateManager) -> AgentState:
    """Initialize workflow state."""
    state_manager.initialize_state(
        state["train_ids"],
        [state["train_numbers"].get(tid, f"T{tid}") for tid in state["train_ids"]],
        state["decision_date"],
        state["mode"],
    )
    return state_manager.get_state()


def _parallel_analysis_node(
    state: AgentState, agents: Dict[AgentType, Any], state_manager: StateManager
) -> AgentState:
    """Execute all agents in parallel."""
    async def run_agents():
        train_ids = state["train_ids"]
        decision_date = state["decision_date"]
        mode = state["mode"]

        # Run all agents in parallel
        tasks = [
            agent.analyze(train_ids, decision_date, mode)
            for agent in agents.values()
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        agent_results: Dict[AgentType, AgentResult] = {}
        for agent_type, result in zip(agents.keys(), results):
            if isinstance(result, Exception):
                state_manager.add_error(f"Agent {agent_type.value} failed: {str(result)}")
                agent_results[agent_type] = {
                    "agent_type": agent_type,
                    "train_analyses": [],
                    "processing_time": 0.0,
                    "errors": [str(result)],
                    "completed": False,
                }
            else:
                agent_results[agent_type] = {
                    "agent_type": agent_type,
                    "train_analyses": [a.dict() for a in result],
                    "processing_time": 0.0,  # Would calculate actual time
                    "errors": [],
                    "completed": True,
                }
                state_manager.update_agent_result(agent_type, agent_results[agent_type])

        return agent_results

    # Run async function
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        agent_results = loop.run_until_complete(run_agents())
    finally:
        loop.close()

    return state_manager.get_state()


def _synchronize_node(state: AgentState, state_manager: StateManager) -> AgentState:
    """Synchronize and collect agent results."""
    state_manager.check_all_agents_completed()
    return state_manager.get_state()


def _detect_conflicts_node(
    state: AgentState, conflict_resolver: ConflictResolver, state_manager: StateManager
) -> AgentState:
    """Detect conflicts between agent recommendations."""
    agent_results = state.get("agent_results", {})

    # Convert to format expected by conflict resolver
    formatted_results: Dict[AgentType, List[TrainAnalysis]] = {}
    for agent_type, result in agent_results.items():
        analyses = result.get("train_analyses", [])
        formatted_results[agent_type] = [
            TrainAnalysis(**a) if isinstance(a, dict) else a for a in analyses
        ]

    conflicts = conflict_resolver.detect_conflicts(formatted_results)
    state_manager.update_conflicts(conflicts)

    return state_manager.get_state()


def _resolve_conflicts_node(
    state: AgentState, conflict_resolver: ConflictResolver, state_manager: StateManager
) -> AgentState:
    """Resolve detected conflicts."""
    conflicts = state.get("conflicts", [])
    agent_results = state.get("agent_results", {})

    resolved = conflict_resolver.resolve_conflicts(conflicts, agent_results)
    state_manager.update_conflicts(resolved)
    state_manager.mark_conflicts_resolved()

    return state_manager.get_state()


def _optimize_node(
    state: AgentState, optimizer: MultiObjectiveOptimizer, state_manager: StateManager
) -> AgentState:
    """Perform multi-objective optimization."""
    agent_results = state.get("agent_results", {})
    train_ids = state["train_ids"]
    train_numbers = state.get("train_numbers", {})

    # Build train_analyses dictionary
    train_analyses: Dict[int, Dict[AgentType, float]] = {}
    for train_id in train_ids:
        train_analyses[train_id] = {}

    # Extract scores from agent results
    for agent_type, result in agent_results.items():
        analyses = result.get("train_analyses", [])
        for analysis in analyses:
            if isinstance(analysis, dict):
                train_id = analysis.get("train_id")
                score = analysis.get("score", 0.0)
                if train_id:
                    train_analyses[train_id][agent_type] = score

    # Run optimization
    conflicts = state.get("conflicts", [])
    recommendations = optimizer.optimize(train_analyses, train_numbers, conflicts)

    # Update composite scores
    composite_scores = {r.train_id: r.score for r in recommendations}
    state_manager.update_composite_scores(composite_scores)
    state_manager.update_recommendations(recommendations)

    return state_manager.get_state()


def _generate_reasoning_node(
    state: AgentState, reasoning_service: ReasoningService, state_manager: StateManager
) -> AgentState:
    """Generate explainable reasoning for decisions."""
    recommendations = state.get("recommendations", [])
    agent_results = state.get("agent_results", {})

    reasoning: Dict[int, str] = {}
    for rec in recommendations:
        train_id = rec.train_id if hasattr(rec, "train_id") else rec.get("train_id")
        reasoning_text = reasoning_service.generate_reasoning(rec, agent_results)
        reasoning[train_id] = reasoning_text

    state_manager.update_reasoning(reasoning)
    return state_manager.get_state()


def _finalize_node(state: AgentState, state_manager: StateManager) -> AgentState:
    """Finalize output."""
    state_manager.finalize_output()
    return state_manager.get_state()


async def run_planning_workflow(
    train_ids: List[int],
    train_numbers: List[str],
    decision_date: str,
    mode: PlanningMode,
    backend_client: BackendClient,
) -> Dict[str, Any]:
    """
    Run the complete planning workflow.

    Args:
        train_ids: List of train IDs
        train_numbers: List of train numbers
        decision_date: Decision date
        mode: Planning mode
        backend_client: Backend API client

    Returns:
        Final workflow state
    """
    workflow = create_workflow(backend_client)

    # Prepare initial state
    initial_state: AgentState = {
        "train_ids": train_ids,
        "train_numbers": {tid: tnum for tid, tnum in zip(train_ids, train_numbers)},
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

    # Run workflow
    final_state = await workflow.ainvoke(initial_state)

    return final_state

