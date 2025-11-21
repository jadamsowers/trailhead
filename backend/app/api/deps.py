from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any

from app.core.security import decode_token
from app.core.clerk import get_clerk_client
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from Clerk session token or JWT token (legacy).
    Tries Clerk authentication first, falls back to legacy JWT if that fails.
    """
    token = credentials.credentials
    
    # Try Clerk session token first
    try:
        clerk = get_clerk_client()
        token_data = await clerk.verify_token(token)
        clerk_user_id = token_data["user_id"]
        
        # Get user info from Clerk
        clerk_user = await clerk.get_user(clerk_user_id)
        email = clerk_user.get("email")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not found in token"
            )
        
        # Find or create user in our database
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if user is None:
            # Create user from Clerk info
            # Check if this is the initial admin email
            is_initial_admin = email.lower() == settings.INITIAL_ADMIN_EMAIL.lower()
            if is_initial_admin:
                role = "admin"
            else:
                # Get metadata to check for role
                metadata = await clerk.get_user_metadata(clerk_user_id)
                role = metadata.get("public_metadata", {}).get("role", "user")
            
            user = User(
                email=email,
                full_name=clerk_user.get("full_name") or email,
                role=role,
                is_active=True,
                is_initial_admin=is_initial_admin,
                hashed_password=""  # No password needed for Clerk users
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # If user exists and matches admin email, ensure they have admin role
            if email.lower() == settings.INITIAL_ADMIN_EMAIL.lower() and user.role != "admin":
                user.role = "admin"
                await db.commit()
                await db.refresh(user)
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        # Fall back to legacy JWT token validation
        try:
            payload = decode_token(token)
            
            if payload.get("type") != "access":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            
            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials"
                )
            
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            
            if user is None or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found or inactive"
                )
            
            return user
        except Exception:
            # If both fail, raise authentication error
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Verify the current user is an admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user