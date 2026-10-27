"""
Daily & Library Challenge Schemas (Ankush's Module)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any


class DailyChallengeResponse(BaseModel):
    id: str
    title: str
    topic: str
    difficulty: str
    description: str
    code_snippet: str
    question_type: str = "multiple_choice"
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    points: int
    has_completed: bool = False
    challenge_date: Optional[str] = None
    subject_id: Optional[str] = None
    correct_option: Optional[str] = None
    explanation: Optional[str] = None
    user_submission: Optional[Any] = None


class ChallengeSubmitRequest(BaseModel):
    challenge_id: str = Field(..., description="ID of daily challenge")
    selected_option: str = Field(..., description="'A', 'B', 'C', or 'D'")


class ChallengeResultResponse(BaseModel):
    challenge_id: str
    is_correct: bool
    points_awarded: int
    correct_option: str
    explanation: str


class ChallengeLibraryItem(BaseModel):
    id: str
    subject_id: str
    title: str
    topic: str
    difficulty: str
    description: str
    code_snippet: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    points: int
    has_completed: bool = False


class UserStreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[str] = None
    streak_freeze_available: bool = False
    active_today: bool = False


class ChallengeCreateRequest(BaseModel):
    subject_id: str = "subj_python"
    title: str
    topic: str
    difficulty: str = "Medium"
    description: str
    code_snippet: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: str
    points: int = 50
    scheduled_date: Optional[str] = None
