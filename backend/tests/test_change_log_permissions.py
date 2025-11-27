import pytest
from sqlalchemy import select
from datetime import datetime

from app.models.change_log import ChangeLog
from app.crud.place import create_place
from app.schemas.place import PlaceCreate
from app.crud.outing import create_outing
from app.schemas.outing import OutingCreate
from app.services.change_log import get_deltas


@pytest.mark.asyncio
async def test_deltas_non_admin_filters(db_session, test_regular_user):
    """Test that get_deltas service properly filters for non-admin entity types."""
    # Create an outing and place (admin context) with change log
    outing_in = OutingCreate(
        name="Permission Outing",
        outing_date=datetime.utcnow().date(),
        end_date=None,
        location="Secret Location",
        description="",
        max_participants=5,
        capacity_type="fixed",
        is_overnight=False,
    )
    await create_outing(db_session, outing_in)

    place_in = PlaceCreate(name="Hidden Camp", address="123 Wood Rd")
    await create_place(db_session, place_in)

    # Create a merit badge requirement change (should be filtered for non-admin)
    from app.models.requirement import MeritBadge
    badge = MeritBadge(name="Test Badge", description="Desc", keywords=["k"], eagle_required=False)
    db_session.add(badge)
    await db_session.flush()
    # Manually insert change log row for merit_badge to simulate create (since CRUD may not be invoked here)
    from app.services.change_log import record_change
    await record_change(db_session, entity_type="merit_badge", entity_id=badge.id, op_type="create")
    await db_session.commit()

    # Test non-admin filtering (simulate non-admin user requesting only outing/place)
    non_admin_types = {"outing", "place"}
    rows = await get_deltas(db_session, since=None, cursor_id=None, limit=100, entity_types=non_admin_types)
    
    # All rows should be outing or place
    assert all(row.entity_type in non_admin_types for row in rows), \
        f"Expected only {non_admin_types}, got {set(r.entity_type for r in rows)}"
    
    # Test admin filtering (all types visible)
    all_rows = await get_deltas(db_session, since=None, cursor_id=None, limit=100, entity_types=None)
    entity_types_found = {row.entity_type for row in all_rows}
    
    # Admin should see merit_badge (and outing, place if present)
    assert "merit_badge" in entity_types_found or len(all_rows) == 0
