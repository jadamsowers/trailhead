"""Tests for signup schema validators"""
import pytest
from datetime import datetime
from uuid import uuid4
from pydantic import ValidationError

from app.schemas.signup import (
    DietaryRestriction,
    Allergy,
    FamilyContact,
    SignupCreate,
    SignupUpdate,
    ParticipantResponse,
    SignupResponse,
    SignupListResponse,
)


class TestDietaryRestriction:
    """Tests for DietaryRestriction schema"""

    def test_valid_restriction(self):
        """Test creating a valid dietary restriction"""
        restriction = DietaryRestriction(restriction_type="vegetarian")
        assert restriction.restriction_type == "vegetarian"
        assert restriction.notes is None

    def test_restriction_with_notes(self):
        """Test dietary restriction with notes"""
        restriction = DietaryRestriction(
            restriction_type="gluten-free",
            notes="Celiac disease"
        )
        assert restriction.restriction_type == "gluten-free"
        assert restriction.notes == "Celiac disease"


class TestAllergy:
    """Tests for Allergy schema"""

    def test_valid_allergy_mild(self):
        """Test creating a mild allergy"""
        allergy = Allergy(allergy_type="peanuts", severity="mild")
        assert allergy.allergy_type == "peanuts"
        assert allergy.severity == "mild"
        assert allergy.notes is None

    def test_valid_allergy_moderate(self):
        """Test creating a moderate allergy"""
        allergy = Allergy(allergy_type="shellfish", severity="moderate")
        assert allergy.severity == "moderate"

    def test_valid_allergy_severe(self):
        """Test creating a severe allergy"""
        allergy = Allergy(allergy_type="tree nuts", severity="severe")
        assert allergy.severity == "severe"

    def test_allergy_with_notes(self):
        """Test allergy with additional notes"""
        allergy = Allergy(
            allergy_type="bee stings",
            severity="severe",
            notes="Carries EpiPen"
        )
        assert allergy.notes == "Carries EpiPen"

    def test_invalid_severity_raises_error(self):
        """Test that invalid severity raises validation error"""
        with pytest.raises(ValidationError) as exc_info:
            Allergy(allergy_type="peanuts", severity="extreme")
        # The pattern validation should fail
        assert "severity" in str(exc_info.value)


class TestFamilyContact:
    """Tests for FamilyContact schema"""

    def test_valid_family_contact(self):
        """Test creating a valid family contact"""
        contact = FamilyContact(
            email="parent@example.com",
            phone="555-1234",
            emergency_contact_name="John Doe",
            emergency_contact_phone="555-9999"
        )
        assert contact.email == "parent@example.com"
        assert contact.phone == "555-1234"
        assert contact.emergency_contact_name == "John Doe"
        assert contact.emergency_contact_phone == "555-9999"

    def test_invalid_email_raises_error(self):
        """Test that invalid email raises validation error"""
        with pytest.raises(ValidationError):
            FamilyContact(
                email="not-an-email",
                phone="555-1234",
                emergency_contact_name="John Doe",
                emergency_contact_phone="555-9999"
            )

    def test_empty_phone_raises_error(self):
        """Test that empty phone raises validation error"""
        with pytest.raises(ValidationError):
            FamilyContact(
                email="parent@example.com",
                phone="",  # Empty phone
                emergency_contact_name="John Doe",
                emergency_contact_phone="555-9999"
            )

    def test_phone_too_long_raises_error(self):
        """Test that too long phone raises validation error"""
        with pytest.raises(ValidationError):
            FamilyContact(
                email="parent@example.com",
                phone="x" * 51,  # Too long
                emergency_contact_name="John Doe",
                emergency_contact_phone="555-9999"
            )

    def test_empty_emergency_contact_name_raises_error(self):
        """Test that empty emergency contact name raises error"""
        with pytest.raises(ValidationError):
            FamilyContact(
                email="parent@example.com",
                phone="555-1234",
                emergency_contact_name="",  # Empty
                emergency_contact_phone="555-9999"
            )


class TestSignupCreate:
    """Tests for SignupCreate schema"""

    def test_valid_signup_create(self):
        """Test creating a valid signup"""
        outing_id = uuid4()
        member_id = uuid4()
        signup = SignupCreate(
            outing_id=outing_id,
            family_contact=FamilyContact(
                email="parent@example.com",
                phone="555-1234",
                emergency_contact_name="John Doe",
                emergency_contact_phone="555-9999"
            ),
            family_member_ids=[member_id]
        )
        assert signup.outing_id == outing_id
        assert len(signup.family_member_ids) == 1

    def test_multiple_family_members(self):
        """Test signup with multiple family members"""
        signup = SignupCreate(
            outing_id=uuid4(),
            family_contact=FamilyContact(
                email="parent@example.com",
                phone="555-1234",
                emergency_contact_name="John Doe",
                emergency_contact_phone="555-9999"
            ),
            family_member_ids=[uuid4(), uuid4(), uuid4()]
        )
        assert len(signup.family_member_ids) == 3

    def test_empty_family_member_ids_raises_error(self):
        """Test that empty family_member_ids raises validation error"""
        with pytest.raises(ValidationError):
            SignupCreate(
                outing_id=uuid4(),
                family_contact=FamilyContact(
                    email="parent@example.com",
                    phone="555-1234",
                    emergency_contact_name="John Doe",
                    emergency_contact_phone="555-9999"
                ),
                family_member_ids=[]  # Empty list
            )


