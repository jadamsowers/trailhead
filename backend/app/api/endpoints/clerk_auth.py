"""
Clerk authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel

from app.db.session import get_db
from app.core.clerk import get_clerk_client
from app.schemas.auth import UserResponse, UserContactUpdate
from app.api.deps import get_current_user, get_current_admin_user
from app.models.user import User

router = APIRouter()


class UpdateUserRoleRequest(BaseModel):
    """Schema for updating user role"""
    role: str


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information including contact details.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        phone=current_user.phone,
        emergency_contact_name=current_user.emergency_contact_name,
        emergency_contact_phone=current_user.emergency_contact_phone
    )


@router.patch("/me/contact", response_model=UserResponse)
async def update_contact_info(
    contact_update: UserContactUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's contact information.
    This serves as the default contact info for signups.
    """
    # Update contact fields
    if contact_update.phone is not None:
        current_user.phone = contact_update.phone
    if contact_update.emergency_contact_name is not None:
        current_user.emergency_contact_name = contact_update.emergency_contact_name
    if contact_update.emergency_contact_phone is not None:
        current_user.emergency_contact_phone = contact_update.emergency_contact_phone
    
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        phone=current_user.phone,
        emergency_contact_name=current_user.emergency_contact_name,
        emergency_contact_phone=current_user.emergency_contact_phone
    )


@router.post("/sync-role")
async def sync_user_role(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sync user role from Clerk metadata to local database.
    This endpoint fetches the role directly from Clerk to ensure security.
    """
    # Fetch user metadata from Clerk
    clerk = get_clerk_client()
    try:
        metadata = await clerk.get_user_metadata(str(current_user.id))
        public_metadata = metadata.get("public_metadata", {})
        role = public_metadata.get("role", "user")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch role from Clerk: {str(e)}"
        )
    
    if role not in ["admin", "adult", "user"]:
        # Default to user if invalid role found
        role = "user"
    
    current_user.role = role
    await db.commit()
    
    return {"message": "Role synced successfully", "role": role}


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all users in the system. Admin only.
    """
    result = await db.execute(select(User).order_by(User.created_at))
    users = result.scalars().all()
    
    return [
        UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_initial_admin=user.is_initial_admin,
            phone=user.phone,
            emergency_contact_name=user.emergency_contact_name,
            emergency_contact_phone=user.emergency_contact_phone
        )
        for user in users
    ]


@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    request: UpdateUserRoleRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user's role. Admin only.
    Cannot demote the initial admin.
    """
    # Validate role
    if request.role not in ["admin", "adult", "user"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be one of: admin, adult, user"
        )
    
    # Get the target user
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent demotion of initial admin
    if target_user.is_initial_admin and request.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot demote the initial admin user"
        )
    
    # Update the role
    target_user.role = request.role
    await db.commit()
    await db.refresh(target_user)
    
    return UserResponse(
        id=target_user.id,
        email=target_user.email,
        full_name=target_user.full_name,
        role=target_user.role,
        is_initial_admin=target_user.is_initial_admin,
        phone=target_user.phone,
        emergency_contact_name=target_user.emergency_contact_name,
        emergency_contact_phone=target_user.emergency_contact_phone
    )