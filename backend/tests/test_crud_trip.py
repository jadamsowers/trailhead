"""Tests for crud/trip.py"""
import pytest
from datetime import date, timedelta
from uuid import uuid4

from app.crud import trip as crud_trip
from app.schemas.trip import TripCreate, TripUpdate
from app.models.trip import Trip


@pytest.mark.asyncio
class TestGetTrip:
    """Test get_trip function"""
    
    async def test_get_existing_trip(self, db_session, test_trip):
        """Test getting an existing trip"""
        result = await crud_trip.get_trip(db_session, test_trip.id)
        
        assert result is not None
        assert result.id == test_trip.id
        assert result.name == test_trip.name
        assert result.location == test_trip.location
    
    async def test_get_nonexistent_trip(self, db_session):
        """Test getting a non-existent trip returns None"""
        fake_id = uuid4()
        result = await crud_trip.get_trip(db_session, fake_id)
        
        assert result is None


@pytest.mark.asyncio
class TestGetTrips:
    """Test get_trips function"""
    
    async def test_get_all_trips(self, db_session, test_trip, test_day_trip):
        """Test getting all trips"""
        trips = await crud_trip.get_trips(db_session)
        
        assert len(trips) >= 2
        trip_ids = [t.id for t in trips]
        assert test_trip.id in trip_ids
        assert test_day_trip.id in trip_ids
    
    async def test_get_trips_with_pagination(self, db_session, test_trip, test_day_trip):
        """Test getting trips with pagination"""
        trips = await crud_trip.get_trips(db_session, skip=0, limit=1)
        
        assert len(trips) == 1
    
    async def test_get_trips_ordered_by_date(self, db_session):
        """Test trips are ordered by date descending"""
        # Create trips with different dates
        trip1 = Trip(
            name="Future Trip",
            trip_date=date.today() + timedelta(days=60),
            location="Location 1",
            max_participants=20,
        )
        trip2 = Trip(
            name="Near Trip",
            trip_date=date.today() + timedelta(days=30),
            location="Location 2",
            max_participants=20,
        )
        db_session.add(trip1)
        db_session.add(trip2)
        await db_session.commit()
        
        trips = await crud_trip.get_trips(db_session)
        
        # Should be ordered by date descending (newest first)
        assert trips[0].trip_date >= trips[1].trip_date


@pytest.mark.asyncio
class TestGetAvailableTrips:
    """Test get_available_trips function"""
    
    async def test_get_available_trips_excludes_full(self, db_session):
        """Test that full trips are excluded from available trips"""
        # Create a trip with 2 max participants
        trip = Trip(
            name="Small Trip",
            trip_date=date.today() + timedelta(days=30),
            location="Test Location",
            max_participants=2,
            is_overnight=False,
        )
        db_session.add(trip)
        await db_session.commit()
        await db_session.refresh(trip)
        
        # Initially should be available
        available = await crud_trip.get_available_trips(db_session)
        assert trip.id in [t.id for t in available]
        
        # Add signups to fill the trip
        from app.models.signup import Signup
        from app.models.participant import Participant
        
        signup = Signup(
            trip_id=trip.id,
            family_contact_name="Test Family",
            family_contact_email="test@example.com",
            family_contact_phone="555-0000",
        )
        db_session.add(signup)
        await db_session.flush()
        
        # Add 2 participants to fill the trip
        for i in range(2):
            participant = Participant(
                signup_id=signup.id,
                name=f"Participant {i}",
                age=14,
                participant_type="scout",
                is_adult=False,
                gender="male",
            )
            db_session.add(participant)
        
        await db_session.commit()
        await db_session.refresh(trip)
        
        # Now should not be available
        available = await crud_trip.get_available_trips(db_session)
        assert trip.id not in [t.id for t in available]
    
    async def test_get_available_trips_ordered_by_date(self, db_session):
        """Test available trips are ordered by date ascending"""
        trips = await crud_trip.get_available_trips(db_session)
        
        if len(trips) > 1:
            for i in range(len(trips) - 1):
                assert trips[i].trip_date <= trips[i + 1].trip_date


