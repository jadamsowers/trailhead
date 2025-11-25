"""Tests for app/core/clerk.py"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from fastapi import HTTPException
from app.core.clerk import ClerkClient, get_clerk_client
from app.core.config import settings

@pytest.fixture
def mock_clerk_sdk():
    with patch("app.core.clerk.Clerk") as mock:
        yield mock

@pytest.fixture
def mock_jwt_decode():
    with patch("app.core.clerk.jwt.decode") as mock:
        yield mock

@pytest.fixture
def mock_jwk_client():
    with patch("app.core.clerk.PyJWKClient") as mock:
        yield mock

class TestClerkClient:
    """Test ClerkClient class"""

    def test_init(self, mock_clerk_sdk):
        """Test initialization"""
        client = ClerkClient()
        assert client.secret_key == settings.CLERK_SECRET_KEY
        mock_clerk_sdk.assert_called_once_with(bearer_auth=settings.CLERK_SECRET_KEY)

    @pytest.mark.asyncio
    async def test_verify_token_success(self, mock_clerk_sdk, mock_jwt_decode, mock_jwk_client):
        """Test successful token verification"""
        client = ClerkClient()
        token = "valid_token"
        
        # Mock unverified decode to get issuer
        mock_jwt_decode.side_effect = [
            {"iss": "https://clerk.example.com", "sub": "user_123"},  # First call (unverified)
            {"sub": "user_123", "sid": "sess_123"}  # Second call (verified)
        ]
        
        # Mock JWK client
        mock_jwk_instance = Mock()
        mock_jwk_client.return_value = mock_jwk_instance
        mock_signing_key = Mock()
        mock_signing_key.key = "public_key"
        mock_jwk_instance.get_signing_key_from_jwt.return_value = mock_signing_key
        
        result = await client.verify_token(token)
        
        assert result["user_id"] == "user_123"
        assert result["session_id"] == "sess_123"
        
        # Verify calls
        mock_jwk_client.assert_called_with("https://clerk.example.com/.well-known/jwks.json")
        mock_jwk_instance.get_signing_key_from_jwt.assert_called_with(token)

    @pytest.mark.asyncio
    async def test_verify_token_missing_issuer(self, mock_clerk_sdk, mock_jwt_decode):
        """Test token verification with missing issuer"""
        client = ClerkClient()
        token = "invalid_token"
        
        mock_jwt_decode.return_value = {}  # No issuer
        
        with pytest.raises(HTTPException) as exc:
            await client.verify_token(token)
        
        assert exc.value.status_code == 401
        assert "Token missing issuer claim" in exc.value.detail

    @pytest.mark.asyncio
    async def test_verify_token_expired(self, mock_clerk_sdk, mock_jwt_decode):
        """Test expired token verification"""
        import jwt
        client = ClerkClient()
        token = "expired_token"
        
        mock_jwt_decode.side_effect = [
            {"iss": "https://clerk.example.com"},
            jwt.ExpiredSignatureError("Signature has expired")
        ]
        
        # We need to mock PyJWKClient too since it's called before the second decode
        with patch("app.core.clerk.PyJWKClient"):
            with pytest.raises(HTTPException) as exc:
                await client.verify_token(token)
            
            assert exc.value.status_code == 401
            assert "Token has expired" in exc.value.detail

    @pytest.mark.asyncio
    async def test_get_user_success(self, mock_clerk_sdk):
        """Test getting user info"""
        client = ClerkClient()
        
        # Mock Clerk SDK response
        mock_user = Mock()
        mock_user.id = "user_123"
        mock_user.email_addresses = [Mock(email_address="test@example.com")]
        mock_user.first_name = "Test"
        mock_user.last_name = "User"
        mock_user.image_url = "http://image.url"
        mock_user.created_at = 1234567890
        mock_user.updated_at = 1234567890
        
        client.client.users.get.return_value = mock_user
        
        result = await client.get_user("user_123")
        
        assert result["id"] == "user_123"
        assert result["email"] == "test@example.com"
        assert result["full_name"] == "Test User"
        
        client.client.users.get.assert_called_with(user_id="user_123")

    @pytest.mark.asyncio
    async def test_get_user_not_found(self, mock_clerk_sdk):
        """Test getting non-existent user"""
        client = ClerkClient()
        
        client.client.users.get.side_effect = Exception("Not found")
        
        with pytest.raises(HTTPException) as exc:
            await client.get_user("user_123")
        
        assert exc.value.status_code == 404
        assert "User not found" in exc.value.detail

    @pytest.mark.asyncio
    async def test_get_user_metadata_success(self, mock_clerk_sdk):
        """Test getting user metadata"""
        client = ClerkClient()
        
        mock_user = Mock()
        mock_user.public_metadata = {"role": "admin"}
        mock_user.private_metadata = {"internal_id": 1}
        mock_user.unsafe_metadata = {}
        
        client.client.users.get.return_value = mock_user
        
        result = await client.get_user_metadata("user_123")
        
        assert result["public_metadata"] == {"role": "admin"}
        assert result["private_metadata"] == {"internal_id": 1}

    @pytest.mark.asyncio
    async def test_update_user_metadata_success(self, mock_clerk_sdk):
        """Test updating user metadata"""
        client = ClerkClient()
        
        await client.update_user_metadata(
            "user_123",
            public_metadata={"role": "user"},
            private_metadata={"checked": True}
        )
        
        client.client.users.update.assert_called_with(
            user_id="user_123",
            public_metadata={"role": "user"},
            private_metadata={"checked": True}
        )

    @pytest.mark.asyncio
    async def test_update_user_metadata_error(self, mock_clerk_sdk):
        """Test error updating user metadata"""
        client = ClerkClient()
        
        client.client.users.update.side_effect = Exception("Update failed")
        
        with pytest.raises(HTTPException) as exc:
            await client.update_user_metadata("user_123", public_metadata={})
        
        assert exc.value.status_code == 400
        assert "Failed to update user metadata" in exc.value.detail

def test_get_clerk_client_singleton():
    """Test get_clerk_client returns singleton"""
    # Reset global
    import app.core.clerk
    app.core.clerk._clerk_client = None
    
    with patch("app.core.clerk.Clerk"):
        client1 = get_clerk_client()
        client2 = get_clerk_client()
        
        assert client1 is client2
        assert isinstance(client1, ClerkClient)
