from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base


class JobType(str, enum.Enum):
    PREVENTIVE = "preventive"  # Scheduled maintenance
    CORRECTIVE = "corrective"  # Fault-based repair
    INSPECTION = "inspection"  # Regular inspection
    OVERHAUL = "overhaul"  # Major overhaul
    EMERGENCY = "emergency"  # Emergency repair
    UPGRADE = "upgrade"  # System upgrade


class JobStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_PARTS = "PENDING_PARTS"
    DEFERRED = "DEFERRED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class JobPriority(int, enum.Enum):
    CRITICAL = 1  # Safety critical - immediate
    HIGH = 2  # Must complete within 24 hours
    MEDIUM = 3  # Within 72 hours
    LOW = 4  # Within 1 week
    ROUTINE = 5  # Scheduled/planned


class JobCard(Base):
    """
    Job cards / work orders from IBM Maximo.
    Represents maintenance tasks for trainsets.
    """
    __tablename__ = "job_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    
    # Job identification (from Maximo)
    job_id = Column(String(50), unique=True, index=True)  # Maximo work order ID
    parent_job_id = Column(String(50))  # For child work orders
    
    # Job details
    job_type = Column(SQLEnum(JobType), nullable=False)
    priority = Column(SQLEnum(JobPriority), default=JobPriority.MEDIUM)
    status = Column(SQLEnum(JobStatus), default=JobStatus.OPEN)
    
    # Description
    title = Column(String(200), nullable=False)
    description = Column(Text)
    
    # Component/system affected
    related_component = Column(String(100))  # bogie, HVAC, doors, traction, brakes
    system_code = Column(String(50))  # System classification code
    location_on_train = Column(String(50))  # Car 1, Car 2, etc.
    
    # Timing
    reported_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)
    earliest_start = Column(DateTime)  # Can't start before this
    target_completion = Column(DateTime)
    actual_completion = Column(DateTime)
    
    # Duration and resources
    estimated_downtime_hours = Column(Float, default=0)
    actual_downtime_hours = Column(Float)
    estimated_cost = Column(Float)
    actual_cost = Column(Float)
    
    # Safety and criticality
    safety_critical = Column(Boolean, default=False)
    requires_ibl = Column(Boolean, default=False)  # Must go to IBL
    blocks_service = Column(Boolean, default=False)  # Blocks revenue service
    
    # Parts and materials
    parts_required = Column(Text)  # JSON list
    parts_available = Column(Boolean, default=True)
    parts_eta = Column(DateTime)  # Expected arrival of parts
    
    # Deferral info
    can_be_deferred = Column(Boolean, default=True)
    max_deferral_days = Column(Integer, default=0)
    deferral_reason = Column(Text)
    deferred_count = Column(Integer, default=0)  # Times this job was deferred
    
    # Failure/fault info (for corrective)
    fault_code = Column(String(50))
    fault_description = Column(Text)
    fault_detected_by = Column(String(50))  # Driver, IoT, Inspection
    
    # Assignment
    assigned_to = Column(String(100))
    assigned_team = Column(String(50))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    train = relationship("Train", back_populates="job_cards")
    
    def __repr__(self):
        return f"<JobCard {self.job_id} - {self.title}>"
    
    def is_blocking(self) -> bool:
        """Check if this job blocks the train from service"""
        if self.status == JobStatus.CLOSED:
            return False
        if self.safety_critical and self.status in [JobStatus.OPEN, JobStatus.IN_PROGRESS]:
            return True
        if self.blocks_service:
            return True
        return False
    
    def is_overdue(self) -> bool:
        """Check if job is overdue"""
        if self.status == JobStatus.CLOSED:
            return False
        if self.due_date and datetime.utcnow() > self.due_date:
            return True
        return False
    
    def days_until_due(self) -> float:
        """Get days until job is due"""
        if not self.due_date:
            return float('inf')
        delta = self.due_date - datetime.utcnow()
        return delta.total_seconds() / 86400
    
    def to_dict(self):
        return {
            "id": self.id,
            "train_id": self.train_id,
            "job_id": self.job_id,
            "parent_job_id": self.parent_job_id,
            "job_type": self.job_type.value if self.job_type else None,
            "priority": self.priority.value if self.priority else None,
            "status": self.status.value if self.status else None,
            "title": self.title,
            "description": self.description,
            "related_component": self.related_component,
            "system_code": self.system_code,
            "location_on_train": self.location_on_train,
            "reported_date": self.reported_date.isoformat() if self.reported_date else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "estimated_downtime_hours": self.estimated_downtime_hours,
            "safety_critical": self.safety_critical,
            "requires_ibl": self.requires_ibl,
            "blocks_service": self.blocks_service,
            "parts_available": self.parts_available,
            "can_be_deferred": self.can_be_deferred,
            "max_deferral_days": self.max_deferral_days,
            "fault_code": self.fault_code,
            "is_blocking": self.is_blocking(),
            "is_overdue": self.is_overdue(),
            "days_until_due": self.days_until_due(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

