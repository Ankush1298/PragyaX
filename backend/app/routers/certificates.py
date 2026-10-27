"""
Certificates and Verification Router
Owned by: Ankush (Gamification & Competition Module Owner)
Provides tamper-evident verification endpoints, downloadable certificates, and shareable cards.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from ..services.auth_service import get_current_user
from ..services.certificate_service import CertificateService
from ..schemas.certificates import CertificatePublicView, CertificateShareCard

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.get("/my-certificates")
def get_my_certificates(user: dict = Depends(get_current_user)):
    """Retrieves all verified certificates earned by the authenticated user."""
    return CertificateService.get_user_certificates(user["id"])


@router.get("/verify/{verification_id}", response_model=CertificatePublicView)
def verify_certificate(verification_id: str):
    """
    Public tamper-evident verification endpoint.
    Recalculates SHA256 cryptographic signature to verify authenticity.
    """
    result = CertificateService.verify_certificate(verification_id)
    if not result.get("is_valid"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.get("error", "Invalid certificate"))
    return result


@router.get("/{verification_id}/share", response_model=CertificateShareCard)
def get_share_card(verification_id: str):
    """Returns shareable social preview data and card layout."""
    card = CertificateService.get_shareable_card_data(verification_id)
    if "error" in card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=card["error"])
    return card


@router.get("/{verification_id}/download")
def download_certificate(verification_id: str):
    """Returns downloadable printable HTML representation of the certificate."""
    rendered = CertificateService.render_downloadable_certificate_html(verification_id)
    if "error" in rendered:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=rendered["error"])
    return Response(content=rendered["html"], media_type="text/html")
