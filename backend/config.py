"""
Configuration settings for KMRL Train Induction Planning System

Environment Variables:
- DATABASE_URL: Database connection string (default: SQLite)
- GEMINI_API_KEY: Google Gemini API key for AI Copilot
- HOST: Server host (default: 0.0.0.0)
- PORT: Server port (default: 8000)
"""

import os

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kmrl_induction.db")

# Google Gemini API Key (for AI Copilot)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Server settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Application settings
APP_NAME = "KMRL Train Induction Planning System"
APP_VERSION = "1.0.0"

# Fleet configuration
DEFAULT_DEPOT = "MUTTOM"
FLEET_SIZE = 25
TRAINS_NEEDED_FOR_SERVICE = 18
STANDBY_COUNT = 2
MAX_IBL_CAPACITY = 4

# Optimization weights
OPTIMIZATION_WEIGHTS = {
    "reliability": 100,
    "mileage_balance": 50,
    "branding": 80,
    "shunting": 30,
    "cleaning": 40
}

