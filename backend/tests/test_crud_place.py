"""Tests for place CRUD functions"""
import pytest
from uuid import uuid4

from app.crud import place as crud_place
from app.schemas.place import PlaceCreate, PlaceUpdate

pytestmark = pytest.mark.asyncio


class TestGetPlace:
    async def test_get_place_success(self, db_session):
        """Test getting a place by ID"""
        place = await crud_place.create_place(
            db_session,
            PlaceCreate(name="Test Camp", address="123 Test St, City, ST 12345")
        )
        fetched = await crud_place.get_place(db_session, place.id)
        assert fetched is not None
        assert fetched.id == place.id
        assert fetched.name == "Test Camp"

    async def test_get_place_not_found(self, db_session):
        """Test getting non-existent place"""
        result = await crud_place.get_place(db_session, uuid4())
        assert result is None


class TestGetPlaces:
    async def test_get_places_list(self, db_session):
        """Test getting list of places"""
        place1 = await crud_place.create_place(
            db_session,
            PlaceCreate(name="Alpha Camp", address="123 Alpha St")
        )
        place2 = await crud_place.create_place(
            db_session,
            PlaceCreate(name="Beta Camp", address="456 Beta St")
        )
        
        places = await crud_place.get_places(db_session)
        assert len(places) >= 2
        place_names = [p.name for p in places]
        assert "Alpha Camp" in place_names
        assert "Beta Camp" in place_names

    async def test_get_places_pagination(self, db_session):
        """Test pagination of places"""
        for i in range(5):
            await crud_place.create_place(
                db_session,
                PlaceCreate(name=f"Camp {i}", address=f"{i} Street")
            )
        
        # Get first 2
        page1 = await crud_place.get_places(db_session, skip=0, limit=2)
        assert len(page1) == 2
        
        # Get next 2
        page2 = await crud_place.get_places(db_session, skip=2, limit=2)
        assert len(page2) == 2
        
        # Verify different results
        assert page1[0].id != page2[0].id

    async def test_get_places_search_by_name(self, db_session):
        """Test searching places by name"""
        await crud_place.create_place(
            db_session,
            PlaceCreate(name="Mountain Camp", address="123 Mountain Rd")
        )
        await crud_place.create_place(
            db_session,
            PlaceCreate(name="Beach Camp", address="456 Beach Ave")
        )
        
        results = await crud_place.get_places(db_session, search="Mountain")
        assert len(results) >= 1
        assert any("Mountain" in p.name for p in results)

    async def test_get_places_search_by_address(self, db_session):
        """Test searching places by address"""
        await crud_place.create_place(
            db_session,
            PlaceCreate(name="Camp A", address="123 Yosemite Valley")
        )
        
        results = await crud_place.get_places(db_session, search="Yosemite")
        assert len(results) >= 1
        assert any("Yosemite" in p.address for p in results)

    async def test_get_places_search_case_insensitive(self, db_session):
        """Test that search is case-insensitive"""
        await crud_place.create_place(
            db_session,
            PlaceCreate(name="UPPERCASE CAMP", address="123 St")
        )
        
        results = await crud_place.get_places(db_session, search="uppercase")
        assert len(results) >= 1


class TestCreatePlace:
    async def test_create_place_basic(self, db_session):
        """Test creating a place with basic info"""
        place_data = PlaceCreate(
            name="New Campground",
            address="789 Camp Rd, City, ST 99999"
        )
        
        place = await crud_place.create_place(db_session, place_data)
        assert place.id is not None
        assert place.name == "New Campground"
        assert place.address == "789 Camp Rd, City, ST 99999"
        assert place.created_at is not None

    async def test_create_place_with_google_maps_url(self, db_session):
        """Test creating a place with explicit Google Maps URL"""
        place_data = PlaceCreate(
            name="Custom URL Camp",
            address="123 Custom St",
            google_maps_url="https://custom.url"
        )
        
        place = await crud_place.create_place(db_session, place_data)
        assert place.google_maps_url == "https://custom.url"

    async def test_create_place_auto_generates_google_maps_url(self, db_session):
        """Test that Google Maps URL is auto-generated when not provided"""
        place_data = PlaceCreate(
            name="Auto URL Camp",
            address="456 Auto St, City, ST"
        )
        
        place = await crud_place.create_place(db_session, place_data)
        assert place.google_maps_url is not None
        assert "google.com/maps" in place.google_maps_url


