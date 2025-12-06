"""Scoring and calculation tools for agents."""

from typing import Dict, Any, List
from datetime import datetime
from langchain_core.tools import tool


@tool
def calculate_fitness_score(
    certificates: List[Dict[str, Any]], decision_date: str, mode: str = "normal"
) -> Dict[str, Any]:
    """
    Calculate fitness certificate score based on validity.

    Args:
        certificates: List of fitness certificate records
        decision_date: Decision date in YYYY-MM-DD format
        mode: Planning mode (normal, emergency, crisis)

    Returns:
        Dictionary with score, reasoning, and alerts
    """
    decision_dt = datetime.strptime(decision_date, "%Y-%m-%d")
    is_emergency = mode in ["emergency", "crisis"]
    min_validity_days = 1 if is_emergency else 3

    if not certificates:
        return {
            "score": 0.0,
            "reasoning": "No fitness certificates found",
            "alerts": ["No fitness certificates available"],
        }

    expired = 0
    expiring_soon = 0
    valid = 0
    required_departments = ["rolling_stock", "signalling", "telecom"]

    for cert in certificates:
        expiry_str = cert.get("expiryDate")
        if not expiry_str:
            continue

        try:
            expiry_date = datetime.strptime(expiry_str, "%Y-%m-%d")
            days_remaining = (expiry_date - decision_dt).days

            if days_remaining < 0:
                expired += 1
            elif days_remaining < min_validity_days:
                expiring_soon += 1
            else:
                valid += 1
        except (ValueError, TypeError):
            continue

    if expired > 0:
        score = 0.0
        alerts = [f"CRITICAL: {expired} expired certificate(s)"]
    elif valid == len(required_departments):
        score = 100.0
        alerts = []
    elif expiring_soon > 0:
        score = max(0, 100 - (20 * expiring_soon))
        alerts = [f"WARNING: {expiring_soon} certificate(s) expiring soon"]
    else:
        score = (valid / len(required_departments)) * 100
        alerts = []

    return {
        "score": score,
        "reasoning": f"Valid: {valid}, Expiring: {expiring_soon}, Expired: {expired}",
        "alerts": alerts,
    }


@tool
def calculate_job_card_score(
    job_cards: List[Dict[str, Any]], mode: str = "normal"
) -> Dict[str, Any]:
    """
    Calculate job card maintenance readiness score.

    Args:
        job_cards: List of job card records
        mode: Planning mode

    Returns:
        Dictionary with score, reasoning, and alerts
    """
    open_jobs = [j for j in job_cards if j.get("status") in ["open", "in_progress"]]

    if not open_jobs:
        return {
            "score": 100.0,
            "reasoning": "No open job cards",
            "alerts": [],
        }

    critical = [j for j in open_jobs if j.get("priority") == "critical"]
    blocking = [j for j in critical if j.get("blockingService", False)]

    max_critical_allowed = 3 if mode in ["emergency", "crisis"] else 2

    if blocking:
        return {
            "score": 0.0,
            "reasoning": f"{len(blocking)} blocking job(s) prevent service",
            "alerts": [f"CRITICAL: {len(blocking)} blocking job(s)"],
        }

    if len(critical) > max_critical_allowed:
        return {
            "score": 0.0,
            "reasoning": f"{len(critical)} critical jobs exceed threshold",
            "alerts": [f"WARNING: {len(critical)} critical jobs"],
        }

    if critical:
        score = 40.0
    elif [j for j in open_jobs if j.get("priority") == "high"]:
        score = 70.0
    else:
        score = 90.0

    return {
        "score": score,
        "reasoning": f"Open jobs: {len(open_jobs)}, Critical: {len(critical)}",
        "alerts": [],
    }


@tool
def calculate_days_until(target_date: str, reference_date: str) -> int:
    """
    Calculate days until target date.

    Args:
        target_date: Target date in YYYY-MM-DD format
        reference_date: Reference date in YYYY-MM-DD format

    Returns:
        Number of days (negative if past)
    """
    target = datetime.strptime(target_date, "%Y-%m-%d")
    reference = datetime.strptime(reference_date, "%Y-%m-%d")
    return (target - reference).days


@tool
def calculate_mileage_deviation(
    train_mileage: float, fleet_average: float
) -> Dict[str, Any]:
    """
    Calculate mileage deviation from fleet average.

    Args:
        train_mileage: Train's cumulative mileage
        fleet_average: Fleet average mileage

    Returns:
        Dictionary with deviation percentage and score
    """
    if fleet_average == 0:
        return {"deviation_percent": 0, "score": 50.0}

    deviation = ((train_mileage - fleet_average) / fleet_average) * 100
    abs_deviation = abs(deviation)

    if abs_deviation <= 5:
        score = 100.0
    elif abs_deviation <= 10:
        score = 90.0 if deviation < 0 else 85.0
    elif abs_deviation <= 20:
        score = 70.0 if deviation < 0 else 50.0
    else:
        score = 0.0 if deviation > 0 else 100.0

    return {
        "deviation_percent": deviation,
        "score": score,
        "status": "above_average" if deviation > 0 else "below_average",
    }

