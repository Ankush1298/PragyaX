"""
1v1 Battle System Schemas
Owned by: Ankush (Gamification & Competition Module Owner)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class BattleInviteRequest(BaseModel):
    recipient_identifier: str = Field(..., description="Email or user ID of student to challenge")
    subject_id: str = Field("subj_python", description="Battle subject ID")


class BattleInviteResponseRequest(BaseModel):
    invitation_id: str
    accept: bool


class BattleReadyRequest(BaseModel):
    battle_id: str


class BattleSubmitRequest(BaseModel):
    battle_id: str
    answers: Dict[str, str] = Field(..., description="Map of question_id -> option (A/B/C/D)")
    time_taken_seconds: float = Field(0.0, description="Time spent solving questions")


class BattleRematchRequest(BaseModel):
    battle_id: str


class BattleQuestionView(BaseModel):
    position: int
    question_id: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    topic: str


class BattleReviewItem(BaseModel):
    position: int
    question_id: str
    correct_option: str
    explanation: str
    answers: Dict[str, str]


class BattleViewResponse(BaseModel):
    battle_id: str
    status: str
    viewer_user_id: str
    opponent_display_name: str
    viewer_submitted: bool
    opponent_submitted: bool
    started_at: Optional[str] = None
    time_limit_seconds: int = 60
    questions: List[BattleQuestionView]
    viewer_answers: Dict[str, str] = {}
    result: Optional[Dict[str, Any]] = None
    review: List[BattleReviewItem] = []


class BattleLeaderboardItem(BaseModel):
    user_id: str
    name: str
    total_battles: int
    wins: int
    losses: int
    ties: int
    win_streak: int
    battle_xp: int
