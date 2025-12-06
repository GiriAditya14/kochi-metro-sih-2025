"""API routes module."""

from .planning import router as planning_router
from .emergency import router as emergency_router
from .health import router as health_router
from .agent_query import router as agent_query_router

__all__ = ["planning_router", "emergency_router", "health_router", "agent_query_router"]

