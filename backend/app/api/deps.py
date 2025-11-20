from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any

from app.core.security import decode_token
from app.core.keycloak import get_keycloak_client
from app.db.session import get_db
from app.models.user import User

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from OAuth token (Keycloak) or JWT token (legacy).
    Tries Keycloak OAuth first, falls back to legacy JWT if that fails.
    """
    token = credentials.credentials
    
    # Try Keycloak OAuth token first
    try:
        keycloak = get_keycloak_client()
        token_info = keycloak.introspect_token(token)
        
        if not token_info.get("active", False):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is not active"
            )
        
        # Get user info from token
        user_info = keycloak.get_userinfo(token)
        email = user_info.get("email")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not found in token"
            )
        
        # Find or create user in our database
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if user is None:
            # Create user from Keycloak info
            # Extract roles from token
            realm_access = token_info.get("realm_access", {})
            roles = realm_access.get("roles", [])
            role = "admin" if "admin" in roles else ("parent" if "parent" in roles else "user")
            
            user = User(
                email=email,
                full_name=f"{user_info.get('given_name', '')} {user_info.get('family_name', '')}".strip() or email,
                role=role,
                is_active=True,
                hashed_password=""  # No password needed for OAuth users
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        return user
        
    except (ValueError, Exception) as e:
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