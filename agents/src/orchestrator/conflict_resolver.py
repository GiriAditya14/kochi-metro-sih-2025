"""Conflict resolution engine for detecting and resolving agent conflicts."""

from typing import List, Dict, Any
from ..models.schemas import (
    AgentType,
    ConflictAlert,
    ConflictSeverity,
    PlanningMode,
    TrainAnalysis,
)


class ConflictResolver:
    """Engine for detecting and resolving conflicts between agent recommendations."""

    def __init__(self, mode: PlanningMode):
        """
        Initialize conflict resolver.

        Args:
            mode: Planning mode
        """
        self.mode = mode

    def detect_conflicts(
        self, agent_results: Dict[AgentType, List[TrainAnalysis]]
    ) -> List[ConflictAlert]:
        """
        Detect conflicts between agent recommendations.

        Args:
            agent_results: Dictionary of agent type to train analyses

        Returns:
            List of detected conflicts
        """
        conflicts = []

        # Get all train IDs
        all_train_ids = set()
        for analyses in agent_results.values():
            for analysis in analyses:
                all_train_ids.add(analysis.train_id)

        # Check each train for conflicts
        for train_id in all_train_ids:
            train_conflicts = self._check_train_conflicts(train_id, agent_results)
            conflicts.extend(train_conflicts)

        return conflicts

    def _check_train_conflicts(
        self, train_id: int, agent_results: Dict[AgentType, List[TrainAnalysis]]
    ) -> List[ConflictAlert]:
        """Check for conflicts for a specific train."""
        conflicts = []

        # Get analyses for this train
        train_analyses: Dict[AgentType, TrainAnalysis] = {}
        train_number = None

        for agent_type, analyses in agent_results.items():
            for analysis in analyses:
                if analysis.train_id == train_id:
                    train_analyses[agent_type] = analysis
                    if not train_number:
                        train_number = analysis.train_number
                    break

        if not train_analyses:
            return []

        # Check for hard constraint conflicts
        fitness_analysis = train_analyses.get(AgentType.FITNESS_CERTIFICATE)
        job_card_analysis = train_analyses.get(AgentType.JOB_CARD)
        branding_analysis = train_analyses.get(AgentType.BRANDING)

        # Conflict 1: Expired certificate but branding requires service
        if fitness_analysis and fitness_analysis.score == 0:
            if branding_analysis and branding_analysis.score > 80:
                conflicts.append(
                    ConflictAlert(
                        train_id=train_id,
                        train_number=train_number or f"T{train_id}",
                        conflict_type="hard_constraint_vs_revenue",
                        severity=ConflictSeverity.CRITICAL,
                        description="Expired fitness certificate blocks revenue service, but branding contract requires service",
                        affected_agents=[AgentType.FITNESS_CERTIFICATE, AgentType.BRANDING],
                        resolution="Hard constraint wins: Train cannot enter revenue service. Alert management about branding breach risk.",
                    )
                )

        # Conflict 2: Blocking job card but branding requires service
        if job_card_analysis and job_card_analysis.score == 0:
            if branding_analysis and branding_analysis.score > 80:
                conflicts.append(
                    ConflictAlert(
                        train_id=train_id,
                        train_number=train_number or f"T{train_id}",
                        conflict_type="hard_constraint_vs_revenue",
                        severity=ConflictSeverity.CRITICAL,
                        description="Blocking job card prevents revenue service, but branding contract requires service",
                        affected_agents=[AgentType.JOB_CARD, AgentType.BRANDING],
                        resolution="Hard constraint wins: Train cannot enter revenue service. Alert management about branding breach risk.",
                    )
                )

        # Conflict 3: Mileage balancing vs branding priority
        mileage_analysis = train_analyses.get(AgentType.MILEAGE)
        if mileage_analysis and mileage_analysis.score < 50:  # Overused train
            if branding_analysis and branding_analysis.score > 90:  # High branding priority
                conflicts.append(
                    ConflictAlert(
                        train_id=train_id,
                        train_number=train_number or f"T{train_id}",
                        conflict_type="optimization_vs_revenue",
                        severity=ConflictSeverity.MEDIUM,
                        description="Mileage balancing recommends maintenance, but branding contract requires immediate service",
                        affected_agents=[AgentType.MILEAGE, AgentType.BRANDING],
                        resolution="Evaluate trade-off: Calculate cost of maintenance delay vs branding penalty. Choose lower total cost.",
                    )
                )

        # Conflict 4: Cleaning overdue but otherwise ready
        cleaning_analysis = train_analyses.get(AgentType.CLEANING)
        if cleaning_analysis and cleaning_analysis.score < 50:
            # Check if other agents recommend service
            other_scores = [
                a.score
                for agent_type, a in train_analyses.items()
                if agent_type not in [AgentType.CLEANING]
            ]
            if other_scores and all(s > 70 for s in other_scores):
                conflicts.append(
                    ConflictAlert(
                        train_id=train_id,
                        train_number=train_number or f"T{train_id}",
                        conflict_type="quality_vs_readiness",
                        severity=ConflictSeverity.LOW,
                        description="Cleaning overdue but train is otherwise ready for service",
                        affected_agents=[AgentType.CLEANING],
                        resolution="Schedule cleaning before service or accept with documentation",
                    )
                )

        return conflicts

    def resolve_conflicts(
        self, conflicts: List[ConflictAlert], agent_results: Dict[AgentType, List[TrainAnalysis]]
    ) -> List[ConflictAlert]:
        """
        Resolve conflicts using resolution strategies.

        Args:
            conflicts: List of detected conflicts
            agent_results: Agent results for potential adjustment

        Returns:
            List of resolved conflicts with resolutions
        """
        resolved = []

        for conflict in conflicts:
            if conflict.resolution:
                # Apply resolution strategy
                resolution_applied = self._apply_resolution(conflict, agent_results)
                if resolution_applied:
                    conflict.severity = ConflictSeverity.LOW  # Mark as resolved
                resolved.append(conflict)

        return resolved

    def _apply_resolution(
        self, conflict: ConflictAlert, agent_results: Dict[AgentType, List[TrainAnalysis]]
    ) -> bool:
        """
        Apply resolution strategy to a conflict.

        Args:
            conflict: Conflict to resolve
            agent_results: Agent results (may be modified)

        Returns:
            True if resolution was applied
        """
        # For now, we just document the resolution
        # In a full implementation, we might adjust agent scores or recommendations
        return True

