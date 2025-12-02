"""
Authentik authentication integration for the backend.
This module provides JWT verification for tokens issued by Authentik via OIDC.
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
import jwt
from jwt import PyJWKClient
import httpx
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def _parse_display_name(display_name: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """Parse display name into first and last name components."""
    if not display_name:
        return None, None
    parts = display_name.strip().split(" ", 1)
    first_name = parts[0] if parts else None
    last_name = parts[1] if len(parts) > 1 else None
    return first_name, last_name


class AuthentikConfigurationError(Exception):
    """Raised when Authentik is not properly configured."""
    pass


class AuthentikClient:
    """Authentik client wrapper for authentication operations"""

    def __init__(self):
        self.authentik_url = settings.AUTHENTIK_URL
        self.client_id = settings.AUTHENTIK_CLIENT_ID
        self.client_secret = settings.AUTHENTIK_CLIENT_SECRET
        self._jwks_client: Optional[PyJWKClient] = None
        self._openid_config: Optional[Dict[str, Any]] = None
        
        # Validate configuration on initialization
        self._validate_configuration()

    async def get_openid_config(self) -> Dict[str, Any]:
        """
        Fetch and cache the OpenID Connect discovery document for the
        configured application (trailhead).
        """
        if self._openid_config is not None:
            return self._openid_config

        url = f"{self.authentik_url}/application/o/trailhead/.well-known/openid-configuration"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, timeout=10)
                resp.raise_for_status()
                self._openid_config = resp.json()
        except Exception as e:
            logger.error(f"Failed to fetch OpenID configuration from {url}: {type(e).__name__} {e}")
            raise

        return self._openid_config

    def _validate_configuration(self) -> None:
        """Validate Authentik configuration at startup."""
        if not self.client_id:
            logger.warning("Authentik client ID not configured. Please set AUTHENTIK_CLIENT_ID in backend/.env")
        
        if not self.client_secret:
            logger.warning("Authentik client secret not configured. Please set AUTHENTIK_CLIENT_SECRET in backend/.env")

    def _check_configuration(self) -> None:
        """Check if Authentik is properly configured, raise HTTP error if not."""
        if not self.client_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication service not configured"
            )

    @property
    def openid_config_url(self) -> str:
        """Get the OpenID Connect configuration URL"""
        return f"{self.authentik_url}/application/o/trailhead/.well-known/openid-configuration"

    @property
    def jwks_url(self) -> str:
        """Get the JWKS URL for Authentik"""
        return f"{self.authentik_url}/application/o/trailhead/jwks/"

    @property
    def userinfo_url(self) -> str:
        """Get the userinfo endpoint URL"""
        return f"{self.authentik_url}/application/o/userinfo/"

    @property
    def jwks_client(self) -> PyJWKClient:
        """Get or create JWKS client"""
        if self._jwks_client is None:
            self._jwks_client = PyJWKClient(self.jwks_url)
        return self._jwks_client

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify an Authentik OIDC access token and return the claims.

        Args:
            token: The access token from the Authorization header

        Returns:
            Dict containing user claims from the token

        Raises:
            HTTPException: If token is invalid or verification fails
        """
        try:
            # Check configuration
            self._check_configuration()

            # Try to determine signing algorithm from discovery. If the
            # provider signs ID tokens with a symmetric algorithm (HS*),
            # use the client secret as the HMAC key. Otherwise, fetch the
            # JWKS and verify with the public key (RS*).
            try:
                discovery = await self.get_openid_config()
                algs = discovery.get("id_token_signing_alg_values_supported") or ["RS256"]
                alg = algs[0]
            except Exception:
                alg = "RS256"

            if alg.startswith("HS") and self.client_secret:
                # Symmetric HMAC-signed tokens (use client secret)
                payload = jwt.decode(
                    token,
                    self.client_secret,
                    algorithms=[alg],
                    audience=self.client_id,
                    options={"verify_exp": True, "verify_iat": True, "leeway": 10},
                )
            else:
                # Asymmetric signing (JWKS)
                signing_key = self.jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256"],
                    audience=self.client_id,
                    options={"verify_exp": True, "verify_iat": True, "leeway": 10},
                )

            return {
                "user_id": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name"),
                "preferred_username": payload.get("preferred_username"),
                "groups": payload.get("groups", []),
                "claims": payload
            }
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {type(e).__name__}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Token verification failed: {type(e).__name__}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token verification failed"
            )

    async def get_user_info(self, token: str) -> Dict[str, Any]:
        """
        Get user information from Authentik userinfo endpoint.

        Args:
            token: The access token

        Returns:
            Dict containing user information
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.userinfo_url,
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10,
                )

                if response.status_code == 200:
                    user_data = response.json()
                    # Parse display name into first/last name
                    first_name, last_name = _parse_display_name(user_data.get("name"))

                    return {
                        "id": user_data.get("sub"),
                        "email": user_data.get("email"),
                        "email_verified": user_data.get("email_verified", False),
                        "display_name": user_data.get("name"),
                        "first_name": first_name,
                        "last_name": last_name,
                        "full_name": user_data.get("name") or user_data.get("email"),
                        "preferred_username": user_data.get("preferred_username"),
                        "groups": user_data.get("groups", []),
                    }

                # If userinfo returns not found or unauthorized, try token introspection
                logger.info(f"Userinfo returned {response.status_code}; attempting introspection")

                # Fetch discovery to get introspection endpoint
                discovery = await self.get_openid_config()
                introspect_url = discovery.get("introspection_endpoint")
                if not introspect_url:
                    logger.error("No introspection endpoint available in discovery")
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found in Authentik")

                # Use client credentials via post (client_secret_post) per discovery
                introspect_data = {"token": token, "token_type_hint": "access_token", "client_id": self.client_id, "client_secret": self.client_secret}
                introspect_resp = await client.post(introspect_url, data=introspect_data, timeout=10)
                if introspect_resp.status_code != 200:
                    logger.error(f"Introspection failed: {introspect_resp.status_code}")
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found in Authentik")

                introspect_json = introspect_resp.json()
                if not introspect_json.get("active"):
                    logger.error("Token introspection indicates token is not active")
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found in Authentik")

                # Build a user-like structure from introspection claims where possible
                user_data = {
                    "sub": introspect_json.get("sub") or introspect_json.get("username"),
                    "email": introspect_json.get("email"),
                    "name": introspect_json.get("name") or introspect_json.get("preferred_username"),
                    "preferred_username": introspect_json.get("preferred_username"),
                    "groups": introspect_json.get("groups", []),
                }

                first_name, last_name = _parse_display_name(user_data.get("name"))

                return {
                    "id": user_data.get("sub"),
                    "email": user_data.get("email"),
                    "email_verified": introspect_json.get("email_verified", False),
                    "display_name": user_data.get("name"),
                    "first_name": first_name,
                    "last_name": last_name,
                    "full_name": user_data.get("name") or user_data.get("email"),
                    "preferred_username": user_data.get("preferred_username"),
                    "groups": user_data.get("groups", []),
                }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get user from Authentik: {type(e).__name__}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not found: {str(e)}"
            )

    def get_role_from_groups(self, groups: list[str]) -> str:
        """
        Determine user role based on Authentik groups.
        
        Args:
            groups: List of group names the user belongs to
            
        Returns:
            Role string: 'admin', 'outing-admin', or 'participant'
        """
        # Check for admin group
        if "trailhead-admins" in groups or "authentik Admins" in groups:
            return "admin"
        # Check for outing admin group
        if "trailhead-outing-admins" in groups:
            return "outing-admin"
        # Default to participant
        return "participant"


# Global Authentik client instance
_authentik_client: Optional[AuthentikClient] = None


def get_authentik_client() -> AuthentikClient:
    """Get or create Authentik client instance"""
    global _authentik_client

    if _authentik_client is None:
        _authentik_client = AuthentikClient()

    return _authentik_client
