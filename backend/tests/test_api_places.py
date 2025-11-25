"""Tests for api/endpoints/places.py"""
import pytest
from httpx import AsyncClient
from uuid import uuid4


@pytest.mark.asyncio
class TestListPlaces:
    """Test GET /api/places endpoint"""
    
    async def test_list_places_success(self, client: AsyncClient, auth_headers, test_place):
        """Test getting all places"""
        response = await client.get(
            "/api/places",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Verify structure
        place = data[0]
        assert "id" in place
        assert "name" in place
        assert "address" in place
    
    async def test_list_places_empty(self, client: AsyncClient, auth_headers, db_session):
        """Test listing places when none exist"""
        # Clear places
        from app.models.place import Place
        from sqlalchemy import delete
        await db_session.execute(delete(Place))
        await db_session.commit()
        
        response = await client.get(
            "/api/places",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    async def test_list_places_no_auth(self, client: AsyncClient):
        """Test getting places without authentication"""
        response = await client.get("/api/places")
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestGetPlace:
    """Test GET /api/places/{place_id} endpoint"""
    
    async def test_get_place_success(self, client: AsyncClient, auth_headers, test_place):
        """Test getting a specific place"""
        response = await client.get(
            f"/api/places/{test_place.id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_place.id)
        assert data["name"] == test_place.name
        assert data["address"] == test_place.address
    
    async def test_get_place_not_found(self, client: AsyncClient, auth_headers):
        """Test getting non-existent place"""
        fake_id = uuid4()
        response = await client.get(
            f"/api/places/{fake_id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 404
    
    async def test_get_place_no_auth(self, client: AsyncClient, test_place):
        """Test getting place without authentication"""
        response = await client.get(f"/api/places/{test_place.id}")
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestCreatePlace:
    """Test POST /api/places endpoint"""
    
    async def test_create_place_success(self, client: AsyncClient, auth_headers):
        """Test creating a new place"""
        place_data = {
            "name": "New Campground",
            "address": "456 New Camp Rd, Forest, ST 54321",
        }
        
        response = await client.post(
            "/api/places",
            headers=auth_headers,
            json=place_data,
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Campground"
        assert data["address"] == "456 New Camp Rd, Forest, ST 54321"
        assert "id" in data
        assert "created_at" in data
    
    async def test_create_place_duplicate_name(self, client: AsyncClient, auth_headers, test_place):
        """Test creating place with duplicate name"""
        place_data = {
            "name": test_place.name,
            "address": "Different Address",
        }
        
        response = await client.post(
            "/api/places",
            headers=auth_headers,
            json=place_data,
        )
        
        # Should succeed - duplicate names are allowed
        assert response.status_code == 201
    
    async def test_create_place_missing_required_fields(self, client: AsyncClient, auth_headers):
        """Test creating place with missing required fields"""
        place_data = {
            "name": "Incomplete Place",
            # Missing address
        }
        
        response = await client.post(
            "/api/places",
            headers=auth_headers,
            json=place_data,
        )
        
        assert response.status_code == 422
    
    async def test_create_place_no_auth(self, client: AsyncClient):
        """Test creating place without authentication"""
        place_data = {
            "name": "New Place",
            "address": "123 Address",
        }
        
        response = await client.post(
            "/api/places",
            json=place_data,
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestUpdatePlace:
    """Test PUT /api/places/{place_id} endpoint"""
    
    async def test_update_place_success(self, client: AsyncClient, auth_headers, test_place):
        """Test updating a place"""
        update_data = {
            "name": "Updated Campground Name",
            "address": "Updated Address",
        }
        
        response = await client.put(
            f"/api/places/{test_place.id}",
            headers=auth_headers,
            json=update_data,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Campground Name"
        assert data["address"] == "Updated Address"
    
    async def test_update_place_partial(self, client: AsyncClient, auth_headers, test_place):
        """Test partially updating a place"""
        update_data = {
            "name": "Only Name Updated",
        }
        
        response = await client.put(
            f"/api/places/{test_place.id}",
            headers=auth_headers,
            json=update_data,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Only Name Updated"
        # Address should remain unchanged
        assert data["address"] == test_place.address
    
    async def test_update_place_not_found(self, client: AsyncClient, auth_headers):
        """Test updating non-existent place"""
        fake_id = uuid4()
        response = await client.put(
            f"/api/places/{fake_id}",
            headers=auth_headers,
            json={"name": "Updated"},
        )
        
        assert response.status_code == 404
    
    async def test_update_place_no_auth(self, client: AsyncClient, test_place):
        """Test updating place without authentication"""
        response = await client.put(
            f"/api/places/{test_place.id}",
            json={"name": "Updated"},
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestDeletePlace:
    """Test DELETE /api/places/{place_id} endpoint"""
    
    async def test_delete_place_success(self, client: AsyncClient, auth_headers, db_session):
        """Test deleting a place"""
        from app.models.place import Place
        
        # Create a place to delete
        place = Place(
            id=uuid4(),
            name="To Delete",
            address="Delete Address",
        )
        db_session.add(place)
        await db_session.commit()
        
        response = await client.delete(
            f"/api/places/{place.id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 204
    
    async def test_delete_place_not_found(self, client: AsyncClient, auth_headers):
        """Test deleting non-existent place"""
        fake_id = uuid4()
        response = await client.delete(
            f"/api/places/{fake_id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 404
    
    async def test_delete_place_no_auth(self, client: AsyncClient, test_place):
        """Test deleting place without authentication"""
        response = await client.delete(f"/api/places/{test_place.id}")
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestSearchPlaces:
    """Test GET /api/places/search/{name} endpoint"""
    
    async def test_search_places_success(self, client: AsyncClient, auth_headers, test_place):
        """Test searching for places by name"""
        response = await client.get(
            f"/api/places/search/{test_place.name[:4]}",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Verify the place is in results
        place_names = [p["name"] for p in data]
        assert test_place.name in place_names
    
    async def test_search_places_case_insensitive(self, client: AsyncClient, auth_headers, test_place):
        """Test that search is case-insensitive"""
        search_term = test_place.name[:4].lower()
        response = await client.get(
            f"/api/places/search/{search_term}",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        place_names = [p["name"] for p in data]
        assert test_place.name in place_names
    
    async def test_search_places_no_results(self, client: AsyncClient, auth_headers):
        """Test searching with no matching results"""
        response = await client.get(
            "/api/places/search/zzzznonexistent",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    async def test_search_places_no_auth(self, client: AsyncClient):
        """Test searching places without authentication"""
        response = await client.get("/api/places/search/test")
        
        assert response.status_code == 403
