"""Unit tests for individual agents."""

import pytest
from src.agents import (
    FitnessCertificateAgent,
    JobCardAgent,
    BrandingAgent,
    MileageAgent,
    CleaningAgent,
    StablingAgent,
)
from src.services.backend_client import BackendClient


@pytest.fixture
def backend_client():
    """Create backend client fixture."""
    return BackendClient()


@pytest.mark.asyncio
async def test_fitness_agent(backend_client):
    """Test fitness certificate agent."""
    agent = FitnessCertificateAgent(backend_client)
    # Add test implementation
    assert agent is not None


@pytest.mark.asyncio
async def test_job_card_agent(backend_client):
    """Test job card agent."""
    agent = JobCardAgent(backend_client)
    # Add test implementation
    assert agent is not None

