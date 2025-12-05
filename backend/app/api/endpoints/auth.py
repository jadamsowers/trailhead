"""
Authentik server-driven authentication endpoints
"""
from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import uuid
from uuid import UUID
from urllib.parse import urlparse, urlunparse

from app.core.authentik import get_authentik_client
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserResponse, UserContactUpdate
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/login")
async def login(request: Request):
    """Start the OIDC authorization code flow by redirecting to Authentik."""
    authentik = get_authentik_client()
    # Fetch discovery document to get authorization endpoint
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(authentik.openid_config_url, timeout=10)
            resp.raise_for_status()
            discovery = resp.json()
        except Exception as e:
            logger.exception("Failed to fetch OpenID configuration from %s", authentik.openid_config_url)
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to fetch OpenID configuration")

    auth_endpoint = discovery.get("authorization_endpoint")
    # If an externally-reachable Authentik URL is provided (for browser redirects
    # during local development), rewrite the authorization endpoint to use that
    # host/scheme so the browser can reach Authentik (containers cannot be
    # contacted via 'authentik-server' from the host).
    external_auth_url = getattr(settings, "AUTHENTIK_EXTERNAL_URL", None)
    if external_auth_url:
        try:
            parsed_ext = urlparse(external_auth_url)
            parsed_auth = urlparse(auth_endpoint)
            # Build a new URL that uses external scheme/netloc but preserves the
            # discovery-provided path (authorization path and query if present).
            auth_endpoint = urlunparse((parsed_ext.scheme or parsed_auth.scheme,
                                        parsed_ext.netloc or parsed_auth.netloc,
                                        parsed_auth.path,
                                        parsed_auth.params,
                                        parsed_auth.query,
                                        parsed_auth.fragment))
        except Exception:
            logger.warning("Failed to rewrite authorization_endpoint to external URL; using discovery value")
    if not auth_endpoint:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Authorization endpoint not found")

    # Build callback URL (absolute)
    callback_url = request.url_for("auth_callback")

    state = uuid.uuid4().hex

    params = {
        "response_type": "code",
        "client_id": settings.AUTHENTIK_CLIENT_ID,
        "redirect_uri": callback_url,
        "scope": "openid email profile",
        "state": state,
    }

    # Build final URL
    from urllib.parse import urlencode

    url = f"{auth_endpoint}?{urlencode(params)}"

    response = RedirectResponse(url)
    # Store state in a short-lived HttpOnly cookie for CSRF protection
    response.set_cookie("auth_state", state, httponly=True, samesite="lax")
    return response


from typing import Optional

@router.get("/callback", name="auth_callback")
async def callback(code: Optional[str] = None, state: Optional[str] = None, request: Request = None, db: AsyncSession = Depends(get_db)):
    """Handle callback from Authentik, exchange code for tokens, create session cookie, and create/update local user."""
    if code is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing code parameter")

    cookie_state = request.cookies.get("auth_state")
    if not cookie_state or state != cookie_state:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state")

    authentik = get_authentik_client()
    # Get token endpoint from discovery
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(authentik.openid_config_url, timeout=10)
            resp.raise_for_status()
            discovery = resp.json()
        except Exception:
            logger.exception("Failed to fetch OpenID configuration from %s", authentik.openid_config_url)
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to fetch OpenID configuration")

    token_endpoint = discovery.get("token_endpoint")
    if not token_endpoint:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Token endpoint not found")

    # Exchange code for token
    callback_url = request.url_for("auth_callback")
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": callback_url,
        "client_id": settings.AUTHENTIK_CLIENT_ID,
        "client_secret": settings.AUTHENTIK_CLIENT_SECRET,
    }

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(token_endpoint, data=data, timeout=10)
        if token_resp.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token exchange failed")
        token_json = token_resp.json()

    access_token = token_json.get("access_token")
    id_token = token_json.get("id_token")

    if not access_token and not id_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No token returned")

    # Prefer verifying the ID token (JWT) when present. Some Auth servers
    # issue opaque access tokens which cannot be verified as JWTs; in that
    # case fall back to the userinfo endpoint to obtain claims.
    token_data = None
    jwt_to_verify = id_token or access_token
    if jwt_to_verify:
        try:
            token_data = await authentik.verify_token(jwt_to_verify)
        except Exception:
            token_data = None

    # If verification failed (e.g., opaque access token), try userinfo
    # using the access token to obtain claims.
    if token_data is None:
        try:
            userinfo = await authentik.get_user_info(access_token)
            # Normalize fields to match verify_token return shape
            token_data = {
                "user_id": userinfo.get("id"),
                "email": userinfo.get("email"),
                "name": userinfo.get("display_name"),
                "preferred_username": userinfo.get("preferred_username"),
                "groups": userinfo.get("groups", []),
                "claims": userinfo,
            }
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    email = token_data.get("email")
    groups = token_data.get("groups", [])

    # Additional fallbacks: check nested claims and preferred_username
    if not email:
        claims = token_data.get("claims") or {}
        # Common places where Authentik might put an identifier
        email = claims.get("email") or claims.get("mail")

    if not email:
        # preferred_username is often present; use it only if it looks like an email
        preferred = token_data.get("preferred_username") or (token_data.get("claims") or {}).get("preferred_username")
        if preferred and "@" in preferred:
            email = preferred

    if not email:
        # fallback to userinfo (if not already used earlier)
        try:
            userinfo = await authentik.get_user_info(access_token)
            email = userinfo.get("email")
            if email:
                logger.info("Recovered email from userinfo for user: %s", email)
        except Exception:
            logger.info("Userinfo fallback did not return an email")

    if not email:
        logger.error("Email not found in token claims, preferred_username, or userinfo. Claims: %s", token_data.get("claims"))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("Email not found in token. Ensure Authentik is configured to release the 'email' claim "
                    "or include a verifiable email in 'preferred_username'.")
        )

    # Find or create local user, similar to deps.get_current_user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        is_initial_admin = email.lower() == settings.INITIAL_ADMIN_EMAIL.lower()
        if is_initial_admin:
            role = "admin"
        else:
            role = authentik.get_role_from_groups(groups)

        user = User(
            email=email,
            full_name=token_data.get("name") or email,
            role=role,
            is_active=True,
            is_initial_admin=is_initial_admin,
            hashed_password="",
        )
        db.add(user)
        try:
            await db.commit()
            await db.refresh(user)
        except Exception:
            await db.rollback()
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            if user is None:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user")
    else:
        # Ensure initial admin role
        if email.lower() == settings.INITIAL_ADMIN_EMAIL.lower() and user.role != "admin":
            user.role = "admin"
            await db.commit()
            await db.refresh(user)
        elif not user.is_initial_admin:
            new_role = authentik.get_role_from_groups(groups)
            if user.role != new_role and new_role == "admin":
                user.role = new_role
                await db.commit()
                await db.refresh(user)

    # Create response that sets auth_access_token cookie
    response = RedirectResponse(url=settings.FRONTEND_URL)
    # Set access token as HttpOnly cookie for backend session use
    response.set_cookie(
        "auth_access_token",
        access_token,
        httponly=True,
        samesite="lax",
        secure=not settings.DEBUG,
        max_age=3600,
    )
    # Clear the auth_state cookie
    response.delete_cookie("auth_state")

    return response


