from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class DepotTrack(Base):
    """
    Depot track/siding/bay representation for stabling geometry.
    Used to model the physical layout of the depot for shunting optimization.
    """
    __tablename__ = "depot_tracks"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Track identification
    track_id = Column(String(20), unique=True, index=True)
    depot_id = Column(String(20), default="MUTTOM")
    track_name = Column(String(100))
    track_type = Column(String(50))  # stabling, maintenance, cleaning, mainline_connection
    
    # Capacity
    capacity = Column(Integer, default=1)  # Number of trains that can fit
    current_occupancy = Column(Integer, default=0)
    
    # Physical properties
    length_meters = Column(Float)
    is_electrified = Column(Boolean, default=True)
    has_pit = Column(Boolean, default=False)  # For under-train inspection
    
    # Connectivity (for graph-based shunting)
    connected_tracks = Column(Text)  # JSON list of connected track IDs
    exit_distance = Column(Integer, default=0)  # Relative distance to mainline exit
    is_direct_exit = Column(Boolean, default=False)  # Can exit without shunting others
    
    # Operational status
    is_operational = Column(Boolean, default=True)
    out_of_service_reason = Column(Text)
    expected_available_at = Column(DateTime)
    
    # Track features
    has_charging = Column(Boolean, default=False)  # For battery/electric charging
    has_wayside_sensors = Column(Boolean, default=False)
    
    # Priority for stabling
    stabling_priority = Column(Integer, default=5)  # 1=highest preference
    
    # Notes
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    train_positions = relationship("TrainPosition", back_populates="track", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<DepotTrack {self.track_id}>"
    
    def get_available_capacity(self) -> int:
        """Get remaining capacity"""
        return max(0, self.capacity - self.current_occupancy)
    
    def to_dict(self):
        return {
            "id": self.id,
            "track_id": self.track_id,
            "depot_id": self.depot_id,
            "track_name": self.track_name,
            "track_type": self.track_type,
            "capacity": self.capacity,
            "current_occupancy": self.current_occupancy,
            "available_capacity": self.get_available_capacity(),
            "length_meters": self.length_meters,
            "is_electrified": self.is_electrified,
            "has_pit": self.has_pit,
            "connected_tracks": self.connected_tracks,
            "exit_distance": self.exit_distance,
            "is_direct_exit": self.is_direct_exit,
            "is_operational": self.is_operational,
            "stabling_priority": self.stabling_priority,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class TrainPosition(Base):
    """
    Current position of a train in the depot.
    Used for shunting optimization.
    """
    __tablename__ = "train_positions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Train and track
    train_id = Column(Integer, ForeignKey("trains.id"))
    track_id = Column(Integer, ForeignKey("depot_tracks.id"), nullable=False)
    
    # Position in track (0 = closest to exit)
    position_in_track = Column(Integer, default=0)
    
    # Status
    is_locked = Column(Boolean, default=False)  # Cannot be moved
    lock_reason = Column(Text)
    
    # Movement info
    arrived_at = Column(DateTime, default=datetime.utcnow)
    expected_departure = Column(DateTime)
    
    # Shunting cost
    estimated_shunting_moves = Column(Integer, default=0)  # Moves to bring out
    estimated_shunting_time_minutes = Column(Integer, default=0)
    
    # Notes
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    track = relationship("DepotTrack", back_populates="train_positions")
    
    def __repr__(self):
        return f"<TrainPosition Train {self.train_id} at {self.track_id}>"
    
    def calculate_shunting_cost(self) -> dict:
        """
        Calculate cost to bring this train out.
        Returns dict with moves, time, and energy estimates.
        """
        # Base cost is position in track (trains ahead need to move)
        base_moves = self.position_in_track
        
        # Each move takes approximately 5 minutes
        time_per_move = 5
        
        # Energy cost per move (arbitrary units)
        energy_per_move = 10
        
        return {
            "moves": base_moves + self.estimated_shunting_moves,
            "time_minutes": base_moves * time_per_move + self.estimated_shunting_time_minutes,
            "energy_cost": (base_moves + self.estimated_shunting_moves) * energy_per_move
        }
    
    def to_dict(self):
        shunting_cost = self.calculate_shunting_cost()
        return {
            "id": self.id,
            "train_id": self.train_id,
            "track_id": self.track_id,
            "position_in_track": self.position_in_track,
            "is_locked": self.is_locked,
            "lock_reason": self.lock_reason,
            "arrived_at": self.arrived_at.isoformat() if self.arrived_at else None,
            "expected_departure": self.expected_departure.isoformat() if self.expected_departure else None,
            "shunting_cost": shunting_cost,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

