"""
User registration endpoints for parent accounts
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

from app.db.session import get_db
from app.core.keycloak import get_keycloak_client
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select

router = APIRouter()


class ParentRegistrationRequest(BaseModel):
    """Schema for parent account registration"""
    email: EmailStr = Field(..., description="Parent email address")
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters)")
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
    Register a new parent account.
    Creates user in Keycloak and syncs to local database.
    """
    # Check if user already exists in our database
    result = await db.execute(select(User).where(User.email == registration.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create user in Keycloak
    try:
        keycloak = get_keycloak_client()
        keycloak_user_id = keycloak.create_user(
            email=registration.email,
            password=registration.password,
            first_name=registration.first_name,
            last_name=registration.last_name,
            roles=["parent"]  # Assign parent role by default
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Create user in local database
    user = User(
        email=registration.email,
        full_name=f"{registration.first_name} {registration.last_name}",
        role="parent",
        is_active=True,
        hashed_password=""  # No password needed, authentication via Keycloak
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return RegistrationResponse(
        message="Parent account created successfully",
        user_id=str(user.id),
        email=user.email
    )

