"""Tests for api/endpoints/signups.py"""
import pytest
from httpx import AsyncClient
from datetime import date, timedelta
import uuid


@pytest.mark.asyncio
class TestCreateSignup:
    """Test POST /api/signups endpoint (requires auth)"""
    
    async def test_create_signup_success(self, client: AsyncClient, auth_headers, test_outing, test_family_member, db_session):
        """Test creating a signup successfully"""
        from app.models.family import FamilyMember
        
        # Create adult family members for two-deep leadership
        adult_member = FamilyMember(
            user_id=test_family_member.user_id,
            name="Adult Leader",
            date_of_birth=date.today() - timedelta(days=365*35),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
        )
        db_session.add(adult_member)
        
        adult_member2 = FamilyMember(
            user_id=test_family_member.user_id,
            name="Adult Leader 2",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
        )
        db_session.add(adult_member2)
        await db_session.commit()
        await db_session.refresh(adult_member)
        await db_session.refresh(adult_member2)
        
        signup_data = {
            "outing_id": str(test_outing.id),
            "family_contact": {
                "email": "test@test.com",
                "phone": "555-0000",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_phone": "555-1111",
            },
            "family_member_ids": [
                str(test_family_member.id),
                str(adult_member.id),
                str(adult_member2.id),
            ],
        }
        
        response = await client.post("/api/signups", json=signup_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["outing_id"] == str(test_outing.id)
        assert data["family_contact_email"] == "test@test.com"
        assert len(data["participants"]) == 3
        assert "id" in data
        assert data["participant_count"] == 3
        assert data["scout_count"] == 1
        assert data["adult_count"] == 2
    
    async def test_create_signup_outing_not_found(self, client: AsyncClient, auth_headers, test_family_member):
        """Test creating signup for non-existent outing"""
        
        signup_data = {
            "outing_id": str(uuid.uuid4()),
            "family_contact": {
                "email": "test@test.com",
                "phone": "555-0000",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_phone": "555-1111",
            },
            "family_member_ids": [str(test_family_member.id)],
        }
        
        response = await client.post("/api/signups", json=signup_data, headers=auth_headers)
        
        assert response.status_code == 404
    
    async def test_create_signup_not_enough_spots(self, client: AsyncClient, auth_headers, db_session, test_user):
        """Test creating signup when outing doesn't have enough spots"""
        from app.models.outing import Outing
        from app.models.family import FamilyMember
        
        # Create outing with only 1 spot
        outing = Outing(
            name="Small Outing",
            outing_date=date.today() + timedelta(days=30),
            location="Test",
            max_participants=1,
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        # Create 2 family members
        member1 = FamilyMember(
            user_id=test_user.id,
            name="Scout 1",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="male",
            troop_number="123",
        )
        member2 = FamilyMember(
            user_id=test_user.id,
            name="Scout 2",
            date_of_birth=date.today() - timedelta(days=365*15),
            member_type="scout",
            gender="male",
            troop_number="123",
        )
        db_session.add(member1)
        db_session.add(member2)
        await db_session.commit()
        await db_session.refresh(member1)
        await db_session.refresh(member2)
        
        # Try to signup 2 people
        signup_data = {
            "outing_id": str(outing.id),
            "family_contact": {
                "email": "test@test.com",
                "phone": "555-0000",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_phone": "555-1111",
            },
            "family_member_ids": [str(member1.id), str(member2.id)],
        }
        
        response = await client.post("/api/signups", json=signup_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "available spots" in response.json()["detail"].lower()
    
    async def test_create_signup_scouting_america_two_deep_leadership(self, client: AsyncClient, auth_headers, test_outing, test_user, db_session):
        """Test Scouting America two-deep leadership requirement"""
        from app.models.family import FamilyMember
        
        # Create 1 scout and 1 adult (should fail - need 2 adults)
        scout = FamilyMember(
            user_id=test_user.id,
            name="Scout",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="male",
            troop_number="123",
        )
        adult = FamilyMember(
            user_id=test_user.id,
            name="Adult",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
        )
        db_session.add(scout)
        db_session.add(adult)
        await db_session.commit()
        await db_session.refresh(scout)
        await db_session.refresh(adult)
        
        signup_data = {
            "outing_id": str(test_outing.id),
            "family_contact": {
                "email": "test@test.com",
                "phone": "555-0000",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_phone": "555-1111",
            },
            "family_member_ids": [str(scout.id), str(adult.id)],
        }
        
        response = await client.post("/api/signups", json=signup_data, headers=auth_headers)
        
        # Should succeed but return a warning about 2 adults requirement
        assert response.status_code == 201
        data = response.json()
        assert "warnings" in data
        assert any("2 adults" in warning for warning in data["warnings"])
    
    async def test_create_signup_scouting_america_female_leader_requirement(self, client: AsyncClient, auth_headers, test_outing, test_user, db_session):
        """Test Scouting America female leader requirement when female youth present"""
        from app.models.family import FamilyMember
        
        # Create 2 male adults and 1 female scout (should fail - need female adult)
        adult1 = FamilyMember(
            user_id=test_user.id,
            name="Male Adult 1",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
        )
        adult2 = FamilyMember(
            user_id=test_user.id,
            name="Male Adult 2",
            date_of_birth=date.today() - timedelta(days=365*42),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
        )
        female_scout = FamilyMember(
            user_id=test_user.id,
            name="Female Scout",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="female",
            troop_number="123",
        )
        db_session.add(adult1)
        db_session.add(adult2)
        db_session.add(female_scout)
        await db_session.commit()
        await db_session.refresh(adult1)
        await db_session.refresh(adult2)
        await db_session.refresh(female_scout)
        
        signup_data = {
            "outing_id": str(test_outing.id),
            "family_contact": {
                "email": "test@test.com",
                "phone": "555-0000",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_phone": "555-1111",
            },
            "family_member_ids": [str(female_scout.id), str(adult1.id), str(adult2.id)],
        }
        
        response = await client.post("/api/signups", json=signup_data, headers=auth_headers)
        
        # Should succeed but return a warning about female leader requirement
        assert response.status_code == 201
        data = response.json()
        assert "warnings" in data
        assert any("female" in warning.lower() for warning in data["warnings"])
    
    async def test_create_signup_overnight_youth_protection(self, client: AsyncClient, auth_headers, db_session, test_user):
        """Test overnight outing requires youth protection for adults"""
        from app.models.outing import Outing
        from app.models.family import FamilyMember
        
        # Create overnight outing
        outing = Outing(
            name="Overnight Camping",
            outing_date=date.today() + timedelta(days=30),
            location="Test",
            is_overnight=True,
            max_participants=10,
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        # Create 2 adults without youth protection
        adult1 = FamilyMember(
            user_id=test_user.id,
            name="Adult 1",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=False,  # No YPT
        )
        adult2 = FamilyMember(
            user_id=test_user.id,
            name="Adult 2",
            date_of_birth=date.today() - timedelta(days=365*42),
            member_type="adult",
            gender="male",
            has_youth_protection=False,  # No YPT
        )
        scout = FamilyMember(
            user_id=test_user.id,
            name="Scout",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="male",
            troop_number="123",
        )
        db_session.add(adult1)
        db_session.add(adult2)
        db_session.add(scout)
        await db_session.commit()
        await db_session.refresh(adult1)
        await db_session.refresh(adult2)
        await db_session.refresh(scout)
        
        signup_data = {
            "outing_id": str(outing.id),
            "family_contact": {
                "email": "test@test.com",
                "phone": "555-0000",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_phone": "555-1111",
            },
            "family_member_ids": [str(scout.id), str(adult1.id), str(adult2.id)],
        }
        
        response = await client.post("/api/signups", json=signup_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "youth protection" in response.json()["detail"].lower()


@pytest.mark.asyncio
class TestGetSignup:
    """Test GET /api/signups/{signup_id} endpoint"""
    
    async def test_get_signup_success(self, client: AsyncClient, auth_headers, test_signup):
        """Test getting a signup"""
        response = await client.get(f"/api/signups/{test_signup.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_signup.id)
        assert data["outing_id"] == str(test_signup.outing_id)
    
    async def test_get_signup_not_found(self, client: AsyncClient, auth_headers):
        """Test getting non-existent signup"""
        response = await client.get(f"/api/signups/{uuid.uuid4()}", headers=auth_headers)
        
        assert response.status_code == 404


@pytest.mark.asyncio
class TestCancelSignup:
    """Test DELETE /api/signups/{signup_id} endpoint"""
    
    async def test_cancel_signup_success(self, client: AsyncClient, auth_headers, test_signup):
        """Test canceling a signup"""
        response = await client.delete(f"/api/signups/{test_signup.id}", headers=auth_headers)
        
        assert response.status_code == 204
        
        # Verify signup is deleted
        get_response = await client.get(f"/api/signups/{test_signup.id}", headers=auth_headers)
        assert get_response.status_code == 404
    
    async def test_cancel_signup_not_found(self, client: AsyncClient, auth_headers):
        """Test canceling non-existent signup"""
        response = await client.delete(f"/api/signups/{uuid.uuid4()}", headers=auth_headers)
        
        assert response.status_code == 404
