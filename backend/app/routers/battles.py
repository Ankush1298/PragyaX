"""
1v1 Battle System Router
Owned by: Ankush (Gamification & Competition Module Owner)
Provides synchronous battle lobby, server-checked question evaluation,
anti-tamper timer validation, winner determination, XP/badge rewards, and rematch.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from ..services.auth_service import get_current_user
from ..services.battle_service import BattleService
from ..schemas.battles import (
    BattleInviteRequest,
    BattleInviteResponseRequest,
    BattleSubmitRequest,
    BattleViewResponse,
    BattleLeaderboardItem
)
from ..database.competition_repository import CompetitionRepository

router = APIRouter(prefix="/battles", tags=["1v1 Battles"])


@router.post("/invite")
def send_invitation(payload: BattleInviteRequest, user: dict = Depends(get_current_user)):
    """Challenges another registered student by email or user ID."""
    result = BattleService.send_invitation(
        sender_id=user["id"],
        sender_name=user["name"],
        recipient_identifier=payload.recipient_identifier,
        subject_id=payload.subject_id
    )
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return result


@router.post("/invite/respond")
def respond_invitation(payload: BattleInviteResponseRequest, user: dict = Depends(get_current_user)):
    """Accepts or rejects a battle invitation. If accepted, creates synchronized battle lobby."""
    result = BattleService.respond_to_invitation(
        user_id=user["id"],
        invitation_id=payload.invitation_id,
        accept=payload.accept
    )
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return result


@router.get("/invitations")
def get_my_invitations(user: dict = Depends(get_current_user)):
    """Retrieves all pending invitations sent to or received by the user."""
    return CompetitionRepository.get_user_invitations(user["id"])


@router.get("/my-battles")
def get_my_battles(limit: int = 20, user: dict = Depends(get_current_user)):
    """Retrieves battle history for the logged-in student."""
    return BattleService.get_user_battle_history(user["id"], limit=limit)


@router.get("/leaderboard/ranking")
def get_battle_leaderboard(limit: int = 25):
    """Public battle leaderboard sorted by wins and battle XP."""
    return BattleService.get_battle_leaderboard(limit=limit)


@router.get("/{battle_id}")
def get_battle_state(battle_id: str, user: dict = Depends(get_current_user)):
    """
    Returns participant-safe battle state.
    Opponent choices and answer keys remain masked until COMPLETED.
    """
    view = BattleService.get_battle_view(user["id"], battle_id)
    if "error" in view:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=view["error"])
    return view


@router.post("/{battle_id}/ready")
def ready_up(battle_id: str, user: dict = Depends(get_current_user)):
    """Marks player ready. If both are ready, transitions battle to ACTIVE."""
    result = BattleService.set_player_ready(user["id"], battle_id)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return result


@router.post("/{battle_id}/submit")
def submit_answers(battle_id: str, payload: BattleSubmitRequest, user: dict = Depends(get_current_user)):
    """
    Submits participant's answer sheet.
    Authoritatively checks choices server-side against questions.
    Scores battle and awards XP once both participants submit.
    """
    result = BattleService.submit_battle_answers(
        user_id=user["id"],
        battle_id=battle_id,
        answers=payload.answers,
        time_taken_seconds=payload.time_taken_seconds
    )
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return result


@router.post("/{battle_id}/rematch")
def request_rematch(battle_id: str, user: dict = Depends(get_current_user)):
    """Creates a new invitation challenging the same opponent to a rematch."""
    result = BattleService.rematch(user["id"], user["name"], battle_id)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["error"])
    return result
