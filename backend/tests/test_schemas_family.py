"""Tests for family schema validators"""
import pytest
from datetime import date
from uuid import uuid4
from pydantic import ValidationError

from app.schemas.family import (
    DietaryPreferenceBase,
    DietaryPreferenceCreate,
    DietaryPreferenceResponse,
    AllergyBase,
    AllergyCreate,
    AllergyResponse,
    FamilyMemberBase,
    FamilyMemberCreate,
    FamilyMemberUpdate,
    FamilyMemberResponse,
    FamilyMemberListResponse,
    FamilyMemberSummary,
)


class TestDietaryPreferenceSchemas:
    """Tests for dietary preference schemas"""

    def test_dietary_preference_base_valid(self):
        """Test valid dietary preference"""
        pref = DietaryPreferenceBase(preference="vegetarian")
        assert pref.preference == "vegetarian"

    def test_dietary_preference_empty_raises_error(self):
        """Test that empty string raises validation error"""
        with pytest.raises(ValidationError):
            DietaryPreferenceBase(preference="")

    def test_dietary_preference_too_long_raises_error(self):
        """Test that too long string raises validation error"""
        with pytest.raises(ValidationError):
            DietaryPreferenceBase(preference="x" * 101)

    def test_dietary_preference_create(self):
        """Test dietary preference create schema"""
        pref = DietaryPreferenceCreate(preference="vegan")
        assert pref.preference == "vegan"

    def test_dietary_preference_response(self):
        """Test dietary preference response schema"""
        pref_id = uuid4()
        pref = DietaryPreferenceResponse(id=pref_id, preference="gluten-free")
        assert pref.id == pref_id
        assert pref.preference == "gluten-free"


class TestAllergySchemas:
    """Tests for allergy schemas"""

    def test_allergy_base_valid(self):
        """Test valid allergy"""
        allergy = AllergyBase(allergy="peanuts")
        assert allergy.allergy == "peanuts"
        assert allergy.severity is None

    def test_allergy_with_severity(self):
        """Test allergy with severity"""
        allergy = AllergyBase(allergy="shellfish", severity="severe")
        assert allergy.allergy == "shellfish"
        assert allergy.severity == "severe"

    def test_allergy_empty_raises_error(self):
        """Test that empty allergy string raises validation error"""
        with pytest.raises(ValidationError):
            AllergyBase(allergy="")

    def test_allergy_too_long_raises_error(self):
        """Test that too long allergy string raises validation error"""
        with pytest.raises(ValidationError):
            AllergyBase(allergy="x" * 101)

    def test_allergy_severity_too_long_raises_error(self):
        """Test that too long severity string raises validation error"""
        with pytest.raises(ValidationError):
            AllergyBase(allergy="peanuts", severity="x" * 51)

    def test_allergy_create(self):
        """Test allergy create schema"""
        allergy = AllergyCreate(allergy="dairy", severity="mild")
        assert allergy.allergy == "dairy"
        assert allergy.severity == "mild"

    def test_allergy_response(self):
        """Test allergy response schema"""
        allergy_id = uuid4()
        allergy = AllergyResponse(id=allergy_id, allergy="tree nuts", severity="life-threatening")
        assert allergy.id == allergy_id
        assert allergy.allergy == "tree nuts"
        assert allergy.severity == "life-threatening"


class TestFamilyMemberBase:
    """Tests for FamilyMemberBase schema"""

    def test_adult_member_valid(self):
        """Test valid adult member"""
        member = FamilyMemberBase(
            name="John Doe",
            member_type="adult",
            has_youth_protection=True,
            vehicle_capacity=4,
        )
        assert member.name == "John Doe"
        assert member.member_type == "adult"
        assert member.has_youth_protection is True
        assert member.vehicle_capacity == 4

    def test_scout_member_valid(self):
        """Test valid scout member"""
        member = FamilyMemberBase(
            name="Jane Doe",
            member_type="scout",
            date_of_birth=date(2012, 5, 15),
            troop_number="123",
            patrol_name="Eagle Patrol",
        )
        assert member.name == "Jane Doe"
        assert member.member_type == "scout"
        assert member.date_of_birth == date(2012, 5, 15)
        assert member.troop_number == "123"
        assert member.patrol_name == "Eagle Patrol"

    def test_invalid_member_type_raises_error(self):
        """Test that invalid member_type raises validation error"""
        with pytest.raises(ValidationError) as exc_info:
            FamilyMemberBase(
                name="Test Person",
                member_type="invalid",
            )
        assert "member_type must be either" in str(exc_info.value)

    def test_empty_name_raises_error(self):
        """Test that empty name raises validation error"""
        with pytest.raises(ValidationError):
            FamilyMemberBase(name="", member_type="adult")

    def test_name_too_long_raises_error(self):
        """Test that too long name raises validation error"""
        with pytest.raises(ValidationError):
            FamilyMemberBase(name="x" * 256, member_type="adult")

    def test_negative_vehicle_capacity_raises_error(self):
        """Test that negative vehicle_capacity raises validation error"""
        with pytest.raises(ValidationError):
            FamilyMemberBase(
                name="Test Adult",
                member_type="adult",
                vehicle_capacity=-1,
            )

    def test_default_values(self):
        """Test default values for optional fields"""
        member = FamilyMemberBase(name="Test Person", member_type="adult")
        assert member.date_of_birth is None
        assert member.troop_number is None
        assert member.patrol_name is None
        assert member.has_youth_protection is False
        assert member.vehicle_capacity == 0
        assert member.medical_notes is None


