"""
Database Configuration - PostgreSQL (Neon) / SQLite
Production-ready with connection pooling and SSL support.
"""

import os
import pathlib
from dotenv import load_dotenv

# Load .env FIRST before any other imports
_backend_dir = pathlib.Path(__file__).parent.parent.parent
_env_file = _backend_dir / ".env"
if _env_file.exists():
    load_dotenv(_env_file, override=True)

from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, NullPool

# Get database URL from environment, default to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kmrl_induction.db")

# Check if using PostgreSQL
def _is_postgresql():
    return DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")

print(f"[Database] URL: {DATABASE_URL[:50]}..." if len(DATABASE_URL) > 50 else f"[Database] URL: {DATABASE_URL}")
print(f"[Database] Type: {'PostgreSQL' if _is_postgresql() else 'SQLite'}")

# Engine configuration based on database type
if _is_postgresql():
    # PostgreSQL (Neon) configuration with connection pooling
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={
            "sslmode": "require",
            "connect_timeout": 10
        }
    )
    print("✓ PostgreSQL (Neon) database configured")
else:
    # SQLite configuration for local development
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=NullPool
    )
    print("✓ SQLite database configured (local development)")

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency for FastAPI to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    try:
        from . import (
            Train, FitnessCertificate, JobCard,
            BrandingContract, MileageMeter, CleaningRecord,
            DepotTrack, TrainPosition, NightPlan, PlanAssignment,
            Alert, OverrideLog, CleaningBay, User
        )
        
        Base.metadata.create_all(bind=engine)
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        
        print("✓ Database tables initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Database initialization error: {e}")
        return False


def test_connection() -> dict:
    """Test database connection and return status"""
    try:
        with engine.connect() as conn:
            if _is_postgresql():
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
