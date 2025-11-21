from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
import uuid

from app.db.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.models.user import User
from app.core.security import verify_password, create_access_token, get_password_hash
from app.api.deps import get_current_user

router = APIRouter()


class AdminSetupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class SetupStatusResponse(BaseModel):
    setup_complete: bool


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return access token
    
    - **email**: User email address
    - **password**: User password
    
    Returns JWT access token and user information
    """
    # Get user by email
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information
    
    Requires valid JWT token in Authorization header
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role
    )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout current user
    
    Note: Since we're using stateless JWT tokens, this endpoint
    primarily serves as a confirmation. The client should remove
    the token from storage.
    """
    return {"message": "Successfully logged out"}


@router.get("/setup-status", response_model=SetupStatusResponse)
async def check_setup_status(
    db: AsyncSession = Depends(get_db)
):
    """
    Check if initial admin setup has been completed.
    Returns true if any admin user exists in the system.
    """
    result = await db.execute(
        select(User).where(User.role == "admin").limit(1)
    )
    admin_exists = result.scalar_one_or_none() is not None
    
    return SetupStatusResponse(setup_complete=admin_exists)


@router.post("/setup-admin")
async def setup_admin(
    setup_data: AdminSetupRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Create the initial admin user. This endpoint can only be used
    when no admin users exist in the system.
    
    - **email**: Admin email address
    - **password**: Admin password (minimum 8 characters)
    - **full_name**: Admin full name
    
    Returns success message and user ID
    """
    # Check if any admin already exists
    result = await db.execute(
        select(User).where(User.role == "admin").limit(1)
    )
    existing_admin = result.scalar_one_or_none()
    
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin setup has already been completed. This endpoint is only available for initial setup."
        )
    
    # Validate password length
    if len(setup_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Check if email is already in use
    result = await db.execute(
        select(User).where(User.email == setup_data.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    # Create the admin user
    admin_user = User(
        id=uuid.uuid4(),
        email=setup_data.email,
        hashed_password=get_password_hash(setup_data.password),
        full_name=setup_data.full_name,
        role="admin",
        is_active=True
    )
    
    db.add(admin_user)
    await db.commit()
    await db.refresh(admin_user)
    
    return {
        "message": "Admin user created successfully",
        "user_id": str(admin_user.id)
    }