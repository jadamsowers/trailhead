import pytest
from sqlalchemy import select
from datetime import datetime

from app.models.change_log import ChangeLog
from app.crud.place import create_place
from app.schemas.place import PlaceCreate
from app.crud.outing import create_outing
from app.schemas.outing import OutingCreate

@pytest.mark.asyncio
async def test_deltas_non_admin_filters(authenticated_client, regular_user_headers, db_session):
    # Create an outing and place (admin context)
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
    badge = MeritBadge(name="Test Badge", description="Desc", keywords=["k"], is_eagle_required=False)
    db_session.add(badge)
    await db_session.flush()
    # Manually insert change log row for merit_badge to simulate create (since CRUD may not be invoked here)
    from app.services.change_log import record_change
    await record_change(db_session, entity_type="merit_badge", entity_id=badge.id, op_type="create")
    await db_session.commit()

    # Use regular user headers (non-admin)
    response = await authenticated_client.get("/api/v1/offline/deltas", headers=regular_user_headers)
    assert response.status_code == 200
    data = response.json()
    assert all(item['entity_type'] in {"outing", "place"} for item in data['items'])
