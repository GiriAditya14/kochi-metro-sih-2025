"""Agent query endpoints for autonomous agent interactions."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

from ...models.schemas import AgentType
from ...services.backend_client import BackendClient
from ...agents.agent_factory import create_agent

router = APIRouter(prefix="/api/v1/agents", tags=["agent-query"])


class AgentQueryRequest(BaseModel):
    """Request for agent query."""

    agent_type: str
    query: str
    train_ids: Optional[List[int]] = None
    decision_date: Optional[str] = None
    mode: str = "normal"
    context: Optional[Dict[str, Any]] = None


class AgentQueryResponse(BaseModel):
    """Response from agent query."""

    success: bool
    agent_type: str
    decision: Optional[str] = None
    reasoning: str
    actions_taken: List[Dict[str, Any]]
    score: Optional[float] = None
    recommendations: List[str] = []


@router.post("/query", response_model=AgentQueryResponse)
async def query_agent(request: AgentQueryRequest) -> AgentQueryResponse:
    """
    Query an agent with a natural language query.

    The agent will autonomously:
    1. Understand the query
    2. Use available tools to gather information
    3. Make a decision based on rules and data
    4. Explain what it chose to do and why

    Args:
        request: Agent query request

    Returns:
        Agent response with decision and reasoning
    """
    try:
        # Parse agent type
        try:
            agent_type = AgentType(request.agent_type.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid agent type: {request.agent_type}. Valid types: {[at.value for at in AgentType]}",
            )

        # Create backend client and agent
        backend_client = BackendClient()
        agent = create_agent(agent_type, backend_client)

        # Parse mode
        from ...models.schemas import PlanningMode
        try:
            mode = PlanningMode(request.mode.lower())
        except ValueError:
            mode = PlanningMode.NORMAL

        # Execute agent query
        result = await agent.analyze(
            query=request.query,
            train_ids=request.train_ids,
            decision_date=request.decision_date,
            mode=mode,
            context=request.context,
        )

        # Extract score if available in reasoning
        score = None
        if "score" in result.get("reasoning", "").lower():
            # Try to extract score from reasoning
            import re
            score_match = re.search(r"score[:\s]+(\d+\.?\d*)", result.get("reasoning", ""), re.IGNORECASE)
            if score_match:
                score = float(score_match.group(1))

        # Extract recommendations
        recommendations = []
        if "recommend" in result.get("reasoning", "").lower():
            # Simple extraction - could be enhanced
            lines = result.get("reasoning", "").split("\n")
            for line in lines:
                if "recommend" in line.lower() or "should" in line.lower():
                    recommendations.append(line.strip())

        return AgentQueryResponse(
            success=result.get("success", True),
            agent_type=agent_type.value,
            decision=result.get("decision"),
            reasoning=result.get("reasoning", ""),
            actions_taken=result.get("actions_taken", []),
            score=score,
            recommendations=recommendations[:5],  # Limit to 5 recommendations
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent query failed: {str(e)}")


@router.post("/analyze/{agent_type}")
async def analyze_with_agent(
    agent_type: str,
    query: str,
    train_ids: Optional[List[int]] = None,
    decision_date: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyze trains using a specific agent.

    Args:
        agent_type: Type of agent
        query: Analysis query
        train_ids: Optional train IDs
        decision_date: Optional decision date

    Returns:
        Analysis results
    """
    try:
        agent_type_enum = AgentType(agent_type.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid agent type: {agent_type}")

    backend_client = BackendClient()
    agent = create_agent(agent_type_enum, backend_client)

    from ...models.schemas import PlanningMode
    result = await agent.analyze(
        query=query,
        train_ids=train_ids,
        decision_date=decision_date,
        mode=PlanningMode.NORMAL,
    )

    return result

