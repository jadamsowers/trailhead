"""Tests for database models"""
import pytest
from datetime import date, timedelta

from app.models.trip import Trip
from app.models.signup import Signup
from app.models.participant import Participant, DietaryRestriction, Allergy
from app.models.user import User


@pytest.mark.asyncio
class TestTripModel:
    """Test Trip model"""
    
    async def test_trip_creation(self, db_session):
        """Test creating a trip"""
        trip = Trip(
            name="Test Trip",
            trip_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            location="Test Location",
            description="Test Description",
            max_participants=20,
            is_overnight=True,
        )
        
        db_session.add(trip)
        await db_session.commit()
        await db_session.refresh(trip)
        
        assert trip.id is not None
        assert trip.name == "Test Trip"
        assert trip.created_at is not None
        assert trip.updated_at is not None
    
    async def test_trip_signup_count_property(self, db_session, test_trip, test_signup):
        """Test signup_count computed property"""
        from app.crud import trip as crud_trip
        
        trip = await crud_trip.get_trip(db_session, test_trip.id)
        
        # test_signup has 2 participants
        assert trip.signup_count == 2
    
    async def test_trip_available_spots_property(self, db_session, test_trip, test_signup):
        """Test available_spots computed property"""
        from app.crud import trip as crud_trip
        
        trip = await crud_trip.get_trip(db_session, test_trip.id)
        
        expected = test_trip.max_participants - 2
        assert trip.available_spots == expected
    
    async def test_trip_is_full_property(self, db_session):
        """Test is_full computed property"""
        trip = Trip(
            name="Small Trip",
            trip_date=date.today() + timedelta(days=30),
            location="Test",
            max_participants=1,
        )
        db_session.add(trip)
        await db_session.commit()
        await db_session.refresh(trip)
        
        assert trip.is_full is False
        
        # Add signup to fill trip
        signup = Signup(
            trip_id=trip.id,
            family_contact_name="Test",
            family_contact_email="test@test.com",
            family_contact_phone="555-0000",
        )
        db_session.add(signup)
        await db_session.flush()
        
        participant = Participant(
            signup_id=signup.id,
            name="Test Person",
            age=14,
            participant_type="scout",
            is_adult=False,
            gender="male",
        )
        db_session.add(participant)
        await db_session.commit()
        await db_session.refresh(trip)
        
        assert trip.is_full is True
    
    async def test_trip_repr(self, test_trip):
        """Test trip string representation"""
        repr_str = repr(test_trip)
        
        assert "Trip" in repr_str
        assert str(test_trip.id) in repr_str
        assert test_trip.name in repr_str


@pytest.mark.asyncio
class TestSignupModel:
    """Test Signup model"""
    
    async def test_signup_creation(self, db_session, test_trip):
        """Test creating a signup"""
        signup = Signup(
            trip_id=test_trip.id,
            family_contact_name="Test Family",
            family_contact_email="test@example.com",
            family_contact_phone="555-1234",
        )
        
        db_session.add(signup)
        await db_session.commit()
        await db_session.refresh(signup)
        
        assert signup.id is not None
        assert signup.trip_id == test_trip.id
        assert signup.created_at is not None
    
    async def test_signup_participant_count_property(self, db_session, test_signup):
        """Test participant_count computed property"""
        from app.crud import signup as crud_signup
        
        signup = await crud_signup.get_signup(db_session, test_signup.id)
        
        assert signup.participant_count == len(signup.participants)
    
    async def test_signup_scout_count_property(self, db_session, test_signup):
        """Test scout_count computed property"""
        from app.crud import signup as crud_signup
        
        signup = await crud_signup.get_signup(db_session, test_signup.id)
        
        scouts = [p for p in signup.participants if p.participant_type == "scout"]
        assert signup.scout_count == len(scouts)
    
    async def test_signup_adult_count_property(self, db_session, test_signup):
        """Test adult_count computed property"""
        from app.crud import signup as crud_signup
        
        signup = await crud_signup.get_signup(db_session, test_signup.id)
        
        adults = [p for p in signup.participants if p.participant_type == "adult"]
        assert signup.adult_count == len(adults)
    
    async def test_signup_repr(self, test_signup):
        """Test signup string representation"""
        repr_str = repr(test_signup)
        
        assert "Signup" in repr_str
        assert str(test_signup.id) in repr_str
        assert test_signup.family_contact_name in repr_str


