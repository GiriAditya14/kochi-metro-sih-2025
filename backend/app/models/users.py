"""
Local User model with role-based access.
Supports both email/password and phone/OTP authentication.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    # Email auth (optional for phone users)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    # Phone auth (for mobile OTP)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    # User info
    name = Column(String, nullable=True)
    employee_id = Column(String, nullable=True)
    department = Column(String, default="Operations")
    # Role: admin, worker, user
    role = Column(String, default="user", nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "phone_number": self.phone_number,
            "name": self.name,
            "employee_id": self.employee_id,
            "department": self.department,
            "role": self.role,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

