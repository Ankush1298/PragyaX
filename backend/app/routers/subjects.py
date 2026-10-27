"""
Subjects Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from ..schemas.subjects import SubjectListResponse, SelectSubjectRequest, SubjectItemResponse
from ..services.auth_service import get_current_user
from ..database.repository import Repository

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.get("", response_model=SubjectListResponse)
def list_subjects(user: dict = Depends(get_current_user)):
    """Returns available subjects and the active user's current selection."""
    all_subjects = Repository.get_all_subjects()
    user_sel = Repository.get_user_selected_subject(user["id"])
    return {
        "subjects": all_subjects,
        "selected_subject_id": user_sel["id"]
    }


@router.post("/select", response_model=SubjectItemResponse)
def select_subject(payload: SelectSubjectRequest, user: dict = Depends(get_current_user)):
    """Sets learner's active subject."""
    subject = Repository.get_subject_by_id(payload.subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found."
        )

    if not subject["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{subject['title']}' is currently in catalog preview (Coming Soon) and will be fully enabled soon."
        )

    updated = Repository.set_user_selected_subject(user["id"], subject["id"])
    return updated