@pytest.mark.asyncio
class TestCreateTrip:
    """Test create_trip function"""
    
    async def test_create_trip(self, db_session):
        """Test creating a new trip"""
        trip_data = TripCreate(
            name="New Test Trip",
            trip_date=date.today() + timedelta(days=45),
            end_date=date.today() + timedelta(days=47),
            location="New Location",
            description="A new test trip",
            max_participants=25,
            is_overnight=True,
        )
        
        result = await crud_trip.create_trip(db_session, trip_data)
        
        assert result.id is not None
        assert result.name == trip_data.name
        assert result.trip_date == trip_data.trip_date
        assert result.end_date == trip_data.end_date
        assert result.location == trip_data.location
        assert result.description == trip_data.description
        assert result.max_participants == trip_data.max_participants
        assert result.is_overnight == trip_data.is_overnight
        assert result.created_at is not None
        assert result.updated_at is not None
    
    async def test_create_day_trip(self, db_session):
        """Test creating a day trip without end_date"""
        trip_data = TripCreate(
            name="Day Hike",
            trip_date=date.today() + timedelta(days=20),
            end_date=None,
            location="Trail Head",
            description="Day hike",
            max_participants=15,
            is_overnight=False,
        )
        
        result = await crud_trip.create_trip(db_session, trip_data)
        
        assert result.end_date is None
        assert result.is_overnight is False


@pytest.mark.asyncio
class TestUpdateTrip:
    """Test update_trip function"""
    
    async def test_update_trip(self, db_session, test_trip):
        """Test updating an existing trip"""
        update_data = TripUpdate(
            name="Updated Trip Name",
            location="Updated Location",
            max_participants=30,
        )
        
        result = await crud_trip.update_trip(db_session, test_trip.id, update_data)
        
        assert result is not None
        assert result.id == test_trip.id
        assert result.name == "Updated Trip Name"
        assert result.location == "Updated Location"
        assert result.max_participants == 30
    
    async def test_update_nonexistent_trip(self, db_session):
        """Test updating a non-existent trip returns None"""
        fake_id = uuid4()
        update_data = TripUpdate(name="Updated Name")
        
        result = await crud_trip.update_trip(db_session, fake_id, update_data)
        
        assert result is None
    
    async def test_partial_update(self, db_session, test_trip):
        """Test partial update of trip"""
        original_location = test_trip.location
        update_data = TripUpdate(name="New Name Only")
        
        result = await crud_trip.update_trip(db_session, test_trip.id, update_data)
        
        assert result.name == "New Name Only"
        assert result.location == original_location


@pytest.mark.asyncio
class TestDeleteTrip:
    """Test delete_trip function"""
    
    async def test_delete_trip_without_signups(self, db_session, test_day_trip):
        """Test deleting a trip without signups"""
        trip_id = test_day_trip.id
        
        result = await crud_trip.delete_trip(db_session, trip_id)
        
        assert result is True
        
        # Verify trip is deleted
        deleted_trip = await crud_trip.get_trip(db_session, trip_id)
        assert deleted_trip is None
    
    async def test_delete_trip_with_signups(self, db_session, test_signup):
        """Test deleting a trip with signups fails"""
        trip_id = test_signup.trip_id
        
        result = await crud_trip.delete_trip(db_session, trip_id)
        
        assert result is False
        
        # Verify trip still exists
        trip = await crud_trip.get_trip(db_session, trip_id)
        assert trip is not None
    
    async def test_delete_nonexistent_trip(self, db_session):
        """Test deleting a non-existent trip returns False"""
        fake_id = uuid4()
        
        result = await crud_trip.delete_trip(db_session, fake_id)
        
        assert result is False


@pytest.mark.asyncio
class TestGetTripCount:
    """Test get_trip_count function"""
    
    async def test_get_trip_count(self, db_session, test_trip, test_day_trip):
        """Test getting total trip count"""
        count = await crud_trip.get_trip_count(db_session)
        
        assert count >= 2
    
    async def test_get_trip_count_empty(self, db_session):
        """Test getting trip count when no trips exist"""
        # Delete all trips
        from sqlalchemy import delete
        await db_session.execute(delete(Trip))
        await db_session.commit()
        
        count = await crud_trip.get_trip_count(db_session)
        
        assert count == 0


@pytest.mark.asyncio
class TestTripProperties:
    """Test Trip model computed properties"""
    
    async def test_signup_count(self, db_session, test_trip, test_signup):
        """Test signup_count property"""
        trip = await crud_trip.get_trip(db_session, test_trip.id)
        
        # test_signup has 2 participants
        assert trip.signup_count == 2
    
    async def test_available_spots(self, db_session, test_trip, test_signup):
        """Test available_spots property"""
        trip = await crud_trip.get_trip(db_session, test_trip.id)
        
        expected_available = test_trip.max_participants - 2
        assert trip.available_spots == expected_available
    
    async def test_is_full(self, db_session):
        """Test is_full property"""
        # Create trip with 2 max participants
        trip = Trip(
            name="Small Trip",
            trip_date=date.today() + timedelta(days=30),
            location="Test Location",
            max_participants=2,
        )
        db_session.add(trip)
        await db_session.commit()
        await db_session.refresh(trip)
        
        assert trip.is_full is False
        
        # Add signup with 2 participants
        from app.models.signup import Signup
        from app.models.participant import Participant
        
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
        await db_session.refresh(trip)
        
        assert trip.is_full is True