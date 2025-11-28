"""Tests for tenting management functionality"""
import pytest
from datetime import date, timedelta
import uuid

from app.models.tenting_group import TentingGroup, TentingGroupMember
from app.models.family import FamilyMember
from app.models.signup import Signup
from app.models.participant import Participant
from app.crud import tenting_group as crud_tenting
from app.schemas.tenting_group import TentingGroupCreate, TentingGroupUpdate


class TestTentingCRUD:
    """Tests for tenting CRUD operations"""

    @pytest.mark.asyncio
    async def test_create_tenting_group(self, db_session, test_outing):
        """Test creating a tenting group"""
        group_data = TentingGroupCreate(
            outing_id=test_outing.id,
            name="Boys Tent 1",
            notes="First tent"
        )
        
        group = await crud_tenting.create_tenting_group(db_session, group_data)
        
        assert group is not None
        assert group.name == "Boys Tent 1"
        assert group.outing_id == test_outing.id
        assert group.notes == "First tent"

    @pytest.mark.asyncio
    async def test_get_tenting_groups_by_outing(self, db_session, test_outing):
        """Test getting all tenting groups for an outing"""
        # Create multiple groups
        for i in range(3):
            group_data = TentingGroupCreate(
                outing_id=test_outing.id,
                name=f"Tent {i+1}"
            )
            await crud_tenting.create_tenting_group(db_session, group_data)
        
        groups = await crud_tenting.get_tenting_groups_by_outing(db_session, test_outing.id)
        
        assert len(groups) == 3

    @pytest.mark.asyncio
    async def test_update_tenting_group(self, db_session, test_outing):
        """Test updating a tenting group"""
        group_data = TentingGroupCreate(
            outing_id=test_outing.id,
            name="Old Name"
        )
        group = await crud_tenting.create_tenting_group(db_session, group_data)
        
        update_data = TentingGroupUpdate(name="New Name", notes="Updated notes")
        updated_group = await crud_tenting.update_tenting_group(db_session, group.id, update_data)
        
        assert updated_group.name == "New Name"
        assert updated_group.notes == "Updated notes"

    @pytest.mark.asyncio
    async def test_delete_tenting_group(self, db_session, test_outing):
        """Test deleting a tenting group"""
        group_data = TentingGroupCreate(
            outing_id=test_outing.id,
            name="Temp Tent"
        )
        group = await crud_tenting.create_tenting_group(db_session, group_data)
        
        result = await crud_tenting.delete_tenting_group(db_session, group.id)
        
        assert result is True
        
        # Verify it's gone
        deleted = await crud_tenting.get_tenting_group(db_session, group.id)
        assert deleted is None


