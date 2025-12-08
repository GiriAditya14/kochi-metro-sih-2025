from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import enum
from .database import Base


class CleaningStatus(str, enum.Enum):
    OK = "ok"  # Recently cleaned
    DUE = "due"  # Cleaning due soon
    OVERDUE = "overdue"  # Past due date
    SPECIAL_REQUIRED = "special_required"  # Needs special cleaning


class CleaningType(str, enum.Enum):
    LIGHT = "light"  # Basic daily cleaning
    STANDARD = "standard"  # Regular interior/exterior
    DEEP = "deep"  # Thorough deep cleaning
    EXTERIOR_WASH = "exterior_wash"  # External wash only
    SPECIAL = "special"  # After vandalism, sewage, etc.
    VIP_PREP = "vip_prep"  # For VIP/inspection visits
    DETAILING = "detailing"  # Premium detailing


class CleaningRecord(Base):
    """
    Cleaning records for each train.
    Tracks cleaning status, schedules, and requirements.
    """
    __tablename__ = "cleaning_records"
    
    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    
    # Current status
    status = Column(SQLEnum(CleaningStatus), default=CleaningStatus.OK)
    
    # Last cleaning info
    last_cleaning_type = Column(SQLEnum(CleaningType))
    last_cleaned_at = Column(DateTime)
    last_cleaned_by = Column(String(100))
    last_cleaning_bay = Column(String(50))
    last_cleaning_duration_hours = Column(Float)
    
    # Schedule
    next_light_clean_due = Column(DateTime)
    next_deep_clean_due = Column(DateTime)
    next_exterior_wash_due = Column(DateTime)
    
    # Policy thresholds (in days)
    light_clean_interval_days = Column(Integer, default=1)
    deep_clean_interval_days = Column(Integer, default=7)
    exterior_wash_interval_days = Column(Integer, default=3)
    max_days_without_cleaning = Column(Integer, default=2)  # Hard limit
    
    # Special requirements
    special_clean_required = Column(Boolean, default=False)
    special_clean_reason = Column(Text)  # vandalism, sewage, spillage, etc.
    vip_inspection_tomorrow = Column(Boolean, default=False)
    vip_inspection_notes = Column(Text)
    
    # Quality tracking
    last_inspection_score = Column(Float)  # 0-100
    cleanliness_complaints = Column(Integer, default=0)
    
    # Notes
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    train = relationship("Train", back_populates="cleaning_records")
    
    def __repr__(self):
        return f"<CleaningRecord Train {self.train_id}>"
    
    def days_since_last_cleaning(self) -> float:
        """Get days since last cleaning"""
        if not self.last_cleaned_at:
            return float('inf')
        delta = datetime.utcnow() - self.last_cleaned_at
        return delta.total_seconds() / 86400
    
    def is_cleaning_required(self) -> bool:
        """Check if cleaning is required based on policy"""
        days = self.days_since_last_cleaning()
        return (
            days >= self.max_days_without_cleaning or
            self.special_clean_required or
            self.vip_inspection_tomorrow or
            self.status in [CleaningStatus.OVERDUE, CleaningStatus.SPECIAL_REQUIRED]
        )
    
    def get_cleaning_urgency(self) -> float:
        """
        Get cleaning urgency score.
        0 = not urgent, 100 = critical
        """
        if self.special_clean_required:
            return 100
        if self.vip_inspection_tomorrow:
            return 95
        
        days = self.days_since_last_cleaning()
        if days >= self.max_days_without_cleaning:
            return 90
        if days >= self.deep_clean_interval_days:
            return 60
        if days >= self.light_clean_interval_days:
            return 30
        return 0
    
    def update_status(self):
        """Update status based on current state"""
        if self.special_clean_required:
            self.status = CleaningStatus.SPECIAL_REQUIRED
        elif self.days_since_last_cleaning() >= self.max_days_without_cleaning:
            self.status = CleaningStatus.OVERDUE
        elif self.days_since_last_cleaning() >= self.deep_clean_interval_days:
            self.status = CleaningStatus.DUE
        else:
            self.status = CleaningStatus.OK
    
    def to_dict(self):
        return {
            "id": self.id,
            "train_id": self.train_id,
            "status": self.status.value if self.status else None,
            "last_cleaning_type": self.last_cleaning_type.value if self.last_cleaning_type else None,
            "last_cleaned_at": self.last_cleaned_at.isoformat() if self.last_cleaned_at else None,
            "last_cleaned_by": self.last_cleaned_by,
            "days_since_last_cleaning": self.days_since_last_cleaning(),
            "next_light_clean_due": self.next_light_clean_due.isoformat() if self.next_light_clean_due else None,
            "next_deep_clean_due": self.next_deep_clean_due.isoformat() if self.next_deep_clean_due else None,
            "special_clean_required": self.special_clean_required,
            "special_clean_reason": self.special_clean_reason,
            "vip_inspection_tomorrow": self.vip_inspection_tomorrow,
            "max_days_without_cleaning": self.max_days_without_cleaning,
            "is_cleaning_required": self.is_cleaning_required(),
            "cleaning_urgency": self.get_cleaning_urgency(),
            "last_inspection_score": self.last_inspection_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class CleaningBay(Base):
    """
    Cleaning bays/facilities in depot.
    Tracks capacity and availability.
    """
    __tablename__ = "cleaning_bays"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Bay identification
    bay_id = Column(String(20), unique=True, index=True)
    depot_id = Column(String(20), default="MUTTOM")
    bay_name = Column(String(100))
    
    # Capabilities
    cleaning_types_supported = Column(Text)  # JSON list of CleaningType values
    has_exterior_wash = Column(Boolean, default=False)
    has_interior_equipment = Column(Boolean, default=True)
    has_detailing_equipment = Column(Boolean, default=False)
    
    # Capacity
    capacity = Column(Integer, default=1)  # Trains at a time
    avg_cleaning_duration_hours = Column(Float, default=2)
    
    # Availability
    is_operational = Column(Boolean, default=True)
    maintenance_until = Column(DateTime)  # If under maintenance
    
    # Shift info
    shift_start = Column(String(10), default="21:00")  # Night shift start
    shift_end = Column(String(10), default="05:00")  # Night shift end
    
    # Staffing
    staff_required = Column(Integer, default=2)
    current_staff_available = Column(Integer, default=2)
    
    # Location in depot
    track_id = Column(String(20))  # Which track the bay is on
    
    # Notes
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<CleaningBay {self.bay_id}>"
    
    def get_available_slots_tonight(self) -> int:
        """Calculate available cleaning slots for tonight"""
        if not self.is_operational:
            return 0
        if self.maintenance_until and self.maintenance_until > datetime.utcnow():
            return 0
        
        # Assuming 8-hour night shift
        shift_hours = 8
        slots = int(shift_hours / self.avg_cleaning_duration_hours) * self.capacity
        return slots
    
    def to_dict(self):
        return {
            "id": self.id,
            "bay_id": self.bay_id,
            "depot_id": self.depot_id,
            "bay_name": self.bay_name,
            "cleaning_types_supported": self.cleaning_types_supported,
            "has_exterior_wash": self.has_exterior_wash,
            "has_interior_equipment": self.has_interior_equipment,
            "has_detailing_equipment": self.has_detailing_equipment,
            "capacity": self.capacity,
            "avg_cleaning_duration_hours": self.avg_cleaning_duration_hours,
            "is_operational": self.is_operational,
            "shift_start": self.shift_start,
            "shift_end": self.shift_end,
            "staff_required": self.staff_required,
            "current_staff_available": self.current_staff_available,
            "available_slots_tonight": self.get_available_slots_tonight(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

