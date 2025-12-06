"""Scoring algorithms for composite score calculation."""

from typing import Dict
from ..models.schemas import PlanningMode, AgentType


def get_agent_weights(mode: PlanningMode) -> Dict[AgentType, float]:
    """
    Get agent weights for composite score calculation.

    Args:
        mode: Planning mode (normal, emergency, crisis)

    Returns:
        Dictionary mapping agent types to weights
    """
    if mode == PlanningMode.EMERGENCY or mode == PlanningMode.CRISIS:
        # Emergency mode weights - prioritize safety and speed
        return {
            AgentType.FITNESS_CERTIFICATE: 0.30,
            AgentType.JOB_CARD: 0.25,
            AgentType.BRANDING: 0.05,
            AgentType.MILEAGE: 0.05,
            AgentType.CLEANING: 0.03,
            AgentType.STABLING: 0.05,
            # Readiness bonus (calculated separately): 0.27
        }
    else:
        # Normal mode weights
        return {
            AgentType.FITNESS_CERTIFICATE: 0.25,
            AgentType.JOB_CARD: 0.20,
            AgentType.BRANDING: 0.15,
            AgentType.MILEAGE: 0.15,
            AgentType.CLEANING: 0.10,
            AgentType.STABLING: 0.15,
        }


def calculate_composite_score(
    agent_scores: Dict[AgentType, float],
    mode: PlanningMode,
    readiness_bonus: float = 0.0,
) -> float:
    """
    Calculate composite score from individual agent scores.

    Args:
        agent_scores: Dictionary of agent type to score (0-100)
        mode: Planning mode
        readiness_bonus: Bonus score for readiness (0-27 in emergency mode)

    Returns:
        Composite score (0-100)
    """
    weights = get_agent_weights(mode)

    # Check for hard constraint violations (score = 0)
    if agent_scores.get(AgentType.FITNESS_CERTIFICATE, 100) == 0:
        return 0.0  # Expired certificate blocks service
    if agent_scores.get(AgentType.JOB_CARD, 100) == 0:
        return 0.0  # Blocking job card blocks service

    # Calculate weighted sum
    weighted_sum = 0.0
    for agent_type, weight in weights.items():
        score = agent_scores.get(agent_type, 50.0)  # Default to 50 if missing
        weighted_sum += score * weight

    # Add readiness bonus in emergency mode
    if mode in [PlanningMode.EMERGENCY, PlanningMode.CRISIS]:
        weighted_sum += readiness_bonus

    # Apply constraint penalties
    # If any critical constraint is violated, reduce score
    if agent_scores.get(AgentType.FITNESS_CERTIFICATE, 100) < 60:
        weighted_sum *= 0.5  # Penalty for expiring certificates

    # Ensure score is within bounds
    return max(0.0, min(100.0, weighted_sum))


def calculate_readiness_bonus(readiness_minutes: int) -> float:
    """
    Calculate readiness bonus for emergency mode.

    Args:
        readiness_minutes: Minutes until train is ready for deployment

    Returns:
        Bonus points (0-27)
    """
    if readiness_minutes <= 15:
        return 27.0
    elif readiness_minutes <= 20:
        return 20.0
    elif readiness_minutes <= 25:
        return 10.0
    else:
        return 0.0

