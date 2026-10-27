"""
Authentication Router
Owned by: Arsh (FastAPI Backend Architecture)
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from ..schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserProfileResponse
from ..services.auth_service import (
    validate_email,
    generate_salt,
    hash_password,
    verify_password,
    generate_session_token,
    get_current_user
)
from ..database.repository import Repository

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    """Registers a new learner account with salted PBKDF2 password hashing."""
    if not validate_email(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )

    if len(payload.name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide your name (at least 2 characters)."
        )

    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    existing = Repository.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in."
        )

    salt = generate_salt()
    pwd_hash = hash_password(payload.password, salt)
    user = Repository.create_user(
        name=payload.name.strip(),
        email=payload.email.strip(),
        password_hash=pwd_hash,
        salt=salt
    )

    token = generate_session_token()
    Repository.create_session(user["id"], token)

    return {
        "token": token,
        "token_type": "Bearer",
        "user": user,
        "demo_notice": "Demo authentication active. Token valid for local session."
    }


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    """Authenticates learner and establishes session."""
    user = Repository.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not verify_password(payload.password, user["password_hash"], user["salt"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = generate_session_token()
    Repository.create_session(user["id"], token)

    return {
        "token": token,
        "token_type": "Bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "created_at": user.get("created_at")
        },
        "demo_notice": "Demo authentication active. Token valid for local session."
    }


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(user: dict = Depends(get_current_user)):
    """Fetches currently authenticated learner profile."""
    return user


@router.post("/logout")
def logout(user: dict = Depends(get_current_user), authorization: str = Header(None)):
    """Logs out user and invalidates current session token server-side."""
    Repository.delete_session(authorization.split(" ", 1)[1])
    return {"message": "Logged out successfully"}
