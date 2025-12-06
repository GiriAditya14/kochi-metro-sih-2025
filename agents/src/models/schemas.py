"""Pydantic models for API requests and responses."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class AgentType(str, Enum):
    """Agent type enumeration."""

    FITNESS_CERTIFICATE = "fitness_certificate"
    JOB_CARD = "job_card"
    BRANDING = "branding"
    MILEAGE = "mileage"
    CLEANING = "cleaning"
    STABLING = "stabling"


class PlanningMode(str, Enum):
    """Planning mode enumeration."""

    NORMAL = "normal"
    EMERGENCY = "emergency"
    CRISIS = "crisis"


class RecommendedAction(str, Enum):
    """Recommended action enumeration."""

    REVENUE = "revenue"
    STANDBY = "standby"
    MAINTENANCE = "maintenance"


class ConflictSeverity(str, Enum):
    """Conflict severity levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AgentRequest(BaseModel):
    """Request schema for agent analysis."""

    train_ids: List[int] = Field(..., description="List of train IDs to analyze")
    decision_date: str = Field(..., description="Decision date in YYYY-MM-DD format")
    mode: PlanningMode = Field(default=PlanningMode.NORMAL, description="Planning mode")


class TrainAnalysis(BaseModel):
    """Per-train analysis result from an agent."""

    train_id: int
    train_number: str
    score: float = Field(..., ge=0, le=100, description="Agent score (0-100)")
    reasoning: Dict[str, Any] = Field(..., description="Detailed reasoning")
    alerts: List[str] = Field(default_factory=list, description="Alert messages")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations")


class AgentResponse(BaseModel):
    """Response schema from an agent."""

    agent_type: AgentType
    train_analyses: List[TrainAnalysis]
    processing_time_seconds: float
    errors: List[str] = Field(default_factory=list)


class ConflictAlert(BaseModel):
    """Conflict detection schema."""

    train_id: int
    train_number: str
    conflict_type: str = Field(..., description="Type of conflict")
    severity: ConflictSeverity
    description: str
    affected_agents: List[AgentType]
    resolution: Optional[str] = None


class DecisionRecommendation(BaseModel):
    """Final decision recommendation for a train."""

    train_id: int
    train_number: str
    recommended_action: RecommendedAction
    score: float = Field(..., ge=0, le=100, description="Composite score (0-100)")
    confidence: float = Field(..., ge=0, le=1, description="Confidence level (0-1)")
    reasoning: Dict[str, Any] = Field(..., description="Detailed reasoning")
    agent_scores: Dict[str, float] = Field(..., description="Individual agent scores")
    conflicts: List[ConflictAlert] = Field(default_factory=list)
    alternatives: List[Dict[str, Any]] = Field(default_factory=list)


class PlanningRequest(BaseModel):
    """Request schema for normal planning workflow."""

    decision_date: str = Field(..., description="Decision date in YYYY-MM-DD format")
    train_ids: Optional[List[int]] = Field(None, description="Optional list of train IDs (all if not provided)")
    include_reasoning: bool = Field(default=True, description="Include detailed reasoning")


class PlanningResponse(BaseModel):
    """Response schema for planning workflow."""

    success: bool
    decision_date: str
    recommendations: List[DecisionRecommendation]
    conflicts: List[ConflictAlert]
    processing_time_seconds: float
    total_trains_analyzed: int


class EmergencyReplanRequest(BaseModel):
    """Request schema for emergency replanning."""

    emergency_log_id: int
    withdrawn_train_id: str
    affected_route: Optional[str] = None
    mode: PlanningMode = Field(default=PlanningMode.EMERGENCY)
    urgency: str = Field(default="HIGH")


class EmergencyReplanResponse(BaseModel):
    """Response schema for emergency replanning."""

    success: bool
    plan: Optional[Dict[str, Any]] = None
    replacement_train: Optional[str] = None
    deployment_time_minutes: Optional[int] = None
    confidence_score: Optional[float] = None
    reasoning: Optional[List[Dict[str, Any]]] = None
    execution_steps: Optional[List[str]] = None
    fallback_options: Optional[List[Dict[str, Any]]] = None
    processing_time_seconds: float


class QuickCheckRequest(BaseModel):
    """Request schema for quick eligibility check."""

    train_ids: List[str]
    mode: PlanningMode = Field(default=PlanningMode.EMERGENCY)


class QuickCheckResponse(BaseModel):
    """Response schema for quick eligibility check."""

    eligible_trains: List[Dict[str, Any]]
    processing_time_seconds: float

