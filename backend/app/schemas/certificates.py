"""
Certificates and Achievements Schemas
Owned by: Ankush (Gamification & Competition Module Owner)
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class CertificatePublicView(BaseModel):
    is_valid: bool
    verification_id: Optional[str] = None
    recipient_name: Optional[str] = None
    cert_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    issued_at: Optional[str] = None
    issuer: Optional[str] = "PragyaX Educational Foundation"
    verification_hash: Optional[str] = None
    error: Optional[str] = None


class CertificateShareCard(BaseModel):
    title: str
    recipient: str
    verification_url: str
    badge_icon: str
    accent_color: str
    share_text: str
    certificate: CertificatePublicView
