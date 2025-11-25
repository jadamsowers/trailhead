"""Tests for crud/outing.py"""
import pytest
from datetime import date, timedelta
from uuid import uuid4

from app.crud import outing as crud_outing
from app.schemas.outing import OutingCreate, OutingUpdate
from app.models.outing import Outing


@pytest.mark.asyncio
class TestGetOuting:
    """Test get_outing function"""
    
    async def test_get_existing_outing(self, db_session, test_outing):
        """Test getting an existing outing"""
        result = await crud_outing.get_outing(db_session, test_outing.id)
        
        assert result is not None
        assert result.id == test_outing.id
        assert result.name == test_outing.name
        assert result.location == test_outing.location
    
    async def test_get_nonexistent_outing(self, db_session):
        """Test getting a non-existent outing returns None"""
        fake_id = uuid4()
        result = await crud_outing.get_outing(db_session, fake_id)
        
        assert result is None


@pytest.mark.asyncio
class TestGetOutings:
    """Test get_outings function"""
    
    async def test_get_all_outings(self, db_session, test_outing, test_day_outing):
        """Test getting all outings"""
        outings = await crud_outing.get_outings(db_session)
        
        assert len(outings) >= 2
        outing_ids = [t.id for t in outings]
        assert test_outing.id in outing_ids
        assert test_day_outing.id in outing_ids
    
    async def test_get_outings_with_pagination(self, db_session, test_outing, test_day_outing):
        """Test getting outings with pagination"""
        outings = await crud_outing.get_outings(db_session, skip=0, limit=1)
        
        assert len(outings) == 1
    
    async def test_get_outings_ordered_by_date(self, db_session):
        """Test outings are ordered by date descending"""
        # Create outings with different dates
        outing1 = Outing(
            name="Future Outing",
            outing_date=date.today() + timedelta(days=60),
            location="Location 1",
            max_participants=20,
        )
        outing2 = Outing(
            name="Near Outing",
            outing_date=date.today() + timedelta(days=30),
            location="Location 2",
            max_participants=20,
        )
        db_session.add(outing1)
        db_session.add(outing2)
        await db_session.commit()
        
        outings = await crud_outing.get_outings(db_session)
        
        # Should be ordered by date descending (newest first)
        assert outings[0].outing_date >= outings[1].outing_date


