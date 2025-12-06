"""Multi-objective optimization engine."""

from typing import List, Dict, Any
from ..models.schemas import (
    AgentType,
    PlanningMode,
    DecisionRecommendation,
    ConflictAlert,
    RecommendedAction,
)
from .scoring import calculate_composite_score, get_agent_weights, calculate_readiness_bonus


class MultiObjectiveOptimizer:
    """Multi-objective optimization engine for combining agent scores."""

    def __init__(self, mode: PlanningMode = PlanningMode.NORMAL):
        """
        Initialize optimizer.

        Args:
            mode: Planning mode
        """
        self.mode = mode
        self.weights = get_agent_weights(mode)

    def optimize(
        self,
        train_analyses: Dict[int, Dict[AgentType, float]],
        train_numbers: Dict[int, str],
        conflicts: List[ConflictAlert],
    ) -> List[DecisionRecommendation]:
        """
        Optimize and rank trains based on composite scores.

        Args:
            train_analyses: Dictionary mapping train_id to agent scores
            train_numbers: Dictionary mapping train_id to train_number
            conflicts: List of detected conflicts

        Returns:
            List of ranked decision recommendations
        """
        recommendations = []

        for train_id, agent_scores in train_analyses.items():
            train_number = train_numbers.get(train_id, f"T{train_id}")

            # Calculate composite score
            composite_score = calculate_composite_score(agent_scores, self.mode)

            # Determine recommended action
            recommended_action = self._determine_action(composite_score, agent_scores, train_id, conflicts)

            # Calculate confidence
            confidence = self._calculate_confidence(composite_score, agent_scores)

            # Get conflicts for this train
            train_conflicts = [c for c in conflicts if c.train_id == train_id]

            # Generate recommendation
            recommendation = DecisionRecommendation(
                train_id=train_id,
                train_number=train_number,
                recommended_action=recommended_action,
                score=composite_score,
                confidence=confidence,
                reasoning={
                    "composite_score": composite_score,
                    "agent_breakdown": {k.value: v for k, v in agent_scores.items()},
                },
                agent_scores={k.value: v for k, v in agent_scores.items()},
                conflicts=train_conflicts,
                alternatives=[],
            )

            recommendations.append(recommendation)

        # Sort by composite score (descending)
        recommendations.sort(key=lambda x: x.score, reverse=True)

        return recommendations

    def _determine_action(
        self,
        composite_score: float,
        agent_scores: Dict[AgentType, float],
        train_id: int,
        conflicts: List[ConflictAlert],
    ) -> RecommendedAction:
        """
        Determine recommended action based on scores and constraints.

        Args:
            composite_score: Composite score
            agent_scores: Individual agent scores
            train_id: Train ID
            conflicts: List of conflicts

        Returns:
            Recommended action
        """
        # Check for hard constraints
        if agent_scores.get(AgentType.FITNESS_CERTIFICATE, 100) == 0:
            return RecommendedAction.MAINTENANCE
        if agent_scores.get(AgentType.JOB_CARD, 100) == 0:
            return RecommendedAction.MAINTENANCE

        # Check for critical conflicts
        train_conflicts = [c for c in conflicts if c.train_id == train_id and c.severity == "critical"]
        if train_conflicts:
            return RecommendedAction.MAINTENANCE

        # Determine based on score
        if composite_score >= 80:
            return RecommendedAction.REVENUE
        elif composite_score >= 60:
            return RecommendedAction.STANDBY
        else:
            return RecommendedAction.MAINTENANCE

    def _calculate_confidence(
        self, composite_score: float, agent_scores: Dict[AgentType, float]
    ) -> float:
        """
        Calculate confidence level for recommendation.

        Args:
            composite_score: Composite score
            agent_scores: Individual agent scores

        Returns:
            Confidence level (0-1)
        """
        # Base confidence from composite score
        base_confidence = composite_score / 100.0

        # Adjust based on score consistency
        scores = list(agent_scores.values())
        if scores:
            score_variance = sum((s - composite_score) ** 2 for s in scores) / len(scores)
            consistency_penalty = min(0.2, score_variance / 10000.0)
            confidence = base_confidence - consistency_penalty
        else:
            confidence = base_confidence

        return max(0.0, min(1.0, confidence))

