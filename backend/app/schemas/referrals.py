"""
Referral System Schemas
Owned by: Ankush (Gamification & Competition Module Owner)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ReferralApplyRequest(BaseModel):
    referral_code: str = Field(..., description="Referral code entered by new student")


class ReferralHistoryItem(BaseModel):
    id: str
    referrer_id: str
    referee_id: str
    referee_name: Optional[str] = None
    referee_email: Optional[str] = None
    status: str
    milestone_type: Optional[str] = None
    referrer_reward_points: int
    created_at: str
    qualified_at: Optional[str] = None


class ReferralDashboardResponse(BaseModel):
    referral_code: str
    share_url: str
    total_invited: int
    pending_referrals: int
    successful_referrals: int
    xp_earned_from_referrals: int
    referral_history: List[ReferralHistoryItem]
