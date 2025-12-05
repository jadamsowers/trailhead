import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi import HTTPException
import jwt as pyjwt

from app.core import authentik
from app.core.authentik import AuthentikClient, _parse_display_name, get_authentik_client


def test_properties_and_jwks_client_creation():
    client = AuthentikClient()
    # Basic URL properties
    assert client.openid_config_url.endswith("/.well-known/openid-configuration")
    assert client.jwks_url.endswith("/jwks/")
    assert client.userinfo_url.endswith("/userinfo/")

    # Patch PyJWKClient to ensure jwks_client property constructs it
    with patch("app.core.authentik.PyJWKClient") as MockPyJWK:
        # Clear existing jwks client
        client._jwks_client = None
        _ = client.jwks_client
        MockPyJWK.assert_called_with(client.jwks_url)


def test_check_configuration_raises_when_missing():
    client = AuthentikClient()
    client.client_id = None
    with pytest.raises(HTTPException) as exc:
        client._check_configuration()
    assert exc.value.status_code == 500


@pytest.mark.asyncio
async def test_verify_token_raises_expired_and_invalid():
    client = AuthentikClient()
    client.client_id = "cid"

    # Simulate expired token by having jwt.decode raise ExpiredSignatureError
    with patch("app.core.authentik.jwt.decode") as mock_decode:
        mock_decode.side_effect = pyjwt.ExpiredSignatureError("expired")
        with pytest.raises(HTTPException) as exc:
            await client.verify_token("tok")
        assert exc.value.status_code == 401

    # Simulate invalid token
    with patch("app.core.authentik.jwt.decode") as mock_decode2:
        mock_decode2.side_effect = pyjwt.InvalidTokenError("invalid")
        with pytest.raises(HTTPException) as exc2:
            await client.verify_token("tok")
        assert exc2.value.status_code == 401


@pytest.mark.asyncio
async def test_get_user_info_userinfo_and_introspection_flows():
    client = AuthentikClient()
    # Prepare a successful userinfo response
    userinfo = {"sub": "u1", "email": "u@example.com", "name": "Jane Doe", "preferred_username": "jane"}

    mock_resp_userinfo = MagicMock()
    mock_resp_userinfo.status_code = 200
    mock_resp_userinfo.json.return_value = userinfo

    # Patch AsyncClient used in get_user_info
    mock_client_instance = AsyncMock()
    mock_client_instance.get.return_value = mock_resp_userinfo

    with patch("httpx.AsyncClient") as MockAsyncClient:
        MockAsyncClient.return_value.__aenter__.return_value = mock_client_instance
        result = await client.get_user_info("token123")

    assert result["id"] == "u1"
    assert result["first_name"] == "Jane"
    assert result["last_name"] == "Doe"

    # Now simulate userinfo failure and introspection path
    mock_resp_userinfo2 = MagicMock()
    mock_resp_userinfo2.status_code = 404
    mock_resp_userinfo2.json.return_value = {}

    # Discovery with introspection endpoint
    discovery = {"introspection_endpoint": "https://auth/introspect"}

    # Introspection response active
    introspect_resp = MagicMock()
    introspect_resp.status_code = 200
    introspect_resp.json.return_value = {"active": True, "sub": "u2", "preferred_username": "other", "email": "o@example.com"}

    mock_client_instance2 = AsyncMock()
    mock_client_instance2.get.return_value = mock_resp_userinfo2
    mock_client_instance2.post.return_value = introspect_resp

    with patch("httpx.AsyncClient") as MockAsyncClient2:
        MockAsyncClient2.return_value.__aenter__.return_value = mock_client_instance2
        # Patch get_openid_config to return discovery
        client.get_openid_config = AsyncMock(return_value=discovery)
        res = await client.get_user_info("tokenX")

    assert res["id"] == "u2"
    assert res["email"] == "o@example.com"

    # Introspection inactive should raise
    introspect_resp_inactive = MagicMock()
    introspect_resp_inactive.status_code = 200
    introspect_resp_inactive.json.return_value = {"active": False}

    mock_client_instance3 = AsyncMock()
    mock_client_instance3.get.return_value = mock_resp_userinfo2
    mock_client_instance3.post.return_value = introspect_resp_inactive

    with patch("httpx.AsyncClient") as MockAsyncClient3:
        MockAsyncClient3.return_value.__aenter__.return_value = mock_client_instance3
        client.get_openid_config = AsyncMock(return_value=discovery)
        with pytest.raises(HTTPException):
            await client.get_user_info("tokenY")


def test_get_authentik_client_singleton():
    # Ensure get_authentik_client returns the same instance
    a = get_authentik_client()
    b = get_authentik_client()
    assert a is b
