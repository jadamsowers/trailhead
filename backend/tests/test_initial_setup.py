import pytest
from httpx import AsyncClient
from app.api import deps


@pytest.mark.asyncio
async def test_initial_setup_flag_default_false(test_user):
    assert hasattr(test_user, "initial_setup_complete")
    assert test_user.initial_setup_complete is False


@pytest.mark.asyncio
async def test_mark_initial_setup_complete_endpoint(client: AsyncClient, test_user):
    from app.main import app

    async def override_get_current_user():
        return test_user

    app.dependency_overrides[deps.get_current_user] = override_get_current_user

    try:
        response = await client.post(
            "/api/clerk/me/initial-setup/complete",
            headers={"Authorization": "Bearer mock_token"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("initial_setup_complete") is True
    finally:
        app.dependency_overrides.clear()
