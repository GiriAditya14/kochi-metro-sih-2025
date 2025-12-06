"""Fitness Certificate Agent - Validates and tracks fitness certificate validity."""

from typing import List, Dict, Any
from datetime import datetime

from .base_agent import BaseAgent
from ..models.schemas import AgentType, TrainAnalysis, PlanningMode
from ..services.backend_client import BackendClient


class FitnessCertificateAgent(BaseAgent):
    """Agent for validating fitness certificates across departments."""

    def __init__(self, backend_client: BackendClient):
        super().__init__(AgentType.FITNESS_CERTIFICATE, backend_client)

    async def analyze(
        self, train_ids: List[int], decision_date: str, mode: PlanningMode = PlanningMode.NORMAL
    ) -> List[TrainAnalysis]:
        """
        Analyze fitness certificates for trains.

        Args:
            train_ids: List of train IDs
            decision_date: Decision date
            mode: Planning mode

        Returns:
            List of train analyses
        """
        decision_dt = self.validate_decision_date(decision_date)
        analyses = []

        # Query backend for expiring certificates
        certificates_data = await self.backend_client.query_backend(
            "fitness_certificate",
            "get_all_expiring_certificates",
            {"daysAhead": 30},  # Get certificates expiring in next 30 days
        )

        # Group certificates by train
        train_certificates: Dict[int, List[Dict[str, Any]]] = {}
        for cert in certificates_data:
            train_id = cert.get("trainId")
            if train_id:
                if train_id not in train_certificates:
                    train_certificates[train_id] = []
                train_certificates[train_id].append(cert)

        # Analyze each train
        for train_id in train_ids:
            train_data = await self.get_train_data(train_id)
            if not train_data:
                continue

            train_number = train_data.get("trainNumber", f"T{train_id}")
            certificates = train_data.get("fitnessCertificates", [])

            # Calculate score and generate reasoning
            score, reasoning, alerts, recommendations = self._evaluate_certificates(
                certificates, decision_dt, mode
            )

            analyses.append(
                TrainAnalysis(
                    train_id=train_id,
                    train_number=train_number,
                    score=score,
                    reasoning=reasoning,
                    alerts=alerts,
                    recommendations=recommendations,
                )
            )

        return analyses

    def _evaluate_certificates(
        self, certificates: List[Dict[str, Any]], decision_date: datetime, mode: PlanningMode
    ) -> tuple[float, Dict[str, Any], List[str], List[str]]:
        """
        Evaluate fitness certificates and calculate score.

        Returns:
            Tuple of (score, reasoning, alerts, recommendations)
        """
        if not certificates:
            return (
                0.0,
                {"status": "no_certificates", "message": "No fitness certificates found"},
                ["No fitness certificates available"],
                ["Obtain fitness certificates before service"],
            )

        # Required departments
        required_departments = ["rolling_stock", "signalling", "telecom"]
        department_status: Dict[str, Dict[str, Any]] = {}

        # Check each certificate
        expired_count = 0
        expiring_soon_count = 0
        valid_count = 0

        for cert in certificates:
            dept = cert.get("department", "").lower()
            expiry_str = cert.get("expiryDate")
            if not expiry_str:
                continue

            try:
                expiry_date = datetime.strptime(expiry_str, "%Y-%m-%d")
            except (ValueError, TypeError):
                continue

            days_remaining = self.days_until_date(expiry_date, decision_date)

            # Determine validity based on mode
            is_emergency = self.is_emergency_mode(mode)
            min_validity_days = 1 if is_emergency else 3

            if days_remaining < 0:
                status = "expired"
                expired_count += 1
            elif days_remaining < min_validity_days:
                status = "expiring_imminent"
                expiring_soon_count += 1
            elif days_remaining < 7:
                status = "expiring_soon"
                expiring_soon_count += 1
            else:
                status = "valid"
                valid_count += 1

            department_status[dept] = {
                "status": status,
                "expiry_date": expiry_str,
                "days_remaining": days_remaining,
            }

        # Calculate score
        score = self.calculate_score_from_status(
            expired_count, expiring_soon_count, valid_count, len(required_departments), mode
        )

        # Generate reasoning
        reasoning = {
            "total_certificates": len(certificates),
            "valid_count": valid_count,
            "expired_count": expired_count,
            "expiring_soon_count": expiring_soon_count,
            "department_status": department_status,
            "required_departments": required_departments,
        }

        # Generate alerts
        alerts = []
        if expired_count > 0:
            alerts.append(f"CRITICAL: {expired_count} expired certificate(s) - Block revenue service")
        if expiring_soon_count > 0:
            alerts.append(f"WARNING: {expiring_soon_count} certificate(s) expiring soon")

        # Generate recommendations
        recommendations = []
        if expired_count > 0:
            recommendations.append("Renew expired certificates immediately")
        if expiring_soon_count > 0:
            recommendations.append("Schedule certificate renewal before expiry")

        return score, reasoning, alerts, recommendations

    def calculate_score_from_status(
        self, expired: int, expiring_soon: int, valid: int, total_required: int, mode: PlanningMode
    ) -> float:
        """
        Calculate fitness score based on certificate status.

        Args:
            expired: Number of expired certificates
            expiring_soon: Number of expiring soon certificates
            valid: Number of valid certificates
            total_required: Total required certificates
            mode: Planning mode

        Returns:
            Score from 0-100
        """
        if expired > 0:
            return 0.0  # Hard constraint violation

        if valid == total_required:
            return 100.0  # All valid

        # Partial validity scoring
        validity_ratio = valid / total_required if total_required > 0 else 0

        if expiring_soon > 0:
            # Penalty for expiring certificates
            penalty = 20 * expiring_soon
            base_score = validity_ratio * 100
            return max(0, base_score - penalty)

        return validity_ratio * 100

    def calculate_score(self, train_data: Dict[str, Any], mode: PlanningMode = PlanningMode.NORMAL) -> float:
        """Calculate fitness score for train data."""
        certificates = train_data.get("fitnessCertificates", [])
        decision_date = datetime.now()  # Default to today
        _, score, _, _ = self._evaluate_certificates(certificates, decision_date, mode)
        return score

    def generate_reasoning(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate reasoning from analysis result."""
        return analysis_result.get("reasoning", {})

