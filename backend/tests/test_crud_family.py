"""Tests for family CRUD operations"""
import pytest
from datetime import date, timedelta
from uuid import uuid4

from app.crud import family as crud_family
from app.schemas.family import (
    FamilyMemberCreate,
    FamilyMemberUpdate,
    DietaryPreferenceCreate,
    AllergyCreate,
)


@pytest.mark.asyncio
class TestCreateFamilyMember:
    """Test create_family_member function"""
    
    async def test_create_scout_member(self, db_session, test_user):
        """Test creating a scout family member"""
        member_data = FamilyMemberCreate(
            name="Test Scout",
            member_type="scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            gender="male",
            troop_number="100",
            patrol_name="Eagle Patrol",
        )
        
        result = await crud_family.create_family_member(db_session, test_user.id, member_data)
        
        assert result.id is not None
        assert result.user_id == test_user.id
        assert result.name == "Test Scout"
        assert result.member_type == "scout"
        assert result.troop_number == "100"
        assert result.patrol_name == "Eagle Patrol"
    
    async def test_create_adult_member(self, db_session, test_user):
        """Test creating an adult family member"""
        member_data = FamilyMemberCreate(
            name="Test Adult",
            member_type="adult",
            date_of_birth=date.today() - timedelta(days=365*40),
            gender="male",
            has_youth_protection=True,
            vehicle_capacity=5,
        )
        
        result = await crud_family.create_family_member(db_session, test_user.id, member_data)
        
        assert result.id is not None
        assert result.member_type == "adult"
        assert result.has_youth_protection is True
        assert result.vehicle_capacity == 5
    
    async def test_create_member_with_dietary_preferences(self, db_session, test_user):
        """Test creating family member with dietary preferences"""
        member_data = FamilyMemberCreate(
            name="Vegetarian Scout",
            member_type="scout",
            date_of_birth=date.today() - timedelta(days=365*12),
            gender="female",
            dietary_preferences=["vegetarian", "gluten-free"],
        )
        
        result = await crud_family.create_family_member(db_session, test_user.id, member_data)
        
        assert len(result.dietary_preferences) == 2
        prefs = [p.preference for p in result.dietary_preferences]
        assert "vegetarian" in prefs
        assert "gluten-free" in prefs
    
    async def test_create_member_with_allergies(self, db_session, test_user):
        """Test creating family member with allergies"""
        member_data = FamilyMemberCreate(
            name="Allergy Scout",
            member_type="scout",
            date_of_birth=date.today() - timedelta(days=365*11),
            gender="male",
            allergies=[
                {"allergy": "peanuts", "severity": "severe"},
                {"allergy": "shellfish", "severity": "moderate"},
            ],
        )
        
        result = await crud_family.create_family_member(db_session, test_user.id, member_data)
        
        assert len(result.allergies) == 2
        allergies = {a.allergy: a.severity for a in result.allergies}
        assert allergies["peanuts"] == "severe"
        assert allergies["shellfish"] == "moderate"


@pytest.mark.asyncio
class TestGetFamilyMembers:
    """Test get_family_members_for_user function"""
    
    async def test_get_all_family_members(self, db_session, test_user, test_family_member):
        """Test getting all family members for a user"""
        members = await crud_family.get_family_members_for_user(db_session, test_user.id)
        
        assert len(members) >= 1
        member_ids = [m.id for m in members]
        assert test_family_member.id in member_ids
    
    async def test_get_family_members_empty(self, db_session, test_regular_user):
        """Test getting family members when user has none"""
        members = await crud_family.get_family_members_for_user(db_session, test_regular_user.id)
        
        assert len(members) == 0


@pytest.mark.asyncio
class TestGetFamilyMember:
    """Test get_family_member function"""
    
    async def test_get_existing_family_member(self, db_session, test_user, test_family_member):
        """Test getting an existing family member"""
        result = await crud_family.get_family_member(
            db_session, test_family_member.id, test_user.id
        )
        
        assert result is not None
        assert result.id == test_family_member.id
        assert result.user_id == test_user.id
    
    async def test_get_nonexistent_family_member(self, db_session, test_user):
        """Test getting a non-existent family member"""
        fake_id = uuid4()
        result = await crud_family.get_family_member(db_session, fake_id, test_user.id)
        
        assert result is None
    
    async def test_get_family_member_wrong_user(self, db_session, test_regular_user, test_family_member):
        """Test getting family member belonging to different user"""
        result = await crud_family.get_family_member(
            db_session, test_family_member.id, test_regular_user.id
        )
        
        assert result is None


