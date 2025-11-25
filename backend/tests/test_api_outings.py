"""Tests for api/endpoints/outings.py"""
import pytest
from datetime import date, timedelta
from httpx import AsyncClient


@pytest.mark.asyncio
class TestGetAvailableOutings:
    """Test GET /api/outings/available endpoint (public)"""
    
    async def test_get_available_outings_no_auth(self, client: AsyncClient, test_outing):
        """Test getting available outings without authentication"""
        response = await client.get("/api/outings/available")
        
        assert response.status_code == 200
        data = response.json()
        assert "outings" in data
        assert "total" in data
        assert isinstance(data["outings"], list)
    
    async def test_get_available_outings_excludes_full(self, client: AsyncClient, db_session, test_user):
        """Test that full outings are excluded"""
        from app.models.outing import Outing
        from app.models.signup import Signup
        from app.models.participant import Participant
        from app.models.family import FamilyMember
        
        # Create a outing with 2 max participants
        outing = Outing(
            name="Small Outing",
            outing_date=date.today() + timedelta(days=30),
            location="Test Location",
            max_participants=2,
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        # Fill the outing
        signup = Signup(
            outing_id=outing.id,
            family_contact_name="Test",
            family_contact_email="test@test.com",
            family_contact_phone="555-0000",
        )
        db_session.add(signup)
        await db_session.flush()
        
        for i in range(2):
            # Create a family member first
            family_member = FamilyMember(
                user_id=test_user.id,
                name=f"Person {i}",
                date_of_birth=date(2010, 1, 1),
                member_type="scout",
                troop_number="100"
            )
            db_session.add(family_member)
            await db_session.flush()
            
            participant = Participant(
                signup_id=signup.id,
                family_member_id=family_member.id
            )
            db_session.add(participant)
        
        await db_session.commit()
        
        response = await client.get("/api/outings/available")
        
        assert response.status_code == 200
        outing_ids = [t["id"] for t in response.json()["outings"]]
        assert str(outing.id) not in outing_ids


@pytest.mark.asyncio
class TestGetAllOutings:
    """Test GET /api/outings endpoint (admin only)"""
    
    async def test_get_all_outings_with_auth(self, client: AsyncClient, auth_headers, test_outing):
        """Test getting all outings with admin authentication"""
        response = await client.get("/api/outings", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "outings" in data
        assert "total" in data
        assert len(data["outings"]) > 0
    
    async def test_get_all_outings_no_auth(self, client: AsyncClient, test_outing):
        """Test getting all outings without authentication succeeds (public endpoint)"""
        response = await client.get("/api/outings")
        
        assert response.status_code == 200
        data = response.json()
        assert "outings" in data
    
    async def test_get_all_outings_pagination(self, client: AsyncClient, auth_headers):
        """Test pagination parameters"""
        response = await client.get(
            "/api/outings?skip=0&limit=5",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["outings"]) <= 5


@pytest.mark.asyncio
class TestCreateOuting:
    """Test POST /api/outings endpoint (admin only)"""
    
    async def test_create_outing_success(self, client: AsyncClient, auth_headers, sample_outing_data):
        """Test creating a new outing"""
        response = await client.post(
            "/api/outings",
            headers=auth_headers,
            json=sample_outing_data,
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_outing_data["name"]
        assert data["location"] == sample_outing_data["location"]
        assert data["max_participants"] == sample_outing_data["max_participants"]
        assert "id" in data
        assert "signup_count" in data
        assert "available_spots" in data
    
    async def test_create_outing_no_auth(self, client: AsyncClient, sample_outing_data):
        """Test creating outing without authentication fails"""
        response = await client.post("/api/outings", json=sample_outing_data)
        
        assert response.status_code == 403
    
    async def test_create_day_outing(self, client: AsyncClient, auth_headers):
        """Test creating a day outing without end_date"""
        outing_data = {
            "name": "Day Hike",
            "outing_date": (date.today() + timedelta(days=20)).isoformat(),
            "end_date": None,
            "location": "Trail Head",
            "description": "Day hike",
            "max_participants": 15,
            "is_overnight": False,
        }
        
        response = await client.post(
            "/api/outings",
            headers=auth_headers,
            json=outing_data,
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["end_date"] is None
        assert data["is_overnight"] is False
    
    async def test_create_outing_missing_required_fields(self, client: AsyncClient, auth_headers):
        """Test creating outing with missing required fields"""
        incomplete_data = {
            "name": "Incomplete Outing",
            # Missing required fields
        }
        
        response = await client.post(
            "/api/outings",
            headers=auth_headers,
            json=incomplete_data,
        )
        
        assert response.status_code == 422


@pytest.mark.asyncio
class TestGetOuting:
    """Test GET /api/outings/{outing_id} endpoint (admin only)"""
    
    async def test_get_outing_success(self, client: AsyncClient, auth_headers, test_outing):
        """Test getting a specific outing"""
        response = await client.get(
            f"/api/outings/{test_outing.id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_outing.id)
        assert data["name"] == test_outing.name
    
    async def test_get_outing_not_found(self, client: AsyncClient, auth_headers):
        """Test getting non-existent outing"""
        from uuid import uuid4
        fake_id = uuid4()
        
        response = await client.get(
            f"/api/outings/{fake_id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 404
    
    async def test_get_outing_no_auth(self, client: AsyncClient, test_outing):
        """Test getting outing without authentication succeeds (public endpoint)"""
        response = await client.get(f"/api/outings/{test_outing.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_outing.id)


@pytest.mark.asyncio
class TestUpdateOuting:
    """Test PUT /api/outings/{outing_id} endpoint (admin only)"""
    
    async def test_update_outing_success(self, client: AsyncClient, auth_headers, test_outing):
        """Test updating a outing"""
        update_data = {
            "name": "Updated Outing Name",
            "location": "Updated Location",
            "max_participants": 30,
        }
        
        response = await client.put(
            f"/api/outings/{test_outing.id}",
            headers=auth_headers,
            json=update_data,
        )
        
        assert response.status_code == 200
        data = response.json()
        # Response is OutingUpdateResponse with nested outing field
        assert "outing" in data
        outing = data["outing"]
        assert outing["name"] == "Updated Outing Name"
        assert outing["location"] == "Updated Location"
        assert outing["max_participants"] == 30
    
    async def test_update_outing_not_found(self, client: AsyncClient, auth_headers):
        """Test updating non-existent outing"""
        from uuid import uuid4
        fake_id = uuid4()
        
        response = await client.put(
            f"/api/outings/{fake_id}",
            headers=auth_headers,
            json={"name": "Updated"},
        )
        
        assert response.status_code == 404
    
    async def test_update_outing_no_auth(self, client: AsyncClient, test_outing):
        """Test updating outing without authentication fails"""
        response = await client.put(
            f"/api/outings/{test_outing.id}",
            json={"name": "Updated"},
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestDeleteOuting:
    """Test DELETE /api/outings/{outing_id} endpoint (admin only)"""
    
    async def test_delete_outing_success(self, client: AsyncClient, auth_headers, test_day_outing):
        """Test deleting a outing without signups"""
        response = await client.delete(
            f"/api/outings/{test_day_outing.id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 204
    
    async def test_delete_outing_with_signups(self, client: AsyncClient, auth_headers, test_signup):
        """Test deleting outing with signups fails"""
        response = await client.delete(
            f"/api/outings/{test_signup.outing_id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 400
        assert "signups" in response.json()["detail"].lower()
    
    async def test_delete_outing_not_found(self, client: AsyncClient, auth_headers):
        """Test deleting non-existent outing"""
        from uuid import uuid4
        fake_id = uuid4()
        
        response = await client.delete(
            f"/api/outings/{fake_id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 400
    
    async def test_delete_outing_no_auth(self, client: AsyncClient, test_day_outing):
        """Test deleting outing without authentication fails"""
        response = await client.delete(f"/api/outings/{test_day_outing.id}")
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestGetOutingSignups:
    """Test GET /api/outings/{outing_id}/signups endpoint (admin only)"""
    
    async def test_get_outing_signups_success(self, client: AsyncClient, auth_headers, test_outing, test_signup):
        """Test getting signups for a outing"""
        response = await client.get(
            f"/api/outings/{test_outing.id}/signups",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "signups" in data
        assert "total" in data
        assert len(data["signups"]) > 0
        
        # Verify signup structure
        signup = data["signups"][0]
        assert "id" in signup
        assert "family_contact_name" in signup
        assert "participants" in signup
    
    async def test_get_outing_signups_empty(self, client: AsyncClient, auth_headers, test_day_outing):
        """Test getting signups for outing with no signups"""
        response = await client.get(
            f"/api/outings/{test_day_outing.id}/signups",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["signups"]) == 0
        assert data["total"] == 0
    
    async def test_get_outing_signups_not_found(self, client: AsyncClient, auth_headers):
        """Test getting signups for non-existent outing"""
        from uuid import uuid4
        fake_id = uuid4()
        
        response = await client.get(
            f"/api/outings/{fake_id}/signups",
            headers=auth_headers,
        )
        
        assert response.status_code == 404
    
    async def test_get_outing_signups_no_auth(self, client: AsyncClient, test_outing):
        """Test getting outing signups without authentication fails"""
        response = await client.get(f"/api/outings/{test_outing.id}/signups")
        
        assert response.status_code == 403