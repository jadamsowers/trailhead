"""Tests for crud/signup.py"""
import pytest
from uuid import uuid4, UUID
from datetime import date, timedelta

from app.crud import signup as crud_signup
from app.schemas.signup import SignupCreate, SignupUpdate, FamilyContact, GrubmasterRequestItem
from app.models.family import FamilyMember


@pytest.mark.asyncio
class TestGetSignup:
    """Test get_signup function"""
    
    async def test_get_existing_signup(self, db_session, test_signup):
        """Test getting an existing signup"""
        result = await crud_signup.get_signup(db_session, test_signup.id)
        
        assert result is not None
        assert result.id == test_signup.id
        assert result.family_contact_name == test_signup.family_contact_name
        assert len(result.participants) > 0
    
    async def test_get_nonexistent_signup(self, db_session):
        """Test getting a non-existent signup returns None"""
        fake_id = uuid4()
        result = await crud_signup.get_signup(db_session, fake_id)
        
        assert result is None
    


@pytest.mark.asyncio
class TestGetOutingSignups:
    """Test get_outing_signups function"""
    
    async def test_get_outing_signups(self, db_session, test_outing, test_signup):
        """Test getting all signups for a outing"""
        signups = await crud_signup.get_outing_signups(db_session, test_outing.id)
        
        assert len(signups) >= 1
        assert test_signup.id in [s.id for s in signups]
    
    async def test_get_outing_signups_empty(self, db_session, test_day_outing):
        """Test getting signups for outing with no signups"""
        signups = await crud_signup.get_outing_signups(db_session, test_day_outing.id)
        
        assert len(signups) == 0
    
    async def test_get_outing_signups_ordered_by_date(self, db_session, test_outing, test_user):
        """Test signups are ordered by created_at descending"""
        # Create multiple signups using the CRUD function
        import asyncio
        
        for i in range(3):
            # Create a family member for each signup
            scout_member = FamilyMember(
                id=uuid4(),
                user_id=test_user.id,
                name=f"Scout {i}",
                date_of_birth=date.today() - timedelta(days=365*14),
                member_type="scout",
                gender="male",
                troop_number="100",
            )
            db_session.add(scout_member)
            await db_session.flush()
            
            signup_data = SignupCreate(
                outing_id=test_outing.id,
                family_contact=FamilyContact(
                    email=f"family{i}@test.com",
                    phone=f"555-000{i}",
                    emergency_contact_name=f"Emergency {i}",
                    emergency_contact_phone=f"555-111{i}",
                ),
                family_member_ids=[scout_member.id],
            )
            
            await crud_signup.create_signup(db_session, signup_data)
            await db_session.commit()
            await asyncio.sleep(0.01)  # Ensure different timestamps
        
        signups = await crud_signup.get_outing_signups(db_session, test_outing.id)
        
        # Should be ordered by created_at descending (newest first)
        for i in range(len(signups) - 1):
            assert signups[i].created_at >= signups[i + 1].created_at


