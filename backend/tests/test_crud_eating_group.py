import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud import eating_group as crud_eating_group
from app.schemas.eating_group import EatingGroupCreate, EatingGroupUpdate
from app.models.eating_group import EatingGroup
from app.models.outing import Outing
from app.models.participant import Participant
from app.models.signup import Signup
import uuid

@pytest.mark.asyncio
async def test_create_eating_group(db_session: AsyncSession, test_outing: Outing):
    """Test creating a new eating group"""
    group_in = EatingGroupCreate(
        name="Test Patrol",
        outing_id=test_outing.id
    )
    group = await crud_eating_group.create_eating_group(db_session, eating_group_in=group_in)
    
    assert group.name == "Test Patrol"
    assert group.outing_id == test_outing.id
    assert group.id is not None

@pytest.mark.asyncio
async def test_get_eating_group(db_session: AsyncSession, test_outing: Outing):
    """Test retrieving an eating group by ID"""
    group_in = EatingGroupCreate(
        name="Test Patrol 2",
        outing_id=test_outing.id
    )
    created_group = await crud_eating_group.create_eating_group(db_session, eating_group_in=group_in)
    
    fetched_group = await crud_eating_group.get_eating_group(db_session, eating_group_id=created_group.id)
    assert fetched_group is not None
    assert fetched_group.id == created_group.id
    assert fetched_group.name == created_group.name

@pytest.mark.asyncio
async def test_update_eating_group(db_session: AsyncSession, test_outing: Outing):
    """Test updating an eating group"""
    group_in = EatingGroupCreate(
        name="Original Name",
        outing_id=test_outing.id
    )
    group = await crud_eating_group.create_eating_group(db_session, eating_group_in=group_in)
    
    update_in = EatingGroupUpdate(name="Updated Name")
    updated_group = await crud_eating_group.update_eating_group(
        db_session, eating_group_id=group.id, eating_group_in=update_in
    )
    
    assert updated_group.name == "Updated Name"
    assert updated_group.id == group.id

@pytest.mark.asyncio
async def test_delete_eating_group(db_session: AsyncSession, test_outing: Outing):
    """Test deleting an eating group"""
    group_in = EatingGroupCreate(
        name="To Delete",
        outing_id=test_outing.id
    )
    group = await crud_eating_group.create_eating_group(db_session, eating_group_in=group_in)
    
    await crud_eating_group.delete_eating_group(db_session, eating_group_id=group.id)
    
    fetched_group = await crud_eating_group.get_eating_group(db_session, eating_group_id=group.id)
    assert fetched_group is None

@pytest.mark.asyncio
async def test_add_participant_to_group(
    db_session: AsyncSession, 
    test_outing: Outing,
    test_participant: Participant
):
    """Test adding a participant to an eating group"""
    group_in = EatingGroupCreate(
        name="Patrol with Members",
        outing_id=test_outing.id
    )
    group = await crud_eating_group.create_eating_group(db_session, eating_group_in=group_in)
    
    # Need to use EatingGroupMemberCreate schema if the CRUD expects it?
    # No, crud.add_member_to_eating_group expects EatingGroupMemberCreate
    from app.schemas.eating_group import EatingGroupMemberCreate
    member_in = EatingGroupMemberCreate(
        participant_id=test_participant.id,
        is_grubmaster=False
    )
    
    member = await crud_eating_group.add_member_to_eating_group(
        db_session, 
        eating_group_id=group.id, 
        member_in=member_in
    )
    
    assert member.eating_group_id == group.id
    assert member.participant_id == test_participant.id
    
    # Verify via relationship (need to refresh group or fetch members)
    # Expunge group to force fresh fetch with relationships
    db_session.expunge(group)
    group_refreshed = await crud_eating_group.get_eating_group(db_session, eating_group_id=group.id)
    assert len(group_refreshed.members) == 1
    assert group_refreshed.members[0].participant_id == test_participant.id

@pytest.mark.asyncio
async def test_remove_participant_from_group(
    db_session: AsyncSession, 
    test_outing: Outing,
    test_participant: Participant
):
    """Test removing a participant from an eating group"""
    group_in = EatingGroupCreate(
        name="Patrol to Empty",
        outing_id=test_outing.id
    )
    group = await crud_eating_group.create_eating_group(db_session, eating_group_in=group_in)
    
    from app.schemas.eating_group import EatingGroupMemberCreate
    member_in = EatingGroupMemberCreate(
        participant_id=test_participant.id,
        is_grubmaster=False
    )
    
    await crud_eating_group.add_member_to_eating_group(
        db_session, 
        eating_group_id=group.id, 
        member_in=member_in
    )
    
    await crud_eating_group.remove_member_from_eating_group(
        db_session,
        participant_id=test_participant.id
    )
    
    db_session.expunge(group)
    group_refreshed = await crud_eating_group.get_eating_group(db_session, eating_group_id=group.id)
    assert len(group_refreshed.members) == 0

@pytest.mark.asyncio
async def test_get_eating_groups_by_outing(db_session: AsyncSession, test_outing: Outing):
    """Test retrieving all eating groups for an outing"""
    group1 = await crud_eating_group.create_eating_group(
        db_session, eating_group_in=EatingGroupCreate(name="Group 1", outing_id=test_outing.id)
    )
    group2 = await crud_eating_group.create_eating_group(
        db_session, eating_group_in=EatingGroupCreate(name="Group 2", outing_id=test_outing.id)
    )
    
    groups = await crud_eating_group.get_eating_groups_by_outing(db_session, outing_id=test_outing.id)
    assert len(groups) >= 2
    group_ids = [g.id for g in groups]
    assert group1.id in group_ids
    assert group2.id in group_ids
