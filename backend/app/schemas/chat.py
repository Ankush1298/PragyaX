"""
Learning Chat Schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class ChatInputRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Question or concept query")
    subject: Optional[str] = Field("Python Programming", description="Active learning subject")


class ChatMessageResponse(BaseModel):
    id: str
    user_id: str
    subject: str
    role: str
    content: str
    suggested_followups: List[str] = []
    is_mock: bool = True
    provider: str = "PragyaX Mock AI"
    created_at: Optional[str] = None


class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessageResponse]
    active_provider: str
    is_mock: bool