@pytest.mark.asyncio
class TestCreateSignup:
    """Test create_signup function"""
    
    async def test_create_signup_with_participants(self, db_session, test_outing, test_user):
        """Test creating a signup with participants"""
        # Create family members first
        scout_member = FamilyMember(
            id=uuid4(),
            user_id=test_user.id,
            name="New Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="999",
            patrol_name="New Patrol",
            has_youth_protection=False,
            vehicle_capacity=0,
        )
        adult_member = FamilyMember(
            id=uuid4(),
            user_id=test_user.id,
            name="New Adult",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
            vehicle_capacity=5,
        )
        db_session.add_all([scout_member, adult_member])
        await db_session.commit()
        
        signup_data = SignupCreate(
            outing_id=test_outing.id,
            family_contact=FamilyContact(
                email="newfamily@test.com",
                phone="555-9999",
                emergency_contact_name="Emergency Contact",
                emergency_contact_phone="555-0000",
            ),
            family_member_ids=[scout_member.id, adult_member.id],
        )
        
        result = await crud_signup.create_signup(db_session, signup_data)
        
        assert result.id is not None
        assert result.outing_id == test_outing.id
        assert result.family_contact_email == "newfamily@test.com"
        assert result.family_contact_phone == "555-9999"
        assert len(result.participants) == 2
        assert result.created_at is not None
    
    async def test_create_signup_with_dietary_restrictions(self, db_session, test_outing, test_user):
        """Test creating signup with family member that has dietary restrictions"""
        # Create family member with dietary restrictions
        from app.models.family import FamilyMemberDietaryPreference, FamilyMemberAllergy
        
        scout_member = FamilyMember(
            id=uuid4(),
            user_id=test_user.id,
            name="Special Scout",
            date_of_birth=date.today() - timedelta(days=365*12),
            member_type="scout",
            gender="female",
            troop_number="888",
            patrol_name="Special Patrol",
            has_youth_protection=False,
            vehicle_capacity=0,
            medical_notes="Carries EpiPen",
        )
        db_session.add(scout_member)
        await db_session.flush()
        
        # Add dietary preferences
        pref1 = FamilyMemberDietaryPreference(
            family_member_id=scout_member.id,
            preference="vegetarian",
        )
        pref2 = FamilyMemberDietaryPreference(
            family_member_id=scout_member.id,
            preference="gluten-free",
        )
        
        # Add allergies
        allergy1 = FamilyMemberAllergy(
            family_member_id=scout_member.id,
            allergy="peanuts",
            severity="severe",
        )
        allergy2 = FamilyMemberAllergy(
            family_member_id=scout_member.id,
            allergy="dairy",
            severity="moderate",
        )
        
        db_session.add_all([pref1, pref2, allergy1, allergy2])
        await db_session.commit()
        
        signup_data = SignupCreate(
            outing_id=test_outing.id,
            family_contact=FamilyContact(
                email="special@test.com",
                phone="555-8888",
                emergency_contact_name="Emergency Contact",
                emergency_contact_phone="555-0000",
            ),
            family_member_ids=[scout_member.id],
        )
        
        result = await crud_signup.create_signup(db_session, signup_data)
        
        assert len(result.participants) == 1
        # Dietary restrictions and allergies are stored on the family member
        # and accessible through the participant's family_member relationship

    
    async def test_create_signup_with_multiple_families(self, db_session, test_outing, test_user):
        """Test creating multiple signups for same outing"""
        for i in range(3):
            # Create a family member for each signup
            scout_member = FamilyMember(
                id=uuid4(),
                user_id=test_user.id,
                name=f"Scout {i}",
                date_of_birth=date.today() - timedelta(days=365*14),
                member_type="scout",
                gender="male",
                troop_number="777",
                patrol_name="Test Patrol",
                has_youth_protection=False,
                vehicle_capacity=0,
            )
            db_session.add(scout_member)
            await db_session.flush()
            
            signup_data = SignupCreate(
                outing_id=test_outing.id,
                family_contact=FamilyContact(
                    email=f"family{i}@test.com",
                    phone=f"555-777{i}",
                    emergency_contact_name=f"Emergency {i}",
                    emergency_contact_phone=f"555-000{i}",
                ),
                family_member_ids=[scout_member.id],
            )
            
            result = await crud_signup.create_signup(db_session, signup_data)
            assert result.id is not None
            await db_session.commit()
        
        # Verify all signups exist
        signups = await crud_signup.get_outing_signups(db_session, test_outing.id)
        assert len(signups) >= 3


@pytest.mark.asyncio
class TestDeleteSignup:
    """Test delete_signup function"""
    
    async def test_delete_existing_signup(self, db_session, test_outing, test_user):
        """Test deleting an existing signup"""
        # Create a family member and signup to delete
        scout_member = FamilyMember(
            id=uuid4(),
            user_id=test_user.id,
            name="Delete Scout",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="male",
            troop_number="000",
            patrol_name="Delete Patrol",
            has_youth_protection=False,
            vehicle_capacity=0,
        )
        db_session.add(scout_member)
        await db_session.commit()
        
        signup_data = SignupCreate(
            outing_id=test_outing.id,
            family_contact=FamilyContact(
                email="delete@test.com",
                phone="555-0000",
                emergency_contact_name="Emergency Contact",
                emergency_contact_phone="555-1111",
            ),
            family_member_ids=[scout_member.id],
        )
        
        signup = await crud_signup.create_signup(db_session, signup_data)
        signup_id = signup.id
        
        # Delete the signup
        result = await crud_signup.delete_signup(db_session, signup_id)
        
        assert result is True
        
        # Verify signup is deleted
        deleted_signup = await crud_signup.get_signup(db_session, signup_id)
        assert deleted_signup is None
    
    async def test_delete_nonexistent_signup(self, db_session):
        """Test deleting a non-existent signup returns False"""
        fake_id = uuid4()
        
        result = await crud_signup.delete_signup(db_session, fake_id)
        
        assert result is False
    
    async def test_delete_signup_cascades_to_participants(self, db_session, test_outing, test_user):
        """Test deleting signup also deletes participants"""
        from app.models.participant import Participant
        from sqlalchemy import select
        
        # Create family member and signup
        scout_member = FamilyMember(
            id=uuid4(),
            user_id=test_user.id,
            name="Cascade Scout",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="male",
            troop_number="111",
            patrol_name="Cascade Patrol",
            has_youth_protection=False,
            vehicle_capacity=0,
        )
        db_session.add(scout_member)
        await db_session.commit()
        
        signup_data = SignupCreate(
            outing_id=test_outing.id,
            family_contact=FamilyContact(
                email="cascade@test.com",
                phone="555-1111",
                emergency_contact_name="Emergency Contact",
                emergency_contact_phone="555-2222",
            ),
            family_member_ids=[scout_member.id],
        )
        
        signup = await crud_signup.create_signup(db_session, signup_data)
        participant_id = signup.participants[0].id
        
        # Delete signup
        await crud_signup.delete_signup(db_session, signup.id)
        
        # Verify participant is also deleted
        result = await db_session.execute(
            select(Participant).where(Participant.id == participant_id)
        )
        participant = result.scalar_one_or_none()
        assert participant is None




