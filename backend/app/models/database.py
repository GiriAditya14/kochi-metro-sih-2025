"""
Database Configuration - PostgreSQL (Neon) / SQLite
Production-ready with connection pooling and SSL support.
"""

from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, NullPool
import os

from ..config import get_database_url, is_postgresql

# Get database URL
DATABASE_URL = get_database_url()

# Engine configuration based on database type
if is_postgresql():
    # PostgreSQL (Neon) configuration with connection pooling
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=300,  # Recycle connections every 5 minutes
        connect_args={
            "sslmode": "require",  # Required for Neon
            "connect_timeout": 10
        }
    )
    print(f"✓ PostgreSQL (Neon) database configured")
else:
    # SQLite configuration for local development
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=NullPool
    )
    print(f"✓ SQLite database configured (local development)")

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency for FastAPI to get database session.
    Ensures proper connection handling and cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables.
    Creates all tables defined in models if they don't exist.
    """
    try:
        # Import all models to ensure they're registered
        from . import (
            Train, FitnessCertificate, JobCard,
            BrandingContract, MileageMeter, CleaningRecord,
            DepotTrack, TrainPosition, NightPlan, PlanAssignment,
            Alert, OverrideLog, CleaningBay
        )
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        
        print(f"✓ Database tables initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Database initialization error: {e}")
        return False


def test_connection() -> dict:
    """Test database connection and return status"""
    try:
        with engine.connect() as conn:
            # Test query
            if is_postgresql():
                result = conn.execute(text("SELECT version()"))
                version = result.fetchone()[0]
                return {
                    "connected": True,
                    "type": "PostgreSQL",
                    "version": version.split(",")[0] if version else "Unknown"
                }
            else:
                result = conn.execute(text("SELECT sqlite_version()"))
                version = result.fetchone()[0]
                return {
                    "connected": True,
                    "type": "SQLite",
                    "version": version
                }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e)
        }


def get_table_counts() -> dict:
    """Get record counts for all tables"""
    try:
        db = SessionLocal()
        from . import Train, FitnessCertificate, JobCard, BrandingContract, MileageMeter, CleaningRecord, NightPlan
        
        counts = {
            "trains": db.query(Train).count(),
            "certificates": db.query(FitnessCertificate).count(),
            "job_cards": db.query(JobCard).count(),
            "branding_contracts": db.query(BrandingContract).count(),
            "mileage_records": db.query(MileageMeter).count(),
            "cleaning_records": db.query(CleaningRecord).count(),
            "plans": db.query(NightPlan).count()
        }
        db.close()
        return counts
    except Exception as e:
        return {"error": str(e)}
