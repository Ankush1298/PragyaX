"""
Unified Gamification Router
Owned by: Ankush (Gamification & Competition Module Owner)
Unifies XP progression, levels, badges, streaks, and reward store redemptions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from ..services.auth_service import get_current_user
from ..services.gamification_hub import GamificationHub
from ..schemas.gamification import (
    GamificationProfileResponse,
    RedeemRewardRequest,
    RedeemRewardResponse
)

router = APIRouter(prefix="/gamification", tags=["Gamification Hub"])


@router.get("/profile", response_model=GamificationProfileResponse)
def get_gamification_profile(user: dict = Depends(get_current_user)):
    """Retrieves full gamification profile: XP, level, badges, streak, and battle stats."""
    return GamificationHub.get_user_profile_gamification(user["id"])


@router.get("/ledger")
def get_xp_ledger(limit: int = 50, user: dict = Depends(get_current_user)):
    """Retrieves complete, transparent XP ledger history for the student."""
    return GamificationHub.get_xp_history(user["id"], limit=limit)


@router.get("/rewards")
def get_reward_catalog(user: dict = Depends(get_current_user)):
    """Retrieves reward catalog with affordability status for current student."""
    return GamificationHub.get_reward_catalog_with_eligibility(user["id"])


@router.post("/rewards/redeem", response_model=RedeemRewardResponse)
def redeem_reward(payload: RedeemRewardRequest, user: dict = Depends(get_current_user)):
    """
    Redeems a reward from the catalog.
    Server verifies sufficient XP and records deduction in the ledger.
    """
    result = GamificationHub.redeem_reward(user["id"], payload.reward_id)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return result
