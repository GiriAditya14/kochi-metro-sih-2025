"""
KMRL Train Induction Planning System - Configuration
Production-ready settings with PostgreSQL, Cloudinary, and AI services.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # ===========================================
    # DATABASE (Neon PostgreSQL)
    # ===========================================
    database_url: str = "sqlite:///./kmrl_induction.db"
    # For Neon PostgreSQL, set:
    # DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
    
    # ===========================================
    # AI SERVICES
    # ===========================================
    # Google Gemini - for explanations and copilot
    gemini_api_key: Optional[str] = None
    
    # Groq LLM - for fast data parsing and extraction
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.1-70b-versatile"  # or mixtral-8x7b-32768
    
    # ===========================================
    # FILE STORAGE (Cloudinary)
    # ===========================================
    cloudinary_cloud_name: Optional[str] = None
    cloudinary_api_key: Optional[str] = None
    cloudinary_api_secret: Optional[str] = None
    cloudinary_url: Optional[str] = None  # Alternative: full URL
    
    # ===========================================
    # SERVER CONFIGURATION
    # ===========================================
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # ===========================================
    # KMRL FLEET CONFIGURATION
    # ===========================================
    default_depot: str = "MUTTOM"
    fleet_size: int = 25
    trains_needed_for_service: int = 18
    standby_count: int = 2
    max_ibl_capacity: int = 4
    
    # ===========================================
    # OPTIMIZATION WEIGHTS
    # ===========================================
    weight_reliability: int = 100
    weight_mileage_balance: int = 50
    weight_branding: int = 80
    weight_shunting: int = 30
    weight_cleaning: int = 40
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()


def get_database_url() -> str:
    """Get database URL, converting for async if needed"""
    url = settings.database_url
    # Convert postgres:// to postgresql:// if needed (Heroku-style URLs)
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def is_postgresql() -> bool:
    """Check if using PostgreSQL"""
    return "postgresql" in settings.database_url.lower()


def get_gemini_api_key() -> Optional[str]:
    """Get Gemini API key"""
    return settings.gemini_api_key or os.getenv("GEMINI_API_KEY")


def get_groq_api_key() -> Optional[str]:
    """Get Groq API key"""
    return settings.groq_api_key or os.getenv("GROQ_API_KEY")


def is_ai_enabled() -> bool:
    """Check if Gemini AI features are available"""
    key = get_gemini_api_key()
    return key is not None and len(key) > 10 and key != "your_gemini_api_key_here"


def is_groq_enabled() -> bool:
    """Check if Groq LLM is available for data parsing"""
    key = get_groq_api_key()
    return key is not None and len(key) > 10


def is_cloudinary_enabled() -> bool:
    """Check if Cloudinary is configured"""
    if settings.cloudinary_url:
        return True
    return all([
        settings.cloudinary_cloud_name,
        settings.cloudinary_api_key,
        settings.cloudinary_api_secret
    ])


def get_service_status() -> dict:
    """Get status of all external services"""
    return {
        "database": {
            "type": "PostgreSQL (Neon)" if is_postgresql() else "SQLite",
            "connected": True  # Will be updated after connection test
        },
        "gemini_ai": {
            "enabled": is_ai_enabled(),
            "purpose": "Explanations, Copilot, Daily Briefings"
        },
        "groq_llm": {
            "enabled": is_groq_enabled(),
            "model": settings.groq_model,
            "purpose": "Data Parsing, File Extraction"
        },
        "cloudinary": {
            "enabled": is_cloudinary_enabled(),
            "purpose": "File Storage (CSV, PDF)"
        }
    }
