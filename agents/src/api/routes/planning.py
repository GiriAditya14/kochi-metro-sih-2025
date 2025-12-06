"""Planning workflow endpoints."""

from fastapi import APIRouter, HTTPException
from typing import List, Optional

from ...models.schemas import PlanningRequest, PlanningResponse
from ...services.backend_client import BackendClient
from ...orchestrator.langgraph_workflow import run_planning_workflow
from ...models.schemas import PlanningMode

router = APIRouter(prefix="/api/v1/agents", tags=["planning"])


@router.post("/plan", response_model=PlanningResponse)
async def plan_induction(request: PlanningRequest) -> PlanningResponse:
    """
    Execute normal planning workflow.

    Args:
        request: Planning request

    Returns:
        Planning response with recommendations
    """
    import time
    start_time = time.time()

    try:
        # Initialize backend client
        backend_client = BackendClient()

        # Get train IDs if not provided
        train_ids = request.train_ids
        if not train_ids:
            # Get all trains from backend
            all_trains = await backend_client.get_all_trains()
            train_ids = [t.get("id") or t.get("trainId") for t in all_trains if t.get("id") or t.get("trainId")]
            train_numbers = [t.get("trainNumber", f"T{t.get('id')}") for t in all_trains]
        else:
            # Get train numbers for provided IDs
            train_numbers = []
            for train_id in train_ids:
                try:
                    train_data = await backend_client.get_train_status(train_id)
                    train_numbers.append(train_data.get("trainNumber", f"T{train_id}"))
                except Exception:
                    train_numbers.append(f"T{train_id}")

        # Run planning workflow
        result = await run_planning_workflow(
            train_ids=train_ids,
            train_numbers=train_numbers,
            decision_date=request.decision_date,
            mode=PlanningMode.NORMAL,
            backend_client=backend_client,
        )

        processing_time = time.time() - start_time

        # Format response
        return PlanningResponse(
            success=True,
            decision_date=request.decision_date,
            recommendations=result.get("recommendations", []),
            conflicts=result.get("conflicts", []),
            processing_time_seconds=processing_time,
            total_trains_analyzed=len(train_ids),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Planning workflow failed: {str(e)}")


@router.post("/what-if")
async def what_if_simulation(request: PlanningRequest) -> PlanningResponse:
    """
    Execute what-if simulation workflow.

    Args:
        request: Planning request with modified constraints

    Returns:
        Planning response with simulated recommendations
    """
    # Similar to plan_induction but with scenario modifications
    # For now, delegate to normal planning
    return await plan_induction(request)

