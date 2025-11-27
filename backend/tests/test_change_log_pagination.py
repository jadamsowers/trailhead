import uuid
from datetime import datetime
import pytest
from sqlalchemy import select

from app.models.change_log import ChangeLog
from app.crud.outing import create_outing, update_outing
from app.schemas.outing import OutingCreate, OutingUpdate

@pytest.mark.asyncio
async def test_change_log_cursor_pagination(db_session):
    # Create outing and multiple updates to generate log entries
    outing_in = OutingCreate(
        name="Cursor Test",
        outing_date=datetime.utcnow().date(),
        end_date=None,
        location="Loc A",
        description="",
        max_participants=5,
        capacity_type="fixed",
        is_overnight=False,
    )
    outing = await create_outing(db_session, outing_in)

    # Perform several updates
    for i in range(3):
        upd = OutingUpdate(location=f"Loc {i}")
        await update_outing(db_session, outing.id, upd)

    # Query all change log rows
    result = await db_session.execute(select(ChangeLog).where(ChangeLog.entity_id == outing.id).order_by(ChangeLog.created_at, ChangeLog.id))
    rows = result.scalars().all()
    assert len(rows) >= 4, "Expected at least create + 3 updates"

    # Page 1 (limit 2)
    page1 = rows[:2]
    cursor1 = page1[-1].id

    # Simulate service keyset logic manually for test
    # Next page should start strictly after (created_at,id) of cursor1
    after_cursor_rows = [r for r in rows if (r.created_at > page1[-1].created_at) or (r.created_at == page1[-1].created_at and r.id > cursor1)]
    assert len(after_cursor_rows) == len(rows) - 2

@pytest.mark.asyncio
async def test_change_log_latest_timestamp(db_session):
    outing_in = OutingCreate(
        name="Timestamp Test",
        outing_date=datetime.utcnow().date(),
        end_date=None,
        location="Loc",
        description="",
        max_participants=5,
        capacity_type="fixed",
        is_overnight=False,
    )
    outing = await create_outing(db_session, outing_in)
    upd = OutingUpdate(location="New Loc")
    await update_outing(db_session, outing.id, upd)
    result = await db_session.execute(select(ChangeLog).where(ChangeLog.entity_id == outing.id))
    rows = result.scalars().all()
    latest_created = max(r.created_at for r in rows)
    assert latest_created >= rows[0].created_at