@pytest.mark.asyncio
class TestParticipantModel:
    """Test Participant model"""
    
    async def test_participant_creation(self, db_session, test_signup):
        """Test creating a participant"""
        participant = Participant(
            signup_id=test_signup.id,
            name="New Scout",
            age=13,
            participant_type="scout",
            is_adult=False,
            gender="male",
            troop_number="456",
            patrol_name="Wolf Patrol",
            has_youth_protection=False,
            vehicle_capacity=0,
            medical_notes="None",
        )
        
        db_session.add(participant)
        await db_session.commit()
        await db_session.refresh(participant)
        
        assert participant.id is not None
        assert participant.signup_id == test_signup.id
        assert participant.created_at is not None
    
    async def test_participant_with_dietary_restrictions(self, db_session, test_signup):
        """Test participant with dietary restrictions"""
        participant = Participant(
            signup_id=test_signup.id,
            name="Special Scout",
            age=12,
            participant_type="scout",
            is_adult=False,
            gender="female",
        )
        db_session.add(participant)
        await db_session.flush()
        
        # Add dietary restrictions
        restriction1 = DietaryRestriction(
            participant_id=participant.id,
            restriction_type="vegetarian",
        )
        restriction2 = DietaryRestriction(
            participant_id=participant.id,
            restriction_type="gluten-free",
        )
        db_session.add(restriction1)
        db_session.add(restriction2)
        
        await db_session.commit()
        await db_session.refresh(participant)
        
        assert len(participant.dietary_restrictions) == 2
    
    async def test_participant_with_allergies(self, db_session, test_signup):
        """Test participant with allergies"""
        participant = Participant(
            signup_id=test_signup.id,
            name="Allergy Scout",
            age=11,
            participant_type="scout",
            is_adult=False,
            gender="male",
        )
        db_session.add(participant)
        await db_session.flush()
        
        # Add allergies
        allergy1 = Allergy(
            participant_id=participant.id,
            allergy_type="peanuts",
        )
        allergy2 = Allergy(
            participant_id=participant.id,
            allergy_type="shellfish",
        )
        db_session.add(allergy1)
        db_session.add(allergy2)
        
        await db_session.commit()
        await db_session.refresh(participant)
        
        assert len(participant.allergies) == 2
    
    async def test_participant_repr(self, db_session, test_signup):
        """Test participant string representation"""
        participant = Participant(
            signup_id=test_signup.id,
            name="Test Scout",
            age=14,
            participant_type="scout",
            is_adult=False,
            gender="male",
        )
        db_session.add(participant)
        await db_session.commit()
        
        repr_str = repr(participant)
        
        assert "Participant" in repr_str
        assert str(participant.id) in repr_str
        assert participant.name in repr_str


@pytest.mark.asyncio
class TestUserModel:
    """Test User model"""
    
    async def test_user_creation(self, db_session):
        """Test creating a user"""
        from app.core.security import get_password_hash
        
        user = User(
            email="newuser@test.com",
            hashed_password=get_password_hash("password123"),
            full_name="New User",
            role="admin",
            is_active=True,
        )
        
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
        assert user.id is not None
        assert user.email == "newuser@test.com"
        assert user.created_at is not None
        assert user.updated_at is not None
    
    async def test_user_unique_email(self, db_session, test_user):
        """Test that email must be unique"""
        from sqlalchemy.exc import IntegrityError
        from app.core.security import get_password_hash
        
        duplicate_user = User(
            email=test_user.email,  # Same email
            hashed_password=get_password_hash("password123"),
            full_name="Duplicate User",
            role="admin",
        )
        
        db_session.add(duplicate_user)
        
        with pytest.raises(IntegrityError):
            await db_session.commit()
    
    async def test_user_repr(self, test_user):
        """Test user string representation"""
        repr_str = repr(test_user)
        
        assert "User" in repr_str
        assert str(test_user.id) in repr_str
        assert test_user.email in repr_str


