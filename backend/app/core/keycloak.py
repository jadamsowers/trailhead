"""
Keycloak OAuth/OIDC integration for authentication and user management.
"""
from typing import Optional, Dict, Any
from keycloak import KeycloakOpenID, KeycloakAdmin
from keycloak.exceptions import KeycloakError

from app.core.config import settings


class KeycloakClient:
    """Keycloak client wrapper for OAuth/OIDC operations"""
    
    def __init__(self):
        self.server_url = settings.KEYCLOAK_URL
        self.realm_name = settings.KEYCLOAK_REALM
        self.client_id = settings.KEYCLOAK_CLIENT_ID
        self.client_secret = settings.KEYCLOAK_CLIENT_SECRET
        
        # OpenID Connect client for token operations
        self.openid = KeycloakOpenID(
            server_url=self.server_url,
            client_id=self.client_id,
            realm_name=self.realm_name,
            client_secret_key=self.client_secret,
            verify=True
        )
        
        # Admin client for user management
        self.admin = KeycloakAdmin(
            server_url=self.server_url,
            username=settings.KEYCLOAK_ADMIN_USER,
            password=settings.KEYCLOAK_ADMIN_PASSWORD,
            realm_name=self.realm_name,
            verify=True
        )
    
    def get_authorization_url(self, redirect_uri: str, state: Optional[str] = None) -> str:
        """Get the authorization URL for OAuth flow"""
        return self.openid.auth_url(
            redirect_uri=redirect_uri,
            state=state or ""
        )
    
    def get_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens"""
        try:
            return self.openid.token(
                code=code,
                redirect_uri=redirect_uri
            )
        except KeycloakError as e:
            raise ValueError(f"Failed to exchange code for token: {str(e)}")
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        try:
            return self.openid.refresh_token(refresh_token)
        except KeycloakError as e:
            raise ValueError(f"Failed to refresh token: {str(e)}")
    
    def get_userinfo(self, token: str) -> Dict[str, Any]:
        """Get user information from access token"""
        try:
            return self.openid.userinfo(token)
        except KeycloakError as e:
            raise ValueError(f"Failed to get user info: {str(e)}")
    
    def introspect_token(self, token: str) -> Dict[str, Any]:
        """Introspect token to verify validity and get claims"""
        try:
            return self.openid.introspect(token)
        except KeycloakError as e:
            raise ValueError(f"Failed to introspect token: {str(e)}")
    
    def logout(self, refresh_token: str) -> None:
        """Logout user by invalidating refresh token"""
        try:
            self.openid.logout(refresh_token)
        except KeycloakError as e:
            # Logout might fail if token is already invalid, which is fine
            pass
    
    def create_user(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        roles: Optional[list[str]] = None
    ) -> str:
        """Create a new user in Keycloak"""
        try:
            user_id = self.admin.create_user({
                "email": email,
                "username": email,
                "firstName": first_name,
                "lastName": last_name,
                "enabled": True,
                "emailVerified": False,
                "credentials": [{
                    "type": "password",
                    "value": password,
                    "temporary": False
                }]
            })
            
            # Assign roles if provided
            if roles:
                realm_roles = []
                for role in roles:
                    try:
                        role_obj = self.admin.get_realm_role(role)
                        realm_roles.append(role_obj)
                    except KeycloakError:
                        pass  # Role doesn't exist, skip
                
                if realm_roles:
                    self.admin.assign_realm_roles(user_id, realm_roles)
            
            return user_id
        except KeycloakError as e:
            if "User exists" in str(e) or "already exists" in str(e).lower():
                raise ValueError("User with this email already exists")
            raise ValueError(f"Failed to create user: {str(e)}")
    
    def update_user(self, user_id: str, **kwargs) -> None:
        """Update user information"""
        try:
            self.admin.update_user(user_id, kwargs)
        except KeycloakError as e:
            raise ValueError(f"Failed to update user: {str(e)}")
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            users = self.admin.get_users({"email": email, "exact": True})
            return users[0] if users else None
        except KeycloakError:
            return None
    
    def delete_user(self, user_id: str) -> None:
        """Delete user from Keycloak"""
        try:
            self.admin.delete_user(user_id)
        except KeycloakError as e:
            raise ValueError(f"Failed to delete user: {str(e)}")
    
    def reset_password(self, user_id: str, new_password: str, temporary: bool = False) -> None:
        """Reset user password"""
        try:
            self.admin.set_user_password(user_id, new_password, temporary=temporary)
        except KeycloakError as e:
            raise ValueError(f"Failed to reset password: {str(e)}")


# Global Keycloak client instance
_keycloak_client: Optional[KeycloakClient] = None
_keycloak_initialized: bool = False


def get_keycloak_client() -> KeycloakClient:
    """Get or create Keycloak client instance"""
    global _keycloak_client, _keycloak_initialized
    
    if _keycloak_client is None and not _keycloak_initialized:
        try:
            _keycloak_client = KeycloakClient()
            _keycloak_initialized = True
        except Exception as e:
            # If Keycloak isn't available, raise a more helpful error
            raise RuntimeError(
                f"Keycloak is not available. Please ensure Keycloak is running and configured. Error: {str(e)}"
            )
    
    if _keycloak_client is None:
        raise RuntimeError("Keycloak client initialization failed")
    
    return _keycloak_client

