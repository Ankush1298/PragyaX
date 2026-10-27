"""
Personalized Learning Roadmap Router
Exposes endpoints for retrieving diagnostic roadmaps, viewing module details,
and signaling module completion (pending database schema provisioning).
Owned by: Arsh (FastAPI Backend Architecture)
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..schemas.roadmap import (
    RoadmapDetailResponse,
    RoadmapModuleResponse,
    RoadmapProgressResponse,
    UpdateProgressRequest
)
from ..services.auth_service import get_current_user
from ..services.roadmap_service import (
    build_deterministic_roadmap,
    validate_module_completion,
    SUPPORTED_SUBJECTS,
    SUBJECT_CATALOGS,
    SubjectCatalogComingSoonError
)
from ..database.repository import Repository

router = APIRouter(prefix="/roadmap", tags=["Learning Roadmaps"])


@router.get("", response_model=RoadmapDetailResponse)
def get_user_roadmap(
    subject_id: Optional[str] = Query(None, description="Optional target subject ID"),
    user: dict = Depends(get_current_user)
):
    """
    Retrieves the learner's personalized learning roadmap.
    Constructed deterministically using the student's active subject,
    stored module completions, and weakness topics identified during
    recent assessment evaluations.
    """
    user_id = user["id"]

    # 1. Determine active subject
    if subject_id:
        if subject_id not in SUPPORTED_SUBJECTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subject '{subject_id}' is not supported. Supported: {', '.join(sorted(SUPPORTED_SUBJECTS.keys()))}."
            )
        if subject_id not in SUBJECT_CATALOGS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roadmaps for this subject are coming soon."
            )
        target_subject_id = subject_id
    else:
        selected_subject = Repository.get_user_selected_subject(user_id)
        target_subject_id = selected_subject.get("id", "subj_python")
        if target_subject_id not in SUBJECT_CATALOGS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roadmaps for this subject are coming soon."
            )

    # 2. Extract diagnostic weaknesses from user's latest assessment attempt
    attempts = Repository.get_user_assessment_attempts(user_id, limit=1)
    weaknesses = attempts[0].get("recommended_topics", []) if attempts else []

    # 3. Retrieve stored completed module IDs for this user & subject
    completed_module_ids = set(Repository.get_user_completed_modules(user_id, target_subject_id))

    # 4. Generate deterministic roadmap with completed progress
    try:
        roadmap_data = build_deterministic_roadmap(
            subject_id=target_subject_id,
            weaknesses=weaknesses,
            user_id=user_id,
            completed_module_ids=completed_module_ids
        )
    except SubjectCatalogComingSoonError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return roadmap_data


@router.get("/{module_id}", response_model=RoadmapModuleResponse)
def get_roadmap_module(
    module_id: str,
    subject_id: Optional[str] = Query(None, description="Optional subject ID context"),
    user: dict = Depends(get_current_user)
):
    """
    Retrieves detailed specifications for a specific roadmap module,
    including prerequisite dependencies, lock state, and completion status.
    """
    user_id = user["id"]

    if subject_id:
        if subject_id not in SUPPORTED_SUBJECTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subject '{subject_id}' is not supported."
            )
        if subject_id not in SUBJECT_CATALOGS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roadmaps for this subject are coming soon."
            )
        target_subject_id = subject_id
    else:
        target_subject_id = Repository.get_user_selected_subject(user_id).get("id", "subj_python")
        if target_subject_id not in SUBJECT_CATALOGS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roadmaps for this subject are coming soon."
            )

    attempts = Repository.get_user_assessment_attempts(user_id, limit=1)
    weaknesses = attempts[0].get("recommended_topics", []) if attempts else []

    completed_module_ids = set(Repository.get_user_completed_modules(user_id, target_subject_id))

    try:
        roadmap_data = build_deterministic_roadmap(
            subject_id=target_subject_id,
            weaknesses=weaknesses,
            user_id=user_id,
            completed_module_ids=completed_module_ids
        )
    except SubjectCatalogComingSoonError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    module = next((m for m in roadmap_data["modules"] if m["id"] == module_id), None)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Module '{module_id}' not found in active roadmap."
        )

    return module


@router.post("/{module_id}/complete", response_model=RoadmapProgressResponse, status_code=status.HTTP_200_OK)
def complete_roadmap_module(
    module_id: str,
    subject_id: Optional[str] = Query(None, description="Optional subject ID context"),
    payload: Optional[UpdateProgressRequest] = None,
    user: dict = Depends(get_current_user)
):
    """
    Signals completion of a learning roadmap module and persists progress.
    Validates module existence and prerequisite satisfaction.
    Duplicate requests are idempotent.
    """
    user_id = user["id"]

    if not module_id or len(module_id.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid module_id is required."
        )

    # 1. Determine target subject
    if subject_id:
        if subject_id not in SUPPORTED_SUBJECTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subject '{subject_id}' is not supported."
            )
        if subject_id not in SUBJECT_CATALOGS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roadmaps for this subject are coming soon."
            )
        target_subject_id = subject_id
    else:
        target_subject_id = Repository.get_user_selected_subject(user_id).get("id", "subj_python")
        if target_subject_id not in SUBJECT_CATALOGS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roadmaps for this subject are coming soon."
            )

    # 2. Retrieve existing completed modules
    completed_module_ids = set(Repository.get_user_completed_modules(user_id, target_subject_id))

    # 3. Retrieve assessment weaknesses to assemble roadmap graph
    attempts = Repository.get_user_assessment_attempts(user_id, limit=1)
    weaknesses = attempts[0].get("recommended_topics", []) if attempts else []

    try:
        roadmap_data = build_deterministic_roadmap(
            subject_id=target_subject_id,
            weaknesses=weaknesses,
            user_id=user_id,
            completed_module_ids=completed_module_ids
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # 4. Check if module exists in active roadmap
    target_module = next((m for m in roadmap_data["modules"] if m["id"] == module_id), None)
    if not target_module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Module '{module_id}' not found in active roadmap."
        )

    # 5. Validate prerequisites (raises ValueError if locked/unmet)
    try:
        validate_module_completion(module_id, roadmap_data["modules"], completed_module_ids)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # 6. Idempotently save completion in database
    progress_record = Repository.save_module_completion(user_id, target_subject_id, module_id)

    completed_at_str = None
    if progress_record.get("completed_at"):
        completed_at_str = str(progress_record["completed_at"])

    return {
        "module_id": module_id,
        "status": "completed",
        "completion_percentage": 100.0,
        "updated_at": completed_at_str
    }
