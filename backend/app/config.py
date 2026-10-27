"""
PragyaX Backend Configuration
Owned by: Arsh (FastAPI Backend Architecture)
"""

import os
from typing import List

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))


def _load_dotenv(path: str) -> None:
    """Minimal .env loader (stdlib only). Real environment variables win."""
    if not os.path.exists(path):
        return
    with open(path) as fh:
        for line in fh:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())


_load_dotenv(os.path.join(ROOT_DIR, ".env"))

class Settings:
    PROJECT_NAME: str = "PragyaX"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pragyax-hackathon-2026-secret-salt-key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Database
    DATABASE_PATH: str = os.getenv("DATABASE_PATH") or os.path.join(ROOT_DIR, "pragyax.db")
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        origin.strip() for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
        ).split(",") if origin.strip()
    ]
    
    # AI Engine
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "mock")

settings = Settings()
