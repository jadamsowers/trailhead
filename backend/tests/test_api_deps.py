"""Tests for API dependencies"""
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from unittest.mock import AsyncMock, patch

from app.api import deps
from app.models.user import User


@pytest.mark.asyncio
class TestGetDB:
    """Test database dependency"""
    
    async def test_get_db_yields_session(self):
        """Test that get_db yields a database session"""
        generator = deps.get_db()
        
        # Get the session
        session = await generator.__anext__()
        
        assert session is not None
        
        # Cleanup
        try:
            await generator.__anext__()
        except StopAsyncIteration:
            pass


@pytest.mark.asyncio
class TestGetCurrentUser:
    """Test current user dependency"""
    
    async def test_get_current_user_valid_token(self, db_session, test_user):
        """Test getting current user with valid token"""
        from app.core.security import create_access_token
        
        # Create valid token
        token = create_access_token({"sub": test_user.email})
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        
        # Mock Stack Auth client
        with patch('app.api.deps.get_stackauth_client') as mock_stackauth:
            mock_client = AsyncMock()
            mock_client.verify_token.return_value = {"user_id": "stackauth_test_id"}
            mock_client.get_user.return_value = {
                "email": test_user.email,
                "full_name": test_user.full_name
            }
            mock_stackauth.return_value = mock_client
            
            user = await deps.get_current_user(credentials, db_session)
            
            assert user is not None
            assert user.email == test_user.email
    
    async def test_get_current_user_invalid_token(self, db_session):
        """Test getting current user with invalid token"""
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid_token")
        
        with patch('app.api.deps.get_stackauth_client') as mock_stackauth:
            mock_client = AsyncMock()
            mock_client.verify_token.side_effect = Exception("Invalid token")
            mock_stackauth.return_value = mock_client
            
            with pytest.raises(HTTPException) as exc_info:
                await deps.get_current_user(credentials, db_session)
            
            assert exc_info.value.status_code == 401
    
    async def test_get_current_user_creates_new_user(self, db_session):
        """Test that get_current_user creates new user if they don't exist"""
        from app.core.security import create_access_token
        
        # Create token for non-existent user
        token = create_access_token({"sub": "newuser@test.com"})
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        
        with patch('app.api.deps.get_stackauth_client') as mock_stackauth:
            mock_client = AsyncMock()
            mock_client.verify_token.return_value = {"user_id": "stackauth_new_user"}
            mock_client.get_user.return_value = {
                "email": "newuser@test.com",
                "full_name": "New User"
            }
            mock_client.get_user_metadata.return_value = {"public_metadata": {}}
            mock_stackauth.return_value = mock_client
            
            user = await deps.get_current_user(credentials, db_session)
            
            assert user.email == "newuser@test.com"
            assert user.full_name == "New User"
    
    async def test_get_current_user_inactive(self, db_session):
        """Test that inactive user is rejected"""
        from app.core.security import create_access_token
        
        # Create inactive user
        inactive_user = User(
            email="inactive@test.com",
            full_name="Inactive User",
            role="user",
            is_active=False,
            hashed_password=""
        )
        db_session.add(inactive_user)
        await db_session.commit()
        
        token = create_access_token({"sub": inactive_user.email})
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        
        with patch('app.api.deps.get_stackauth_client') as mock_stackauth:
            mock_client = AsyncMock()
            mock_client.verify_token.return_value = {"user_id": "stackauth_inactive"}
            mock_client.get_user.return_value = {
                "email": inactive_user.email,
                "full_name": inactive_user.full_name
            }
            mock_stackauth.return_value = mock_client
            
            with pytest.raises(HTTPException) as exc_info:
                await deps.get_current_user(credentials, db_session)
            
            assert exc_info.value.status_code == 403


@pytest.mark.asyncio
class TestGetCurrentAdminUser:
    """Test admin user dependency"""
    
    async def test_get_current_admin_user_success(self):
        """Test getting admin user when user is admin"""
        # Create a mock admin user without database
        admin_user = User(
            email="admin@test.com",
            full_name="Admin User",
            role="admin",
            is_active=True,
            hashed_password=""
        )
        
        user = await deps.get_current_admin_user(admin_user)
        
        assert user == admin_user
        assert user.role == "admin"
    
    async def test_get_current_admin_user_not_admin(self):
        """Test getting admin user when user is not admin"""
        # Create a mock regular user without database
        regular_user = User(
            email="user@test.com",
            full_name="Regular User",
            role="user",
            is_active=True,
            hashed_password=""
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await deps.get_current_admin_user(regular_user)
        
        assert exc_info.value.status_code == 403
        assert "Not enough permissions" in str(exc_info.value.detail)


@pytest.mark.asyncio
class TestGetCurrentOutingAdminUser:
    """Test outing admin user dependency"""
    
    async def test_get_current_outing_admin_user_admin(self):
        """Test getting outing admin when user is admin"""
        admin_user = User(
            email="admin@test.com",
            full_name="Admin User",
            role="admin",
            is_active=True,
            hashed_password=""
        )
        
        user = await deps.get_current_outing_admin_user(admin_user)
        
        assert user == admin_user
        assert user.role == "admin"
    
    async def test_get_current_outing_admin_user_outing_admin(self):
        """Test getting outing admin when user is outing-admin"""
        outing_admin = User(
            email="outingadmin@test.com",
            full_name="Outing Admin",
            role="outing-admin",
            is_active=True,
            hashed_password=""
        )
        
        user = await deps.get_current_outing_admin_user(outing_admin)
        
        assert user == outing_admin
        assert user.role == "outing-admin"
    
    async def test_get_current_outing_admin_user_not_admin(self):
        """Test getting outing admin when user is not admin or outing-admin"""
        regular_user = User(
            email="user@test.com",
            full_name="Regular User",
            role="user",
            is_active=True,
            hashed_password=""
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await deps.get_current_outing_admin_user(regular_user)
        
        assert exc_info.value.status_code == 403
        assert "Not enough permissions" in str(exc_info.value.detail)
    
    async def test_get_current_outing_admin_user_participant_role(self):
        """Test getting outing admin when user has participant role"""
        participant = User(
            email="participant@test.com",
            full_name="Participant User",
            role="participant",
            is_active=True,
            hashed_password=""
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await deps.get_current_outing_admin_user(participant)
        
        assert exc_info.value.status_code == 403
