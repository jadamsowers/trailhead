"""Tests for api/endpoints/clerk_auth.py"""
import pytest
from httpx import AsyncClient
from uuid import uuid4
from app.api import deps


@pytest.mark.asyncio
class TestGetCurrentUser:
    """Test GET /api/clerk/me endpoint"""
    
    async def test_get_current_user_success(self, client: AsyncClient, test_user):
        """Test getting current user with mocked authentication"""
        from app.main import app
        
        # Mock the get_current_user dependency
        async def override_get_current_user():
            return test_user
        
        app.dependency_overrides[deps.get_current_user] = override_get_current_user
        
        try:
            response = await client.get(
                "/api/clerk/me",
                headers={"Authorization": "Bearer mock_token"},
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == str(test_user.id)
            assert data["email"] == test_user.email
            assert data["full_name"] == test_user.full_name
            assert data["role"] == test_user.role
        finally:
            app.dependency_overrides.clear()
    
    async def test_get_current_user_no_token(self, client: AsyncClient):
        """Test getting current user without token"""
        response = await client.get("/api/clerk/me")
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestUpdateContactInfo:
    """Test PATCH /api/clerk/me/contact endpoint"""
    
    async def test_update_contact_info_success(self, client: AsyncClient, test_user):
        """Test updating contact information"""
        from app.main import app
        
        async def override_get_current_user():
            return test_user
        
        app.dependency_overrides[deps.get_current_user] = override_get_current_user
        
        try:
            update_data = {
                "phone": "555-9999",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_phone": "555-8888",
                "youth_protection_expiration": "2025-12-31"
            }
            
            response = await client.patch(
                "/api/clerk/me/contact",
                headers={"Authorization": "Bearer mock_token"},
                json=update_data,
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["phone"] == "555-9999"
            assert data["emergency_contact_name"] == "Emergency Contact"
            assert data["emergency_contact_phone"] == "555-8888"
            assert data["youth_protection_expiration"] == "2025-12-31"
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
class TestListUsers:
    """Test GET /api/clerk/users endpoint (admin only)"""
    
    async def test_list_users_as_admin(self, client: AsyncClient, test_user, test_regular_user):
        """Test listing users as admin"""
        from app.main import app
        
        async def override_get_current_user():
            return test_user
        
        async def override_get_current_admin():
            return test_user
        
        app.dependency_overrides[deps.get_current_user] = override_get_current_user
        app.dependency_overrides[deps.get_current_admin_user] = override_get_current_admin
        
        try:
            response = await client.get(
                "/api/clerk/users",
                headers={"Authorization": "Bearer mock_token"},
            )
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) >= 2
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
class TestUpdateUserRole:
    """Test PATCH /api/clerk/users/{user_id}/role endpoint (admin only)"""
    
    async def test_update_user_role_success(self, client: AsyncClient, test_user, test_regular_user):
        """Test updating a user's role as admin"""
        from app.main import app
        
        async def override_get_current_admin():
            return test_user
        
        app.dependency_overrides[deps.get_current_admin_user] = override_get_current_admin
        
        try:
            response = await client.patch(
                f"/api/clerk/users/{test_regular_user.id}/role",
                headers={"Authorization": "Bearer mock_token"},
                json={"role": "adult"},
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["role"] == "adult"
            assert data["id"] == str(test_regular_user.id)
        finally:
            app.dependency_overrides.clear()
    
    async def test_update_user_role_invalid_role(self, client: AsyncClient, test_user, test_regular_user):
        """Test updating user role with invalid role"""
        from app.main import app
        
        async def override_get_current_admin():
            return test_user
        
        app.dependency_overrides[deps.get_current_admin_user] = override_get_current_admin
        
        try:
            response = await client.patch(
                f"/api/clerk/users/{test_regular_user.id}/role",
                headers={"Authorization": "Bearer mock_token"},
                json={"role": "superadmin"},
            )
            
            assert response.status_code == 400
            assert "Invalid role" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    async def test_update_user_role_user_not_found(self, client: AsyncClient, test_user):
        """Test updating role for non-existent user"""
        from app.main import app
        
        async def override_get_current_admin():
            return test_user
        
        app.dependency_overrides[deps.get_current_admin_user] = override_get_current_admin
        
        try:
            response = await client.patch(
                f"/api/clerk/users/{uuid4()}/role",
                headers={"Authorization": "Bearer mock_token"},
                json={"role": "adult"},
            )
            
            assert response.status_code == 404
            assert "User not found" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    async def test_update_user_role_demote_initial_admin(self, client: AsyncClient, test_user):
        """Test attempting to demote the initial admin"""
        from app.main import app
        
        # Set user as initial admin
        test_user.is_initial_admin = True
        
        async def override_get_current_admin():
            return test_user
        
        app.dependency_overrides[deps.get_current_admin_user] = override_get_current_admin
        
        try:
            response = await client.patch(
                f"/api/clerk/users/{test_user.id}/role",
                headers={"Authorization": "Bearer mock_token"},
                json={"role": "adult"},
            )
            
            assert response.status_code == 403
            assert "Cannot demote the initial admin user" in response.json()["detail"]
        finally:
            test_user.is_initial_admin = False
            app.dependency_overrides.clear()


@pytest.mark.asyncio
class TestSyncUserRole:
    """Test POST /api/clerk/sync-role endpoint"""

    async def test_sync_user_role_success(self, client: AsyncClient, test_user, mocker):
        """Test syncing user role from Clerk"""
        from app.main import app
        
        async def override_get_current_user():
            return test_user
        
        app.dependency_overrides[deps.get_current_user] = override_get_current_user
        
        # Mock Clerk client
        mock_clerk = mocker.Mock()
        mock_clerk.get_user_metadata = mocker.AsyncMock(return_value={
            "public_metadata": {"role": "admin"}
        })
        
        mocker.patch("app.api.endpoints.clerk_auth.get_clerk_client", return_value=mock_clerk)
        
        try:
            response = await client.post(
                "/api/clerk/sync-role",
                headers={"Authorization": "Bearer mock_token"},
            )
            
            assert response.status_code == 200
            assert response.json()["role"] == "admin"
            assert test_user.role == "admin"
        finally:
            app.dependency_overrides.clear()

    async def test_sync_user_role_default(self, client: AsyncClient, test_user, mocker):
        """Test syncing user role defaults to user if invalid/missing"""
        from app.main import app
        
        async def override_get_current_user():
            return test_user
        
        app.dependency_overrides[deps.get_current_user] = override_get_current_user
        
        # Mock Clerk client with invalid role
        mock_clerk = mocker.Mock()
        mock_clerk.get_user_metadata = mocker.AsyncMock(return_value={
            "public_metadata": {"role": "superadmin"}
        })
        
        mocker.patch("app.api.endpoints.clerk_auth.get_clerk_client", return_value=mock_clerk)
        
        try:
            response = await client.post(
                "/api/clerk/sync-role",
                headers={"Authorization": "Bearer mock_token"},
            )
            
            assert response.status_code == 200
            assert response.json()["role"] == "user"
            assert test_user.role == "user"
        finally:
            app.dependency_overrides.clear()

    async def test_sync_user_role_error(self, client: AsyncClient, test_user, mocker):
        """Test error handling when Clerk sync fails"""
        from app.main import app
        
        async def override_get_current_user():
            return test_user
        
        app.dependency_overrides[deps.get_current_user] = override_get_current_user
        
        # Mock Clerk client raising exception
        mock_clerk = mocker.Mock()
        mock_clerk.get_user_metadata = mocker.AsyncMock(side_effect=Exception("Clerk error"))
        
        mocker.patch("app.api.endpoints.clerk_auth.get_clerk_client", return_value=mock_clerk)
        
        try:
            response = await client.post(
                "/api/clerk/sync-role",
                headers={"Authorization": "Bearer mock_token"},
            )
            
            assert response.status_code == 500
            assert "Failed to fetch role from Clerk" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

