"""Factory for creating LLM-based agents."""

from ..models.schemas import AgentType
from ..services.backend_client import BackendClient
from .llm_agent import (
    create_fitness_agent,
    create_job_card_agent,
    create_branding_agent,
    create_mileage_agent,
    create_cleaning_agent,
    create_stabling_agent,
)


def create_agent(agent_type: AgentType, backend_client: BackendClient):
    """
    Create an LLM-based agent of the specified type.

    Args:
        agent_type: Type of agent to create
        backend_client: Backend API client

    Returns:
        LLM agent instance
    """
    factory_map = {
        AgentType.FITNESS_CERTIFICATE: create_fitness_agent,
        AgentType.JOB_CARD: create_job_card_agent,
        AgentType.BRANDING: create_branding_agent,
        AgentType.MILEAGE: create_mileage_agent,
        AgentType.CLEANING: create_cleaning_agent,
        AgentType.STABLING: create_stabling_agent,
    }

    factory_func = factory_map.get(agent_type)
    if not factory_func:
        raise ValueError(f"Unknown agent type: {agent_type}")

    return factory_func(backend_client)

