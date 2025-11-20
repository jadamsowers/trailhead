"""Tests for api/endpoints/auth.py"""
import pytest
from httpx import AsyncClient

from app.core.security import get_password_hash


@pytest.mark.asyncio
class TestLogin:
    """Test login endpoint"""
    
    async def test_login_success(self, client: AsyncClient, test_user):
        """Test successful login"""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "admin@test.com",
                "password": "testpassword123",
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == "admin@test.com"
        assert data["user"]["role"] == "admin"
    
    async def test_login_wrong_password(self, client: AsyncClient, test_user):
        """Test login with wrong password"""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "admin@test.com",
                "password": "wrongpassword",
            },
        )
        
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]
    
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with non-existent user"""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "password123",
            },
        )
        
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]
    
    async def test_login_inactive_user(self, client: AsyncClient, db_session):
        """Test login with inactive user"""
        from app.models.user import User
        
        # Create inactive user
        inactive_user = User(
            email="inactive@test.com",
            hashed_password=get_password_hash("password123"),
            full_name="Inactive User",
            role="admin",
            is_active=False,
        )
        db_session.add(inactive_user)
        await db_session.commit()
        
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "inactive@test.com",
                "password": "password123",
            },
        )
        
        assert response.status_code == 403
        assert "inactive" in response.json()["detail"].lower()
    
    async def test_login_missing_email(self, client: AsyncClient):
        """Test login with missing email"""
        response = await client.post(
            "/api/auth/login",
            json={
                "password": "password123",
            },
        )
        
        assert response.status_code == 422
    
    async def test_login_missing_password(self, client: AsyncClient):
        """Test login with missing password"""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "admin@test.com",
            },
        )
        
        assert response.status_code == 422
    
    async def test_login_returns_user_info(self, client: AsyncClient, test_user):
        """Test login returns complete user information"""
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "admin@test.com",
                "password": "testpassword123",
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        user = data["user"]
        assert user["id"] == str(test_user.id)
        assert user["email"] == test_user.email
        assert user["full_name"] == test_user.full_name
        assert user["role"] == test_user.role


@pytest.mark.asyncio
class TestGetCurrentUser:
    """Test get current user endpoint"""
    
    async def test_get_current_user_success(self, client: AsyncClient, auth_headers, test_user):
        """Test getting current user with valid token"""
        response = await client.get(
            "/api/auth/me",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_user.id)
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert data["role"] == test_user.role
    
    async def test_get_current_user_no_token(self, client: AsyncClient):
        """Test getting current user without token"""
        response = await client.get("/api/auth/me")
        
        assert response.status_code == 403
    
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token"""
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        
        assert response.status_code == 401
    
    async def test_get_current_user_malformed_header(self, client: AsyncClient):
        """Test getting current user with malformed auth header"""
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "InvalidFormat token"},
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestLogout:
    """Test logout endpoint"""
    
    async def test_logout_success(self, client: AsyncClient, auth_headers):
        """Test successful logout"""
        response = await client.post(
            "/api/auth/logout",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "logged out" in data["message"].lower()
    
    async def test_logout_no_token(self, client: AsyncClient):
        """Test logout without token"""
        response = await client.post("/api/auth/logout")
        
        assert response.status_code == 403
    
    async def test_logout_invalid_token(self, client: AsyncClient):
        """Test logout with invalid token"""
        response = await client.post(
            "/api/auth/logout",
            headers={"Authorization": "Bearer invalid_token"},
        )
        
        assert response.status_code == 401


@pytest.mark.asyncio
class TestAuthenticationFlow:
    """Test complete authentication flow"""
    
    async def test_full_auth_flow(self, client: AsyncClient, test_user):
        """Test complete authentication flow: login -> access protected endpoint -> logout"""
        # Step 1: Login
        login_response = await client.post(
            "/api/auth/login",
            json={
                "email": "admin@test.com",
                "password": "testpassword123",
            },
        )
        
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Step 2: Access protected endpoint
        me_response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert me_response.status_code == 200
        assert me_response.json()["email"] == "admin@test.com"
        
        # Step 3: Logout
        logout_response = await client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        assert logout_response.status_code == 200
    
    async def test_token_reuse_after_logout(self, client: AsyncClient, test_user):
        """Test that token can still be used after logout (stateless JWT)"""
        # Login
        login_response = await client.post(
            "/api/auth/login",
            json={
                "email": "admin@test.com",
                "password": "testpassword123",
            },
        )
        
        token = login_response.json()["access_token"]
        
        # Logout
        await client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        # Try to use token again (should still work since JWT is stateless)
        me_response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        
        # Token should still be valid until it expires
        assert me_response.status_code == 200