class TestFamilyMemberCreate:
    """Tests for FamilyMemberCreate schema"""

    def test_create_with_defaults(self):
        """Test create with default values"""
        member = FamilyMemberCreate(
            name="Test Person",
            member_type="adult",
        )
        assert member.dietary_preferences == []
        assert member.allergies == []

    def test_create_with_dietary_preferences(self):
        """Test create with dietary preferences"""
        member = FamilyMemberCreate(
            name="Test Person",
            member_type="adult",
            dietary_preferences=["vegetarian", "no seafood"],
        )
        assert len(member.dietary_preferences) == 2
        assert "vegetarian" in member.dietary_preferences

    def test_create_with_allergies(self):
        """Test create with allergies"""
        member = FamilyMemberCreate(
            name="Test Person",
            member_type="adult",
            allergies=[
                AllergyCreate(allergy="peanuts", severity="severe"),
                AllergyCreate(allergy="shellfish"),
            ],
        )
        assert len(member.allergies) == 2
        assert member.allergies[0].allergy == "peanuts"
        assert member.allergies[0].severity == "severe"


class TestFamilyMemberUpdate:
    """Tests for FamilyMemberUpdate schema"""

    def test_update_partial(self):
        """Test partial update with some fields"""
        update = FamilyMemberUpdate(name="New Name")
        assert update.name == "New Name"
        assert update.date_of_birth is None
        assert update.troop_number is None

    def test_update_empty(self):
        """Test update with no fields"""
        update = FamilyMemberUpdate()
        assert update.name is None
        assert update.has_youth_protection is None
        assert update.vehicle_capacity is None

    def test_update_all_fields(self):
        """Test update with all fields"""
        update = FamilyMemberUpdate(
            name="Updated Name",
            date_of_birth=date(2010, 1, 1),
            troop_number="456",
            patrol_name="Wolf Patrol",
            has_youth_protection=True,
            vehicle_capacity=5,
            medical_notes="Asthma",
        )
        assert update.name == "Updated Name"
        assert update.date_of_birth == date(2010, 1, 1)
        assert update.troop_number == "456"
        assert update.patrol_name == "Wolf Patrol"
        assert update.has_youth_protection is True
        assert update.vehicle_capacity == 5
        assert update.medical_notes == "Asthma"

    def test_update_dietary_preferences(self):
        """Test update dietary preferences"""
        update = FamilyMemberUpdate(
            dietary_preferences=["vegan"]
        )
        assert update.dietary_preferences == ["vegan"]


class TestFamilyMemberSummary:
    """Tests for FamilyMemberSummary schema"""

    def test_summary_adult(self):
        """Test summary for adult member"""
        summary = FamilyMemberSummary(
            id=uuid4(),
            name="Adult Person",
            member_type="adult",
            vehicle_capacity=4,
            has_youth_protection=True,
            youth_protection_expired=False,
        )
        assert summary.member_type == "adult"
        assert summary.vehicle_capacity == 4
        assert summary.has_youth_protection is True
        assert summary.youth_protection_expired is False

    def test_summary_scout(self):
        """Test summary for scout member"""
        summary = FamilyMemberSummary(
            id=uuid4(),
            name="Scout Person",
            member_type="scout",
            troop_number="789",
            age=14,
        )
        assert summary.member_type == "scout"
        assert summary.troop_number == "789"
        assert summary.age == 14

    def test_summary_minimal(self):
        """Test summary with minimal required fields"""
        summary = FamilyMemberSummary(
            id=uuid4(),
            name="Test Person",
            member_type="adult",
        )
        assert summary.name == "Test Person"
        assert summary.troop_number is None
        assert summary.age is None


class TestFamilyMemberListResponse:
    """Tests for FamilyMemberListResponse schema"""

    def test_list_response_empty(self):
        """Test list response with empty list"""
        response = FamilyMemberListResponse(members=[], total=0)
        assert len(response.members) == 0
        assert response.total == 0

    def test_list_response_with_members(self):
        """Test list response with members"""
        from datetime import datetime
        member = FamilyMemberResponse(
            id=uuid4(),
            user_id=uuid4(),
            name="Test Member",
            member_type="adult",
            has_youth_protection=True,
            vehicle_capacity=4,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        response = FamilyMemberListResponse(members=[member], total=1)
        assert len(response.members) == 1
        assert response.total == 1
        assert response.members[0].name == "Test Member"
