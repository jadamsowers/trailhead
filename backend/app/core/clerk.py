"""
Clerk authentication integration for the backend.
"""
from typing import Optional, Dict, Any
from clerk_backend_api import Clerk
from fastapi import Request, HTTPException, status
import jwt
from jwt import PyJWKClient

from app.core.config import settings


class ClerkClient:
    """Clerk client wrapper for authentication operations"""
    
    def __init__(self):
        self.secret_key = settings.CLERK_SECRET_KEY
        self.client = Clerk(bearer_auth=self.secret_key)
    
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify a Clerk session token and return the claims.
        
        Args:
            token: The session token from the Authorization header
            
        Returns:
            Dict containing user claims from the token
            
        Raises:
            HTTPException: If token is invalid or verification fails
        """
        try:
            # Get the JWKS URL from Clerk
            # Extract the publishable key to get the instance ID
            if not settings.CLERK_PUBLISHABLE_KEY or settings.CLERK_PUBLISHABLE_KEY == "pk_test_your_clerk_publishable_key_here":
                print("❌ ERROR: Clerk publishable key not configured properly!")
                print("   Please set CLERK_PUBLISHABLE_KEY in your backend/.env file")
                print("   Get your keys from: https://dashboard.clerk.com")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Clerk publishable key not configured. Please set CLERK_PUBLISHABLE_KEY in backend/.env"
                )
            
            if not settings.CLERK_SECRET_KEY or settings.CLERK_SECRET_KEY == "sk_test_your_clerk_secret_key_here":
                print("❌ ERROR: Clerk secret key not configured properly!")
                print("   Please set CLERK_SECRET_KEY in your backend/.env file")
                print("   Get your keys from: https://dashboard.clerk.com")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Clerk secret key not configured. Please set CLERK_SECRET_KEY in backend/.env"
                )
            
            # Decode the token to get the issuer (iss) claim which contains the frontend API URL
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            issuer = unverified_payload.get("iss")
            
            if not issuer:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token missing issuer claim"
                )
            
            # Construct JWKS URL from issuer
            # Issuer format: https://<clerk-instance>.clerk.accounts.dev
            jwks_url = f"{issuer}/.well-known/jwks.json"
            
            # Get JWKS from Clerk
            jwks_client = PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            
            # Verify and decode the token
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_exp": True}
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
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(e)}"
            )
    
    async def get_user(self, user_id: str) -> Dict[str, Any]:
        """
        Get user information from Clerk.
        
        Args:
            user_id: The Clerk user ID
            
        Returns:
            Dict containing user information
        """
        try:
            user = self.client.users.get(user_id=user_id)
            return {
                "id": user.id,
                "email": user.email_addresses[0].email_address if user.email_addresses else None,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "full_name": f"{user.first_name or ''} {user.last_name or ''}".strip(),
                "image_url": user.image_url,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not found: {str(e)}"
            )
    
    async def get_user_metadata(self, user_id: str) -> Dict[str, Any]:
        """
        Get user metadata (public and private) from Clerk.
        
        Args:
            user_id: The Clerk user ID
            
        Returns:
            Dict containing user metadata
        """
        try:
            user = self.client.users.get(user_id=user_id)
            return {
                "public_metadata": user.public_metadata or {},
                "private_metadata": user.private_metadata or {},
                "unsafe_metadata": user.unsafe_metadata or {},
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User metadata not found: {str(e)}"
            )
    
    async def update_user_metadata(
        self,
        user_id: str,
        public_metadata: Optional[Dict[str, Any]] = None,
        private_metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Update user metadata in Clerk.
        
        Args:
            user_id: The Clerk user ID
            public_metadata: Public metadata to update
            private_metadata: Private metadata to update
        """
        try:
            update_data = {}
            if public_metadata is not None:
                update_data["public_metadata"] = public_metadata
            if private_metadata is not None:
                update_data["private_metadata"] = private_metadata
            
            self.client.users.update(user_id=user_id, **update_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update user metadata: {str(e)}"
            )


# Global Clerk client instance
_clerk_client: Optional[ClerkClient] = None


def get_clerk_client() -> ClerkClient:
    """Get or create Clerk client instance"""
    global _clerk_client
    
    if _clerk_client is None:
        _clerk_client = ClerkClient()
    
    return _clerk_client