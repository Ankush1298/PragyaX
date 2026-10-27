"""
Daily Challenge Schemas (Ankush's Module)
"""

from pydantic import BaseModel, Field
from typing import Optional, Any


class DailyChallengeResponse(BaseModel):
    id: str
    title: str
    topic: str
    difficulty: str
    description: str
    code_snippet: str
    question_type: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    points: int
    has_completed: bool = False
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
