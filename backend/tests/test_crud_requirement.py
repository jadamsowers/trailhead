"""Tests for requirement CRUD functions"""
import pytest
from uuid import uuid4

from app.crud import requirement as crud_requirement
from app.schemas.requirement import (
    RankRequirementCreate,
    RankRequirementUpdate,
    MeritBadgeCreate,
    MeritBadgeUpdate,
    OutingRequirementCreate,
    OutingRequirementUpdate,
    OutingMeritBadgeCreate,
    OutingMeritBadgeUpdate,
)
from app.models.outing import Outing
from datetime import date, timedelta

pytestmark = pytest.mark.asyncio


# ============================================================================
# Rank Requirement Tests
# ============================================================================

class TestGetRankRequirements:
    async def test_get_rank_requirements_all(self, db_session):
        """Test getting all rank requirements"""
        req1 = await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Scout Spirit",
                keywords=["oath", "scout spirit"]
            )
        )
        req2 = await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Tenderfoot",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Scout Spirit",
                keywords=["scout spirit"]
            )
        )
        
        requirements = await crud_requirement.get_rank_requirements(db_session)
        assert len(requirements) >= 2

    async def test_get_rank_requirements_filter_by_rank(self, db_session):
        """Test filtering rank requirements by rank"""
        await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Scout Spirit",
                keywords=["test"]
            )
        )
        await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Eagle",
                requirement_number="1",
                requirement_text="Test requirement text",
                category="Service",
                keywords=["test"]
            )
        )
        
        scout_reqs = await crud_requirement.get_rank_requirements(db_session, rank="Scout")
        assert all(req.rank == "Scout" for req in scout_reqs)

    async def test_get_rank_requirements_filter_by_category(self, db_session):
        """Test filtering rank requirements by category"""
        await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Scout Spirit",
                keywords=["test"]
            )
        )
        await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="2a",
                requirement_text="Test requirement text",
                category="Camping",
                keywords=["camping"]
            )
        )
        
        camping_reqs = await crud_requirement.get_rank_requirements(db_session, category="Camping")
        assert all(req.category == "Camping" for req in camping_reqs)

    async def test_get_rank_requirements_pagination(self, db_session):
        """Test pagination of rank requirements"""
        for i in range(5):
            await crud_requirement.create_rank_requirement(
                db_session,
                RankRequirementCreate(
                    rank="Scout",
                    requirement_number=f"{i}a",
                requirement_text="Test requirement text",
                    category="Test",
                    keywords=[f"test{i}"]
                )
            )
        
        page1 = await crud_requirement.get_rank_requirements(db_session, skip=0, limit=2)
        assert len(page1) == 2
        
        page2 = await crud_requirement.get_rank_requirements(db_session, skip=2, limit=2)
        assert len(page2) == 2
        assert page1[0].id != page2[0].id


class TestGetRankRequirement:
    async def test_get_rank_requirement_success(self, db_session):
        """Test getting a specific rank requirement"""
        req = await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Scout Spirit",
                keywords=["test"]
            )
        )
        
        fetched = await crud_requirement.get_rank_requirement(db_session, req.id)
        assert fetched is not None
        assert fetched.id == req.id
        assert fetched.rank == "Scout"

    async def test_get_rank_requirement_not_found(self, db_session):
        """Test getting non-existent rank requirement"""
        result = await crud_requirement.get_rank_requirement(db_session, uuid4())
        assert result is None


class TestCreateRankRequirement:
    async def test_create_rank_requirement(self, db_session):
        """Test creating a rank requirement"""
        req_data = RankRequirementCreate(
            rank="Tenderfoot",
            requirement_number="1a",
                requirement_text="Test requirement text",
            category="Scout Spirit",
            keywords=["scout spirit", "leader"]
        )
        
        req = await crud_requirement.create_rank_requirement(db_session, req_data)
        assert req.id is not None
        assert req.rank == "Tenderfoot"
        assert req.requirement_number == "1a"
        assert "scout spirit" in req.keywords


