"""
OAuth/OIDC endpoints for Keycloak integration
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.session import get_db
from app.core.keycloak import get_keycloak_client
from app.core.config import settings
from app.schemas.auth import TokenResponse, UserResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/authorize")
async def authorize(
    redirect_uri: str = Query(..., description="Redirect URI after authentication"),
    state: Optional[str] = Query(None, description="State parameter for CSRF protection")
):
    """
    Initiate OAuth authorization flow.
    Redirects user to Keycloak login page.
    """
    keycloak = get_keycloak_client()
    auth_url = keycloak.get_authorization_url(redirect_uri=redirect_uri, state=state)
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def oauth_callback(
    code: Optional[str] = Query(None, description="Authorization code from Keycloak"),
    state: Optional[str] = Query(None, description="State parameter"),
    error: Optional[str] = Query(None, description="Error from OAuth provider")
):
    """
    OAuth callback endpoint.
    Handles both success and error cases from Keycloak.
    """
    if error:
        # OAuth error - redirect to frontend with error
        frontend_redirect = f"{settings.FRONTEND_URL}/login?error={error}"
        return RedirectResponse(url=frontend_redirect)
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code is required"
        )
    
    try:
        keycloak = get_keycloak_client()
        redirect_uri = f"{settings.FRONTEND_URL}/auth/callback"
        tokens = keycloak.get_token(code=code, redirect_uri=redirect_uri)
        
        # Redirect to frontend with tokens
        frontend_redirect = (
            f"{settings.FRONTEND_URL}/auth/callback"
            f"?access_token={tokens['access_token']}"
            f"&refresh_token={tokens.get('refresh_token', '')}"
        )
        if state:
            frontend_redirect += f"&state={state}"
        
        return RedirectResponse(url=frontend_redirect)
        
    except ValueError as e:
        # Redirect to frontend with error
        frontend_redirect = f"{settings.FRONTEND_URL}/login?error={str(e)}"
        return RedirectResponse(url=frontend_redirect)


@router.post("/token", response_model=TokenResponse)
async def exchange_token(
    code: str,
    redirect_uri: str
):
    """
    Exchange authorization code for tokens (for programmatic access).
    """
    try:
        keycloak = get_keycloak_client()
        tokens = keycloak.get_token(code=code, redirect_uri=redirect_uri)
        user_info = keycloak.get_userinfo(tokens["access_token"])
        
        return TokenResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens.get("refresh_token", ""),
            token_type="bearer",
            user=UserResponse(
                id=user_info.get("sub", ""),
                email=user_info.get("email", ""),
                full_name=f"{user_info.get('given_name', '')} {user_info.get('family_name', '')}".strip() or user_info.get("email", ""),
                role=user_info.get("realm_access", {}).get("roles", ["user"])[0] if user_info.get("realm_access", {}).get("roles") else "user"
            )
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_token: str
):
    """
    Refresh access token using refresh token.
    """
    try:
        keycloak = get_keycloak_client()
        tokens = keycloak.refresh_token(refresh_token)
        user_info = keycloak.get_userinfo(tokens["access_token"])
        
        return TokenResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens.get("refresh_token", refresh_token),
            token_type="bearer",
            user=UserResponse(
                id=user_info.get("sub", ""),
                email=user_info.get("email", ""),
                full_name=f"{user_info.get('given_name', '')} {user_info.get('family_name', '')}".strip() or user_info.get("email", ""),
                role=user_info.get("realm_access", {}).get("roles", ["user"])[0] if user_info.get("realm_access", {}).get("roles") else "user"
            )
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/logout")
async def logout(
    refresh_token: str,
    current_user: User = Depends(get_current_user)
):
    """
    Logout user by invalidating refresh token.
    """
    try:
        keycloak = get_keycloak_client()
        keycloak.logout(refresh_token)
        return {"message": "Successfully logged out"}
    except Exception as e:
        # Logout might fail if token is already invalid, which is fine
        return {"message": "Logged out"}


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

