from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.stackauth import get_stackauth_client
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from Stack Auth session token.
    """
    token = credentials.credentials

    try:
        stackauth = get_stackauth_client()
        token_data = await stackauth.verify_token(token)
        stackauth_user_id = token_data["user_id"]

        # Get user info from Stack Auth
        stackauth_user = await stackauth.get_user(stackauth_user_id)
        email = stackauth_user.get("email")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not found in token"
            )

        # Find or create user in our database
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is None:
            # Create user from Stack Auth info
            # Check if this is the initial admin email
            is_initial_admin = email.lower() == settings.INITIAL_ADMIN_EMAIL.lower()
            if is_initial_admin:
                role = "admin"
            else:
                # Get metadata to check for role
                metadata = await stackauth.get_user_metadata(stackauth_user_id)
                role = metadata.get("public_metadata", {}).get("role", "participant")

            user = User(
                email=email,
                full_name=stackauth_user.get("full_name") or email,
                role=role,
                is_active=True,
                is_initial_admin=is_initial_admin,
                hashed_password=""  # No password needed for Stack Auth users
            )
            db.add(user)
            try:
                await db.commit()
                await db.refresh(user)
            except Exception as commit_error:
                # Handle race condition - another request might have created the user
                await db.rollback()
                result = await db.execute(select(User).where(User.email == email))
                user = result.scalar_one_or_none()
                if user is None:
                    raise  # Re-raise if user still doesn't exist
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
        # Log error with full details for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Authentication error: {type(e).__name__}: {str(e)}", exc_info=True)
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


async def get_current_outing_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Verify the current user is an admin or outing-admin"""
    if current_user.role not in ["admin", "outing-admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user