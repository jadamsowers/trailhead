"""Tests for api/endpoints/signups.py"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestCreateSignup:
    """Test POST /api/signups endpoint (public)"""
    
    async def test_create_signup_success(self, client: AsyncClient, test_trip, sample_signup_data):
        """Test creating a signup successfully"""
        response = await client.post("/api/signups", json=sample_signup_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["trip_id"] == str(test_trip.id)
        assert data["family_contact_name"] == sample_signup_data["family_contact"]["name"]
        assert len(data["participants"]) == len(sample_signup_data["participants"])
        assert "id" in data
        assert "participant_count" in data
        assert "scout_count" in data
        assert "adult_count" in data
    
    async def test_create_signup_trip_not_found(self, client: AsyncClient):
        """Test creating signup for non-existent trip"""
        from uuid import uuid4
        
        signup_data = {
            "trip_id": str(uuid4()),
            "family_contact": {
                "name": "Test Family",
                "email": "test@test.com",
                "phone": "555-0000",
            },
            "participants": [
                {
                    "name": "Test Scout",
                    "age": 14,
                    "participant_type": "scout",
                    "is_adult": False,
                    "gender": "male",
                    "troop_number": "123",
                    "patrol_name": "Test",
                    "has_youth_protection": False,
                    "vehicle_capacity": 0,
                    "dietary_restrictions": [],
                    "allergies": [],
                    "medical_notes": None,
                },
            ],
        }
        
        response = await client.post("/api/signups", json=signup_data)
        
        assert response.status_code == 404
    
    async def test_create_signup_not_enough_spots(self, client: AsyncClient, db_session):
        """Test creating signup when trip doesn't have enough spots"""
        from app.models.trip import Trip
        from app.models.signup import Signup
        from app.models.participant import Participant
        from datetime import date, timedelta
        
        # Create trip with only 1 spot
        trip = Trip(
            name="Small Trip",
            trip_date=date.today() + timedelta(days=30),
            location="Test",
            max_participants=1,
        )
        db_session.add(trip)
        await db_session.commit()
        await db_session.refresh(trip)
        
        # Try to signup 2 people
        signup_data = {
            "trip_id": str(trip.id),
            "family_contact": {
                "name": "Test Family",
                "email": "test@test.com",
                "phone": "555-0000",
            },
            "participants": [
                {
                    "name": "Scout 1",
                    "age": 14,
                    "participant_type": "scout",
                    "is_adult": False,
                    "gender": "male",
                    "troop_number": "123",
                    "patrol_name": "Test",
                    "has_youth_protection": False,
                    "vehicle_capacity": 0,
                    "dietary_restrictions": [],
                    "allergies": [],
                    "medical_notes": None,
                },
                {
                    "name": "Scout 2",
                    "age": 14,
                    "participant_type": "scout",
                    "is_adult": False,
                    "gender": "male",
                    "troop_number": "123",
                    "patrol_name": "Test",
                    "has_youth_protection": False,
                    "vehicle_capacity": 0,
                    "dietary_restrictions": [],
                    "allergies": [],
                    "medical_notes": None,
                },
            ],
        }
        
        response = await client.post("/api/signups", json=signup_data)
        
        assert response.status_code == 400
        assert "available spots" in response.json()["detail"].lower()
    
    async def test_create_signup_scouting_america_two_deep_leadership(self, client: AsyncClient, test_trip):
        """Test Scouting America two-deep leadership requirement"""
        # Try to signup with only 1 adult (should fail)
        signup_data = {
            "trip_id": str(test_trip.id),
            "family_contact": {
                "name": "Test Family",
                "email": "test@test.com",
                "phone": "555-0000",
            },
            "participants": [
                {
                    "name": "Scout",
                    "age": 14,
                    "participant_type": "scout",
                    "is_adult": False,
                    "gender": "male",
                    "troop_number": "123",
                    "patrol_name": "Test",
                    "has_youth_protection": False,
                    "vehicle_capacity": 0,
                    "dietary_restrictions": [],
                    "allergies": [],
                    "medical_notes": None,
                },
                {
                    "name": "Adult",
                    "age": 40,
                    "participant_type": "adult",
                    "is_adult": True,
                    "gender": "male",
                    "troop_number": None,
                    "patrol_name": None,
                    "has_youth_protection": True,
                    "vehicle_capacity": 5,
                    "dietary_restrictions": [],
                    "allergies": [],
                    "medical_notes": None,
                },
            ],
        }
        
        response = await client.post("/api/signups", json=signup_data)
        
        assert response.status_code == 400
        assert "2 adults" in response.json()["detail"]
    
    async def test_create_signup_scouting_america_female_leader_requirement(self, client: AsyncClient, test_trip):
        """Test Scouting America female leader requirement when female youth present"""
        # First, add 2 male adults to satisfy two-deep leadership
        signup1_data = {
            "trip_id": str(test_trip.id),
            "family_contact": {
                "name": "Male Leaders",
                "email": "males@test.com",
                "phone": "555-0001",
            },
            "participants": [
                {
                    "name": "Male Adult 1",
                    "age": 40,
                    "participant_type": "adult",
                    "is_adult": True,
                    "gender": "male",
                    "troop_number": None,
                    "patrol_name": None,
                    "has_youth_protection": True,
                    "vehicle_capacity": 5,
                    "dietary_restrictions": [],
                    "allergies": [],
                    "medical_notes": None,
                },
                {
                    "name": "Male Adult 2",
                    "age": 42,
                    "participant_type": "adult",
                    "is_adult": True,
                    "gender": "male",
                    "troop_number": None,
                    "patrol_name": None,
                    "has_youth_protection": True,
                    "vehicle_capacity": 5,
                    "dietary_restrictions": [],
                    "allergies": [],
                    "medical_notes": None,
                },
            ],
        }
        
        await client.post("/api/signups", json=signup1_data)
        
        # Now try to add female youth without female adult (should fail)
        signup2_data = {
            "trip_id": str(test_trip.id),
            "family_contact": {
                "name": "Female Scout Family",
                "email": "female@test.com",
                "phone": "555-0002",
            },
            "participants": [
                {
                    "name": "Female Scout",
                    "age": 14,
                    "participant_type": "scout",
                    "is_adult": False,
                    "gender": "female",
                    "troop_number": "123",
                    "patrol_name": "Test",
                    "has_youth_protection": False,
                    "vehicle_capacity": 0,
                    "dietary_restrictions": [],
                    "allergies": [],
                    "medical_notes": None,
                },
            ],
        }
        
        response = await client.post("/api/signups", json=signup2_data)
        
        assert response.status_code == 400
        assert "female adult" in response.json()["detail"].lower()
    
    async def test_create_signup_overnight_youth_protection(self, client: AsyncClient, db_session):
        """Test youth protection requirement for overnight trips"""
        from app.models.trip import Trip
        from datetime import date, timedelta
        
        # Create overnight trip
        trip = Trip(
            name="Overnight Trip",
            trip_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            location="Camp",
            max_participants=20,
            is_overnight=True,
        )
        db_session.add(trip)
        await db_session.commit()
        await db_session.refresh(trip)
        
        # First signup with 2 adults (one without youth protection)
        signup1_data = {
            "trip_id": str(trip.id),
            "family_contact": {
                "name": "First Family",
                "email": "first@test.com",
                "phone": "555-0001",
            },
            "participants": [
                {
                    "name": "Adult 1",
                    "age": 40,
                    "participant_type": "adult",
                    "is_adult": True,
                    "gender": "male",
                    "troop_number": None,
                    "patrol_name": None,
                    "has_youth_protection": False,
                    "vehicle_capacity": 5,
                    "dietary_restrictions": [],
                    "allergies": [],
                    "medical_notes": None,
                },
                {
                    "name": "Adult 2",
                    "age": 42,
                    "participant_type": "adult",
                    "is_adult": True,
                    "gender": "male",
                    "troop_number": None,
                    "patrol_name": None,
                    "has_youth_protection": False,
                    "vehicle_capacity": 5,
                    "dietary_restrictions": [],
                    "allergies": [],
                    "medical_notes": None,
                },
            ],
        }
        
        response = await client.post("/api/signups", json=signup1_data)
        
        assert response.status_code == 400
        assert "youth protection" in response.json()["detail"].lower()


