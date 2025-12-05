import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import status
from app.core.config import settings
from app.models.user import User
from uuid import uuid4

@pytest.mark.asyncio
class TestAuth:
    """Tests for auth endpoints"""

    async def test_login_redirect(self, client: AsyncClient):
        """Test login endpoint redirects to Authentik"""
        with patch('app.api.endpoints.auth.get_authentik_client') as mock_get_client, \
             patch('app.api.endpoints.auth.get_http_client') as mock_get_http_client, \
             patch('app.api.endpoints.auth.settings') as mock_settings:
            
            # Mock settings to avoid URL rewriting
            mock_settings.AUTHENTIK_EXTERNAL_URL = None
            mock_settings.AUTHENTIK_CLIENT_ID = "test_client_id"
            
            mock_authentik = AsyncMock()
            mock_authentik.openid_config_url = "http://test-authentik/config"
            mock_get_client.return_value = mock_authentik

            # Mock httpx client instance
            mock_http_client = AsyncMock()
            
            # Setup async context manager
            mock_client_context = MagicMock()
            mock_client_context.__aenter__ = AsyncMock(return_value=mock_http_client)
            mock_client_context.__aexit__ = AsyncMock(return_value=None)
            mock_get_http_client.return_value = mock_client_context
            
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "authorization_endpoint": "http://test-authentik/authorize"
            }
            mock_http_client.get.return_value = mock_response

            response = await client.get("/api/auth/login", follow_redirects=False)
            
            assert response.status_code == 307
            assert "location" in response.headers
            assert "http://test-authentik/authorize" in response.headers["location"]
            assert "response_type=code" in response.headers["location"]
            assert "client_id=" in response.headers["location"]
            
            # Verify state cookie set
            assert "auth_state" in response.cookies

    async def test_callback_success(self, client: AsyncClient, db_session):
        """Test successful callback processing"""
        state = "test_state"
        code = "test_code"
        
        # Set state cookie
        client.cookies.set("auth_state", state)
        
        with patch('app.api.endpoints.auth.get_authentik_client') as mock_get_client, \
             patch('app.api.endpoints.auth.get_http_client') as mock_get_http_client, \
             patch('app.api.endpoints.auth.settings') as mock_settings:
            
            mock_settings.AUTHENTIK_CLIENT_ID = "test_client_id"
            mock_settings.AUTHENTIK_CLIENT_SECRET = "test_client_secret"
            mock_settings.FRONTEND_URL = "http://localhost:3000"
            
            mock_authentik = AsyncMock()
            mock_authentik.openid_config_url = "http://test-authentik/config"
            # Mock verify_token to return user data
            mock_authentik.verify_token.return_value = {
                "user_id": "new_user_id",
                "email": "newuser@test.com",
                "name": "New User",
                "groups": ["participant_group"]
            }
            # Mock get_role_from_groups - it is synchronous!
            mock_authentik.get_role_from_groups = MagicMock(return_value="participant")
            mock_get_client.return_value = mock_authentik

            # Mock httpx client instance
            mock_http_client = AsyncMock()
            
            # Setup async context manager
            mock_client_context = MagicMock()
            mock_client_context.__aenter__ = AsyncMock(return_value=mock_http_client)
            mock_client_context.__aexit__ = AsyncMock(return_value=None)
            mock_get_http_client.return_value = mock_client_context
            
            # Discovery response
            mock_discovery = MagicMock()
            mock_discovery.status_code = 200
            mock_discovery.json.return_value = {
                "token_endpoint": "http://test-authentik/token"
            }
            
            # Token response
            mock_token = MagicMock()
            mock_token.status_code = 200
            mock_token.json.return_value = {
                "access_token": "valid_access_token",
                "id_token": "valid_id_token"
            }
            
            # Configure side effects for get and post
            mock_http_client.get.return_value = mock_discovery
            mock_http_client.post.return_value = mock_token

            response = await client.get(
                f"/api/auth/callback?code={code}&state={state}",
                follow_redirects=False
            )
            
            assert response.status_code == 307
            assert response.headers["location"] == settings.FRONTEND_URL
            assert "auth_access_token" in response.cookies
            assert "auth_state" not in response.cookies # Should be cleared
            
            # Verify user created in DB
            from sqlalchemy import select
            result = await db_session.execute(select(User).where(User.email == "newuser@test.com"))
            user = result.scalar_one_or_none()
            assert user is not None
            assert user.full_name == "New User"
            assert user.role == "participant"

    async def test_logout(self, client: AsyncClient):
        """Test logout clears cookies"""
        client.cookies.set("auth_access_token", "some_token")
        
        response = await client.get("/api/auth/logout", follow_redirects=False)
        
        assert response.status_code == 307
        assert "auth_access_token" not in response.cookies

    async def test_me_endpoint(self, client: AsyncClient, auth_headers, test_user):
        """Test getting current user profile"""
        response = await client.get("/api/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == str(test_user.id)

    async def test_update_contact_info(self, client: AsyncClient, auth_headers, test_user):
        """Test updating contact info"""
        update_data = {
            "full_name": "Updated Name",
            "phone": "555-9999",
            "emergency_contact_name": "Emergency Contact",
            "emergency_contact_phone": "555-1111"
        }
        
        response = await client.patch(
            "/api/auth/me/contact",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"
        assert data["phone"] == "555-9999"
        assert data["initial_setup_complete"] is True

    async def test_mark_initial_setup_complete(self, client: AsyncClient, auth_headers):
        """Test marking initial setup as complete"""
        response = await client.post(
            "/api/auth/me/initial-setup/complete",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["initial_setup_complete"] is True

    async def test_get_users_admin(self, client: AsyncClient, auth_headers):
        """Test getting users list as admin"""
        response = await client.get("/api/auth/users", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_get_users_forbidden(self, client: AsyncClient, regular_user_headers):
        """Test getting users list as non-admin"""
        response = await client.get("/api/auth/users", headers=regular_user_headers)
        
        assert response.status_code == 403

    async def test_update_user_role(self, client: AsyncClient, auth_headers, db_session):
        """Test updating user role as admin"""
        # Create a target user
        target_user = User(
            email="target@test.com",
            full_name="Target User",
            role="participant",
            is_active=True,
            hashed_password=""
        )
        db_session.add(target_user)
        await db_session.commit()
        
        response = await client.patch(
            f"/api/auth/users/{target_user.id}/role",
            headers=auth_headers,
            json={"role": "outing-admin"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "outing-admin"

    async def test_update_user_role_forbidden(self, client: AsyncClient, regular_user_headers, test_user):
        """Test updating user role as non-admin"""
        response = await client.patch(
            f"/api/auth/users/{test_user.id}/role",
            headers=regular_user_headers,
            json={"role": "admin"}
        )
        
        assert response.status_code == 403
