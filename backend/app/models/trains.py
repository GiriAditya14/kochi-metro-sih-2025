from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base


class TrainStatus(str, enum.Enum):
    ACTIVE = "active"
    UNDER_MAINTENANCE = "under_maintenance"
    OUT_OF_SERVICE = "out_of_service"
    DECOMMISSIONED = "decommissioned"


class Train(Base):
    """
    Core train/trainset entity.
    Represents a complete trainset (e.g., 3-car or 6-car unit).
    """
    __tablename__ = "trains"
    
    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g., "TS-201"
    train_number = Column(Integer, nullable=False)  # Sequential number
    
    # Basic info
    name = Column(String(100))  # Friendly name if any
    configuration = Column(String(20), default="3-car")  # 3-car, 6-car
    manufacturer = Column(String(100), default="Alstom")
    commissioning_date = Column(DateTime)
    
    # Current status
    status = Column(SQLEnum(TrainStatus), default=TrainStatus.ACTIVE)
    depot_id = Column(String(20), default="MUTTOM")  # Current depot
    
    # Current position in depot
    current_track = Column(String(20))  # Track/bay ID
    current_position = Column(Integer, default=0)  # Position in track (0 = closest to exit)
    
    # Quick health indicators (denormalized for fast access)
    overall_health_score = Column(Float, default=100.0)  # 0-100
    is_service_ready = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    fitness_certificates = relationship("FitnessCertificate", back_populates="train", cascade="all, delete-orphan")
    job_cards = relationship("JobCard", back_populates="train", cascade="all, delete-orphan")
    branding_contracts = relationship("BrandingContract", back_populates="train", cascade="all, delete-orphan")
    mileage_meters = relationship("MileageMeter", back_populates="train", cascade="all, delete-orphan")
    cleaning_records = relationship("CleaningRecord", back_populates="train", cascade="all, delete-orphan")
    plan_assignments = relationship("PlanAssignment", back_populates="train", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Train {self.train_id}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "train_id": self.train_id,
            "train_number": self.train_number,
            "name": self.name,
            "configuration": self.configuration,
            "manufacturer": self.manufacturer,
            "commissioning_date": self.commissioning_date.isoformat() if self.commissioning_date else None,
            "status": self.status.value if self.status else None,
            "depot_id": self.depot_id,
            "current_track": self.current_track,
            "current_position": self.current_position,
            "overall_health_score": self.overall_health_score,
            "is_service_ready": self.is_service_ready,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

