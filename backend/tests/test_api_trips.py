"""Tests for api/endpoints/trips.py"""
import pytest
from datetime import date, timedelta
from httpx import AsyncClient


@pytest.mark.asyncio
class TestGetAvailableTrips:
    """Test GET /api/trips/available endpoint (public)"""
    
    async def test_get_available_trips_no_auth(self, client: AsyncClient, test_trip):
        """Test getting available trips without authentication"""
        response = await client.get("/api/trips/available")
        
        assert response.status_code == 200
        data = response.json()
        assert "trips" in data
        assert "total" in data
        assert isinstance(data["trips"], list)
    
    async def test_get_available_trips_excludes_full(self, client: AsyncClient, db_session):
        """Test that full trips are excluded"""
        from app.models.trip import Trip
        from app.models.signup import Signup
        from app.models.participant import Participant
        
        # Create a trip with 2 max participants
        trip = Trip(
            name="Small Trip",
            trip_date=date.today() + timedelta(days=30),
            location="Test Location",
            max_participants=2,
        )
        db_session.add(trip)
        await db_session.commit()
        await db_session.refresh(trip)
        
        # Fill the trip
        signup = Signup(
            trip_id=trip.id,
            family_contact_name="Test",
            family_contact_email="test@test.com",
            family_contact_phone="555-0000",
        )
        db_session.add(signup)
        await db_session.flush()
        
        for i in range(2):
            participant = Participant(
                signup_id=signup.id,
                name=f"Person {i}",
                age=14,
                participant_type="scout",
                is_adult=False,
                gender="male",
            )
            db_session.add(participant)
        
        await db_session.commit()
        
        response = await client.get("/api/trips/available")
        
        assert response.status_code == 200
        trip_ids = [t["id"] for t in response.json()["trips"]]
        assert str(trip.id) not in trip_ids