class TestSignupUpdate:
    """Tests for SignupUpdate schema"""

    def test_update_contact_only(self):
        """Test updating only contact information"""
        update = SignupUpdate(
            family_contact=FamilyContact(
                email="newemail@example.com",
                phone="555-9999",
                emergency_contact_name="Jane Doe",
                emergency_contact_phone="555-0000"
            )
        )
        assert update.family_contact is not None
        assert update.family_member_ids is None

    def test_update_members_only(self):
        """Test updating only family members"""
        update = SignupUpdate(
            family_member_ids=[uuid4(), uuid4()]
        )
        assert update.family_contact is None
        assert len(update.family_member_ids) == 2

    def test_update_both(self):
        """Test updating both contact and members"""
        update = SignupUpdate(
            family_contact=FamilyContact(
                email="parent@example.com",
                phone="555-1234",
                emergency_contact_name="John Doe",
                emergency_contact_phone="555-9999"
            ),
            family_member_ids=[uuid4()]
        )
        assert update.family_contact is not None
        assert len(update.family_member_ids) == 1

    def test_update_empty(self):
        """Test update with no fields (allowed)"""
        update = SignupUpdate()
        assert update.family_contact is None
        assert update.family_member_ids is None


class TestParticipantResponse:
    """Tests for ParticipantResponse schema"""

    def test_valid_participant_response(self):
        """Test creating a valid participant response"""
        participant = ParticipantResponse(
            id=uuid4(),
            name="Test Scout",
            age=14,
            participant_type="scout",
            is_adult=False,
            gender="male",
            troop_number="123",
            patrol_name="Eagle Patrol",
            has_youth_protection=False,
            vehicle_capacity=0,
            dietary_restrictions=["vegetarian"],
            allergies=["peanuts"],
            medical_notes="Asthma",
            created_at=datetime.now()
        )
        assert participant.name == "Test Scout"
        assert participant.age == 14
        assert participant.is_adult is False

    def test_adult_participant(self):
        """Test creating an adult participant response"""
        participant = ParticipantResponse(
            id=uuid4(),
            name="Test Adult",
            age=45,
            participant_type="adult",
            is_adult=True,
            gender="female",
            troop_number=None,
            patrol_name=None,
            has_youth_protection=True,
            vehicle_capacity=5,
            dietary_restrictions=[],
            allergies=[],
            medical_notes=None,
            created_at=datetime.now()
        )
        assert participant.is_adult is True
        assert participant.has_youth_protection is True
        assert participant.vehicle_capacity == 5

    def test_participant_minimal(self):
        """Test participant with minimal optional fields"""
        participant = ParticipantResponse(
            id=uuid4(),
            name="Test Person",
            age=None,
            participant_type="scout",
            is_adult=False,
            gender=None,
            troop_number=None,
            patrol_name=None,
            has_youth_protection=False,
            vehicle_capacity=0,
            dietary_restrictions=[],
            allergies=[],
            medical_notes=None,
            created_at=datetime.now()
        )
        assert participant.age is None
        assert participant.gender is None


class TestSignupResponse:
    """Tests for SignupResponse schema"""

    def test_valid_signup_response(self):
        """Test creating a valid signup response"""
        participant = ParticipantResponse(
            id=uuid4(),
            name="Test Scout",
            age=14,
            participant_type="scout",
            is_adult=False,
            gender="male",
            troop_number="123",
            patrol_name="Eagle",
            has_youth_protection=False,
            vehicle_capacity=0,
            dietary_restrictions=[],
            allergies=[],
            medical_notes=None,
            created_at=datetime.now()
        )
        
        signup = SignupResponse(
            id=uuid4(),
            outing_id=uuid4(),
            family_contact_name="Parent Name",
            family_contact_email="parent@example.com",
            family_contact_phone="555-1234",
            participants=[participant],
            participant_count=1,
            scout_count=1,
            adult_count=0,
            created_at=datetime.now()
        )
        assert signup.participant_count == 1
        assert signup.scout_count == 1
        assert signup.adult_count == 0
        assert signup.warnings == []

    def test_signup_with_warnings(self):
        """Test signup response with warnings"""
        signup = SignupResponse(
            id=uuid4(),
            outing_id=uuid4(),
            family_contact_name="Parent Name",
            family_contact_email="parent@example.com",
            family_contact_phone="555-1234",
            participants=[],
            participant_count=0,
            scout_count=0,
            adult_count=0,
            created_at=datetime.now(),
            warnings=["No adults with youth protection", "Missing two-deep leadership"]
        )
        assert len(signup.warnings) == 2


class TestSignupListResponse:
    """Tests for SignupListResponse schema"""

    def test_empty_list(self):
        """Test signup list with no signups"""
        response = SignupListResponse(signups=[], total=0)
        assert len(response.signups) == 0
        assert response.total == 0

    def test_list_with_signups(self):
        """Test signup list with signups"""
        signup = SignupResponse(
            id=uuid4(),
            outing_id=uuid4(),
            family_contact_name="Parent",
            family_contact_email="parent@example.com",
            family_contact_phone="555-1234",
            participants=[],
            participant_count=0,
            scout_count=0,
            adult_count=0,
            created_at=datetime.now()
        )
        response = SignupListResponse(signups=[signup], total=1)
        assert len(response.signups) == 1
        assert response.total == 1
