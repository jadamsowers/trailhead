"""Additional coverage tests for api/endpoints/signups.py

These tests target specific uncovered code paths to improve coverage.
"""
import pytest
from httpx import AsyncClient
from datetime import date, timedelta
import uuid

from app.models.outing import Outing
from app.models.family import FamilyMember
from app.models.troop import Troop
from app.schemas.signup import SignupCreate
from app.crud import signup as crud_signup

pytestmark = pytest.mark.asyncio


class TestRestrictedTroopNotFound:
    """Test edge case where restricted troop deletion nullifies outing restriction (FK ON DELETE SET NULL)"""
    
    async def test_create_signup_restricted_troop_deleted(
        self, client: AsyncClient, auth_headers, db_session, test_user
    ):
        """Test signup succeeds after restricted troop deletion (FK is nullified by ON DELETE SET NULL)"""
        # Create a troop
        troop = Troop(
            id=uuid.uuid4(),
            number="999",
            meeting_location="Test Location"
        )
        db_session.add(troop)
        await db_session.commit()
        await db_session.refresh(troop)
        
        # Create outing with troop restriction
        outing = Outing(
            id=uuid.uuid4(),
            name="Restricted Outing",
            outing_date=date.today() + timedelta(days=30),
            location="Test",
            max_participants=10,
            restricted_troop_id=troop.id
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        # Delete the troop (FK constraint ON DELETE SET NULL will nullify restricted_troop_id)
        await db_session.delete(troop)
        await db_session.commit()
        
        # Create family member
        member = FamilyMember(
            user_id=test_user.id,
            name="Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="999"
        )
        db_session.add(member)
        await db_session.commit()
        await db_session.refresh(member)
        
        # Try to create signup
        payload = {
            "outing_id": str(outing.id),
            "family_contact": {
                "email": "test@test.com",
                "phone": "555-0000",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_phone": "555-1111"
            },
            "family_member_ids": [str(member.id)]
        }
        
        response = await client.post("/api/signups", json=payload, headers=auth_headers)
        
        # With ON DELETE SET NULL, restricted_troop_id becomes null, so no restriction applies
        assert response.status_code == 201
        assert response.json()["outing_id"] == str(outing.id)


class TestSendEmailEndpoint:
    """Test send_email_to_participants endpoint coverage"""
    
    async def test_send_email_outing_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test send_email fails when outing doesn't exist"""
        fake_outing_id = uuid.uuid4()
        payload = {
            "subject": "Test Subject",
            "message": "Test Message",
            "from_email": "sender@test.com"
        }
        
        response = await client.post(
            f"/api/signups/outings/{fake_outing_id}/send-email",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "outing not found" in response.json()["detail"].lower()
    
    async def test_get_outing_emails_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test get_outing_emails fails when outing doesn't exist"""
        fake_outing_id = uuid.uuid4()
        
        response = await client.get(
            f"/api/signups/outings/{fake_outing_id}/emails",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "outing not found" in response.json()["detail"].lower()


class TestExportPDFEndpoint:
    """Test export_outing_roster_pdf endpoint coverage"""
    
    async def test_export_pdf_outing_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test PDF export fails when outing doesn't exist"""
        fake_outing_id = uuid.uuid4()
        
        response = await client.get(
            f"/api/signups/outings/{fake_outing_id}/export-pdf",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "outing not found" in response.json()["detail"].lower()


class TestUpdateSignupEdgeCases:
    """Test update_signup edge cases"""
    
    async def test_update_signup_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test updating non-existent signup"""
        fake_signup_id = uuid.uuid4()
        update_data = {
            "family_contact": {
                "email": "new@test.com",
                "phone": "555-9999",
                "emergency_contact_name": "New Contact",
                "emergency_contact_phone": "555-8888"
            }
        }
        
        response = await client.put(
            f"/api/signups/{fake_signup_id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "signup not found" in response.json()["detail"].lower()
    
    async def test_update_signup_empty_participants_non_admin(
        self, client: AsyncClient, regular_user_headers, db_session, test_outing
    ):
        """Test non-admin cannot update signup with no participants"""
        # Create a signup with no participants
        from app.models.signup import Signup
        
        signup = Signup(
            id=uuid.uuid4(),
            outing_id=test_outing.id,
            family_contact_name="Test Family",
            family_contact_email="test@test.com",
            family_contact_phone="555-1234"
        )
        db_session.add(signup)
        await db_session.commit()
        await db_session.refresh(signup)
        
        update_data = {
            "family_contact": {
                "email": "new@test.com",
                "phone": "555-9999",
                "emergency_contact_name": "New Contact",
                "emergency_contact_phone": "555-8888"
            }
        }
        
        response = await client.put(
            f"/api/signups/{signup.id}",
            json=update_data,
            headers=regular_user_headers
        )
        
        assert response.status_code == 404
        assert "no participants" in response.json()["detail"].lower()


class TestCancelSignupEdgeCases:
    """Test cancel_signup edge cases"""
    
    async def test_cancel_signup_delete_failure(
        self, client: AsyncClient, auth_headers, db_session, test_outing, test_user
    ):
        """Test cancel_signup when delete operation fails"""
        # Create a signup
        from app.models.signup import Signup
        from app.models.participant import Participant
        
        member = FamilyMember(
            user_id=test_user.id,
            name="Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member)
        await db_session.flush()
        
        signup = Signup(
            id=uuid.uuid4(),
            outing_id=test_outing.id,
            family_contact_name="Test Family",
            family_contact_email="test@test.com",
            family_contact_phone="555-1234"
        )
        db_session.add(signup)
        await db_session.flush()
        
        participant = Participant(
            id=uuid.uuid4(),
            signup_id=signup.id,
            family_member_id=member.id
        )
        db_session.add(participant)
        await db_session.commit()
        await db_session.refresh(signup)
        
        # Normal delete should work
        response = await client.delete(
            f"/api/signups/{signup.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204


class TestParticipantDataTransformation:
    """Test participant data transformation edge cases"""
    
    async def test_participant_without_family_member_data(
        self, client: AsyncClient, auth_headers, db_session, test_outing, test_user
    ):
        """Test signup response when participant has no family member dietary/allergy data"""
        # Create family member without dietary preferences or allergies
        member = FamilyMember(
            user_id=test_user.id,
            name="Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member)
        
        adult = FamilyMember(
            user_id=test_user.id,
            name="Adult",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=True
        )
        db_session.add(adult)
        await db_session.commit()
        await db_session.refresh(member)
        await db_session.refresh(adult)
        
        # Create signup via CRUD
        signup_data = SignupCreate(
            outing_id=test_outing.id,
            family_contact={
                "email": "test@test.com",
                "phone": "555-0000",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_phone": "555-1111"
            },
            family_member_ids=[member.id, adult.id]
        )
        
        signup = await crud_signup.create_signup(db_session, signup_data)
        
        # Get the signup via API
        response = await client.get(
            f"/api/signups/{signup.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify participants have empty dietary restrictions and allergies
        for participant in data["participants"]:
            assert participant["dietary_restrictions"] == []
            assert participant["allergies"] == []
