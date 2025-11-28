"""
Stack Auth authentication integration for the backend.
This module provides JWT verification for tokens issued by Stack Auth.
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
import jwt
from jwt import PyJWKClient
import httpx
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class StackAuthClient:
    """Stack Auth client wrapper for authentication operations"""

    def __init__(self):
        self.project_id = settings.STACK_PROJECT_ID
        self.secret_server_key = settings.STACK_SECRET_SERVER_KEY
        self.api_url = settings.STACK_API_URL
        self._jwks_client: Optional[PyJWKClient] = None

    @property
    def jwks_url(self) -> str:
        """Get the JWKS URL for Stack Auth"""
        return f"{self.api_url}/api/v1/projects/{self.project_id}/.well-known/jwks.json"

    @property
    def jwks_client(self) -> PyJWKClient:
        """Get or create JWKS client"""
        if self._jwks_client is None:
            self._jwks_client = PyJWKClient(self.jwks_url)
        return self._jwks_client

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify a Stack Auth session token and return the claims.

        Args:
            token: The session token from the Authorization header

        Returns:
            Dict containing user claims from the token

        Raises:
            HTTPException: If token is invalid or verification fails
        """
        try:
            # Check configuration
            if not self.project_id or self.project_id == "your_stack_project_id":
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Stack Auth project ID not configured. Please set STACK_PROJECT_ID in backend/.env"
                )

            if not self.secret_server_key or self.secret_server_key == "your_stack_secret_server_key":
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Stack Auth secret server key not configured. Please set STACK_SECRET_SERVER_KEY in backend/.env"
                )

            # Get signing key from JWKS
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)

            # Verify and decode the token
            # Stack Auth uses ES256 algorithm
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                audience=self.project_id,
                options={"verify_exp": True, "verify_iat": True, "leeway": 10}
            )

            return {
                "user_id": payload.get("sub"),
                "session_id": payload.get("sid"),
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

    async def get_user(self, user_id: str) -> Dict[str, Any]:
        """
        Get user information from Stack Auth via REST API.

        Args:
            user_id: The Stack Auth user ID

        Returns:
            Dict containing user information
        """
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "x-stack-access-type": "server",
                    "x-stack-project-id": self.project_id,
                    "x-stack-secret-server-key": self.secret_server_key,
                }
                response = await client.get(
                    f"{self.api_url}/api/v1/users/{user_id}",
                    headers=headers
                )

                if response.status_code != 200:
                    logger.error(f"Failed to get user from Stack Auth: {response.status_code}")
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="User not found in Stack Auth"
                    )

                user_data = response.json()
                # Extract primary email
                email = None
                if user_data.get("primary_email"):
                    email = user_data["primary_email"]
                elif user_data.get("contact_channels"):
                    for channel in user_data["contact_channels"]:
                        if channel.get("type") == "email" and channel.get("is_verified"):
                            email = channel.get("value")
                            break

                return {
                    "id": user_data.get("id"),
                    "email": email,
                    "display_name": user_data.get("display_name"),
                    "first_name": user_data.get("display_name", "").split(" ")[0] if user_data.get("display_name") else None,
                    "last_name": " ".join(user_data.get("display_name", "").split(" ")[1:]) if user_data.get("display_name") and " " in user_data.get("display_name", "") else None,
                    "full_name": user_data.get("display_name") or email,
                    "profile_image_url": user_data.get("profile_image_url"),
                    "created_at": user_data.get("signed_up_at_millis"),
                    "client_metadata": user_data.get("client_metadata", {}),
                    "server_metadata": user_data.get("server_metadata", {}),
                }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get user from Stack Auth: {type(e).__name__}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not found: {str(e)}"
            )

    async def get_user_metadata(self, user_id: str) -> Dict[str, Any]:
        """
        Get user metadata from Stack Auth.

        Args:
            user_id: The Stack Auth user ID

        Returns:
            Dict containing user metadata (client and server)
        """
        user_data = await self.get_user(user_id)
        return {
            "public_metadata": user_data.get("client_metadata", {}),
            "private_metadata": user_data.get("server_metadata", {}),
        }

    async def update_user_metadata(
        self,
        user_id: str,
        client_metadata: Optional[Dict[str, Any]] = None,
        server_metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Update user metadata in Stack Auth.

        Args:
            user_id: The Stack Auth user ID
            client_metadata: Public metadata to update
            server_metadata: Private/server metadata to update
        """
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "x-stack-access-type": "server",
                    "x-stack-project-id": self.project_id,
                    "x-stack-secret-server-key": self.secret_server_key,
                    "Content-Type": "application/json",
                }

                update_data = {}
                if client_metadata is not None:
                    update_data["client_metadata"] = client_metadata
                if server_metadata is not None:
                    update_data["server_metadata"] = server_metadata

                response = await client.patch(
                    f"{self.api_url}/api/v1/users/{user_id}",
                    headers=headers,
                    json=update_data
                )

                if response.status_code not in (200, 204):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to update user metadata: {response.text}"
                    )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update user metadata: {str(e)}"
            )


# Global Stack Auth client instance
_stackauth_client: Optional[StackAuthClient] = None


def get_stackauth_client() -> StackAuthClient:
    """Get or create Stack Auth client instance"""
    global _stackauth_client

    if _stackauth_client is None:
        _stackauth_client = StackAuthClient()

    return _stackauth_client
