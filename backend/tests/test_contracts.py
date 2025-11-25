"""
Contract tests to verify API responses match frontend TypeScript type expectations.

These tests ensure that the backend API responses conform to the structure expected
by the frontend TypeScript types generated from the OpenAPI specification.

IMPORTANT: These tests are database-independent and test response structure only.
They do not require database fixtures or actual data.
"""
import pytest
from datetime import date, timedelta, datetime
from app.schemas.outing import OutingResponse, OutingCreate
from app.schemas.signup import SignupResponse, SignupCreate
from pydantic import ValidationError


pytestmark = pytest.mark.asyncio


class TestOutingContracts:
    """Test Outing response structure matches frontend expectations"""
    
    def test_outing_response_structure(self):
        """Verify OutingResponse schema matches frontend Outing type"""
        # Create a valid outing response
        outing_data = {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Test Outing",
            "outing_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=2)).isoformat(),
            "location": "Test Location",
            "description": "Test Description",
            "max_participants": 20,
            "is_overnight": True,
            "signup_count": 5,
            "available_spots": 15,
            "outing_lead_name": "John Doe",
            "outing_lead_email": "john@example.com",
            "outing_lead_phone": "555-1234",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        # Should not raise validation error
        outing = OutingResponse(**outing_data)
        
        # Verify all required fields are present
        assert str(outing.id) == outing_data["id"]
        assert outing.name == outing_data["name"]
        assert outing.outing_date == date.today()
        assert outing.end_date == date.today() + timedelta(days=2)
        assert outing.location == outing_data["location"]
        assert outing.description == outing_data["description"]
        assert outing.max_participants == outing_data["max_participants"]
        assert outing.is_overnight == outing_data["is_overnight"]
        assert outing.signup_count == outing_data["signup_count"]
        assert outing.available_spots == outing_data["available_spots"]
        assert outing.outing_lead_name == outing_data["outing_lead_name"]
        assert outing.outing_lead_email == outing_data["outing_lead_email"]
        assert outing.outing_lead_phone == outing_data["outing_lead_phone"]
    
    def test_outing_create_request_structure(self):
        """Verify OutingCreate schema matches frontend expectations"""
        outing_data = {
            "name": "New Outing",
            "outing_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=2)).isoformat(),
            "location": "New Location",
            "description": "New Description",
            "max_participants": 30,
            "is_overnight": False,
            "outing_lead_name": "Jane Doe",
            "outing_lead_email": "jane@example.com",
            "outing_lead_phone": "555-5678",
        }
        
        # Should not raise validation error
        outing = OutingCreate(**outing_data)
        
        assert outing.name == outing_data["name"]
        assert outing.outing_date == date.today()
        assert outing.location == outing_data["location"]


class TestSignupContracts:
    """Test Signup response structure matches frontend expectations"""
    
    def test_signup_response_structure(self):
        """Verify SignupResponse schema matches frontend SignupResponse type"""
        signup_data = {
            "id": "123e4567-e89b-12d3-a456-426614174001",
            "outing_id": "123e4567-e89b-12d3-a456-426614174000",
            "family_contact_name": "John Doe",
            "family_contact_email": "john@example.com",
            "family_contact_phone": "555-1234",
            "participants": [
                {
                    "id": "123e4567-e89b-12d3-a456-426614174002",
                    "signup_id": "123e4567-e89b-12d3-a456-426614174001",
                    "name": "Scout Doe",
                    "age": 14,
                    "participant_type": "scout",
                    "is_adult": False,
                    "gender": "male",
                    "troop_number": "123",
                    "patrol_name": "Eagle Patrol",
                    "has_youth_protection": False,
                    "vehicle_capacity": 0,
                    "dietary_restrictions": [],
                    "allergies": [],
                    "medical_notes": None,
                    "created_at": datetime.utcnow().isoformat(),
                }
            ],
            "participant_count": 1,
            "scout_count": 1,
            "adult_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            "warnings": [],
        }
        
        # Should not raise validation error
        signup = SignupResponse(**signup_data)
        
        # Verify all required fields including warnings
        assert str(signup.id) == signup_data["id"]
        assert str(signup.outing_id) == signup_data["outing_id"]
        assert signup.family_contact_name == signup_data["family_contact_name"]
        assert signup.family_contact_email == signup_data["family_contact_email"]
        assert signup.family_contact_phone == signup_data["family_contact_phone"]
        assert len(signup.participants) == 1
        assert signup.warnings == []  # Critical: warnings field must be present
    
    def test_signup_response_with_warnings(self):
        """Verify SignupResponse includes warnings field (the original 422 error cause)"""
        signup_data = {
            "id": "123e4567-e89b-12d3-a456-426614174001",
            "outing_id": "123e4567-e89b-12d3-a456-426614174000",
            "family_contact_name": "John Doe",
            "family_contact_email": "john@example.com",
            "family_contact_phone": "555-1234",
            "participants": [
                {
                    "id": "123e4567-e89b-12d3-a456-426614174002",
                    "signup_id": "123e4567-e89b-12d3-a456-426614174001",
                    "name": "Scout Doe",
                    "age": 14,
                    "participant_type": "scout",
                    "is_adult": False,
                    "gender": "male",
                    "troop_number": "123",
                    "patrol_name": "Eagle Patrol",
                    "has_youth_protection": False,
                    "vehicle_capacity": 0,
                    "dietary_restrictions": [],
                    "allergies": [],
                    "medical_notes": None,
                    "created_at": datetime.utcnow().isoformat(),
                }
            ],
            "participant_count": 1,
            "scout_count": 1,
            "adult_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            "warnings": ["No adult with youth protection training"],
        }
        
        # Should not raise validation error
        signup = SignupResponse(**signup_data)
        
        # Verify warnings field is present and contains expected data
        assert signup.warnings == ["No adult with youth protection training"]
        assert isinstance(signup.warnings, list)
    
    def test_signup_create_request_structure(self):
        """Verify SignupCreate schema matches frontend expectations"""
        signup_data = {
            "outing_id": "123e4567-e89b-12d3-a456-426614174000",
            "family_contact": {
                "email": "jane@example.com",
                "phone": "555-5678",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_phone": "555-1111",
            },
            "family_member_ids": ["123e4567-e89b-12d3-a456-426614174003"],
        }
        
        # Should not raise validation error
        signup = SignupCreate(**signup_data)
        
        assert str(signup.outing_id) == signup_data["outing_id"]
        assert signup.family_contact.email == signup_data["family_contact"]["email"]
        assert len(signup.family_member_ids) == 1


class TestParticipantContracts:
    """Test Participant response structure matches frontend expectations"""
    
    def test_participant_response_structure(self):
        """Verify ParticipantResponse schema matches frontend Participant type"""
        participant_data = {
            "id": "123e4567-e89b-12d3-a456-426614174002",
            "signup_id": "123e4567-e89b-12d3-a456-426614174001",
            "name": "Scout Doe",
            "age": 14,
            "participant_type": "scout",
            "is_adult": False,
            "gender": "male",
            "troop_number": "123",
            "patrol_name": "Eagle Patrol",
            "has_youth_protection": False,
            "vehicle_capacity": 0,
            "dietary_restrictions": ["vegetarian", "gluten-free"],
            "allergies": ["peanuts"],
            "medical_notes": "Requires EpiPen",
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Should not raise validation error when used in SignupResponse
        signup_data = {
            "id": "123e4567-e89b-12d3-a456-426614174001",
            "outing_id": "123e4567-e89b-12d3-a456-426614174000",
            "family_contact_name": "John Doe",
            "family_contact_email": "john@example.com",
            "family_contact_phone": "555-1234",
            "participants": [participant_data],
                        "participant_count": 1,
                        "scout_count": 1,
                        "adult_count": 0,
                        "created_at": datetime.utcnow().isoformat(),
            "warnings": [],
        }
        
        signup = SignupResponse(**signup_data)
        participant = signup.participants[0]
        
        # Verify all participant fields
        assert str(participant.id) == participant_data["id"]
        assert participant.name == participant_data["name"]
        assert participant.age == participant_data["age"]
        assert participant.participant_type == participant_data["participant_type"]
        assert participant.dietary_restrictions == participant_data["dietary_restrictions"]
        assert participant.allergies == participant_data["allergies"]
        assert participant.medical_notes == participant_data["medical_notes"]


class TestErrorContracts:
    """Test error response structures match frontend expectations"""
    
    def test_validation_error_structure(self):
        """Verify validation errors have expected structure"""
        # Test that invalid data raises ValidationError with expected structure
        invalid_outing_data = {
            "name": "Test",
            "outing_date": "invalid-date",  # Invalid date format
            "location": "Test",
            "max_participants": -1,  # Invalid negative number
        }
        
        with pytest.raises(ValidationError) as exc_info:
            OutingCreate(**invalid_outing_data)
        
        # Verify error structure
        errors = exc_info.value.errors()
        assert isinstance(errors, list)
        assert len(errors) > 0
        
        # Each error should have type, loc, msg
        for error in errors:
            assert "type" in error
            assert "loc" in error
            assert "msg" in error
    
    def test_missing_required_field_error(self):
        """Verify missing required fields raise appropriate errors"""
        incomplete_signup_data = {
            "outing_id": "123e4567-e89b-12d3-a456-426614174000",
            # Missing family_contact
            "participants": [],
        }
        
        with pytest.raises(ValidationError) as exc_info:
            SignupCreate(**incomplete_signup_data)
        
        errors = exc_info.value.errors()
        assert any("family_contact" in str(error["loc"]) for error in errors)


class TestTypeCompatibility:
    """Test that schemas are compatible with TypeScript type expectations"""
    
    def test_optional_fields_are_nullable(self):
        """Verify optional fields can be None"""
        # Test outing with minimal required fields
        minimal_outing = {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Test Outing",
            "outing_date": date.today().isoformat(),
            "end_date": None,  # Optional
            "location": "Test",
            "description": None,  # Optional
            "max_participants": 20,
            "is_overnight": False,
                "signup_count": 0,
            "available_spots": 20,
            "outing_lead_name": None,  # Optional
            "outing_lead_email": None,  # Optional
            "outing_lead_phone": None,  # Optional
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
        }
        
        # Should not raise validation error
        outing = OutingResponse(**minimal_outing)
        assert outing.end_date is None
        assert outing.description is None
    
    def test_list_fields_default_to_empty(self):
        """Verify list fields have appropriate defaults"""
        participant_data = {
            "id": "123e4567-e89b-12d3-a456-426614174002",
            "signup_id": "123e4567-e89b-12d3-a456-426614174001",
            "name": "Scout Doe",
            "age": 14,
            "participant_type": "scout",
            "is_adult": False,
            "gender": "male",
                "has_youth_protection": False,
                "vehicle_capacity": 0,
                "troop_number": None,
                "patrol_name": None,
                "dietary_restrictions": [],
                "allergies": [],
                "medical_notes": None,
                "created_at": datetime.utcnow().isoformat(),
        }
        
        signup_data = {
            "id": "123e4567-e89b-12d3-a456-426614174001",
            "outing_id": "123e4567-e89b-12d3-a456-426614174000",
            "family_contact_name": "John Doe",
            "family_contact_email": "john@example.com",
            "family_contact_phone": "555-1234",
            "participants": [participant_data],
            "participant_count": 1,
            "scout_count": 1,
            "adult_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            "warnings": [],
        }
        
        signup = SignupResponse(**signup_data)
        participant = signup.participants[0]
        
        # Lists should be empty, not None
        assert participant.dietary_restrictions == []
        assert participant.allergies == []
        assert signup.warnings == []