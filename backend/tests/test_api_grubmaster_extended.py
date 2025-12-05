import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4


@pytest.mark.asyncio
async def test_get_grubmaster_summary_not_found(authenticated_client):
    fake_id = uuid4()
    response = await authenticated_client.get(f"/api/outings/{fake_id}/grubmaster")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_move_participant_target_group_not_found(authenticated_client):
    """If target eating group is missing, endpoint should return 404"""
    fake_outing_id = uuid4()
    fake_target = uuid4()

    # Patch outing exists but target group not found
    with patch("app.api.endpoints.grubmaster.crud_outing.get_outing", new=AsyncMock(return_value=MagicMock(id=fake_outing_id, name="O", food_budget_per_person=None, restricted_troop_id=None))):
        with patch("app.api.endpoints.grubmaster.crud_eating_group.get_eating_group", new=AsyncMock(return_value=None)):
            payload = {"participant_id": str(uuid4()), "target_eating_group_id": str(fake_target), "is_grubmaster": False}
            resp = await authenticated_client.post(f"/api/outings/{fake_outing_id}/move-participant", json=payload)
            assert resp.status_code == 404


@pytest.mark.asyncio
async def test_set_participant_grubmaster_not_in_group(authenticated_client):
    fake_outing_id = uuid4()
    participant_id = uuid4()

    # Patch set_grubmaster to return False -> participant not in group
    with patch("app.api.endpoints.grubmaster.crud_eating_group.set_grubmaster", new=AsyncMock(return_value=False)):
        resp = await authenticated_client.post(f"/api/outings/{fake_outing_id}/set-grubmaster?participant_id={participant_id}&is_grubmaster=true")
        assert resp.status_code == 404
