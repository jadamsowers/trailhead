"""
User registration endpoints for parent accounts
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr, Field

from app.db.session import get_db
from app.models.user import User
from sqlalchemy import select

router = APIRouter()


class ParentRegistrationRequest(BaseModel):
    """Schema for parent account registration"""
    email: EmailStr = Field(..., description="Parent email address")
    first_name: str = Field(..., min_length=1, max_length=255, description="First name")
    last_name: str = Field(..., min_length=1, max_length=255, description="Last name")


class RegistrationResponse(BaseModel):
    """Response after successful registration"""
    message: str
    user_id: str
    email: str


@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_parent(
    registration: ParentRegistrationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new adult account.
    
    Note: This endpoint is deprecated. User registration should be handled
    through Authentik's sign-up flow. Users are automatically created in the
    local database when they first authenticate via Authentik.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Registration is handled through Authentik. Please use the Authentik sign-up flow."
    )

