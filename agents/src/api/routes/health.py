"""Health check endpoints."""

from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "agent-phase"}


@router.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    """Readiness check endpoint."""
    # Could check database connectivity, backend connectivity, etc.
    return {"status": "ready", "service": "agent-phase"}

