"""
Health and Status Router
"""

from fastapi import APIRouter
import time
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
from ai.factory import get_ai_provider

router = APIRouter(prefix="/health", tags=["Health"])

START_TIME = time.time()


@router.get("")
def get_health():
    """Returns system status, active database persistence, and Python environment details."""
    ai = get_ai_provider()
    return {
        "status": "healthy",
        "service": "PragyaX AI Learning Platform",
        "version": "1.0.0",
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "python_version": sys.version.split(" ")[0],
        "database": "SQLite Demo Persistence (File-backed)",
        "persistence_active": True,
        "ai_provider": ai.provider_name,
        "ai_is_mock": ai.is_mock
    }