@pytest.mark.asyncio
class TestGetAllTrips:
    """Test GET /api/trips endpoint (admin only)"""
    
    async def test_get_all_trips_with_auth(self, client: AsyncClient, auth_headers, test_trip):
        """Test getting all trips with admin authentication"""
        response = await client.get("/api/trips", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "trips" in data
        assert "total" in data
        assert len(data["trips"]) > 0
    
    async def test_get_all_trips_no_auth(self, client: AsyncClient):
        """Test getting all trips without authentication fails"""
        response = await client.get("/api/trips")
        
        assert response.status_code == 403
    
    async def test_get_all_trips_pagination(self, client: AsyncClient, auth_headers):
        """Test pagination parameters"""
        response = await client.get(
            "/api/trips?skip=0&limit=5",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["trips"]) <= 5


@pytest.mark.asyncio
class TestCreateTrip:
    """Test POST /api/trips endpoint (admin only)"""
    
    async def test_create_trip_success(self, client: AsyncClient, auth_headers, sample_trip_data):
        """Test creating a new trip"""
        response = await client.post(
            "/api/trips",
            headers=auth_headers,
            json=sample_trip_data,
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_trip_data["name"]
        assert data["location"] == sample_trip_data["location"]
        assert data["max_participants"] == sample_trip_data["max_participants"]
        assert "id" in data
        assert "signup_count" in data
        assert "available_spots" in data
    
    async def test_create_trip_no_auth(self, client: AsyncClient, sample_trip_data):
        """Test creating trip without authentication fails"""
        response = await client.post("/api/trips", json=sample_trip_data)
        
        assert response.status_code == 403
    
    async def test_create_day_trip(self, client: AsyncClient, auth_headers):
        """Test creating a day trip without end_date"""
        trip_data = {
            "name": "Day Hike",
            "trip_date": (date.today() + timedelta(days=20)).isoformat(),
            "end_date": None,
            "location": "Trail Head",
            "description": "Day hike",
            "max_participants": 15,
            "is_overnight": False,
        }
        
        response = await client.post(
            "/api/trips",
            headers=auth_headers,
            json=trip_data,
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["end_date"] is None
        assert data["is_overnight"] is False
    
    async def test_create_trip_missing_required_fields(self, client: AsyncClient, auth_headers):
        """Test creating trip with missing required fields"""
        incomplete_data = {
            "name": "Incomplete Trip",
            # Missing required fields
        }
        
        response = await client.post(
            "/api/trips",
            headers=auth_headers,
            json=incomplete_data,
        )
        
        assert response.status_code == 422


@pytest.mark.asyncio
class TestGetTrip:
    """Test GET /api/trips/{trip_id} endpoint (admin only)"""
    
    async def test_get_trip_success(self, client: AsyncClient, auth_headers, test_trip):
        """Test getting a specific trip"""
        response = await client.get(
            f"/api/trips/{test_trip.id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_trip.id)
        assert data["name"] == test_trip.name
    
    async def test_get_trip_not_found(self, client: AsyncClient, auth_headers):
        """Test getting non-existent trip"""
        from uuid import uuid4
        fake_id = uuid4()
        
        response = await client.get(
            f"/api/trips/{fake_id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 404
    
    async def test_get_trip_no_auth(self, client: AsyncClient, test_trip):
        """Test getting trip without authentication fails"""
        response = await client.get(f"/api/trips/{test_trip.id}")
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestUpdateTrip:
    """Test PUT /api/trips/{trip_id} endpoint (admin only)"""
    
    async def test_update_trip_success(self, client: AsyncClient, auth_headers, test_trip):
        """Test updating a trip"""
        update_data = {
            "name": "Updated Trip Name",
            "location": "Updated Location",
            "max_participants": 30,
        }
        
        response = await client.put(
            f"/api/trips/{test_trip.id}",
            headers=auth_headers,
            json=update_data,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Trip Name"
        assert data["location"] == "Updated Location"
        assert data["max_participants"] == 30
    
    async def test_update_trip_not_found(self, client: AsyncClient, auth_headers):
        """Test updating non-existent trip"""
        from uuid import uuid4
        fake_id = uuid4()
        
        response = await client.put(
            f"/api/trips/{fake_id}",
            headers=auth_headers,
            json={"name": "Updated"},
        )
        
        assert response.status_code == 404
    
    async def test_update_trip_no_auth(self, client: AsyncClient, test_trip):
        """Test updating trip without authentication fails"""
        response = await client.put(
            f"/api/trips/{test_trip.id}",
            json={"name": "Updated"},
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestDeleteTrip:
    """Test DELETE /api/trips/{trip_id} endpoint (admin only)"""
    
    async def test_delete_trip_success(self, client: AsyncClient, auth_headers, test_day_trip):
        """Test deleting a trip without signups"""
        response = await client.delete(
            f"/api/trips/{test_day_trip.id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 204
    
    async def test_delete_trip_with_signups(self, client: AsyncClient, auth_headers, test_signup):
        """Test deleting trip with signups fails"""
        response = await client.delete(
            f"/api/trips/{test_signup.trip_id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 400
        assert "signups" in response.json()["detail"].lower()
    
    async def test_delete_trip_not_found(self, client: AsyncClient, auth_headers):
        """Test deleting non-existent trip"""
        from uuid import uuid4
        fake_id = uuid4()
        
        response = await client.delete(
            f"/api/trips/{fake_id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 400
    
    async def test_delete_trip_no_auth(self, client: AsyncClient, test_day_trip):
        """Test deleting trip without authentication fails"""
        response = await client.delete(f"/api/trips/{test_day_trip.id}")
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestGetTripSignups:
    """Test GET /api/trips/{trip_id}/signups endpoint (admin only)"""
    
    async def test_get_trip_signups_success(self, client: AsyncClient, auth_headers, test_trip, test_signup):
        """Test getting signups for a trip"""
        response = await client.get(
            f"/api/trips/{test_trip.id}/signups",
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
    
    async def test_get_trip_signups_empty(self, client: AsyncClient, auth_headers, test_day_trip):
        """Test getting signups for trip with no signups"""
        response = await client.get(
            f"/api/trips/{test_day_trip.id}/signups",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["signups"]) == 0
        assert data["total"] == 0
    
    async def test_get_trip_signups_not_found(self, client: AsyncClient, auth_headers):
        """Test getting signups for non-existent trip"""
        from uuid import uuid4
        fake_id = uuid4()
        
        response = await client.get(
            f"/api/trips/{fake_id}/signups",
            headers=auth_headers,
        )
        
        assert response.status_code == 404
    
    async def test_get_trip_signups_no_auth(self, client: AsyncClient, test_trip):
        """Test getting trip signups without authentication fails"""
        response = await client.get(f"/api/trips/{test_trip.id}/signups")
        
        assert response.status_code == 403