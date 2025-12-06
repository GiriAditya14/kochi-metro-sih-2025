"""FastAPI application entry point for Agent Phase service."""

import logging
from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi

from .config.settings import settings
from .api.routes import planning_router, emergency_router, health_router
from .api.middleware import setup_cors, setup_middleware

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="NeuralInduction AI - Agent Phase Service",
    description="Multi-agent system for train induction optimization",
    version="1.0.0",
)

# Setup middleware
setup_cors(app)
setup_middleware(app)

# Register routes
app.include_router(health_router, tags=["health"])
app.include_router(planning_router)
app.include_router(emergency_router)


@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    logger.info("Agent Phase service starting up...")
    logger.info(f"Backend API URL: {settings.backend_api_url}")
    logger.info(f"Service running on {settings.agent_service_host}:{settings.agent_service_port}")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    logger.info("Agent Phase service shutting down...")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "NeuralInduction AI - Agent Phase",
        "version": "1.0.0",
        "status": "operational",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.agent_service_host,
        port=settings.agent_service_port,
        reload=settings.node_env == "development",
    )

