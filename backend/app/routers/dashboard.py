"""
Dashboard Router
Computes real, derived learning statistics from persistent database records.
Owned by: Arsh (Backend) & Ankush (Architecture)
"""

from fastapi import APIRouter, Depends
from ..schemas.dashboard import DashboardResponse
from ..services.auth_service import get_current_user
from ..database.repository import Repository

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(user: dict = Depends(get_current_user)):
    """
    Returns live aggregated dashboard metrics for the student.
    All metrics are computed directly from persistent database records.
    """
    metrics_data = Repository.get_user_dashboard_metrics(user["id"])
    return metrics_data
