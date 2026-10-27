"""
Hosted Competitions Schemas (College & Company Challenges)
Owned by: Ankush (Gamification & Competition Module Owner)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class OrganizationCreateRequest(BaseModel):
    name: str
    org_type: str = Field(..., description="PLATFORM, STUDENT, COLLEGE, COMPANY")
    domain: Optional[str] = None
    description: str


class OrganizationResponse(BaseModel):
    id: str
    name: str
    org_type: str
    domain: Optional[str] = None
    description: str
    is_verified: bool
    created_by_user_id: str


class CompetitionQuestionInput(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: Optional[str] = ""
    topic: Optional[str] = "General"


class CompetitionCreateRequest(BaseModel):
    org_id: str
    title: str
    description: str
    subject_id: str = "subj_python"
    difficulty: str = "Intermediate"
    start_time: str
    end_time: str
    eligibility_rules: str = "OPEN"
    questions: List[CompetitionQuestionInput]


class CompetitionSubmitRequest(BaseModel):
    answers: Dict[str, str] = Field(..., description="Map of question_id -> option")
    time_taken_seconds: float = 0.0


class CompetitionLeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    user_name: str
    score: int
    total_questions: int
    percentage: float
    time_taken_seconds: float