@pytest.mark.asyncio
class TestDietaryRestrictionModel:
    """Test DietaryRestriction model"""
    
    async def test_dietary_restriction_creation(self, db_session, test_signup):
        """Test creating a dietary restriction"""
        participant = Participant(
            signup_id=test_signup.id,
            name="Test Scout",
            age=14,
            participant_type="scout",
            is_adult=False,
            gender="male",
        )
        db_session.add(participant)
        await db_session.flush()
        
        restriction = DietaryRestriction(
            participant_id=participant.id,
            restriction_type="vegan",
        )
        db_session.add(restriction)
        await db_session.commit()
        await db_session.refresh(restriction)
        
        assert restriction.id is not None
        assert restriction.participant_id == participant.id
        assert restriction.restriction_type == "vegan"
    
    async def test_dietary_restriction_repr(self, db_session, test_signup):
        """Test dietary restriction string representation"""
        participant = Participant(
            signup_id=test_signup.id,
            name="Test Scout",
            age=14,
            participant_type="scout",
            is_adult=False,
            gender="male",
        )
        db_session.add(participant)
        await db_session.flush()
        
        restriction = DietaryRestriction(
            participant_id=participant.id,
            restriction_type="vegetarian",
        )
        db_session.add(restriction)
        await db_session.commit()
        
        repr_str = repr(restriction)
        
        assert "DietaryRestriction" in repr_str
        assert str(restriction.id) in repr_str


@pytest.mark.asyncio
class TestAllergyModel:
    """Test Allergy model"""
    
    async def test_allergy_creation(self, db_session, test_signup):
        """Test creating an allergy"""
        participant = Participant(
            signup_id=test_signup.id,
            name="Test Scout",
            age=14,
            participant_type="scout",
            is_adult=False,
            gender="male",
        )
        db_session.add(participant)
        await db_session.flush()
        
        allergy = Allergy(
            participant_id=participant.id,
            allergy_type="dairy",
        )
        db_session.add(allergy)
        await db_session.commit()
        await db_session.refresh(allergy)
        
        assert allergy.id is not None
        assert allergy.participant_id == participant.id
        assert allergy.allergy_type == "dairy"
    
    async def test_allergy_repr(self, db_session, test_signup):
        """Test allergy string representation"""
        participant = Participant(
            signup_id=test_signup.id,
            name="Test Scout",
            age=14,
            participant_type="scout",
            is_adult=False,
            gender="male",
        )
        db_session.add(participant)
        await db_session.flush()
        
        allergy = Allergy(
            participant_id=participant.id,
            allergy_type="peanuts",
        )
        db_session.add(allergy)
        await db_session.commit()
        
        repr_str = repr(allergy)
        
        assert "Allergy" in repr_str
        assert str(allergy.id) in repr_str


@pytest.mark.asyncio
class TestModelRelationships:
    """Test model relationships and cascades"""
    
    async def test_trip_signup_relationship(self, db_session, test_trip, test_signup):
        """Test trip-signup relationship"""
        from app.crud import trip as crud_trip
        
        trip = await crud_trip.get_trip(db_session, test_trip.id)
        
        assert len(trip.signups) > 0
        assert test_signup.id in [s.id for s in trip.signups]
    
    async def test_signup_participant_relationship(self, db_session, test_signup):
        """Test signup-participant relationship"""
        from app.crud import signup as crud_signup
        
        signup = await crud_signup.get_signup(db_session, test_signup.id)
        
        assert len(signup.participants) > 0
    
    async def test_delete_signup_cascades_to_participants(self, db_session, test_trip):
        """Test deleting signup cascades to participants"""
        from app.crud import signup as crud_signup
        from app.schemas.signup import SignupCreate, ParticipantCreate, FamilyContact
        
        # Create signup with participant
        signup_data = SignupCreate(
            trip_id=test_trip.id,
            family_contact=FamilyContact(
                name="Test",
                email="test@test.com",
                phone="555-0000",
            ),
            participants=[
                ParticipantCreate(
                    name="Test Scout",
                    age=14,
                    participant_type="scout",
                    is_adult=False,
                    gender="male",
                    troop_number="123",
                    patrol_name="Test",
                    has_youth_protection=False,
                    vehicle_capacity=0,
                    dietary_restrictions=[],
                    allergies=[],
                    medical_notes=None,
                ),
            ],
        )
        
        signup = await crud_signup.create_signup(db_session, signup_data)
        participant_id = signup.participants[0].id
        
        # Delete signup
        await crud_signup.delete_signup(db_session, signup.id)
        
        # Verify participant is also deleted
        from sqlalchemy import select
        result = await db_session.execute(
            select(Participant).where(Participant.id == participant_id)
        )
        participant = result.scalar_one_or_none()
        
        assert participant is None