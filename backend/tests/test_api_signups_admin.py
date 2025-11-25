"""Admin-focused tests for signups endpoints to improve coverage.

Tests admin-only endpoints and filtered queries that were previously untested.
"""
import pytest
from httpx import AsyncClient
from datetime import date, timedelta
from uuid import uuid4


@pytest.mark.asyncio
class TestAdminListSignups:
    """Test admin list signups endpoint with filtering"""
    
    async def test_list_signups_all(self, client: AsyncClient, auth_headers, test_signup):
        """Admin can list all signups without filter"""
        response = await client.get("/api/signups", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "signups" in data
        assert "total" in data
        assert data["total"] >= 1
        assert len(data["signups"]) >= 1

    async def test_list_signups_filtered_by_outing(self, client: AsyncClient, auth_headers, test_signup, test_day_outing):
        """Admin can filter signups by outing_id"""
        response = await client.get(f"/api/signups?outing_id={test_signup.outing_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        # All returned signups should be for the specified outing
        for signup in data["signups"]:
            assert signup["outing_id"] == str(test_signup.outing_id)

    async def test_list_signups_filtered_by_nonexistent_outing(self, client: AsyncClient, auth_headers):
        """Filtering by nonexistent outing returns empty list"""
        fake_id = uuid4()
        response = await client.get(f"/api/signups?outing_id={fake_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["signups"] == []
        assert data["total"] == 0

    async def test_list_signups_pagination(self, client: AsyncClient, auth_headers, test_signup):
        """Admin can paginate signups list"""
        response = await client.get("/api/signups?skip=0&limit=1", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["signups"]) <= 1

    async def test_list_signups_skip_beyond_total(self, client: AsyncClient, auth_headers):
        """Pagination skip beyond total returns empty"""
        response = await client.get("/api/signups?skip=9999&limit=10", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["signups"] == []
        assert data["total"] >= 0

    async def test_list_signups_no_auth(self, client: AsyncClient):
        """Non-admin cannot list signups"""
        response = await client.get("/api/signups")
        assert response.status_code == 403


@pytest.mark.asyncio
class TestMySignupsEdgeCases:
    """Test my-signups endpoint edge cases"""
    
    async def test_my_signups_no_family_members(self, client: AsyncClient, authenticated_client, test_regular_user):
        """User with no family members gets empty list"""
        # Use authenticated client for regular user with no family
        response = await authenticated_client.get("/api/signups/my-signups")
        assert response.status_code == 200
        assert response.json() == []

    async def test_my_signups_family_but_no_signups(self, client: AsyncClient, authenticated_client, test_regular_user, test_family_member):
        """User with family members but no signups gets empty list"""
        # test_family_member belongs to test_user (admin), not test_regular_user
        # So for test_regular_user, should be empty
        response = await authenticated_client.get("/api/signups/my-signups")
        assert response.status_code == 200
        # Since test_family_member belongs to admin, regular user sees nothing
        assert response.json() == []

    async def test_my_signups_with_multiple_outings(self, client: AsyncClient, auth_headers, test_user, db_session):
        """User's signups across multiple outings returned"""
        from app.models.outing import Outing
        from app.models.signup import Signup
        from app.models.participant import Participant
        from app.models.family import FamilyMember
        
        # Create two outings
        outing1 = Outing(
            name="Outing 1",
            outing_date=date.today() + timedelta(days=10),
            location="Location 1",
            max_participants=20,
        )
        outing2 = Outing(
            name="Outing 2",
            outing_date=date.today() + timedelta(days=20),
            location="Location 2",
            max_participants=20,
        )
        db_session.add(outing1)
        db_session.add(outing2)
        await db_session.flush()
        
        # Create family member for test_user
        family_member = FamilyMember(
            user_id=test_user.id,
            name="Multi Signup Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            troop_number="100",
        )
        db_session.add(family_member)
        await db_session.flush()
        
        # Sign up for both outings
        signup1 = Signup(
            outing_id=outing1.id,
            family_contact_name="Test",
            family_contact_email="test@test.com",
            family_contact_phone="555-0000",
        )
        signup2 = Signup(
            outing_id=outing2.id,
            family_contact_name="Test",
            family_contact_email="test@test.com",
            family_contact_phone="555-0000",
        )
        db_session.add(signup1)
        db_session.add(signup2)
        await db_session.flush()
        
        participant1 = Participant(signup_id=signup1.id, family_member_id=family_member.id)
        participant2 = Participant(signup_id=signup2.id, family_member_id=family_member.id)
        db_session.add(participant1)
        db_session.add(participant2)
        await db_session.commit()
        
        # Now get my-signups as test_user (admin)
        response = await client.get("/api/signups/my-signups", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Should have at least 2 signups (could have more from fixtures)
        assert len(data) >= 2


@pytest.mark.asyncio
class TestExportPDF:
    """Test PDF export endpoint"""
    
    async def test_export_pdf_success(self, client: AsyncClient, auth_headers, test_outing, test_signup):
        """Admin can export outing roster as PDF"""
        response = await client.get(f"/api/signups/outings/{test_outing.id}/export-pdf", headers=auth_headers)
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        cd = response.headers.get("content-disposition")
        assert cd and "attachment;" in cd
        assert len(response.content) > 100

    async def test_export_pdf_outing_not_found(self, client: AsyncClient, auth_headers):
        """Export PDF for nonexistent outing returns 404"""
        fake_id = uuid4()
        response = await client.get(f"/api/signups/outings/{fake_id}/export-pdf", headers=auth_headers)
        assert response.status_code == 404

    async def test_export_pdf_no_signups(self, client: AsyncClient, auth_headers, test_day_outing):
        """Export PDF for outing with no signups still succeeds"""
        response = await client.get(f"/api/signups/outings/{test_day_outing.id}/export-pdf", headers=auth_headers)
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"

    async def test_export_pdf_no_auth(self, client: AsyncClient, test_outing):
        """Non-admin cannot export PDF"""
        response = await client.get(f"/api/signups/outings/{test_outing.id}/export-pdf")
        assert response.status_code == 403


@pytest.mark.asyncio
class TestEmailList:
    """Test email list endpoint"""
    
    async def test_get_emails_success(self, client: AsyncClient, auth_headers, test_outing, test_signup):
        """Admin can get email list for outing"""
        response = await client.get(f"/api/signups/outings/{test_outing.id}/emails", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "emails" in data
        assert "count" in data
        assert isinstance(data["emails"], list)
        assert data["count"] == len(data["emails"])
        # test_signup has family_contact_email
        assert any("@" in email for email in data["emails"])

    async def test_get_emails_outing_not_found(self, client: AsyncClient, auth_headers):
        """Get emails for nonexistent outing returns 404"""
        fake_id = uuid4()
        response = await client.get(f"/api/signups/outings/{fake_id}/emails", headers=auth_headers)
        assert response.status_code == 404

    async def test_get_emails_no_signups(self, client: AsyncClient, auth_headers, test_day_outing):
        """Get emails for outing with no signups returns empty list"""
        response = await client.get(f"/api/signups/outings/{test_day_outing.id}/emails", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["emails"] == []
        assert data["count"] == 0

    async def test_get_emails_no_auth(self, client: AsyncClient, test_outing):
        """Non-admin cannot get email list"""
        response = await client.get(f"/api/signups/outings/{test_outing.id}/emails")
        assert response.status_code == 403


@pytest.mark.asyncio
class TestGetSignupOwnership:
    """Test get signup endpoint ownership checks"""
    
    async def test_get_signup_admin_any_signup(self, client: AsyncClient, auth_headers, test_signup):
        """Admin can view any signup"""
        response = await client.get(f"/api/signups/{test_signup.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_signup.id)

    async def test_get_signup_user_own_signup(self, client: AsyncClient, regular_user_headers, test_regular_user, db_session):
        """User can view their own signup"""
        from app.models.outing import Outing
        from app.models.signup import Signup
        from app.models.participant import Participant
        from app.models.family import FamilyMember
        
        # Create outing
        outing = Outing(
            name="User Outing",
            outing_date=date.today() + timedelta(days=10),
            location="Test Location",
            max_participants=20,
        )
        db_session.add(outing)
        await db_session.flush()
        
        # Create family member for regular user
        family_member = FamilyMember(
            user_id=test_regular_user.id,
            name="User Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            troop_number="100",
        )
        db_session.add(family_member)
        await db_session.flush()
        
        # Create signup
        signup = Signup(
            outing_id=outing.id,
            family_contact_name="Regular User",
            family_contact_email="regular@test.com",
            family_contact_phone="555-1111",
        )
        db_session.add(signup)
        await db_session.flush()
        
        participant = Participant(signup_id=signup.id, family_member_id=family_member.id)
        db_session.add(participant)
        await db_session.commit()
        
        # Regular user views own signup
        response = await client.get(f"/api/signups/{signup.id}", headers=regular_user_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(signup.id)

    async def test_get_signup_user_other_signup_forbidden(self, client: AsyncClient, regular_user_headers, test_signup):
        """User cannot view other user's signup"""
        # test_signup belongs to test_user (admin), not test_regular_user
        response = await client.get(f"/api/signups/{test_signup.id}", headers=regular_user_headers)
        assert response.status_code == 403


@pytest.mark.asyncio
class TestDeleteSignupOwnership:
    """Test delete signup endpoint ownership checks"""
    
    async def test_delete_signup_admin_any_signup(self, client: AsyncClient, auth_headers, db_session, test_outing, test_user):
        """Admin can delete any signup"""
        from app.models.signup import Signup
        from app.models.participant import Participant
        from app.models.family import FamilyMember
        
        # Create a signup to delete
        family_member = FamilyMember(
            user_id=test_user.id,
            name="Delete Test Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            troop_number="100",
        )
        db_session.add(family_member)
        await db_session.flush()
        
        signup = Signup(
            outing_id=test_outing.id,
            family_contact_name="Delete Test",
            family_contact_email="delete@test.com",
            family_contact_phone="555-2222",
        )
        db_session.add(signup)
        await db_session.flush()
        
        participant = Participant(signup_id=signup.id, family_member_id=family_member.id)
        db_session.add(participant)
        await db_session.commit()
        
        # Admin deletes signup
        response = await client.delete(f"/api/signups/{signup.id}", headers=auth_headers)
        assert response.status_code == 204

    async def test_delete_signup_user_own_signup(self, client: AsyncClient, regular_user_headers, test_regular_user, db_session):
        """User can delete their own signup"""
        from app.models.outing import Outing
        from app.models.signup import Signup
        from app.models.participant import Participant
        from app.models.family import FamilyMember
        
        # Create outing
        outing = Outing(
            name="User Delete Outing",
            outing_date=date.today() + timedelta(days=10),
            location="Test Location",
            max_participants=20,
        )
        db_session.add(outing)
        await db_session.flush()
        
        # Create family member for regular user
        family_member = FamilyMember(
            user_id=test_regular_user.id,
            name="User Delete Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            troop_number="100",
        )
        db_session.add(family_member)
        await db_session.flush()
        
        # Create signup
        signup = Signup(
            outing_id=outing.id,
            family_contact_name="Regular User Delete",
            family_contact_email="regular_delete@test.com",
            family_contact_phone="555-3333",
        )
        db_session.add(signup)
        await db_session.flush()
        
        participant = Participant(signup_id=signup.id, family_member_id=family_member.id)
        db_session.add(participant)
        await db_session.commit()
        
        # Regular user deletes own signup
        response = await client.delete(f"/api/signups/{signup.id}", headers=regular_user_headers)
        assert response.status_code == 204

    async def test_delete_signup_user_other_signup_forbidden(self, client: AsyncClient, regular_user_headers, test_signup):
        """User cannot delete other user's signup"""
        # test_signup belongs to test_user (admin), not test_regular_user
        response = await client.delete(f"/api/signups/{test_signup.id}", headers=regular_user_headers)
        assert response.status_code == 403
