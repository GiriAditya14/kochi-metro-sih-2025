from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base


class BrandingPriority(str, enum.Enum):
    PLATINUM = "platinum"  # Highest priority - premium rates
    GOLD = "gold"  # High priority
    SILVER = "silver"  # Standard
    BRONZE = "bronze"  # Basic


class TimeBand(str, enum.Enum):
    PEAK_ONLY = "peak_only"  # 8-10 AM, 5-8 PM
    OFF_PEAK = "off_peak"  # Non-peak hours
    ALL_DAY = "all_day"  # Any time
    CUSTOM = "custom"  # Specific time ranges


class BrandingContract(Base):
    """
    Branding/advertising contracts with SLA requirements.
    Tracks exposure requirements and compliance.
    """
    __tablename__ = "branding_contracts"
    
    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    
    # Contract identification
    brand_id = Column(String(50), index=True)
    brand_name = Column(String(100), nullable=False)
    campaign_name = Column(String(200))
    
    # Contract period
    campaign_start = Column(DateTime, nullable=False)
    campaign_end = Column(DateTime, nullable=False)
    
    # Priority
    priority = Column(SQLEnum(BrandingPriority), default=BrandingPriority.SILVER)
    
    # Exposure requirements
    target_exposure_hours_weekly = Column(Float, default=0)
    target_exposure_hours_monthly = Column(Float, default=0)
    target_trips_daily = Column(Integer, default=0)
    target_km_daily = Column(Float, default=0)
    
    # Current exposure (updated daily)
    current_exposure_hours_week = Column(Float, default=0)
    current_exposure_hours_month = Column(Float, default=0)
    current_trips_today = Column(Float, default=0)
    
    # Time band requirements
    required_time_band = Column(SQLEnum(TimeBand), default=TimeBand.ALL_DAY)
    custom_time_ranges = Column(Text)  # JSON for custom times
    
    # Corridor requirements
    required_corridor = Column(String(100))  # Specific route if any
    
    # Financial
    contract_value = Column(Float)
    penalty_per_hour_shortfall = Column(Float, default=0)
    bonus_per_hour_excess = Column(Float, default=0)
    
    # Compliance tracking
    is_compliant = Column(Boolean, default=True)
    compliance_percentage = Column(Float, default=100)
    accumulated_penalty = Column(Float, default=0)
    accumulated_bonus = Column(Float, default=0)
    
    # Notes
    special_requirements = Column(Text)
    contact_person = Column(String(100))
    contact_email = Column(String(100))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    train = relationship("Train", back_populates="branding_contracts")
    exposure_logs = relationship("BrandingExposureLog", back_populates="contract", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<BrandingContract {self.brand_name} on Train {self.train_id}>"
    
    def get_weekly_deficit(self) -> float:
        """Get exposure deficit for current week"""
        return max(0, self.target_exposure_hours_weekly - self.current_exposure_hours_week)
    
    def get_monthly_deficit(self) -> float:
        """Get exposure deficit for current month"""
        return max(0, self.target_exposure_hours_monthly - self.current_exposure_hours_month)
    
    def get_urgency_score(self) -> float:
        """Calculate urgency score based on deficit and remaining time"""
        now = datetime.utcnow()
        if now > self.campaign_end:
            return 0
        
        remaining_days = (self.campaign_end - now).days
        if remaining_days <= 0:
            return 100  # Max urgency
        
        deficit = self.get_monthly_deficit()
        if self.target_exposure_hours_monthly > 0:
            deficit_ratio = deficit / self.target_exposure_hours_monthly
        else:
            deficit_ratio = 0
        
        # Higher urgency if less time remaining with more deficit
        urgency = (deficit_ratio * 100) / (remaining_days / 30)
        return min(100, urgency)
    
    def to_dict(self):
        return {
            "id": self.id,
            "train_id": self.train_id,
            "brand_id": self.brand_id,
            "brand_name": self.brand_name,
            "campaign_name": self.campaign_name,
            "campaign_start": self.campaign_start.isoformat() if self.campaign_start else None,
            "campaign_end": self.campaign_end.isoformat() if self.campaign_end else None,
            "priority": self.priority.value if self.priority else None,
            "target_exposure_hours_weekly": self.target_exposure_hours_weekly,
            "target_exposure_hours_monthly": self.target_exposure_hours_monthly,
            "target_trips_daily": self.target_trips_daily,
            "current_exposure_hours_week": self.current_exposure_hours_week,
            "current_exposure_hours_month": self.current_exposure_hours_month,
            "required_time_band": self.required_time_band.value if self.required_time_band else None,
            "penalty_per_hour_shortfall": self.penalty_per_hour_shortfall,
            "is_compliant": self.is_compliant,
            "compliance_percentage": self.compliance_percentage,
            "weekly_deficit": self.get_weekly_deficit(),
            "monthly_deficit": self.get_monthly_deficit(),
            "urgency_score": self.get_urgency_score(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class BrandingExposureLog(Base):
    """
    Daily log of branding exposure for each contract.
    """
    __tablename__ = "branding_exposure_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("branding_contracts.id"), nullable=False)
    
    # Date
    log_date = Column(DateTime, nullable=False)
    
    # Exposure details
    exposure_hours = Column(Float, default=0)
    trips_completed = Column(Integer, default=0)
    km_covered = Column(Float, default=0)
    
    # Time breakdown
    peak_hours = Column(Float, default=0)
    off_peak_hours = Column(Float, default=0)
    
    # Notes
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    contract = relationship("BrandingContract", back_populates="exposure_logs")
    
    def to_dict(self):
        return {
            "id": self.id,
            "contract_id": self.contract_id,
            "log_date": self.log_date.isoformat() if self.log_date else None,
            "exposure_hours": self.exposure_hours,
            "trips_completed": self.trips_completed,
            "km_covered": self.km_covered,
            "peak_hours": self.peak_hours,
            "off_peak_hours": self.off_peak_hours,
            "notes": self.notes
        }

