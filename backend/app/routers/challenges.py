"""
Daily Challenge Router (Ankush's Module)
Provides daily gamified coding snippets, points allocation, and badges.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from ..schemas.challenges import DailyChallengeResponse, ChallengeSubmitRequest, ChallengeResultResponse
from ..services.auth_service import get_current_user
from ..database.repository import Repository

router = APIRouter(prefix="/challenges", tags=["Daily Challenges"])


@router.get("/daily", response_model=DailyChallengeResponse)
def get_daily_challenge(user: dict = Depends(get_current_user)):
    """Retrieves today's Python micro-challenge and user's completion status."""
    chal = Repository.get_daily_challenge(user["id"])
    if not chal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No daily challenge active at this time."
        )
    return chal


@router.post("/submit", response_model=ChallengeResultResponse)
def submit_challenge(payload: ChallengeSubmitRequest, user: dict = Depends(get_current_user)):
    """
    Submits user answer for the daily challenge.
    Awards points and achievement badges exactly once per user.
    """
    if payload.selected_option.strip().upper() not in {"A", "B", "C", "D"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="selected_option must be A, B, C, or D."
        )

    result = Repository.submit_daily_challenge(
        user_id=user["id"],
        challenge_id=payload.challenge_id,
        selected_option=payload.selected_option
    )

    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )

    return result
