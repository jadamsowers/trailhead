import pytest
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import troop as crud_troop
from app.schemas.troop import TroopCreate, TroopUpdate, PatrolCreate, PatrolUpdate


@pytest.mark.asyncio
class TestTroopCRUD:
    async def test_create_troop(self, db_session: AsyncSession):
        troop_in = TroopCreate(number="456", charter_org="Charter Org", meeting_location="Hall", meeting_day="Monday")
        troop = await crud_troop.create_troop(db_session, troop_in)
        assert troop.id is not None
        assert troop.number == "456"

    async def test_get_troops(self, db_session: AsyncSession, test_troop):
        troops = await crud_troop.get_troops(db_session)
        assert len(troops) >= 1

    async def test_update_troop(self, db_session: AsyncSession, test_troop):
        updated = await crud_troop.update_troop(db_session, test_troop.id, TroopUpdate(meeting_day="Wednesday"))
        assert updated.meeting_day == "Wednesday"

    async def test_delete_troop(self, db_session: AsyncSession, test_troop):
        success = await crud_troop.delete_troop(db_session, test_troop.id)
        assert success is True
        troops = await crud_troop.get_troops(db_session)
        # Deleted troop should not appear when only one existed
        assert all(t.id != test_troop.id for t in troops)


@pytest.mark.asyncio
class TestPatrolCRUD:
    async def test_create_patrol(self, db_session: AsyncSession, test_troop):
        patrol_in = PatrolCreate(troop_id=test_troop.id, name="Wolf Patrol")
        patrol = await crud_troop.create_patrol(db_session, patrol_in)
        assert patrol.id is not None
        assert patrol.troop_id == test_troop.id

    async def test_get_patrols(self, db_session: AsyncSession, test_troop, test_patrol):
        patrols = await crud_troop.get_patrols_by_troop(db_session, test_troop.id)
        assert len(patrols) >= 1

    async def test_update_patrol(self, db_session: AsyncSession, test_patrol):
        updated = await crud_troop.update_patrol(db_session, test_patrol.id, PatrolUpdate(name="Phoenix Patrol"))
        assert updated.name == "Phoenix Patrol"

    async def test_delete_patrol(self, db_session: AsyncSession, test_patrol):
        success = await crud_troop.delete_patrol(db_session, test_patrol.id)
        assert success is True
