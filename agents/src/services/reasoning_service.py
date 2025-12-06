"""Explainable reasoning generation service using Groq LLM."""

from typing import Dict, Any, List
import logging

from ..config.groq_config import get_groq_llm
from ..models.schemas import DecisionRecommendation, AgentType

logger = logging.getLogger(__name__)


class ReasoningService:
    """Service for generating explainable reasoning for decisions."""

    def __init__(self):
        """Initialize reasoning service."""
        self.llm = get_groq_llm(temperature=0.1)

    def generate_reasoning(
        self, recommendation: DecisionRecommendation, agent_results: Dict[str, Any]
    ) -> str:
        """
        Generate human-readable reasoning for a decision recommendation.

        Args:
            recommendation: Decision recommendation
            agent_results: Agent analysis results

        Returns:
            Natural language reasoning text
        """
        try:
            # Extract key information
            train_number = recommendation.train_number if hasattr(recommendation, "train_number") else recommendation.get("train_number", "Unknown")
            action = recommendation.recommended_action if hasattr(recommendation, "recommended_action") else recommendation.get("recommended_action", "unknown")
            score = recommendation.score if hasattr(recommendation, "score") else recommendation.get("score", 0.0)
            agent_scores = recommendation.agent_scores if hasattr(recommendation, "agent_scores") else recommendation.get("agent_scores", {})
            conflicts = recommendation.conflicts if hasattr(recommendation, "conflicts") else recommendation.get("conflicts", [])

            # Build prompt
            prompt = self._build_reasoning_prompt(
                train_number, action, score, agent_scores, conflicts
            )

            # Generate reasoning using LLM
            response = self.llm.invoke(prompt)
            reasoning_text = response.content if hasattr(response, "content") else str(response)

            return reasoning_text
        except Exception as e:
            logger.error(f"Error generating reasoning: {str(e)}")
            # Fallback to template-based reasoning
            return self._generate_fallback_reasoning(recommendation)

    def _build_reasoning_prompt(
        self,
        train_number: str,
        action: str,
        score: float,
        agent_scores: Dict[str, float],
        conflicts: List[Dict[str, Any]],
    ) -> str:
        """Build prompt for LLM reasoning generation."""
        prompt = f"""Generate a clear, concise explanation for the train induction decision.

Train: {train_number}
Recommended Action: {action}
Composite Score: {score:.1f}/100

Agent Scores:
"""
        for agent_name, agent_score in agent_scores.items():
            prompt += f"- {agent_name}: {agent_score:.1f}/100\n"

        if conflicts:
            prompt += "\nConflicts Detected:\n"
            for conflict in conflicts:
                desc = conflict.get("description", "Unknown conflict") if isinstance(conflict, dict) else getattr(conflict, "description", "Unknown conflict")
                prompt += f"- {desc}\n"

        prompt += """
Provide a clear explanation that includes:
1. Primary recommendation and confidence level
2. Key factors driving the decision (top 2-3 factors)
3. Any concerns or risks
4. Alternative considerations

Format the explanation in a professional, clear manner suitable for train operations supervisors.
"""

        return prompt

    def _generate_fallback_reasoning(self, recommendation: Dict[str, Any]) -> str:
        """Generate fallback reasoning if LLM fails."""
        train_number = recommendation.get("train_number", "Unknown") if isinstance(recommendation, dict) else getattr(recommendation, "train_number", "Unknown")
        action = recommendation.get("recommended_action", "unknown") if isinstance(recommendation, dict) else getattr(recommendation, "recommended_action", "unknown")
        score = recommendation.get("score", 0.0) if isinstance(recommendation, dict) else getattr(recommendation, "score", 0.0)

        return f"Train {train_number} is recommended for {action} with a composite score of {score:.1f}/100. This recommendation is based on analysis of fitness certificates, job cards, branding contracts, mileage balance, cleaning status, and stabling geometry."

