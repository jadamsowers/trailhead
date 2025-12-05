import pytest
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.exc import IntegrityError

from app.api import deps
from app.models.user import User
from app.core.config import settings

@pytest.mark.asyncio
class TestGetCurrentUserExtended:
    """Extended tests for get_current_user dependency"""

    async def test_get_current_user_from_cookie(self, db_session):
        """Test getting token from cookie when header is missing"""
        request = MagicMock(spec=Request)
        request.cookies = {"auth_access_token": "cookie_token"}
        
        with patch('app.api.deps.get_authentik_client') as mock_authentik:
            mock_client = AsyncMock()
            mock_client.verify_token.return_value = {
                "user_id": "cookie_user",
                "email": "cookie@test.com",
                "name": "Cookie User",
                "groups": []
            }
            mock_client.get_role_from_groups.return_value = "participant"
            mock_authentik.return_value = mock_client
            
            user = await deps.get_current_user(None, db_session, request)
            
            assert user.email == "cookie@test.com"
            assert user.full_name == "Cookie User"

    async def test_get_current_user_no_token(self, db_session):
        """Test error when no token is provided in header or cookie"""
        request = MagicMock(spec=Request)
        request.cookies = {}
        
        with pytest.raises(HTTPException) as exc_info:
            await deps.get_current_user(None, db_session, request)
        
        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert exc_info.value.detail == "Not authenticated"

    async def test_get_current_user_email_fallback(self, db_session):
        """Test fallback to userinfo endpoint when email missing in token"""
        token = "valid_token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        
        with patch('app.api.deps.get_authentik_client') as mock_authentik:
            mock_client = AsyncMock()
            # Token verify returns no email
            mock_client.verify_token.return_value = {
                "user_id": "no_email_id",
                "name": "No Email User",
                "groups": []
            }
            # Userinfo returns email
            mock_client.get_user_info.return_value = {
                "email": "fallback@test.com"
            }
            mock_client.get_role_from_groups.return_value = "participant"
            mock_authentik.return_value = mock_client
            
            user = await deps.get_current_user(credentials, db_session)
            
            assert user.email == "fallback@test.com"
            mock_client.get_user_info.assert_called_once_with(token)

    async def test_get_current_user_no_email_anywhere(self, db_session):
        """Test error when email is missing in both token and userinfo"""
        token = "valid_token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        
        with patch('app.api.deps.get_authentik_client') as mock_authentik:
            mock_client = AsyncMock()
            mock_client.verify_token.return_value = {
                "user_id": "no_email_id",
                "groups": []
            }
            mock_client.get_user_info.return_value = {}
            mock_authentik.return_value = mock_client
            
            with pytest.raises(HTTPException) as exc_info:
                await deps.get_current_user(credentials, db_session)
            
            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert exc_info.value.detail == "Email not found in token"

    async def test_get_current_user_race_condition(self, db_session):
        """Test handling of race condition during user creation"""
        token = "race_token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        email = "race@test.com"
        
        with patch('app.api.deps.get_authentik_client') as mock_authentik:
            mock_client = AsyncMock()
            mock_client.verify_token.return_value = {
                "user_id": "race_id",
                "email": email,
                "name": "Race User",
                "groups": []
            }
            mock_client.get_role_from_groups.return_value = "participant"
            mock_authentik.return_value = mock_client
            
            # Mock db.commit to raise IntegrityError (simulating race condition)
            # We need to patch the session's commit method specifically for this test
            original_commit = db_session.commit
            
            async def mock_commit_side_effect():
                # First call raises error
                if mock_commit.call_count == 1:
                    # Create the user "behind the scenes" to simulate another request doing it
                    user = User(email=email, full_name="Race User", role="participant", is_active=True, hashed_password="")
                    db_session.add(user)
                    await original_commit()
                    raise IntegrityError("statement", "params", "orig")
                return None

            mock_commit = AsyncMock(side_effect=mock_commit_side_effect)
            
            # We can't easily patch the instance method of the session passed in fixture
            # So we'll rely on the logic: if commit fails, it rolls back and queries again
            
            # Actually, let's mock the db session object itself to control behavior precisely
            mock_db = AsyncMock()
            # First query returns None
            mock_db.execute.side_effect = [
                MagicMock(scalar_one_or_none=lambda: None), # First check
                MagicMock(scalar_one_or_none=lambda: User(email=email, role="participant", is_active=True)) # Second check after rollback
            ]
            mock_db.commit.side_effect = Exception("Race condition")
            
            user = await deps.get_current_user(credentials, mock_db)
            
            assert user.email == email
            assert mock_db.rollback.called

    async def test_get_current_user_initial_admin(self, db_session):
        """Test initial admin creation logic"""
        email = settings.INITIAL_ADMIN_EMAIL
        token = "admin_token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        
        with patch('app.api.deps.get_authentik_client') as mock_authentik:
            mock_client = AsyncMock()
            mock_client.verify_token.return_value = {
                "user_id": "admin_id",
                "email": email,
                "name": "Admin User",
                "groups": []
            }
            mock_authentik.return_value = mock_client
            
            user = await deps.get_current_user(credentials, db_session)
            
            assert user.email == email
            assert user.role == "admin"
            assert user.is_initial_admin is True

    async def test_get_current_user_role_update(self, db_session):
        """Test role update from Authentik groups"""
        # Create existing user with 'participant' role
        user = User(email="update@test.com", full_name="Update User", role="participant", is_active=True, hashed_password="")
        db_session.add(user)
        await db_session.commit()
        
        token = "update_token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        
        with patch('app.api.deps.get_authentik_client') as mock_authentik:
            mock_client = AsyncMock()
            mock_client.verify_token.return_value = {
                "user_id": "update_id",
                "email": "update@test.com",
                "name": "Update User",
                "groups": ["admin_group"]
            }
            # Simulate Authentik returning 'admin' role based on groups
            mock_client.get_role_from_groups.return_value = "admin"
            mock_authentik.return_value = mock_client
            
            updated_user = await deps.get_current_user(credentials, db_session)
            
            assert updated_user.role == "admin"

    async def test_get_current_user_role_update_coroutine(self, db_session):
        """Test role update when get_role_from_groups returns a coroutine"""
        # Create existing user with 'participant' role
        user = User(email="async@test.com", full_name="Async User", role="participant", is_active=True, hashed_password="")
        db_session.add(user)
        await db_session.commit()
        
        token = "async_token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        
        with patch('app.api.deps.get_authentik_client') as mock_authentik:
            mock_client = AsyncMock()
            mock_client.verify_token.return_value = {
                "user_id": "async_id",
                "email": "async@test.com",
                "name": "Async User",
                "groups": ["admin_group"]
            }
            
            # Simulate coroutine return
            async def async_role():
                return "admin"
            
            # We need get_role_from_groups to be a MagicMock (sync) that returns a coroutine
            # because AsyncMock would wrap the return value in another coroutine
            mock_client.get_role_from_groups = MagicMock(return_value=async_role())
            mock_authentik.return_value = mock_client
            
            updated_user = await deps.get_current_user(credentials, db_session)
            
            assert updated_user.role == "admin"

    async def test_get_current_user_general_exception(self, db_session):
        """Test general exception handling"""
        token = "error_token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        
        with patch('app.api.deps.get_authentik_client') as mock_authentik:
            mock_client = AsyncMock()
            mock_client.verify_token.side_effect = Exception("Unexpected error")
            mock_authentik.return_value = mock_client
            
            with pytest.raises(HTTPException) as exc_info:
                await deps.get_current_user(credentials, db_session)
            
            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Could not validate credentials" in exc_info.value.detail