class TestUpdatePlace:
    async def test_update_place_name(self, db_session):
        """Test updating place name"""
        place = await crud_place.create_place(
            db_session,
            PlaceCreate(name="Original", address="123 St")
        )
        
        updated = await crud_place.update_place(
            db_session,
            place.id,
            PlaceUpdate(name="Updated Name")
        )
        assert updated is not None
        assert updated.name == "Updated Name"
        assert updated.address == "123 St"  # Unchanged

    async def test_update_place_address(self, db_session):
        """Test updating place address"""
        place = await crud_place.create_place(
            db_session,
            PlaceCreate(name="Place", address="Old Address")
        )
        
        updated = await crud_place.update_place(
            db_session,
            place.id,
            PlaceUpdate(address="New Address")
        )
        assert updated is not None
        assert updated.address == "New Address"

    async def test_update_place_address_regenerates_google_maps_url(self, db_session):
        """Test that updating address regenerates Google Maps URL"""
        place = await crud_place.create_place(
            db_session,
            PlaceCreate(name="Place", address="Old Address")
        )
        original_url = place.google_maps_url
        
        updated = await crud_place.update_place(
            db_session,
            place.id,
            PlaceUpdate(address="New Address")
        )
        assert updated.google_maps_url != original_url
        assert "New" in updated.google_maps_url and "Address" in updated.google_maps_url

    async def test_update_place_with_explicit_google_maps_url(self, db_session):
        """Test updating place with explicit Google Maps URL doesn't get overridden"""
        place = await crud_place.create_place(
            db_session,
            PlaceCreate(name="Place", address="Address")
        )
        
        custom_url = "https://custom.google.maps.url"
        updated = await crud_place.update_place(
            db_session,
            place.id,
            PlaceUpdate(address="New Address", google_maps_url=custom_url)
        )
        assert updated.google_maps_url == custom_url

    async def test_update_place_not_found(self, db_session):
        """Test updating non-existent place"""
        result = await crud_place.update_place(
            db_session,
            uuid4(),
            PlaceUpdate(name="Updated")
        )
        assert result is None


class TestDeletePlace:
    async def test_delete_place_success(self, db_session):
        """Test deleting a place"""
        place = await crud_place.create_place(
            db_session,
            PlaceCreate(name="To Delete", address="123 Delete St")
        )
        
        success = await crud_place.delete_place(db_session, place.id)
        assert success is True
        
        # Verify it's gone
        deleted = await crud_place.get_place(db_session, place.id)
        assert deleted is None

    async def test_delete_place_not_found(self, db_session):
        """Test deleting non-existent place"""
        success = await crud_place.delete_place(db_session, uuid4())
        assert success is False


class TestSearchPlacesByName:
    async def test_search_places_by_name(self, db_session):
        """Test searching places by name for autocomplete"""
        await crud_place.create_place(
            db_session,
            PlaceCreate(name="Yellowstone Camp", address="123 St")
        )
        await crud_place.create_place(
            db_session,
            PlaceCreate(name="Yosemite Camp", address="456 St")
        )
        await crud_place.create_place(
            db_session,
            PlaceCreate(name="Grand Canyon Camp", address="789 St")
        )
        
        results = await crud_place.search_places_by_name(db_session, "Yellow")
        assert len(results) >= 1
        assert any("Yellowstone" in p.name for p in results)

    async def test_search_places_by_name_limit(self, db_session):
        """Test that search respects limit parameter"""
        for i in range(15):
            await crud_place.create_place(
                db_session,
                PlaceCreate(name=f"Test Camp {i}", address=f"{i} St")
            )
        
        results = await crud_place.search_places_by_name(db_session, "Test", limit=5)
        assert len(results) == 5

    async def test_search_places_by_name_no_results(self, db_session):
        """Test searching with no matches"""
        results = await crud_place.search_places_by_name(db_session, "NonexistentPlace")
        assert len(results) == 0


class TestGetOrCreatePlace:
    async def test_get_or_create_new_place(self, db_session):
        """Test creating a new place when it doesn't exist"""
        place = await crud_place.get_or_create_place(
            db_session,
            name="New Place",
            address="New Address"
        )
        assert place.id is not None
        assert place.name == "New Place"
        assert place.address == "New Address"

    async def test_get_or_create_existing_place(self, db_session):
        """Test returning existing place when it matches"""
        # Create initial place
        existing = await crud_place.create_place(
            db_session,
            PlaceCreate(name="Existing Place", address="Existing Address")
        )
        
        # Try to get or create with same name and address
        place = await crud_place.get_or_create_place(
            db_session,
            name="Existing Place",
            address="Existing Address"
        )
        
        # Should return the existing place, not create new one
        assert place.id == existing.id

    async def test_get_or_create_different_address(self, db_session):
        """Test creating new place when name matches but address differs"""
        await crud_place.create_place(
            db_session,
            PlaceCreate(name="Camp Alpha", address="Address 1")
        )
        
        # Same name, different address should create new place
        place = await crud_place.get_or_create_place(
            db_session,
            name="Camp Alpha",
            address="Address 2"
        )
        
        assert place.address == "Address 2"
        
        # Verify both exist
        all_places = await crud_place.get_places(db_session, search="Camp Alpha")
        assert len(all_places) >= 2
