"""
Clerk authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.clerk import get_clerk_client
from app.schemas.auth import UserResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role
    )


@router.post("/sync-role")
async def sync_user_role(
    role: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sync user role from Clerk metadata to local database.
    This endpoint can be called after updating role in Clerk dashboard.
    """
    if role not in ["admin", "parent", "user"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be one of: admin, parent, user"
        )
    
    current_user.role = role
    await db.commit()
    
    return {"message": "Role synced successfully", "role": role}