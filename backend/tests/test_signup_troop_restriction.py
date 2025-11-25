"""Tests for troop-restricted outing signup logic"""
import pytest
from httpx import AsyncClient
import uuid
from datetime import date, timedelta

from app.models.outing import Outing
from app.models.troop import Troop
from app.models.family import FamilyMember


@pytest.mark.asyncio
async def test_signup_restricted_to_troop(client: AsyncClient, auth_headers, db_session, test_user):
    # Create troop
    troop = Troop(
        id=uuid.uuid4(),
        number="777",
        charter_org="Test Org",
    )
    db_session.add(troop)
    await db_session.flush()

    # Create outing restricted to troop
    outing = Outing(
        id=uuid.uuid4(),
        name="Restricted Outing",
        outing_date=date.today() + timedelta(days=10),
        end_date=None,
        location="Restricted Location",
        description="Troop restricted outing",
        max_participants=10,
        is_overnight=False,
        restricted_troop_id=troop.id,
    )
    db_session.add(outing)

    # Create family members: one in troop, one in different troop
    member_allowed = FamilyMember(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Scout Allowed",
        member_type="scout",
        date_of_birth=date.today() - timedelta(days=365*13),
        troop_id=troop.id,
    )
    db_session.add(member_allowed)
    await db_session.flush()

    member_blocked = FamilyMember(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Scout Blocked",
        member_type="scout",
        date_of_birth=date.today() - timedelta(days=365*12),
        troop_number="999",  # Legacy text different troop
    )
    db_session.add(member_blocked)
    await db_session.commit()

    # Attempt signup with both members (should fail)
    payload = {
        "outing_id": str(outing.id),
        "family_contact": {
            "email": "family@test.com",
            "phone": "555-1111",
            "emergency_contact_name": "Parent",
            "emergency_contact_phone": "555-2222"
        },
        "family_member_ids": [str(member_allowed.id), str(member_blocked.id)],
    }
    response = await client.post("/api/signups", headers=auth_headers, json=payload)
    assert response.status_code == 400
    assert "not part of restricted troop" in response.text

    # Signup with allowed member only should succeed
    payload["family_member_ids"] = [str(member_allowed.id)]
    response_ok = await client.post("/api/signups", headers=auth_headers, json=payload)
    assert response_ok.status_code == 201