@router.get("/logout")
async def logout(request: Request):
    """Clear session cookies and redirect to frontend."""
    response = RedirectResponse(url=settings.FRONTEND_URL)
    response.delete_cookie("auth_access_token")
    response.delete_cookie("auth_state")
    return response


from app.api.deps import get_current_user


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user's public profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_initial_admin=current_user.is_initial_admin,
        phone=current_user.phone,
        emergency_contact_name=current_user.emergency_contact_name,
        emergency_contact_phone=current_user.emergency_contact_phone,
        youth_protection_expiration=current_user.youth_protection_expiration,
        initial_setup_complete=current_user.initial_setup_complete,
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
    if contact_update.full_name is not None:
        current_user.full_name = contact_update.full_name
    if contact_update.phone is not None:
        current_user.phone = contact_update.phone
    if contact_update.emergency_contact_name is not None:
        current_user.emergency_contact_name = contact_update.emergency_contact_name
    if contact_update.emergency_contact_phone is not None:
        current_user.emergency_contact_phone = contact_update.emergency_contact_phone
    if contact_update.youth_protection_expiration is not None:
        current_user.youth_protection_expiration = contact_update.youth_protection_expiration
    
    # Mark initial setup as complete when contact info is saved
    current_user.initial_setup_complete = True

    await db.commit()
    await db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_initial_admin=current_user.is_initial_admin,
        phone=current_user.phone,
        emergency_contact_name=current_user.emergency_contact_name,
        emergency_contact_phone=current_user.emergency_contact_phone,
        youth_protection_expiration=current_user.youth_protection_expiration,
        initial_setup_complete=current_user.initial_setup_complete,
    )


@router.post("/me/initial-setup/complete", response_model=UserResponse)
async def mark_initial_setup_complete(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark the current user's initial setup as complete.
    """
    current_user.initial_setup_complete = True
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_initial_admin=current_user.is_initial_admin,
        phone=current_user.phone,
        emergency_contact_name=current_user.emergency_contact_name,
        emergency_contact_phone=current_user.emergency_contact_phone,
        youth_protection_expiration=current_user.youth_protection_expiration,
        initial_setup_complete=current_user.initial_setup_complete,
    )

@router.get("/token")
async def token_endpoint(request: Request):
    """Return the current access token from the HttpOnly cookie for compatibility with legacy frontend code.

    NOTE: This endpoint exposes the access token to JavaScript when called and should only be used
    as a compatibility shim while migrating the frontend to cookie-based session usage.
    """
    access_token = request.cookies.get("auth_access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return {"access_token": access_token}


from typing import List
from app.api.deps import get_current_admin_user
from app.schemas.auth import UserRoleUpdate
from app.crud import user as user_crud


@router.get("/users", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all users. Admin only.
    """
    users = await user_crud.get_users(db, skip=skip, limit=limit)
    return [
        UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_initial_admin=user.is_initial_admin,
            phone=user.phone,
            emergency_contact_name=user.emergency_contact_name,
            emergency_contact_phone=user.emergency_contact_phone,
            youth_protection_expiration=user.youth_protection_expiration,
            initial_setup_complete=user.initial_setup_complete,
        )
        for user in users
    ]


@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    role_update: UserRoleUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user's role. Admin only.
    """
    # Validate role
    valid_roles = ["admin", "outing-admin", "participant"]
    if role_update.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Get the user to update
    user = await user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent changing the initial admin's role
    if user.is_initial_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot change the role of the initial admin"
        )
    
    # Update the role
    user.role = role_update.role
    await db.commit()
    await db.refresh(user)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_initial_admin=user.is_initial_admin,
        phone=user.phone,
        emergency_contact_name=user.emergency_contact_name,
        emergency_contact_phone=user.emergency_contact_phone,
        youth_protection_expiration=user.youth_protection_expiration,
        initial_setup_complete=user.initial_setup_complete,
    )