@pytest.mark.asyncio
class TestUpdateFamilyMember:
    """Test update_family_member function"""
    
    async def test_update_family_member(self, db_session, test_user, test_family_member):
        """Test updating a family member"""
        update_data = FamilyMemberUpdate(
            name="Updated Name",
            patrol_name="Wolf Patrol",
        )
        
        result = await crud_family.update_family_member(
            db_session, test_family_member.id, test_user.id, update_data
        )
        
        assert result is not None
        assert result.name == "Updated Name"
        assert result.patrol_name == "Wolf Patrol"
    
    async def test_update_nonexistent_family_member(self, db_session, test_user):
        """Test updating a non-existent family member"""
        fake_id = uuid4()
        update_data = FamilyMemberUpdate(name="Updated")
        
        result = await crud_family.update_family_member(
            db_session, fake_id, test_user.id, update_data
        )
        
        assert result is None
    
    async def test_partial_update(self, db_session, test_user, test_family_member):
        """Test partial update of family member"""
        original_member_type = test_family_member.member_type
        update_data = FamilyMemberUpdate(troop_number="200")
        
        result = await crud_family.update_family_member(
            db_session, test_family_member.id, test_user.id, update_data
        )
        
        assert result.troop_number == "200"
        assert result.member_type == original_member_type


@pytest.mark.asyncio
class TestDeleteFamilyMember:
    """Test delete_family_member function"""
    
    async def test_delete_family_member_without_signups(self, db_session, test_user):
        """Test deleting a family member without signups"""
        # Create a new member to delete
        member_data = FamilyMemberCreate(
            name="To Delete",
            member_type="scout",
            date_of_birth=date.today() - timedelta(days=365*12),
        )
        member = await crud_family.create_family_member(db_session, test_user.id, member_data)
        member_id = member.id
        
        result = await crud_family.delete_family_member(db_session, member_id, test_user.id)
        
        assert result is True
        
        # Verify member is deleted
        deleted = await crud_family.get_family_member(db_session, member_id, test_user.id)
        assert deleted is None
    
    async def test_delete_nonexistent_family_member(self, db_session, test_user):
        """Test deleting a non-existent family member"""
        fake_id = uuid4()
        
        result = await crud_family.delete_family_member(db_session, fake_id, test_user.id)
        
        assert result is False


@pytest.mark.asyncio
class TestUpdateDietaryPreferences:
    """Test updating dietary preferences via update_family_member"""
    
    async def test_add_dietary_preferences(self, db_session, test_user, test_family_member):
        """Test adding dietary preferences via update"""
        update_data = FamilyMemberUpdate(
            dietary_preferences=["vegan", "gluten-free"]
        )
        
        result = await crud_family.update_family_member(
            db_session, test_family_member.id, test_user.id, update_data
        )
        
        assert result is not None
        assert len(result.dietary_preferences) == 2
        prefs = [p.preference for p in result.dietary_preferences]
        assert "vegan" in prefs
        assert "gluten-free" in prefs
    
    async def test_remove_dietary_preferences(self, db_session, test_user):
        """Test removing dietary preferences via update"""
        # Create member with preferences
        member_data = FamilyMemberCreate(
            name="Test",
            member_type="scout",
            date_of_birth=date.today() - timedelta(days=365*12),
            dietary_preferences=["vegetarian"],
        )
        member = await crud_family.create_family_member(db_session, test_user.id, member_data)
        
        # Remove preferences
        update_data = FamilyMemberUpdate(dietary_preferences=[])
        result = await crud_family.update_family_member(
            db_session, member.id, test_user.id, update_data
        )
        
        assert len(result.dietary_preferences) == 0


@pytest.mark.asyncio
class TestUpdateAllergies:
    """Test updating allergies via update_family_member"""
    
    async def test_add_allergies(self, db_session, test_user, test_family_member):
        """Test adding allergies via update"""
        from app.schemas.family import AllergyCreate
        
        update_data = FamilyMemberUpdate(
            allergies=[
                AllergyCreate(allergy="dairy", severity="mild"),
                AllergyCreate(allergy="peanuts", severity="severe")
            ]
        )
        
        result = await crud_family.update_family_member(
            db_session, test_family_member.id, test_user.id, update_data
        )
        
        assert result is not None
        assert len(result.allergies) == 2
        allergy_map = {a.allergy: a.severity for a in result.allergies}
        assert allergy_map["dairy"] == "mild"
        assert allergy_map["peanuts"] == "severe"
    
    async def test_remove_allergies(self, db_session, test_user):
        """Test removing allergies via update"""
        from app.schemas.family import AllergyCreate
        
        # Create member with allergies
        member_data = FamilyMemberCreate(
            name="Test",
            member_type="scout",
            date_of_birth=date.today() - timedelta(days=365*12),
            allergies=[AllergyCreate(allergy="peanuts", severity="severe")],
        )
        member = await crud_family.create_family_member(db_session, test_user.id, member_data)
        
        # Remove allergies
        update_data = FamilyMemberUpdate(allergies=[])
        result = await crud_family.update_family_member(
            db_session, member.id, test_user.id, update_data
        )
        
        assert len(result.allergies) == 0