@pytest.mark.asyncio
class TestGetSignup:
    """Test GET /api/signups/{signup_id} endpoint (public)"""
    
    async def test_get_signup_success(self, client: AsyncClient, test_signup):
        """Test getting a signup"""
        response = await client.get(f"/api/signups/{test_signup.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_signup.id)
        assert data["family_contact_name"] == test_signup.family_contact_name
        assert "participants" in data
    
    async def test_get_signup_not_found(self, client: AsyncClient):
        """Test getting non-existent signup"""
        from uuid import uuid4
        fake_id = uuid4()
        
        response = await client.get(f"/api/signups/{fake_id}")
        
        assert response.status_code == 404


@pytest.mark.asyncio
class TestCancelSignup:
    """Test DELETE /api/signups/{signup_id} endpoint (public)"""
    
    async def test_cancel_signup_success(self, client: AsyncClient, test_trip, sample_signup_data):
        """Test canceling a signup"""
        # Create a signup
        create_response = await client.post("/api/signups", json=sample_signup_data)
        signup_id = create_response.json()["id"]
        
        # Cancel it
        response = await client.delete(f"/api/signups/{signup_id}")
        
        assert response.status_code == 204
        
        # Verify it's deleted
        get_response = await client.get(f"/api/signups/{signup_id}")
        assert get_response.status_code == 404
    
    async def test_cancel_signup_not_found(self, client: AsyncClient):
        """Test canceling non-existent signup"""
        from uuid import uuid4
        fake_id = uuid4()
        
        response = await client.delete(f"/api/signups/{fake_id}")
        
        assert response.status_code == 404