class TestUpdateRankRequirement:
    async def test_update_rank_requirement(self, db_session):
        """Test updating a rank requirement"""
        req = await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Scout Spirit",
                keywords=["original"]
            )
        )
        
        updated = await crud_requirement.update_rank_requirement(
            db_session,
            req.id,
            RankRequirementUpdate(
                requirement_text="Updated description",
                keywords=["original", "updated"]
            )
        )
        assert updated is not None
        assert updated.requirement_text == "Updated description"
        assert "updated" in updated.keywords

    async def test_update_rank_requirement_not_found(self, db_session):
        """Test updating non-existent rank requirement"""
        result = await crud_requirement.update_rank_requirement(
            db_session,
            uuid4(),
            RankRequirementUpdate(requirement_text="Test")
        )
        assert result is None


class TestDeleteRankRequirement:
    async def test_delete_rank_requirement_success(self, db_session):
        """Test deleting a rank requirement"""
        req = await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Test",
                keywords=["test"]
            )
        )
        
        success = await crud_requirement.delete_rank_requirement(db_session, req.id)
        assert success is True
        
        deleted = await crud_requirement.get_rank_requirement(db_session, req.id)
        assert deleted is None

    async def test_delete_rank_requirement_not_found(self, db_session):
        """Test deleting non-existent rank requirement"""
        success = await crud_requirement.delete_rank_requirement(db_session, uuid4())
        assert success is False


class TestSearchRankRequirementsByKeywords:
    async def test_search_by_keywords_single(self, db_session):
        """Test searching rank requirements by single keyword"""
        await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Camping",
                keywords=["camping", "outdoors"]
            )
        )
        
        results = await crud_requirement.search_rank_requirements_by_keywords(
            db_session,
            ["camping"]
        )
        assert len(results) >= 1
        assert any("camping" in req.keywords for req in results)

    async def test_search_by_keywords_multiple(self, db_session):
        """Test searching rank requirements by multiple keywords"""
        await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Aquatics",
                keywords=["swimming", "water", "safety"]
            )
        )
        
        results = await crud_requirement.search_rank_requirements_by_keywords(
            db_session,
            ["swimming", "water"]
        )
        assert len(results) >= 1


# ============================================================================
# Merit Badge Tests
# ============================================================================

class TestGetMeritBadges:
    async def test_get_merit_badges_all(self, db_session):
        """Test getting all merit badges"""
        await crud_requirement.create_merit_badge(
            db_session,
            MeritBadgeCreate(
                name="Camping",
                eagle_required=False,
                keywords=["camping", "outdoors"]
            )
        )
        
        badges = await crud_requirement.get_merit_badges(db_session)
        assert len(badges) >= 1

    async def test_get_merit_badges_pagination(self, db_session):
        """Test pagination of merit badges"""
        for i in range(5):
            await crud_requirement.create_merit_badge(
                db_session,
                MeritBadgeCreate(
                    name=f"Badge {i}",
                    description=f"Description {i}",
                    eagle_required=False,
                    keywords=[f"test{i}"]
                )
            )
        
        page1 = await crud_requirement.get_merit_badges(db_session, skip=0, limit=2)
        assert len(page1) == 2