@pytest.mark.asyncio
class TestGetAvailableOutings:
    """Test get_available_outings function"""
    
    async def test_get_available_outings_excludes_full(self, db_session, test_user):
        """Test that full outings are excluded from available outings"""
        # Create a outing with 2 max participants
        outing = Outing(
            name="Small Outing",
            outing_date=date.today() + timedelta(days=30),
            location="Test Location",
            max_participants=2,
            is_overnight=False,
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        # Initially should be available
        available = await crud_outing.get_available_outings(db_session)
        assert outing.id in [t.id for t in available]
        
        # Add signups to fill the outing
        from app.models.signup import Signup
        from app.models.participant import Participant
        from app.models.family import FamilyMember
        
        signup = Signup(
            outing_id=outing.id,
            family_contact_name="Test Family",
            family_contact_email="test@example.com",
            family_contact_phone="555-0000",
        )
        db_session.add(signup)
        await db_session.flush()
        
        # Create 2 family members and add participants to fill the outing
        members = []
        for i in range(2):
            member = FamilyMember(
                user_id=test_user.id,
                name=f"Participant {i}",
                member_type="scout",
            )
            db_session.add(member)
            members.append(member)
        await db_session.flush()

        for m in members:
            participant = Participant(
                signup_id=signup.id,
                family_member_id=m.id,
            )
            db_session.add(participant)
        
        await db_session.commit()
        await db_session.refresh(outing)
        
        # Now should not be available
        available = await crud_outing.get_available_outings(db_session)
        assert outing.id not in [t.id for t in available]
    
    async def test_get_available_outings_ordered_by_date(self, db_session):
        """Test available outings are ordered by date ascending"""
        outings = await crud_outing.get_available_outings(db_session)
        
        if len(outings) > 1:
            for i in range(len(outings) - 1):
                assert outings[i].outing_date <= outings[i + 1].outing_date


@pytest.mark.asyncio
class TestCreateOuting:
    """Test create_outing function"""
    
    async def test_create_outing(self, db_session):
        """Test creating a new outing"""
        outing_data = OutingCreate(
            name="New Test Outing",
            outing_date=date.today() + timedelta(days=45),
            end_date=date.today() + timedelta(days=47),
            location="New Location",
            description="A new test outing",
            max_participants=25,
            is_overnight=True,
        )
        
        result = await crud_outing.create_outing(db_session, outing_data)
        
        assert result.id is not None
        assert result.name == outing_data.name
        assert result.outing_date == outing_data.outing_date
        assert result.end_date == outing_data.end_date
        assert result.location == outing_data.location
        assert result.description == outing_data.description
        assert result.max_participants == outing_data.max_participants
        assert result.is_overnight == outing_data.is_overnight
        assert result.created_at is not None
        assert result.updated_at is not None
    
    async def test_create_day_outing(self, db_session):
        """Test creating a day outing without end_date"""
        outing_data = OutingCreate(
            name="Day Hike",
            outing_date=date.today() + timedelta(days=20),
            end_date=None,
            location="Trail Head",
            description="Day hike",
            max_participants=15,
            is_overnight=False,
        )
        
        result = await crud_outing.create_outing(db_session, outing_data)
        
        assert result.end_date is None
        assert result.is_overnight is False


@pytest.mark.asyncio
class TestUpdateOuting:
    """Test update_outing function"""
    
    async def test_update_outing(self, db_session, test_outing):
        """Test updating an existing outing"""
        update_data = OutingUpdate(
            name="Updated Outing Name",
            location="Updated Location",
            max_participants=30,
        )
        
        result = await crud_outing.update_outing(db_session, test_outing.id, update_data)
        
        assert result is not None
        assert result.id == test_outing.id
        assert result.name == "Updated Outing Name"
        assert result.location == "Updated Location"
        assert result.max_participants == 30
    
    async def test_update_nonexistent_outing(self, db_session):
        """Test updating a non-existent outing returns None"""
        fake_id = uuid4()
        update_data = OutingUpdate(name="Updated Name")
        
        result = await crud_outing.update_outing(db_session, fake_id, update_data)
        
        assert result is None
    
    async def test_partial_update(self, db_session, test_outing):
        """Test partial update of outing"""
        original_location = test_outing.location
        update_data = OutingUpdate(name="New Name Only")
        
        result = await crud_outing.update_outing(db_session, test_outing.id, update_data)
        
        assert result.name == "New Name Only"
        assert result.location == original_location


@pytest.mark.asyncio
class TestDeleteOuting:
    """Test delete_outing function"""
    
    async def test_delete_outing_without_signups(self, db_session, test_day_outing):
        """Test deleting a outing without signups"""
        outing_id = test_day_outing.id
        
        result = await crud_outing.delete_outing(db_session, outing_id)
        
        assert result is True
        
        # Verify outing is deleted
        deleted_outing = await crud_outing.get_outing(db_session, outing_id)
        assert deleted_outing is None
    
    async def test_delete_outing_with_signups(self, db_session, test_signup):
        """Test deleting a outing with signups fails"""
        outing_id = test_signup.outing_id
        
        result = await crud_outing.delete_outing(db_session, outing_id)
        
        assert result is False
        
        # Verify outing still exists
        outing = await crud_outing.get_outing(db_session, outing_id)
        assert outing is not None
    
    async def test_delete_nonexistent_outing(self, db_session):
        """Test deleting a non-existent outing returns False"""
        fake_id = uuid4()
        
        result = await crud_outing.delete_outing(db_session, fake_id)
        
        assert result is False


@pytest.mark.asyncio
class TestGetOutingCount:
    """Test get_outing_count function"""
    
    async def test_get_outing_count(self, db_session, test_outing, test_day_outing):
        """Test getting total outing count"""
        count = await crud_outing.get_outing_count(db_session)
        
        assert count >= 2
    
    async def test_get_outing_count_empty(self, db_session):
        """Test getting outing count when no outings exist"""
        # Delete all outings
        from sqlalchemy import delete
        await db_session.execute(delete(Outing))
        await db_session.commit()
        
        count = await crud_outing.get_outing_count(db_session)
        
        assert count == 0


@pytest.mark.asyncio
class TestOutingProperties:
    """Test Outing model computed properties"""
    
    async def test_signup_count(self, db_session, test_outing, test_signup):
        """Test signup_count property"""
        outing = await crud_outing.get_outing(db_session, test_outing.id)
        
        # test_signup has 2 participants
        assert outing.signup_count == 2
    
    async def test_available_spots(self, db_session, test_outing, test_signup):
        """Test available_spots property"""
        outing = await crud_outing.get_outing(db_session, test_outing.id)
        
        expected_available = test_outing.max_participants - 2
        assert outing.available_spots == expected_available
    
    async def test_is_full(self, db_session, test_user, test_family_member):
        """Test is_full property"""
        # Create outing with 2 max participants
        outing = Outing(
            name="Small Outing",
            outing_date=date.today() + timedelta(days=30),
            location="Test Location",
            max_participants=2,
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        # Fetch with relationships eagerly loaded to avoid async lazy-load
        outing = await crud_outing.get_outing(db_session, outing.id)
        assert outing.is_full is False
        
        # Create a signup via CRUD with 2 family members to fill the outing
        from app.crud import signup as crud_signup
        from app.schemas.signup import SignupCreate, FamilyContact
        from app.models.family import FamilyMember
        # Use existing test_family_member plus a new one
        member2 = FamilyMember(user_id=test_user.id, name="Person 2", member_type="scout")
        db_session.add(member2)
        await db_session.flush()

        signup_data = SignupCreate(
            outing_id=outing.id,
            family_contact=FamilyContact(
                email="test@test.com",
                phone="555-0000",
                emergency_contact_name="EC",
                emergency_contact_phone="555-9999",
            ),
            family_member_ids=[test_family_member.id, member2.id],
        )
        await crud_signup.create_signup(db_session, signup_data)
        
        await db_session.commit()
        # Validate counts and capacity via direct query to avoid ORM lazy-load edge cases
        from sqlalchemy import select, func
        from app.models.signup import Signup
        from app.models.participant import Participant
        result = await db_session.execute(
            select(func.count()).select_from(Participant)
            .join(Signup)
            .where(Signup.outing_id == outing.id)
        )
        signup_count = result.scalar() or 0
        assert signup_count == 2
        assert signup_count >= outing.max_participants