from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class MileageMeter(Base):
    """
    Mileage/odometer tracking for trains and components.
    Tracks total km, km since last overhaul, and maintenance thresholds.
    """
    __tablename__ = "mileage_meters"
    
    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    
    # Component tracking (train-level or component-level)
    component_type = Column(String(50), default="train")  # train, bogie, brake, HVAC, traction
    component_id = Column(String(50))  # Specific component ID if applicable
    
    # Current readings
    lifetime_km = Column(Float, default=0)  # Total lifetime kilometers
    km_since_last_overhaul = Column(Float, default=0)
    km_since_last_service = Column(Float, default=0)
    km_today = Column(Float, default=0)
    km_this_week = Column(Float, default=0)
    km_this_month = Column(Float, default=0)
    
    # Thresholds
    overhaul_threshold_km = Column(Float, default=100000)  # Major overhaul every 100k km
    service_threshold_km = Column(Float, default=20000)  # Regular service every 20k km
    warning_threshold_km = Column(Float, default=5000)  # Warn when this close to threshold
    
    # Status
    is_near_threshold = Column(Boolean, default=False)
    is_over_threshold = Column(Boolean, default=False)
    predicted_threshold_date = Column(DateTime)  # When threshold will be hit at current rate
    
    # Average daily km (for predictions)
    avg_daily_km = Column(Float, default=200)  # Average km per day in service
    
    # Operational hours (alternative to km for some components)
    operational_hours = Column(Float, default=0)
    hours_since_last_service = Column(Float, default=0)
    
    # Last readings timestamp
    last_reading_at = Column(DateTime, default=datetime.utcnow)
    reading_source = Column(String(50), default="manual")  # manual, IoT, Maximo
    
    # Notes
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    train = relationship("Train", back_populates="mileage_meters")
    
    def __repr__(self):
        return f"<MileageMeter Train {self.train_id} - {self.component_type}>"
    
    def get_km_to_threshold(self) -> float:
        """Get kilometers remaining until service threshold"""
        return max(0, self.service_threshold_km - self.km_since_last_service)
    
    def get_km_to_overhaul(self) -> float:
        """Get kilometers remaining until overhaul threshold"""
        return max(0, self.overhaul_threshold_km - self.km_since_last_overhaul)
    
    def get_threshold_risk_score(self) -> float:
        """
        Calculate risk score based on proximity to threshold.
        0 = safe, 100 = at/over threshold
        """
        km_to_threshold = self.get_km_to_threshold()
        if km_to_threshold <= 0:
            return 100
        if km_to_threshold >= self.warning_threshold_km:
            return 0
        
        # Linear interpolation within warning zone
        return 100 * (1 - km_to_threshold / self.warning_threshold_km)
    
    def predict_days_to_threshold(self) -> float:
        """Predict days until threshold at current usage rate"""
        if self.avg_daily_km <= 0:
            return float('inf')
        km_remaining = self.get_km_to_threshold()
        return km_remaining / self.avg_daily_km
    
    def can_complete_day(self, predicted_km: float) -> bool:
        """Check if train can complete a day with predicted km without hitting threshold"""
        return self.km_since_last_service + predicted_km < self.service_threshold_km
    
    def to_dict(self):
        return {
            "id": self.id,
            "train_id": self.train_id,
            "component_type": self.component_type,
            "component_id": self.component_id,
            "lifetime_km": self.lifetime_km,
            "km_since_last_overhaul": self.km_since_last_overhaul,
            "km_since_last_service": self.km_since_last_service,
            "km_today": self.km_today,
            "km_this_week": self.km_this_week,
            "km_this_month": self.km_this_month,
            "overhaul_threshold_km": self.overhaul_threshold_km,
            "service_threshold_km": self.service_threshold_km,
            "warning_threshold_km": self.warning_threshold_km,
            "is_near_threshold": self.is_near_threshold,
            "is_over_threshold": self.is_over_threshold,
            "avg_daily_km": self.avg_daily_km,
            "km_to_threshold": self.get_km_to_threshold(),
            "km_to_overhaul": self.get_km_to_overhaul(),
            "threshold_risk_score": self.get_threshold_risk_score(),
            "days_to_threshold": self.predict_days_to_threshold(),
            "last_reading_at": self.last_reading_at.isoformat() if self.last_reading_at else None,
            "reading_source": self.reading_source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

