"""Tests for database models"""
import pytest
from datetime import date, timedelta

from app.models.outing import Outing
from app.models.signup import Signup
from app.models.participant import Participant
from app.models.family import FamilyMemberDietaryPreference as DietaryRestriction, FamilyMemberAllergy as Allergy
from app.models.user import User


@pytest.mark.asyncio
class TestOutingModel:
    """Test Outing model"""
    
    async def test_outing_creation(self, db_session):
        """Test creating a outing"""
        outing = Outing(
            name="Test Outing",
            outing_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=32),
            location="Test Location",
            description="Test Description",
            max_participants=20,
            is_overnight=True,
        )
        
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        assert outing.id is not None
        assert outing.name == "Test Outing"
        assert outing.created_at is not None
        assert outing.updated_at is not None
    
    async def test_outing_signup_count_property(self, db_session, test_outing, test_signup):
        """Test signup_count computed property"""
        from app.crud import outing as crud_outing
        
        outing = await crud_outing.get_outing(db_session, test_outing.id)
        
        # test_signup has 2 participants
        assert outing.signup_count == 2
    
    async def test_outing_available_spots_property(self, db_session, test_outing, test_signup):
        """Test available_spots computed property"""
        from app.crud import outing as crud_outing
        
        outing = await crud_outing.get_outing(db_session, test_outing.id)
        
        expected = test_outing.max_participants - 2
        assert outing.available_spots == expected
    
    async def test_outing_is_full_property(self, db_session):
        """Test is_full computed property"""
        outing = Outing(
            name="Small Outing",
            outing_date=date.today() + timedelta(days=30),
            location="Test",
            max_participants=1,
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        # Initially not full
        from app.crud import outing as crud_outing
        outing = await crud_outing.get_outing(db_session, outing.id)
        assert outing.is_full is False
        
        # Create a signup via CRUD with a single family member
        from app.crud import signup as crud_signup
        from app.schemas.signup import SignupCreate, FamilyContact
        from app.models.family import FamilyMember
        from app.models.user import User
        user = User(email="temp@test.com", hashed_password="x", full_name="Temp", role="user", is_active=True)
        db_session.add(user)
        await db_session.flush()
        member = FamilyMember(user_id=user.id, name="Test Person", member_type="scout")
        db_session.add(member)
        await db_session.flush()
        signup_data = SignupCreate(
            outing_id=outing.id,
            family_contact=FamilyContact(
                email="test@test.com",
                phone="555-0000",
                emergency_contact_name="EC",
                emergency_contact_phone="555-9999",
            ),
            family_member_ids=[member.id],
        )
        await crud_signup.create_signup(db_session, signup_data)
        
        # Validate via direct count
        from sqlalchemy import select, func
        from app.models.signup import Signup
        from app.models.participant import Participant
        result = await db_session.execute(
            select(func.count()).select_from(Participant)
            .join(Signup)
            .where(Signup.outing_id == outing.id)
        )
        signup_count = result.scalar() or 0
        assert signup_count >= outing.max_participants
    
    async def test_outing_repr(self, test_outing):
        """Test outing string representation"""
        repr_str = repr(test_outing)
        
        assert "Outing" in repr_str
        assert str(test_outing.id) in repr_str
        assert test_outing.name in repr_str


@pytest.mark.asyncio
class TestSignupModel:
    """Test Signup model"""
    
    async def test_signup_creation(self, db_session, test_outing):
        """Test creating a signup"""
        signup = Signup(
            outing_id=test_outing.id,
            family_contact_name="Test Family",
            family_contact_email="test@example.com",
            family_contact_phone="555-1234",
        )
        
        db_session.add(signup)
        await db_session.commit()
        await db_session.refresh(signup)
        
        assert signup.id is not None
        assert signup.outing_id == test_outing.id
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
        from app.models.family import FamilyMember
        from app.models.user import User
        user = User(email="member@test.com", hashed_password="x", full_name="Member", role="user", is_active=True)
        db_session.add(user)
        await db_session.flush()
        member = FamilyMember(user_id=user.id, name="New Scout", member_type="scout")
        db_session.add(member)
        await db_session.flush()
        participant = Participant(signup_id=test_signup.id, family_member_id=member.id)
        
        db_session.add(participant)
        await db_session.commit()
        await db_session.refresh(participant)
        
        assert participant.id is not None
        assert participant.signup_id == test_signup.id
        assert participant.created_at is not None
    
    async def test_participant_with_dietary_restrictions(self, db_session, test_signup):
        """Test participant with dietary restrictions"""
        # Create participant linked to a family member
        from app.models.family import FamilyMember
        from app.models.user import User
        user = User(email="diet@test.com", hashed_password="x", full_name="Diet", role="user", is_active=True)
        db_session.add(user)
        await db_session.flush()
        member = FamilyMember(user_id=user.id, name="Special Scout", member_type="scout")
        db_session.add(member)
        await db_session.flush()
        participant = Participant(signup_id=test_signup.id, family_member_id=member.id)
        db_session.add(participant)
        await db_session.flush()

        # Add dietary preferences to family member
        restriction1 = DietaryRestriction(
            family_member_id=member.id,
            preference="vegetarian",
        )
        restriction2 = DietaryRestriction(
            family_member_id=member.id,
            preference="gluten-free",
        )
        db_session.add(restriction1)
        db_session.add(restriction2)
        
        await db_session.commit()
        # Re-query with eager loads to avoid async lazy-load
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.family import FamilyMember
        result = await db_session.execute(
            select(Participant)
            .options(selectinload(Participant.family_member).selectinload(FamilyMember.dietary_preferences))
            .where(Participant.id == participant.id)
        )
        participant = result.scalar_one()
        assert len(participant.family_member.dietary_preferences) == 2
    
    async def test_participant_with_allergies(self, db_session, test_signup):
        """Test participant with allergies"""
        # Create participant linked to a family member
        from app.models.family import FamilyMember
        from app.models.user import User
        user = User(email="allergy@test.com", hashed_password="x", full_name="Allergy", role="user", is_active=True)
        db_session.add(user)
        await db_session.flush()
        member = FamilyMember(user_id=user.id, name="Allergy Scout", member_type="scout")
        db_session.add(member)
        await db_session.flush()
        participant = Participant(signup_id=test_signup.id, family_member_id=member.id)
        db_session.add(participant)
        await db_session.flush()

        # Add allergies to family member
        allergy1 = Allergy(
            family_member_id=member.id,
            allergy="peanuts",
            severity="moderate",
        )
        allergy2 = Allergy(
            family_member_id=member.id,
            allergy="shellfish",
            severity="mild",
        )
        db_session.add(allergy1)
        db_session.add(allergy2)
        
        await db_session.commit()
        # Re-query with eager loads to avoid async lazy-load
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.models.family import FamilyMember
        result = await db_session.execute(
            select(Participant)
            .options(selectinload(Participant.family_member).selectinload(FamilyMember.allergies))
            .where(Participant.id == participant.id)
        )
        participant = result.scalar_one()
        assert len(participant.family_member.allergies) == 2
    
    async def test_participant_repr(self, db_session, test_signup):
        """Test participant string representation"""
        from app.models.family import FamilyMember
        from app.models.user import User
        user = User(email="repr@test.com", hashed_password="x", full_name="Repr", role="user", is_active=True)
        db_session.add(user)
        await db_session.flush()
        member = FamilyMember(user_id=user.id, name="Test Scout", member_type="scout")
        db_session.add(member)
        await db_session.flush()
        participant = Participant(signup_id=test_signup.id, family_member_id=member.id)
        db_session.add(participant)
        await db_session.commit()
        
        repr_str = repr(participant)
        
        assert "Participant" in repr_str
        assert str(participant.id) in repr_str
        assert str(participant.signup_id) in repr_str


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
        from app.models.family import FamilyMember
        from app.models.user import User
        user = User(email="diet2@test.com", hashed_password="x", full_name="Diet2", role="user", is_active=True)
        db_session.add(user)
        await db_session.flush()
        member = FamilyMember(user_id=user.id, name="Test Scout", member_type="scout")
        db_session.add(member)
        await db_session.flush()

        restriction = DietaryRestriction(
            family_member_id=member.id,
            preference="vegan",
        )
        db_session.add(restriction)
        await db_session.commit()
        await db_session.refresh(restriction)
        
        assert restriction.id is not None
        assert restriction.family_member_id == member.id
        assert restriction.preference == "vegan"
    
    async def test_dietary_restriction_repr(self, db_session, test_signup):
        """Test dietary restriction string representation"""
        from app.models.family import FamilyMember
        from app.models.user import User
        user = User(email="diet3@test.com", hashed_password="x", full_name="Diet3", role="user", is_active=True)
        db_session.add(user)
        await db_session.flush()
        member = FamilyMember(user_id=user.id, name="Test Scout", member_type="scout")
        db_session.add(member)
        await db_session.flush()

        restriction = DietaryRestriction(
            family_member_id=member.id,
            preference="vegetarian",
        )
        db_session.add(restriction)
        await db_session.commit()
        
        repr_str = repr(restriction)
        
        assert "FamilyMemberDietaryPreference" in repr_str
        assert str(restriction.id) in repr_str


@pytest.mark.asyncio
class TestAllergyModel:
    """Test Allergy model"""
    
    async def test_allergy_creation(self, db_session, test_signup):
        """Test creating an allergy"""
        from app.models.family import FamilyMember
        from app.models.user import User
        user = User(email="allergy2@test.com", hashed_password="x", full_name="Allergy2", role="user", is_active=True)
        db_session.add(user)
        await db_session.flush()
        member = FamilyMember(user_id=user.id, name="Test Scout", member_type="scout")
        db_session.add(member)
        await db_session.flush()

        allergy = Allergy(
            family_member_id=member.id,
            allergy="dairy",
            severity="mild",
        )
        db_session.add(allergy)
        await db_session.commit()
        await db_session.refresh(allergy)
        
        assert allergy.id is not None
        assert allergy.family_member_id == member.id
        assert allergy.allergy == "dairy"
    
    async def test_allergy_repr(self, db_session, test_signup):
        """Test allergy string representation"""
        from app.models.family import FamilyMember
        from app.models.user import User
        user = User(email="allergy3@test.com", hashed_password="x", full_name="Allergy3", role="user", is_active=True)
        db_session.add(user)
        await db_session.flush()
        member = FamilyMember(user_id=user.id, name="Test Scout", member_type="scout")
        db_session.add(member)
        await db_session.flush()

        allergy = Allergy(
            family_member_id=member.id,
            allergy="peanuts",
            severity="severe",
        )
        db_session.add(allergy)
        await db_session.commit()
        
        repr_str = repr(allergy)
        
        assert "Allergy" in repr_str
        assert str(allergy.id) in repr_str


@pytest.mark.asyncio
class TestModelRelationships:
    """Test model relationships and cascades"""
    
    async def test_outing_signup_relationship(self, db_session, test_outing, test_signup):
        """Test outing-signup relationship"""
        from app.crud import outing as crud_outing
        
        outing = await crud_outing.get_outing(db_session, test_outing.id)
        
        assert len(outing.signups) > 0
        assert test_signup.id in [s.id for s in outing.signups]
    
    async def test_signup_participant_relationship(self, db_session, test_signup):
        """Test signup-participant relationship"""
        from app.crud import signup as crud_signup
        
        signup = await crud_signup.get_signup(db_session, test_signup.id)
        
        assert len(signup.participants) > 0
    
    async def test_delete_signup_cascades_to_participants(self, db_session, test_outing):
        """Test deleting signup cascades to participants"""
        from app.crud import signup as crud_signup
        from app.schemas.signup import SignupCreate, FamilyContact
        from app.models.family import FamilyMember
        from app.models.user import User
        # Create a family member to sign up
        user = User(email="cascade@test.com", hashed_password="x", full_name="Cascade", role="user", is_active=True)
        db_session.add(user)
        await db_session.flush()
        member = FamilyMember(user_id=user.id, name="Test Scout", member_type="scout")
        db_session.add(member)
        await db_session.flush()

        # Create signup with family_member_ids
        signup_data = SignupCreate(
            outing_id=test_outing.id,
            family_contact=FamilyContact(
                email="test@test.com",
                phone="555-0000",
                emergency_contact_name="EC",
                emergency_contact_phone="555-9999",
            ),
            family_member_ids=[member.id],
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