class TestGetMeritBadge:
    async def test_get_merit_badge_by_id(self, db_session):
        """Test getting a merit badge by ID"""
        badge = await crud_requirement.create_merit_badge(
            db_session,
            MeritBadgeCreate(
                name="Swimming",
                eagle_required=True,
                keywords=["swimming", "water"]
            )
        )
        
        fetched = await crud_requirement.get_merit_badge(db_session, badge.id)
        assert fetched is not None
        assert fetched.id == badge.id
        assert fetched.name == "Swimming"

    async def test_get_merit_badge_not_found(self, db_session):
        """Test getting non-existent merit badge"""
        result = await crud_requirement.get_merit_badge(db_session, uuid4())
        assert result is None

    async def test_get_merit_badge_by_name(self, db_session):
        """Test getting a merit badge by name"""
        await crud_requirement.create_merit_badge(
            db_session,
            MeritBadgeCreate(
                name="Hiking",
                eagle_required=False,
                keywords=["hiking"]
            )
        )
        
        fetched = await crud_requirement.get_merit_badge_by_name(db_session, "Hiking")
        assert fetched is not None
        assert fetched.name == "Hiking"

    async def test_get_merit_badge_by_name_not_found(self, db_session):
        """Test getting merit badge by non-existent name"""
        result = await crud_requirement.get_merit_badge_by_name(db_session, "Nonexistent")
        assert result is None


class TestCreateMeritBadge:
    async def test_create_merit_badge(self, db_session):
        """Test creating a merit badge"""
        badge_data = MeritBadgeCreate(
            name="First Aid",
            eagle_required=True,
            keywords=["first aid", "safety", "medical"]
        )
        
        badge = await crud_requirement.create_merit_badge(db_session, badge_data)
        assert badge.id is not None
        assert badge.name == "First Aid"
        assert badge.eagle_required is True
        assert "first aid" in badge.keywords


class TestUpdateMeritBadge:
    async def test_update_merit_badge(self, db_session):
        """Test updating a merit badge"""
        badge = await crud_requirement.create_merit_badge(
            db_session,
            MeritBadgeCreate(
                name="Cooking",
                eagle_required=False,
                keywords=["cooking"]
            )
        )
        
        updated = await crud_requirement.update_merit_badge(
            db_session,
            badge.id,
            MeritBadgeUpdate(
                description="Updated description",
                eagle_required=True
            )
        )
        assert updated is not None
        assert updated.description == "Updated description"
        assert updated.eagle_required is True

    async def test_update_merit_badge_not_found(self, db_session):
        """Test updating non-existent merit badge"""
        result = await crud_requirement.update_merit_badge(
            db_session,
            uuid4(),
            MeritBadgeUpdate(description="Test")
        )
        assert result is None


class TestDeleteMeritBadge:
    async def test_delete_merit_badge_success(self, db_session):
        """Test deleting a merit badge"""
        badge = await crud_requirement.create_merit_badge(
            db_session,
            MeritBadgeCreate(
                name="To Delete",
                eagle_required=False,
                keywords=["test"]
            )
        )
        
        success = await crud_requirement.delete_merit_badge(db_session, badge.id)
        assert success is True
        
        deleted = await crud_requirement.get_merit_badge(db_session, badge.id)
        assert deleted is None

    async def test_delete_merit_badge_not_found(self, db_session):
        """Test deleting non-existent merit badge"""
        success = await crud_requirement.delete_merit_badge(db_session, uuid4())
        assert success is False


class TestSearchMeritBadgesByKeywords:
    async def test_search_merit_badges_by_keywords(self, db_session):
        """Test searching merit badges by keywords"""
        await crud_requirement.create_merit_badge(
            db_session,
            MeritBadgeCreate(
                name="Environmental Science",
                eagle_required=True,
                keywords=["environment", "science", "nature"]
            )
        )
        
        results = await crud_requirement.search_merit_badges_by_keywords(
            db_session,
            ["environment"]
        )
        assert len(results) >= 1
        assert any("environment" in badge.keywords for badge in results)


# ============================================================================
# Outing Requirement Tests
# ============================================================================

