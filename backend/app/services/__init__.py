"""
PragyaX Services Package
"""

from .auth_service import hash_password, verify_password, get_current_user
from .roadmap_service import (
    build_deterministic_roadmap,
    calculate_overall_progress,
    validate_module_prerequisites,
    update_module_lock_statuses,
    validate_module_completion,
    validate_progress_transition,
    validate_catalog_integrity,
    SubjectCatalogComingSoonError,
    SUBJECT_CATALOGS,
    SUPPORTED_SUBJECTS
)

__all__ = [
    "hash_password", "verify_password", "get_current_user",
    "build_deterministic_roadmap",
    "calculate_overall_progress",
    "validate_module_prerequisites",
    "update_module_lock_statuses",
    "validate_module_completion",
    "validate_progress_transition",
    "validate_catalog_integrity",
    "SubjectCatalogComingSoonError",
    "SUBJECT_CATALOGS",
    "SUPPORTED_SUBJECTS",
    "ChallengeService",
    "BattleService",
    "HostedCompetitionService",
    "ReferralService",
    "CertificateService",
    "GamificationHub",
    "AdminCompetitionService"
]

from .challenge_service import ChallengeService
from .battle_service import BattleService
from .hosted_competition_service import HostedCompetitionService
from .referral_service import ReferralService
from .certificate_service import CertificateService
from .gamification_hub import GamificationHub
from .admin_competition_service import AdminCompetitionService
