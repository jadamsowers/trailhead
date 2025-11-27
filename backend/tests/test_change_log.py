import asyncio
from uuid import uuid4
from datetime import datetime

from app.services.change_log import record_change, compute_payload_hash
from app.models.change_log import ChangeLog
from app.models.outing import Outing
from app.crud.outing import create_outing, update_outing, delete_outing
from app.schemas.outing import OutingCreate, OutingUpdate
from app.db.session import AsyncSessionLocal

async def _setup_outing(db):
    outing_in = OutingCreate(
        name="Sync Test Outing",
        outing_date=datetime.utcnow().date(),
        end_date=None,
        location="Test Location",
        description="",
        max_participants=10,
        capacity_type="fixed",
        is_overnight=False,
    )
    outing = await create_outing(db, outing_in)
    return outing

async def test_change_log_version_increment():
    async with AsyncSessionLocal() as db:
        # Create outing (logs create)
        outing = await _setup_outing(db)

        # Fetch change log entries for outing
        from sqlalchemy import select
        result = await db.execute(select(ChangeLog).where(ChangeLog.entity_id == outing.id).order_by(ChangeLog.version))
        rows = result.scalars().all()
        assert len(rows) >= 1, "Expected at least one change log row after create"
        assert rows[-1].op_type == "create"
        first_version = rows[-1].version

        # Update outing
        upd = OutingUpdate(location="New Location")
        updated = await update_outing(db, outing.id, upd)
        result2 = await db.execute(select(ChangeLog).where(ChangeLog.entity_id == outing.id).order_by(ChangeLog.version))
        rows2 = result2.scalars().all()
        assert rows2[-1].version == first_version + 1, "Version should increment after update"
        assert rows2[-1].op_type == "update"

        # Delete outing
        ok = await delete_outing(db, outing.id)
        assert ok
        result3 = await db.execute(select(ChangeLog).where(ChangeLog.entity_id == outing.id).order_by(ChangeLog.version))
        rows3 = result3.scalars().all()
        assert rows3[-1].op_type == "delete"
        assert rows3[-1].version == rows2[-1].version + 1

if __name__ == "__main__":
    asyncio.run(test_change_log_version_increment())