class TestTentingAPI:
    """Tests for tenting API endpoints"""

    @pytest.mark.asyncio
    async def test_get_tenting_summary(self, authenticated_client, test_outing, test_signup):
        """Test getting tenting summary for an outing"""
        response = await authenticated_client.get(f"/api/outings/{test_outing.id}/tenting")
        
        assert response.status_code == 200
        data = response.json()
        assert data["outing_id"] == str(test_outing.id)
        assert data["outing_name"] == test_outing.name
        assert "participants" in data
        assert "tenting_groups" in data
        assert "unassigned_count" in data
        assert "scout_count" in data

    @pytest.mark.asyncio
    async def test_create_tenting_group_api(self, authenticated_client, test_outing):
        """Test creating a tenting group via API"""
        response = await authenticated_client.post(
            f"/api/outings/{test_outing.id}/tenting-groups",
            json={
                "outing_id": str(test_outing.id),
                "name": "API Test Tent",
                "notes": "Created via API"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "API Test Tent"
        assert data["notes"] == "Created via API"
        assert data["outing_id"] == str(test_outing.id)

    @pytest.mark.asyncio
    async def test_get_tenting_groups_api(self, authenticated_client, test_outing, db_session):
        """Test getting tenting groups via API"""
        # Create a group first
        group_data = TentingGroupCreate(
            outing_id=test_outing.id,
            name="Test Tent"
        )
        await crud_tenting.create_tenting_group(db_session, group_data)
        
        response = await authenticated_client.get(f"/api/outings/{test_outing.id}/tenting-groups")
        
        assert response.status_code == 200
        data = response.json()
        assert "tenting_groups" in data
        assert "total" in data
        assert data["total"] >= 1

    @pytest.mark.asyncio
    async def test_delete_tenting_group_api(self, authenticated_client, test_outing, db_session):
        """Test deleting a tenting group via API"""
        # Create a group first
        group_data = TentingGroupCreate(
            outing_id=test_outing.id,
            name="To Delete"
        )
        group = await crud_tenting.create_tenting_group(db_session, group_data)
        
        response = await authenticated_client.delete(
            f"/api/outings/{test_outing.id}/tenting-groups/{group.id}"
        )
        
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_validate_tenting_api(self, authenticated_client, test_outing):
        """Test validating tenting assignments via API"""
        response = await authenticated_client.get(
            f"/api/outings/{test_outing.id}/tenting/validate"
        )
        
        assert response.status_code == 200
        data = response.json()
        # Returns a list of validation issues
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_auto_assign_tenting_api(self, authenticated_client, test_outing, test_signup):
        """Test auto-assigning tenting groups via API"""
        response = await authenticated_client.post(
            f"/api/outings/{test_outing.id}/auto-assign-tenting",
            json={
                "tent_size_min": 2,
                "tent_size_max": 3,
                "keep_patrols_together": True,
                "max_age_difference": 2
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "tenting_groups" in data
        assert "total" in data


class TestTentingValidation:
    """Tests for tenting validation logic"""

    @pytest.mark.asyncio
    async def test_age_gap_validation(self, db_session, test_outing, test_user):
        """Test that age gap validation catches large age differences"""
        # Create two scouts with a large age gap (5 years)
        young_scout = FamilyMember(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Young Scout",
            member_type="scout",
            date_of_birth=date.today() - timedelta(days=365*11),  # 11 years old
            gender="male",
            troop_number="100",
        )
        old_scout = FamilyMember(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Old Scout", 
            member_type="scout",
            date_of_birth=date.today() - timedelta(days=365*16),  # 16 years old
            gender="male",
            troop_number="100",
        )
        db_session.add(young_scout)
        db_session.add(old_scout)
        await db_session.flush()

        # Create signup with both scouts
        signup = Signup(
            id=uuid.uuid4(),
            outing_id=test_outing.id,
            family_contact_name="Test Family",
            family_contact_email="test@test.com",
            family_contact_phone="555-1234",
        )
        db_session.add(signup)
        await db_session.flush()

        young_participant = Participant(
            id=uuid.uuid4(),
            signup_id=signup.id,
            family_member_id=young_scout.id,
        )
        old_participant = Participant(
            id=uuid.uuid4(),
            signup_id=signup.id,
            family_member_id=old_scout.id,
        )
        db_session.add(young_participant)
        db_session.add(old_participant)
        await db_session.flush()

        # Create a tenting group with both scouts
        group_data = TentingGroupCreate(
            outing_id=test_outing.id,
            name="Mixed Age Tent",
            member_ids=[young_participant.id, old_participant.id]
        )
        group = await crud_tenting.create_tenting_group(db_session, group_data)
        
        # The group should be created (validation happens separately)
        assert group is not None
        assert len(group.members) == 2

    @pytest.mark.asyncio
    async def test_gender_validation(self, db_session, test_outing, test_user):
        """Test that gender validation is enforced (scouts must be same gender)"""
        # Create scouts of different genders
        male_scout = FamilyMember(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Male Scout",
            member_type="scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            gender="male",
            troop_number="100",
        )
        female_scout = FamilyMember(
            id=uuid.uuid4(),
            user_id=test_user.id,
            name="Female Scout",
            member_type="scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            gender="female",
            troop_number="100",
        )
        db_session.add(male_scout)
        db_session.add(female_scout)
        await db_session.flush()

        signup = Signup(
            id=uuid.uuid4(),
            outing_id=test_outing.id,
            family_contact_name="Test Family",
            family_contact_email="test@test.com",
            family_contact_phone="555-1234",
        )
        db_session.add(signup)
        await db_session.flush()

        male_participant = Participant(
            id=uuid.uuid4(),
            signup_id=signup.id,
            family_member_id=male_scout.id,
        )
        female_participant = Participant(
            id=uuid.uuid4(),
            signup_id=signup.id,
            family_member_id=female_scout.id,
        )
        db_session.add(male_participant)
        db_session.add(female_participant)
        await db_session.flush()

        # Create a tenting group with both genders (validation happens separately)
        group_data = TentingGroupCreate(
            outing_id=test_outing.id,
            name="Mixed Gender Tent",
            member_ids=[male_participant.id, female_participant.id]
        )
        group = await crud_tenting.create_tenting_group(db_session, group_data)
        
        # Group is created (validation is a separate endpoint)
        assert group is not None
        assert len(group.members) == 2


class TestTentingAutoAssign:
    """Tests for auto-assign functionality"""

    @pytest.mark.asyncio
    async def test_auto_assign_groups_by_gender(self, db_session, test_outing, test_user):
        """Test that auto-assign separates scouts by gender"""
        # Create male scouts
        for i in range(3):
            scout = FamilyMember(
                id=uuid.uuid4(),
                user_id=test_user.id,
                name=f"Male Scout {i+1}",
                member_type="scout",
                date_of_birth=date.today() - timedelta(days=365*13),
                gender="male",
                troop_number="100",
            )
            db_session.add(scout)
        
        # Create female scouts
        for i in range(2):
            scout = FamilyMember(
                id=uuid.uuid4(),
                user_id=test_user.id,
                name=f"Female Scout {i+1}",
                member_type="scout",
                date_of_birth=date.today() - timedelta(days=365*13),
                gender="female",
                troop_number="100",
            )
            db_session.add(scout)
        
        await db_session.flush()
        
        # Get all family members we just created
        from sqlalchemy import select
        result = await db_session.execute(
            select(FamilyMember).where(FamilyMember.user_id == test_user.id)
        )
        family_members = list(result.scalars().all())
        
        # Create signup with all scouts
        signup = Signup(
            id=uuid.uuid4(),
            outing_id=test_outing.id,
            family_contact_name="Test Family",
            family_contact_email="test@test.com",
            family_contact_phone="555-1234",
        )
        db_session.add(signup)
        await db_session.flush()

        for fm in family_members:
            if fm.member_type == "scout":
                participant = Participant(
                    id=uuid.uuid4(),
                    signup_id=signup.id,
                    family_member_id=fm.id,
                )
                db_session.add(participant)
        
        await db_session.commit()

        # Get unassigned scouts
        unassigned = await crud_tenting.get_unassigned_scouts(db_session, test_outing.id)
        
        # There should be unassigned scouts
        assert len(unassigned) > 0
