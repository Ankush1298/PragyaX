"""
Dashboard Schemas
"""

from pydantic import BaseModel
from typing import List, Optional, Any
from .auth import UserProfileResponse
from .subjects import SubjectItemResponse


class MetricsData(BaseModel):
    total_assessments_completed: int
    latest_score: Optional[int] = None
    latest_total: int = 5
    latest_percentage: Optional[float] = None
    latest_proficiency: str = "Not Assessed"
    average_percentage: float = 0.0
    highest_score: int = 0
    best_percentage: float = 0.0
    chat_questions_asked: int = 0
    challenges_attempted: int = 0
    total_points: int = 0


class BadgeItem(BaseModel):
    id: str
    badge_key: str
    title: str
    description: str
    icon: str
    awarded_at: str


class DashboardResponse(BaseModel):
    user: UserProfileResponse
    selected_subject: SubjectItemResponse
    has_selected_subject: bool = False
    metrics: MetricsData
    recommended_next_topics: List[str]
    recommendations_source: str = "starter"
    recent_attempts: List[Any] = []
    badges: List[BadgeItem] = []