@pytest.mark.asyncio
class TestUpdateSignup:
    """Test update_signup function"""
    
    async def test_update_contact_info(self, db_session, test_outing, test_user, test_family_member):
        """Test updating signup contact information"""
        # Create a signup first
        signup_data = SignupCreate(
            outing_id=test_outing.id,
            family_contact=FamilyContact(
                email="original@test.com",
                phone="555-0000",
                emergency_contact_name="Original Emergency",
                emergency_contact_phone="555-1111",
            ),
            family_member_ids=[test_family_member.id],
        )
        signup = await crud_signup.create_signup(db_session, signup_data)
        
        # Update contact info
        update_data = SignupUpdate(
            family_contact=FamilyContact(
                email="updated@test.com",
                phone="555-9999",
                emergency_contact_name="Updated Emergency",
                emergency_contact_phone="555-8888",
            ),
        )
        
        result = await crud_signup.update_signup(db_session, signup.id, update_data)
        
        assert result is not None
        assert result.family_contact_email == "updated@test.com"
        assert result.family_contact_phone == "555-9999"
    
    async def test_update_participants(self, db_session, test_outing, test_user, test_family_member):
        """Test updating signup participants"""
        # Create additional family member
        new_member = FamilyMember(
            id=uuid4(),
            user_id=test_user.id,
            name="New Member",
            date_of_birth=date.today() - timedelta(days=365*15),
            member_type="scout",
            gender="male",
            troop_number="100",
        )
        db_session.add(new_member)
        await db_session.commit()
        
        # Create signup with original member
        signup_data = SignupCreate(
            outing_id=test_outing.id,
            family_contact=FamilyContact(
                email="test@test.com",
                phone="555-0000",
                emergency_contact_name="Emergency",
                emergency_contact_phone="555-1111",
            ),
            family_member_ids=[test_family_member.id],
        )
        signup = await crud_signup.create_signup(db_session, signup_data)
        
        # Update to include new member
        update_data = SignupUpdate(
            family_member_ids=[test_family_member.id, new_member.id],
        )
        
        result = await crud_signup.update_signup(db_session, signup.id, update_data)
        
        assert result is not None
        assert len(result.participants) == 2
    
    async def test_update_nonexistent_signup(self, db_session):
        """Test updating non-existent signup returns None"""
        update_data = SignupUpdate(
            family_contact=FamilyContact(
                email="test@test.com",
                phone="555-0000",
                emergency_contact_name="Emergency",
                emergency_contact_phone="555-1111",
            ),
        )
        
        result = await crud_signup.update_signup(db_session, uuid4(), update_data)
        
        assert result is None
    
    async def test_update_with_grubmaster_requests(self, db_session, test_outing, test_user, test_family_member):
        """Test updating signup with grubmaster requests"""
        # Create signup
        signup_data = SignupCreate(
            outing_id=test_outing.id,
            family_contact=FamilyContact(
                email="test@test.com",
                phone="555-0000",
                emergency_contact_name="Emergency",
                emergency_contact_phone="555-1111",
            ),
            family_member_ids=[test_family_member.id],
        )
        signup = await crud_signup.create_signup(db_session, signup_data)
        
        # Update with grubmaster request
        update_data = SignupUpdate(
            grubmaster_requests=[
                GrubmasterRequestItem(
                    family_member_id=test_family_member.id,
                    grubmaster_interest=True,
                    grubmaster_reason="rank_requirement",
                ),
            ],
        )
        
        result = await crud_signup.update_signup(db_session, signup.id, update_data)
        
        assert result is not None
        assert len(result.participants) == 1
        assert result.participants[0].grubmaster_interest is True


