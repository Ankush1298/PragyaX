"""
Admin Competitions Router
Owned by: Ankush (Gamification & Competition Module Owner)
Provides admin-only endpoints for host approvals, competition audits, and platform analytics.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from ..services.auth_service import get_current_user
from ..services.admin_competition_service import AdminCompetitionService

router = APIRouter(prefix="/admin/competitions", tags=["Admin Competitions"])


class VerifyOrgRequest(BaseModel):
    is_verified: bool = True


def require_admin_user(user: dict = Depends(get_current_user)):
    """Enforces admin role or platform administrator email/id."""
    is_admin = (
        user.get("role") == "admin" or
        user.get("id") == "system_admin" or
        user.get("email") in ("admin@pragyax.test", "super_admin@pragyax.test", "system_admin@pragyax.org")
    )
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required."
        )
    return user


@router.post("/organizations/{org_id}/verify")
def verify_organization(org_id: str, payload: VerifyOrgRequest, admin: dict = Depends(require_admin_user)):
    """Approves or revokes organization hosting credentials."""
    result = AdminCompetitionService.verify_organization_host(org_id, is_verified=payload.is_verified)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])
    return result


@router.get("/analytics")
def get_analytics(admin: dict = Depends(require_admin_user)):
    """Retrieves platform-wide competition, battle, challenge, and referral metrics."""
    return AdminCompetitionService.get_platform_competition_analytics()


@router.get("/audit/referrals")
def audit_referrals(admin: dict = Depends(require_admin_user)):
    """Audits referral system to flag suspicious patterns or potential abuse."""
    return AdminCompetitionService.audit_referral_activity()


@router.get("/audit/rewards")
def audit_rewards(admin: dict = Depends(require_admin_user)):
    """Audits reward redemptions to flag high-frequency spending."""
    return AdminCompetitionService.audit_suspicious_rewards()
