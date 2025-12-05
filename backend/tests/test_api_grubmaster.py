import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.outing import Outing
from app.models.participant import Participant
from app.models.eating_group import EatingGroup

@pytest.mark.asyncio
async def test_get_grubmaster_summary(
    authenticated_client: AsyncClient,
    test_outing: Outing,
    test_participant: Participant,
    db_session: AsyncSession
):
    """Test getting grubmaster summary for an outing"""
    # Create an eating group
    from app.crud import eating_group as crud_eating_group
    from app.schemas.eating_group import EatingGroupCreate, EatingGroupMemberCreate
    
    group = await crud_eating_group.create_eating_group(
        db_session, 
        eating_group_in=EatingGroupCreate(name="Test Group", outing_id=test_outing.id)
    )
    
    # Add participant to group
    await crud_eating_group.add_member_to_eating_group(
        db_session,
        eating_group_id=group.id,
        member_in=EatingGroupMemberCreate(participant_id=test_participant.id)
    )
    
    response = await authenticated_client.get(f"/api/outings/{test_outing.id}/grubmaster")
    assert response.status_code == 200
    data = response.json()
    
    assert data["outing_id"] == str(test_outing.id)
    assert len(data["eating_groups"]) == 1
    assert data["eating_groups"][0]["id"] == str(group.id)
    assert len(data["participants"]) >= 1

@pytest.mark.asyncio
async def test_auto_assign_groups(
    authenticated_client: AsyncClient,
    test_outing: Outing,
    db_session: AsyncSession
):
    """Test auto-assigning participants to groups"""
    # Ensure we have some unassigned participants
    # (test_outing fixture might not have enough, but we can test the call)
    
    payload = {
        "group_size_min": 2,
        "group_size_max": 6,
        "keep_patrols_together": True,
        "group_by_dietary": True
    }
    
    response = await authenticated_client.post(
        f"/api/outings/{test_outing.id}/auto-assign",
        json=payload
    )
    
    # It might return 200 even if no groups created if not enough participants
    assert response.status_code == 200
    data = response.json()
    assert "total" in data

@pytest.mark.asyncio
async def test_send_eating_group_emails(
    authenticated_client: AsyncClient,
    test_outing: Outing,
    db_session: AsyncSession
):
    """Test generating eating group emails"""
    # This endpoint returns email data, doesn't actually send in dev/test usually?
    # Or it calls send_email which we should mock.
    # But let's see if it runs.
    
    # We need at least one group
    from app.crud import eating_group as crud_eating_group
    from app.schemas.eating_group import EatingGroupCreate
    
    group = await crud_eating_group.create_eating_group(
        db_session, 
        eating_group_in=EatingGroupCreate(name="Email Group", outing_id=test_outing.id)
    )
    
    payload = {
        "eating_group_ids": [str(group.id)],
        "include_budget_info": True,
        "include_dietary_info": True,
        "custom_message": "Hello"
    }
    
    response = await authenticated_client.post(
        f"/api/outings/{test_outing.id}/send-eating-group-emails",
        json=payload
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "groups" in data
    assert len(data["groups"]) == 1
    assert data["groups"][0]["eating_group_id"] == str(group.id)

@pytest.mark.asyncio
async def test_create_eating_group_api(
    authenticated_client: AsyncClient,
    test_outing: Outing
):
    """Test creating an eating group via API"""
    payload = {
        "outing_id": str(test_outing.id),
        "name": "API Created Group",
        "notes": "Created via API"
    }
    
    response = await authenticated_client.post(f"/api/outings/{test_outing.id}/eating-groups", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "API Created Group"
    assert data["outing_id"] == str(test_outing.id)

@pytest.mark.asyncio
async def test_update_eating_group_api(
    authenticated_client: AsyncClient,
    test_outing: Outing,
    db_session: AsyncSession
):
    """Test updating an eating group via API"""
    from app.crud import eating_group as crud_eating_group
    from app.schemas.eating_group import EatingGroupCreate
    
    group = await crud_eating_group.create_eating_group(
        db_session, 
        eating_group_in=EatingGroupCreate(name="To Update", outing_id=test_outing.id)
    )
    
    payload = {
        "name": "Updated via API",
        "notes": "Updated notes"
    }
    
    response = await authenticated_client.put(f"/api/outings/{test_outing.id}/eating-groups/{group.id}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated via API"
    assert data["notes"] == "Updated notes"

@pytest.mark.asyncio
async def test_delete_eating_group_api(
    authenticated_client: AsyncClient,
    test_outing: Outing,
    db_session: AsyncSession
):
    """Test deleting an eating group via API"""
    from app.crud import eating_group as crud_eating_group
    from app.schemas.eating_group import EatingGroupCreate
    
    group = await crud_eating_group.create_eating_group(
        db_session, 
        eating_group_in=EatingGroupCreate(name="To Delete API", outing_id=test_outing.id)
    )
    
    response = await authenticated_client.delete(f"/api/outings/{test_outing.id}/eating-groups/{group.id}")
    assert response.status_code == 204
    
    # Verify deletion
    fetched = await crud_eating_group.get_eating_group(db_session, group.id)
    assert fetched is None
