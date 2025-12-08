from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base


class Department(str, enum.Enum):
    ROLLING_STOCK = "RollingStock"
    SIGNALLING = "Signalling"
    TELECOM = "Telecom"


class CertificateStatus(str, enum.Enum):
    VALID = "Valid"
    EXPIRING_SOON = "ExpiringSoon"  # Within 48 hours
    EXPIRED = "Expired"
    SUSPENDED = "Suspended"
    CONDITIONAL = "Conditional"  # Valid with restrictions


class Criticality(str, enum.Enum):
    HARD = "hard"  # Must not violate - safety critical
    SOFT = "soft"  # Should not violate - operational
    MONITOR = "monitor"  # Track but don't block


class FitnessCertificate(Base):
    """
    Fitness certificates from RS, Signalling, and Telecom departments.
    A train needs valid certificates from all three departments for revenue service.
    """
    __tablename__ = "fitness_certificates"
    
    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    
    # Certificate details
    certificate_number = Column(String(50), unique=True)
    department = Column(SQLEnum(Department), nullable=False)
    status = Column(SQLEnum(CertificateStatus), default=CertificateStatus.VALID)
    criticality = Column(SQLEnum(Criticality), default=Criticality.HARD)
    
    # Validity period
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=False)
    
    # Conditional validity
    is_conditional = Column(Boolean, default=False)
    condition_notes = Column(Text)  # e.g., "Valid only at reduced speed"
    max_speed_restriction = Column(Integer)  # km/h, if applicable
    
    # Emergency override
    emergency_override = Column(Boolean, default=False)
    override_approved_by = Column(String(100))
    override_reason = Column(Text)
    override_expires_at = Column(DateTime)
    
    # Inspection details
    last_inspection_date = Column(DateTime)
    inspector_name = Column(String(100))
    inspection_type = Column(String(50))  # Routine, Special, Post-incident
    
    # Remarks and issues
    remarks = Column(Text)  # e.g., "Door fault monitored", "Radio intermittent"
    pending_issues = Column(Text)  # JSON list of issues
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    train = relationship("Train", back_populates="fitness_certificates")
    
    def __repr__(self):
        return f"<FitnessCertificate {self.certificate_number} - {self.department.value}>"
    
    def is_valid_at(self, check_time: datetime = None) -> bool:
        """Check if certificate is valid at given time"""
        if check_time is None:
            check_time = datetime.utcnow()
        
        if self.status == CertificateStatus.EXPIRED:
            return False
        if self.status == CertificateStatus.SUSPENDED:
            return False
        
        # Check emergency override
        if self.emergency_override and self.override_expires_at:
            if check_time <= self.override_expires_at:
                return True
        
        return self.valid_from <= check_time <= self.valid_to
    
    def hours_until_expiry(self) -> float:
        """Get hours until certificate expires"""
        now = datetime.utcnow()
        if self.valid_to < now:
            return 0
        return (self.valid_to - now).total_seconds() / 3600
    
    def to_dict(self):
        return {
            "id": self.id,
            "train_id": self.train_id,
            "certificate_number": self.certificate_number,
            "department": self.department.value if self.department else None,
            "status": self.status.value if self.status else None,
            "criticality": self.criticality.value if self.criticality else None,
            "valid_from": self.valid_from.isoformat() if self.valid_from else None,
            "valid_to": self.valid_to.isoformat() if self.valid_to else None,
            "is_conditional": self.is_conditional,
            "condition_notes": self.condition_notes,
            "max_speed_restriction": self.max_speed_restriction,
            "emergency_override": self.emergency_override,
            "override_approved_by": self.override_approved_by,
            "override_reason": self.override_reason,
            "override_expires_at": self.override_expires_at.isoformat() if self.override_expires_at else None,
            "remarks": self.remarks,
            "hours_until_expiry": self.hours_until_expiry(),
            "is_currently_valid": self.is_valid_at(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

