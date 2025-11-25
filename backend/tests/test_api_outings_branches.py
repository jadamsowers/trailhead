"""Branch-focused tests for api/endpoints/outings.py to exercise untested logic paths.

Scenarios covered:
1. Manual close signups success & not found.
2. Manual open signups success after close & not found.
3. Update outing with multiple field changes generates email draft with expected changed_fields.
4. Update outing with no changes returns no email draft.
5. Handout PDF success returns application/pdf + Content-Disposition.
6. Handout PDF outing not found returns 404.
7. Pagination skip beyond total returns empty outings list but preserves total count.
8. Availability boundary: outing appears when not full; disappears after filling to capacity.
"""
import pytest
from httpx import AsyncClient
from datetime import date, timedelta
from uuid import uuid4


@pytest.mark.asyncio
class TestOutingSignupsToggle:
    async def test_close_signups_success(self, client: AsyncClient, auth_headers, test_outing):
        response = await client.post(f"/api/outings/{test_outing.id}/close-signups", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["signups_closed"] is True
        assert data["are_signups_closed"] is True

    async def test_close_signups_not_found(self, client: AsyncClient, auth_headers):
        fake_id = uuid4()
        response = await client.post(f"/api/outings/{fake_id}/close-signups", headers=auth_headers)
        assert response.status_code == 404

    async def test_open_signups_success_after_close(self, client: AsyncClient, auth_headers, test_outing):
        # Close first
        close_resp = await client.post(f"/api/outings/{test_outing.id}/close-signups", headers=auth_headers)
        assert close_resp.status_code == 200
        # Open
        open_resp = await client.post(f"/api/outings/{test_outing.id}/open-signups", headers=auth_headers)
        assert open_resp.status_code == 200
        data = open_resp.json()
        assert data["signups_closed"] is False
        assert data["are_signups_closed"] is False

    async def test_open_signups_not_found(self, client: AsyncClient, auth_headers):
        fake_id = uuid4()
        response = await client.post(f"/api/outings/{fake_id}/open-signups", headers=auth_headers)
        assert response.status_code == 404


@pytest.mark.asyncio
class TestOutingUpdateEmailDraft:
    async def test_update_outing_generates_email_draft(self, client: AsyncClient, auth_headers, test_outing):
        update_data = {
            "name": "Email Draft Outing",
            "location": "New Location",
            "max_participants": test_outing.max_participants + 5,
        }
        response = await client.put(f"/api/outings/{test_outing.id}", headers=auth_headers, json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert "outing" in data
        assert "email_draft" in data
        draft = data["email_draft"]
        assert draft is not None, "Expected email_draft when fields change"
        # Changed fields should include only the explicitly changed keys
        assert set(draft["changed_fields"]) == {"name", "location", "max_participants"}
        assert draft["subject"].startswith("Update: Email Draft Outing")
        assert "Changed Fields:" in draft["body"]

    async def test_update_outing_no_changes_no_email_draft(self, client: AsyncClient, auth_headers, test_outing):
        # Empty update payload (no fields provided)
        response = await client.put(f"/api/outings/{test_outing.id}", headers=auth_headers, json={})
        assert response.status_code == 200
        data = response.json()
        assert data["email_draft"] is None
        # Outing unchanged attributes
        outing = data["outing"]
        assert outing["id"] == str(test_outing.id)


@pytest.mark.asyncio
class TestOutingHandout:
    async def test_outing_handout_success(self, client: AsyncClient, test_outing):
        response = await client.get(f"/api/outings/{test_outing.id}/handout")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        cd = response.headers.get("content-disposition")
        assert cd and "attachment;" in cd and str(test_outing.id) in cd
        assert len(response.content) > 100  # Basic sanity check that PDF has content

    async def test_outing_handout_not_found(self, client: AsyncClient):
        fake_id = uuid4()
        response = await client.get(f"/api/outings/{fake_id}/handout")
        assert response.status_code == 404


@pytest.mark.asyncio
class TestOutingPaginationEdge:
    async def test_get_all_outings_skip_beyond_total(self, client: AsyncClient, auth_headers, test_outing):
        # Large skip beyond total count
        response = await client.get("/api/outings?skip=9999&limit=10", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["outings"] == []
        # total should reflect actual outing count (>= 1)
        assert data["total"] >= 1


@pytest.mark.asyncio
class TestOutingAvailabilityBoundary:
    async def test_outing_full_boundary_exclusion(self, client: AsyncClient, db_session, test_user):
        from app.models.outing import Outing
        from app.models.signup import Signup
        from app.models.participant import Participant
        from app.models.family import FamilyMember
        # Create outing with single spot
        outing = Outing(
            name="Boundary Outing",
            outing_date=date.today() + timedelta(days=10),
            location="Boundary Location",
            max_participants=1,
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)

        # Initially should appear in available
        initial = await client.get("/api/outings/available")
        assert initial.status_code == 200
        ids_initial = {o["id"] for o in initial.json()["outings"]}
        assert str(outing.id) in ids_initial

        # Fill the outing with one signup/participant
        signup = Signup(
            outing_id=outing.id,
            family_contact_name="Boundary Family",
            family_contact_email="boundary@test.com",
            family_contact_phone="555-0000",
        )
        db_session.add(signup)
        await db_session.flush()

        family_member = FamilyMember(
            user_id=test_user.id,
            name="Only Participant",
            date_of_birth=date.today() - timedelta(days=365*12),
            member_type="scout",
            troop_number="100",
        )
        db_session.add(family_member)
        await db_session.flush()

        participant = Participant(
            signup_id=signup.id,
            family_member_id=family_member.id,
        )
        db_session.add(participant)
        await db_session.commit()
        # Expire session state to ensure relationships reload with latest data
        db_session.expire_all()

        # Should now be excluded from available outings
        after = await client.get("/api/outings/available")
        assert after.status_code == 200
        ids_after = {o["id"] for o in after.json()["outings"]}
        assert str(outing.id) not in ids_after
