"""Tests for place schema validators"""
import pytest
from datetime import datetime
from uuid import uuid4
from pydantic import ValidationError

from app.schemas.place import (
    PlaceBase,
    PlaceCreate,
    PlaceUpdate,
    PlaceResponse,
)


class TestPlaceBase:
    """Tests for PlaceBase schema"""

    def test_valid_place_basic(self):
        """Test creating a valid place with minimal fields"""
        place = PlaceBase(
            name="Test Campground",
            address="123 Camp Road, City, ST 12345"
        )
        assert place.name == "Test Campground"
        assert place.address == "123 Camp Road, City, ST 12345"
        assert place.google_maps_url is None

    def test_place_with_google_maps_url(self):
        """Test place with Google Maps URL"""
        place = PlaceBase(
            name="Test Location",
            address="456 Test Street, Town, ST 67890",
            google_maps_url="https://maps.google.com/?q=456+Test+Street"
        )
        assert place.google_maps_url == "https://maps.google.com/?q=456+Test+Street"

    def test_missing_name_raises_error(self):
        """Test that missing name raises validation error"""
        with pytest.raises(ValidationError):
            PlaceBase(address="123 Test Street")

    def test_missing_address_raises_error(self):
        """Test that missing address raises validation error"""
        with pytest.raises(ValidationError):
            PlaceBase(name="Test Place")


class TestPlaceCreate:
    """Tests for PlaceCreate schema"""

    def test_create_place_basic(self):
        """Test creating a place with required fields"""
        place = PlaceCreate(
            name="New Campground",
            address="789 Forest Road, Woods, ST 11111"
        )
        assert place.name == "New Campground"
        assert place.address == "789 Forest Road, Woods, ST 11111"

    def test_create_place_with_optional(self):
        """Test creating a place with all fields"""
        place = PlaceCreate(
            name="New Location",
            address="321 Main Street",
            google_maps_url="https://maps.google.com/test"
        )
        assert place.google_maps_url is not None


class TestPlaceUpdate:
    """Tests for PlaceUpdate schema"""

    def test_update_name_only(self):
        """Test updating only the name"""
        update = PlaceUpdate(name="Updated Name")
        assert update.name == "Updated Name"
        assert update.address is None
        assert update.google_maps_url is None

    def test_update_address_only(self):
        """Test updating only the address"""
        update = PlaceUpdate(address="999 New Street")
        assert update.name is None
        assert update.address == "999 New Street"

    def test_update_google_maps_url_only(self):
        """Test updating only the Google Maps URL"""
        update = PlaceUpdate(google_maps_url="https://maps.google.com/new")
        assert update.name is None
        assert update.address is None
        assert update.google_maps_url == "https://maps.google.com/new"

    def test_update_all_fields(self):
        """Test updating all fields"""
        update = PlaceUpdate(
            name="Fully Updated",
            address="123 Updated Street",
            google_maps_url="https://maps.google.com/updated"
        )
        assert update.name == "Fully Updated"
        assert update.address == "123 Updated Street"
        assert update.google_maps_url == "https://maps.google.com/updated"

    def test_empty_update(self):
        """Test update with no fields (all None)"""
        update = PlaceUpdate()
        assert update.name is None
        assert update.address is None
        assert update.google_maps_url is None


class TestPlaceResponse:
    """Tests for PlaceResponse schema"""

    def test_valid_response(self):
        """Test creating a valid place response"""
        now = datetime.now()
        place = PlaceResponse(
            id=uuid4(),
            name="Test Campground",
            address="123 Camp Road",
            google_maps_url="https://maps.google.com/test",
            created_at=now,
            updated_at=now
        )
        assert place.name == "Test Campground"
        assert place.address == "123 Camp Road"
        assert place.created_at == now
        assert place.updated_at == now

    def test_response_without_google_maps_url(self):
        """Test response with no Google Maps URL"""
        now = datetime.now()
        place = PlaceResponse(
            id=uuid4(),
            name="Test Location",
            address="456 Test Street",
            google_maps_url=None,
            created_at=now,
            updated_at=now
        )
        assert place.google_maps_url is None

    def test_response_id_is_uuid(self):
        """Test that response ID is a valid UUID"""
        place_id = uuid4()
        now = datetime.now()
        place = PlaceResponse(
            id=place_id,
            name="Test",
            address="Test Address",
            created_at=now,
            updated_at=now
        )
        assert place.id == place_id
