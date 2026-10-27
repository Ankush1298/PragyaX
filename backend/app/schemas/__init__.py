"""
PragyaX Pydantic Schemas
Owned by: Arsh (FastAPI Backend Architecture)
"""

from .auth import RegisterRequest, LoginRequest, AuthResponse, UserProfileResponse
from .subjects import SubjectItemResponse, SubjectListResponse, SelectSubjectRequest
from .chat import ChatInputRequest, ChatMessageResponse, ChatHistoryResponse
from .assessments import AssessmentQuestionPublic, AssessmentSubmitRequest, AssessmentResultResponse, AssessmentHistoryResponse
from .dashboard import DashboardResponse
from .challenges import DailyChallengeResponse, ChallengeSubmitRequest, ChallengeResultResponse
from .roadmap import (
    RoadmapStatus,
    RoadmapModuleResponse,
    RoadmapDetailResponse,
    RoadmapProgressResponse,
    UpdateProgressRequest
)

__all__ = [
    "RegisterRequest", "LoginRequest", "AuthResponse", "UserProfileResponse",
    "SubjectItemResponse", "SubjectListResponse", "SelectSubjectRequest",
    "ChatInputRequest", "ChatMessageResponse", "ChatHistoryResponse",
    "AssessmentQuestionPublic", "AssessmentSubmitRequest", "AssessmentResultResponse", "AssessmentHistoryResponse",
    "DashboardResponse",
    "DailyChallengeResponse", "ChallengeSubmitRequest", "ChallengeResultResponse",
    "RoadmapStatus", "RoadmapModuleResponse", "RoadmapDetailResponse", "RoadmapProgressResponse", "UpdateProgressRequest",
    "BattleInviteRequest", "BattleInviteResponseRequest", "BattleReadyRequest", "BattleSubmitRequest", "BattleViewResponse",
    "OrganizationCreateRequest", "OrganizationResponse", "CompetitionCreateRequest", "CompetitionSubmitRequest", "CompetitionLeaderboardEntry",
    "ReferralApplyRequest", "ReferralDashboardResponse",
    "CertificatePublicView", "CertificateShareCard",
    "GamificationProfileResponse", "XPLedgerItem", "RewardCatalogItem", "RedeemRewardRequest", "RedeemRewardResponse"
]

from .battles import (
    BattleInviteRequest, BattleInviteResponseRequest, BattleReadyRequest,
    BattleSubmitRequest, BattleViewResponse, BattleLeaderboardItem
)
from .competitions import (
    OrganizationCreateRequest, OrganizationResponse, CompetitionCreateRequest,
    CompetitionSubmitRequest, CompetitionLeaderboardEntry
)
from .referrals import ReferralApplyRequest, ReferralDashboardResponse
from .certificates import CertificatePublicView, CertificateShareCard
from .gamification import (
    GamificationProfileResponse, XPLedgerItem, RewardCatalogItem,
    RedeemRewardRequest, RedeemRewardResponse
)
