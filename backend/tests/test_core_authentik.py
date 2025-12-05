import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.core.authentik import AuthentikClient, _parse_display_name

def test_parse_display_name():
    """Test parsing display name"""
    assert _parse_display_name("John Doe") == ("John", "Doe")
    assert _parse_display_name("John") == ("John", None)
    assert _parse_display_name("John Middle Doe") == ("John", "Middle Doe")
    assert _parse_display_name(None) == (None, None)
    assert _parse_display_name("") == (None, None)

def test_get_role_from_groups():
    """Test role determination from groups"""
    client = AuthentikClient()
    
    assert client.get_role_from_groups(["trailhead-admins"]) == "admin"
    assert client.get_role_from_groups(["authentik Admins"]) == "admin"
    assert client.get_role_from_groups(["trailhead-outing-admins"]) == "outing-admin"
    assert client.get_role_from_groups(["some-other-group"]) == "participant"
    assert client.get_role_from_groups([]) == "participant"
    assert client.get_role_from_groups(["trailhead-outing-admins", "trailhead-admins"]) == "admin"

@pytest.mark.asyncio
async def test_get_openid_config():
    """Test fetching OpenID configuration"""
    mock_response_data = {
        "issuer": "https://authentik.example.com",
        "authorization_endpoint": "https://authentik.example.com/auth",
        "token_endpoint": "https://authentik.example.com/token"
    }
    
    # Mock the response object
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_response_data
    mock_response.raise_for_status = MagicMock()
    
    # Mock the client instance
    mock_client_instance = AsyncMock()
    mock_client_instance.get.return_value = mock_response
    
    # Mock the AsyncClient constructor to return the mock instance via context manager
    with patch("httpx.AsyncClient") as MockAsyncClient:
        MockAsyncClient.return_value.__aenter__.return_value = mock_client_instance
        
        client = AuthentikClient()
        config = await client.get_openid_config()
        
        assert config == mock_response_data
        assert client._openid_config == mock_response_data
        
        # Test caching
        await client.get_openid_config()
        # Should be called once because of caching, but we created a new client instance? 
        # No, client instance persists.
        # Wait, get_openid_config creates a NEW httpx.AsyncClient each time it fetches.
        # But if cached, it returns early.
        assert mock_client_instance.get.call_count == 1

@pytest.mark.asyncio
async def test_verify_token_symmetric():
    """Test verifying token with symmetric key (HS256)"""
    client = AuthentikClient()
    client.client_secret = "secret"
    client.client_id = "client_id"
    
    # Mock get_openid_config to return HS256
    client.get_openid_config = AsyncMock(return_value={"id_token_signing_alg_values_supported": ["HS256"]})
    
    # Create a token
    from jose import jwt
    token = jwt.encode({"sub": "user1", "aud": "client_id"}, "secret", algorithm="HS256")
    
    claims = await client.verify_token(token)
    assert claims["user_id"] == "user1"

@pytest.mark.asyncio
async def test_verify_token_asymmetric():
    """Test verifying token with asymmetric key (RS256)"""
    client = AuthentikClient()
    client.client_id = "client_id"
    
    # Mock get_openid_config to return RS256
    client.get_openid_config = AsyncMock(return_value={"id_token_signing_alg_values_supported": ["RS256"]})
    
    # Mock JWKS client
    mock_jwks_client = MagicMock()
    mock_signing_key = MagicMock()
    
    # Generate a real RSA key pair for testing would be better, but mocking the key object works if we mock jwt.decode too
    # But jwt.decode needs a real key or string.
    # Let's mock jwt.decode instead to avoid key generation complexity
    
    with patch("app.core.authentik.jwt.decode") as mock_decode:
        mock_decode.return_value = {
            "sub": "user1",
            "email": "user@example.com",
            "name": "User One",
            "groups": ["group1"]
        }
        
        client._jwks_client = mock_jwks_client
        mock_jwks_client.get_signing_key_from_jwt.return_value = mock_signing_key
        
        claims = await client.verify_token("dummy_token")
        
        assert claims["user_id"] == "user1"
        assert claims["email"] == "user@example.com"
