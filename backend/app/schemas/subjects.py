"""
Subject Schemas
"""

from pydantic import BaseModel, Field
from typing import List


class SubjectItemResponse(BaseModel):
    id: str
    slug: str
    title: str
    description: str
    icon: str
    is_active: bool
    question_count: int
    difficulty: str


class SubjectListResponse(BaseModel):
    subjects: List[SubjectItemResponse]
    selected_subject_id: str


class SelectSubjectRequest(BaseModel):
    subject_id: str = Field(..., description="Target subject ID (e.g. 'subj_python')")
