"""Application settings and configuration management."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Groq LLM Configuration
    groq_api_key: str

    # Backend API Configuration
    backend_api_url: str = "http://localhost:3000"

    # Agent Service Configuration
    agent_service_port: int = 8000
    agent_service_host: str = "0.0.0.0"

    # Logging Configuration
    log_level: str = "info"

    # Timeout Configuration
    agent_timeout_seconds: int = 60
    emergency_timeout_seconds: int = 300

    # Environment
    node_env: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


# Global settings instance
settings = Settings()