class TestOutingRequirements:
    async def test_get_outing_requirements(self, db_session):
        """Test getting all requirements for an outing"""
        # Create outing
        outing = Outing(
            name="Test Outing",
            outing_date=date.today() + timedelta(days=7),
            end_date=date.today() + timedelta(days=8),
            location="Test Location",
            max_participants=20
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        # Create rank requirement
        rank_req = await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Test",
                keywords=["test"]
            )
        )
        
        # Add to outing
        await crud_requirement.add_requirement_to_outing(
            db_session,
            outing.id,
            OutingRequirementCreate(rank_requirement_id=rank_req.id, notes="Test notes")
        )
        
        requirements = await crud_requirement.get_outing_requirements(db_session, outing.id)
        assert len(requirements) >= 1

    async def test_add_requirement_to_outing(self, db_session):
        """Test adding a requirement to an outing"""
        # Create outing
        outing = Outing(
            name="Test Outing",
            outing_date=date.today() + timedelta(days=7),
            end_date=date.today() + timedelta(days=8),
            location="Test Location",
            max_participants=20
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        # Create rank requirement
        rank_req = await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Test",
                keywords=["test"]
            )
        )
        
        # Add to outing
        outing_req = await crud_requirement.add_requirement_to_outing(
            db_session,
            outing.id,
            OutingRequirementCreate(rank_requirement_id=rank_req.id, notes="Important notes")
        )
        
        assert outing_req.id is not None
        assert outing_req.outing_id == outing.id
        assert outing_req.rank_requirement_id == rank_req.id
        assert outing_req.notes == "Important notes"

    async def test_update_outing_requirement(self, db_session):
        """Test updating an outing requirement"""
        # Create outing and requirement
        outing = Outing(
            name="Test Outing",
            outing_date=date.today() + timedelta(days=7),
            end_date=date.today() + timedelta(days=8),
            location="Test Location",
            max_participants=20
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        rank_req = await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Test",
                keywords=["test"]
            )
        )
        
        outing_req = await crud_requirement.add_requirement_to_outing(
            db_session,
            outing.id,
            OutingRequirementCreate(rank_requirement_id=rank_req.id, notes="Original notes")
        )
        
        # Update
        updated = await crud_requirement.update_outing_requirement(
            db_session,
            outing_req.id,
            OutingRequirementUpdate(notes="Updated notes")
        )
        
        assert updated is not None
        assert updated.notes == "Updated notes"

    async def test_update_outing_requirement_not_found(self, db_session):
        """Test updating non-existent outing requirement"""
        result = await crud_requirement.update_outing_requirement(
            db_session,
            uuid4(),
            OutingRequirementUpdate(notes="Updated")
        )
        assert result is None

    async def test_remove_requirement_from_outing(self, db_session):
        """Test removing a requirement from an outing"""
        # Create outing and requirement
        outing = Outing(
            name="Test Outing",
            outing_date=date.today() + timedelta(days=7),
            end_date=date.today() + timedelta(days=8),
            location="Test Location",
            max_participants=20
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        rank_req = await crud_requirement.create_rank_requirement(
            db_session,
            RankRequirementCreate(
                rank="Scout",
                requirement_number="1a",
                requirement_text="Test requirement text",
                category="Test",
                keywords=["test"]
            )
        )
        
        outing_req = await crud_requirement.add_requirement_to_outing(
            db_session,
            outing.id,
            OutingRequirementCreate(rank_requirement_id=rank_req.id)
        )
        
        # Remove
        success = await crud_requirement.remove_requirement_from_outing(db_session, outing_req.id)
        assert success is True

    async def test_remove_requirement_from_outing_not_found(self, db_session):
        """Test removing non-existent outing requirement"""
        success = await crud_requirement.remove_requirement_from_outing(db_session, uuid4())
        assert success is False


# ============================================================================
# Outing Merit Badge Tests
# ============================================================================

class TestOutingMeritBadges:
    async def test_get_outing_merit_badges(self, db_session):
        """Test getting all merit badges for an outing"""
        # Create outing
        outing = Outing(
            name="Test Outing",
            outing_date=date.today() + timedelta(days=7),
            end_date=date.today() + timedelta(days=8),
            location="Test Location",
            max_participants=20
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        # Create merit badge
        badge = await crud_requirement.create_merit_badge(
            db_session,
            MeritBadgeCreate(
                name="Test Badge",
                eagle_required=False,
                keywords=["test"]
            )
        )
        
        # Add to outing
        await crud_requirement.add_merit_badge_to_outing(
            db_session,
            outing.id,
            OutingMeritBadgeCreate(merit_badge_id=badge.id, notes="Test notes")
        )
        
        badges = await crud_requirement.get_outing_merit_badges(db_session, outing.id)
        assert len(badges) >= 1

    async def test_add_merit_badge_to_outing(self, db_session):
        """Test adding a merit badge to an outing"""
        # Create outing
        outing = Outing(
            name="Test Outing",
            outing_date=date.today() + timedelta(days=7),
            end_date=date.today() + timedelta(days=8),
            location="Test Location",
            max_participants=20
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        # Create merit badge
        badge = await crud_requirement.create_merit_badge(
            db_session,
            MeritBadgeCreate(
                name="Test Badge",
                eagle_required=False,
                keywords=["test"]
            )
        )
        
        # Add to outing
        outing_badge = await crud_requirement.add_merit_badge_to_outing(
            db_session,
            outing.id,
            OutingMeritBadgeCreate(merit_badge_id=badge.id, notes="Badge notes")
        )
        
        assert outing_badge.id is not None
        assert outing_badge.outing_id == outing.id
        assert outing_badge.merit_badge_id == badge.id
        assert outing_badge.notes == "Badge notes"

    async def test_update_outing_merit_badge(self, db_session):
        """Test updating an outing merit badge"""
        # Create outing and badge
        outing = Outing(
            name="Test Outing",
            outing_date=date.today() + timedelta(days=7),
            end_date=date.today() + timedelta(days=8),
            location="Test Location",
            max_participants=20
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        badge = await crud_requirement.create_merit_badge(
            db_session,
            MeritBadgeCreate(
                name="Test Badge",
                eagle_required=False,
                keywords=["test"]
            )
        )
        
        outing_badge = await crud_requirement.add_merit_badge_to_outing(
            db_session,
            outing.id,
            OutingMeritBadgeCreate(merit_badge_id=badge.id, notes="Original notes")
        )
        
        # Update
        updated = await crud_requirement.update_outing_merit_badge(
            db_session,
            outing_badge.id,
            OutingMeritBadgeUpdate(notes="Updated notes")
        )
        
        assert updated is not None
        assert updated.notes == "Updated notes"

    async def test_update_outing_merit_badge_not_found(self, db_session):
        """Test updating non-existent outing merit badge"""
        result = await crud_requirement.update_outing_merit_badge(
            db_session,
            uuid4(),
            OutingMeritBadgeUpdate(notes="Updated")
        )
        assert result is None

    async def test_remove_merit_badge_from_outing(self, db_session):
        """Test removing a merit badge from an outing"""
        # Create outing and badge
        outing = Outing(
            name="Test Outing",
            outing_date=date.today() + timedelta(days=7),
            end_date=date.today() + timedelta(days=8),
            location="Test Location",
            max_participants=20
        )
        db_session.add(outing)
        await db_session.commit()
        await db_session.refresh(outing)
        
        badge = await crud_requirement.create_merit_badge(
            db_session,
            MeritBadgeCreate(
                name="Test Badge",
                eagle_required=False,
                keywords=["test"]
            )
        )
        
        outing_badge = await crud_requirement.add_merit_badge_to_outing(
            db_session,
            outing.id,
            OutingMeritBadgeCreate(merit_badge_id=badge.id)
        )
        
        # Remove
        success = await crud_requirement.remove_merit_badge_from_outing(db_session, outing_badge.id)
        assert success is True

    async def test_remove_merit_badge_from_outing_not_found(self, db_session):
        """Test removing non-existent outing merit badge"""
        success = await crud_requirement.remove_merit_badge_from_outing(db_session, uuid4())
        assert success is False