@pytest.mark.asyncio
class TestSignupProperties:
    """Test Signup model computed properties"""
    
    async def test_participant_count(self, db_session, test_signup):
        """Test participant_count property"""
        signup = await crud_signup.get_signup(db_session, test_signup.id)
        
        assert signup.participant_count == len(signup.participants)
    
    async def test_scout_count(self, db_session, test_signup):
        """Test scout_count property"""
        signup = await crud_signup.get_signup(db_session, test_signup.id)
        
        scouts = [p for p in signup.participants if p.participant_type == "scout"]
        assert signup.scout_count == len(scouts)
    
    async def test_adult_count(self, db_session, test_signup):
        """Test adult_count property"""
        signup = await crud_signup.get_signup(db_session, test_signup.id)
        
        adults = [p for p in signup.participants if p.participant_type == "adult"]
        assert signup.adult_count == len(adults)


@pytest.mark.asyncio
class TestSignupEdgeCases:
    """Test edge cases and error handling for signup CRUD"""

    async def test_create_signup_invalid_family_member(self, db_session, test_outing):
        """Test creating signup with non-existent family member raises ValueError"""
        signup_data = SignupCreate(
            outing_id=test_outing.id,
            family_contact=FamilyContact(
                email="fail@test.com",
                phone="555-0000",
                emergency_contact_name="Emergency",
                emergency_contact_phone="555-1111",
            ),
            family_member_ids=[uuid4()],  # Non-existent ID
        )
        
        with pytest.raises(ValueError) as exc_info:
            await crud_signup.create_signup(db_session, signup_data)
        
        assert "not found" in str(exc_info.value)

    async def test_update_signup_invalid_family_member(self, db_session, test_signup):
        """Test updating signup with non-existent family member raises ValueError"""
        update_data = SignupUpdate(
            family_member_ids=[uuid4()],  # Non-existent ID
        )
        
        with pytest.raises(ValueError) as exc_info:
            await crud_signup.update_signup(db_session, test_signup.id, update_data)
        
        assert "not found" in str(exc_info.value)

    async def test_update_signup_grubmaster_only(self, db_session, test_signup, test_family_member):
        """Test updating ONLY grubmaster requests without changing participants"""
        # Reload signup to ensure participants are loaded
        signup = await crud_signup.get_signup(db_session, test_signup.id)
        
        # Initial state: no grubmaster interest
        assert signup.participants[0].grubmaster_interest is False
        
        # Update with grubmaster request but NO family_member_ids change
        update_data = SignupUpdate(
            grubmaster_requests=[
                GrubmasterRequestItem(
                    family_member_id=test_family_member.id,
                    grubmaster_interest=True,
                    grubmaster_reason="Cooking Merit Badge",
                ),
            ],
        )
        
        result = await crud_signup.update_signup(db_session, signup.id, update_data)
        
        assert result is not None
        assert len(result.participants) == 1
        # Should have updated the existing participant
        participant = result.participants[0]
        assert participant.family_member_id == test_family_member.id
        assert participant.grubmaster_interest is True
        assert participant.grubmaster_reason == "Cooking Merit Badge"

    async def test_create_signup_race_condition(self, db_session, test_outing, test_family_member):
        """Test race condition handling during signup creation"""
        from unittest.mock import AsyncMock, patch
        from sqlalchemy.exc import IntegrityError
        
        signup_data = SignupCreate(
            outing_id=test_outing.id,
            family_contact=FamilyContact(
                email="race@test.com",
                phone="555-0000",
                emergency_contact_name="Emergency",
                emergency_contact_phone="555-1111",
            ),
            family_member_ids=[test_family_member.id],
        )
        
        # Mock db.commit to raise IntegrityError once
        # We need to intercept the db session calls
        
        mock_db = AsyncMock()
        
        # Setup for family member check
        mock_db.execute.return_value.scalar_one_or_none.side_effect = [
            test_family_member,  # First check for family member
            None, # Check if signup exists (first time)
        ]
        
        mock_signup = AsyncMock()
        mock_signup.id = uuid4()
        
        async def execute_side_effect(stmt):
            str_stmt = str(stmt)
            if "family_members" in str_stmt:
                return AsyncMock(scalar_one_or_none=lambda: test_family_member)
            if "signups" in str_stmt:
                # If we are in the exception handler (commit failed)
                # The code will try to find the existing signup
                return AsyncMock(scalar_one_or_none=lambda: mock_signup, scalar_one=lambda: mock_signup)
            return AsyncMock()

        mock_db.execute.side_effect = execute_side_effect
        
        # Make commit raise exception
        mock_db.commit.side_effect = IntegrityError("stmt", "params", "orig")
        
        # Run the function
        result = await crud_signup.create_signup(mock_db, signup_data)
        
        assert result == mock_signup
        assert mock_db.rollback.called