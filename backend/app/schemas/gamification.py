"""
Gamification Hub Schemas
Owned by: Ankush (Gamification & Competition Module Owner)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class GamificationBadge(BaseModel):
    id: str
    name: str
    icon: str
    desc: str


class GamificationProfileResponse(BaseModel):
    user_id: str
    total_xp: int
    level: int
    title: str
    current_threshold: int
    next_threshold: int
    progress_percentage: float
    streak: Dict[str, Any]
    battle_stats: Dict[str, Any]
    badges: List[GamificationBadge]


class XPLedgerItem(BaseModel):
    id: str
    event_key: str
    user_id: str
    points_delta: int
    reason: str
    source_type: str
    source_id: str
    created_at: str


class RewardCatalogItem(BaseModel):
    id: str
    title: str
    description: str
    category: str
    xp_cost: int
    icon: str
    stock: int
    is_active: bool
    can_afford: Optional[bool] = False
    shortfall: Optional[int] = 0


class RedeemRewardRequest(BaseModel):
    reward_id: str


class RedeemRewardResponse(BaseModel):
    redemption_id: str
    reward_title: str
    xp_spent: int
    remaining_xp: int
    status: str
