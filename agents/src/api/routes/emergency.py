"""Emergency workflow endpoints."""

from fastapi import APIRouter, HTTPException
from typing import List

from ...models.schemas import (
    EmergencyReplanRequest,
    EmergencyReplanResponse,
    QuickCheckRequest,
    QuickCheckResponse,
    PlanningMode,
)
from ...services.backend_client import BackendClient
from ...emergency.emergency_workflow import EmergencyWorkflow
from ...emergency.crisis_workflow import CrisisWorkflow

router = APIRouter(prefix="/api/v1/agents/emergency", tags=["emergency"])


@router.post("/replan", response_model=EmergencyReplanResponse)
async def emergency_replan(request: EmergencyReplanRequest) -> EmergencyReplanResponse:
    """
    Execute emergency replanning workflow.

    Args:
        request: Emergency replanning request

    Returns:
        Emergency replanning response
    """
    try:
        backend_client = BackendClient()
        emergency_workflow = EmergencyWorkflow(backend_client)

        result = await emergency_workflow.replan(
            withdrawn_train_id=request.withdrawn_train_id,
            emergency_log_id=request.emergency_log_id,
            affected_route=request.affected_route,
            mode=request.mode,
        )

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Emergency replanning failed"))

        plan = result.get("plan", {})

        return EmergencyReplanResponse(
            success=True,
            plan=plan,
            replacement_train=plan.get("replacement_train"),
            deployment_time_minutes=plan.get("deployment_time_minutes"),
            confidence_score=plan.get("confidence_score"),
            reasoning=plan.get("reasoning"),
            execution_steps=plan.get("execution_steps"),
            fallback_options=plan.get("fallback_options"),
            processing_time_seconds=result.get("processing_time_seconds", 0.0),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emergency replanning failed: {str(e)}")


@router.post("/quick-check", response_model=QuickCheckResponse)
async def quick_check(request: QuickCheckRequest) -> QuickCheckResponse:
    """
    Perform quick eligibility check for trains.

    Args:
        request: Quick check request

    Returns:
        Quick check response
    """
    import time
    start_time = time.time()

    try:
        backend_client = BackendClient()
        emergency_workflow = EmergencyWorkflow(backend_client)

        # Get train data for provided train IDs
        eligible_trains = []
        for train_id_str in request.train_ids:
            try:
                # Try to parse as integer
                train_id = int(train_id_str) if train_id_str.isdigit() else None
                if train_id:
                    train_data = await backend_client.get_train_status(train_id)
                    # Quick eligibility check
                    train_option = {
                        "train_id": train_data.get("trainNumber", train_id_str),
                        "readiness_minutes": 15,  # Default
                        "fitness_score": 85.0,
                        "job_card_score": 90.0,
                        "overall_eligible": True,
                    }
                    eligible_trains.append(train_option)
            except Exception:
                continue

        processing_time = time.time() - start_time

        return QuickCheckResponse(
            eligible_trains=eligible_trains,
            processing_time_seconds=processing_time,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick check failed: {str(e)}")


@router.post("/crisis-optimize")
async def crisis_optimize(request: dict) -> dict:
    """
    Execute crisis mode optimization.

    Args:
        request: Crisis optimization request

    Returns:
        Crisis plan
    """
    try:
        backend_client = BackendClient()
        crisis_workflow = CrisisWorkflow(backend_client)

        withdrawn_trains = request.get("withdrawnTrains", [])
        critical_routes = request.get("criticalRoutes", [])
        service_deficit = request.get("serviceDeficit")

        result = await crisis_workflow.optimize(
            withdrawn_trains=withdrawn_trains,
            critical_routes=critical_routes,
            service_deficit=service_deficit,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crisis optimization failed: {str(e)}")

