"""
Contract tests to verify API responses match frontend TypeScript type expectations.

These tests ensure that the backend API responses conform to the structure expected
by the frontend TypeScript types generated from the OpenAPI specification.

IMPORTANT: These tests are database-independent and test response structure only.
They do not require database fixtures or actual data.
"""
import pytest
from datetime import date, timedelta
from app.schemas.trip import TripResponse, TripCreate
from app.schemas.signup import SignupResponse, SignupCreate, ParticipantCreate, FamilyContactCreate
from pydantic import ValidationError


pytestmark = pytest.mark.asyncio


class TestTripContracts:
    """Test Trip response structure matches frontend expectations"""
    
    def test_trip_response_structure(self):
        """Verify TripResponse schema matches frontend Trip type"""
        # Create a valid trip response
        trip_data = {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Test Trip",
            "trip_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=2)).isoformat(),
            "location": "Test Location",
            "description": "Test Description",
            "max_participants": 20,
            "is_overnight": True,
            "current_signups": 5,
            "available_spots": 15,
            "trip_lead_name": "John Doe",
            "trip_lead_email": "john@example.com",
            "trip_lead_phone": "555-1234",
        }
        
        # Should not raise validation error
        trip = TripResponse(**trip_data)
        
        # Verify all required fields are present
        assert trip.id == trip_data["id"]
        assert trip.name == trip_data["name"]
        assert trip.trip_date == date.today()
        assert trip.end_date == date.today() + timedelta(days=2)
        assert trip.location == trip_data["location"]
        assert trip.description == trip_data["description"]
        assert trip.max_participants == trip_data["max_participants"]
        assert trip.is_overnight == trip_data["is_overnight"]
        assert trip.current_signups == trip_data["current_signups"]
        assert trip.available_spots == trip_data["available_spots"]
        assert trip.trip_lead_name == trip_data["trip_lead_name"]
        assert trip.trip_lead_email == trip_data["trip_lead_email"]
        assert trip.trip_lead_phone == trip_data["trip_lead_phone"]
    
    def test_trip_create_request_structure(self):
        """Verify TripCreate schema matches frontend expectations"""
        trip_data = {
            "name": "New Trip",
            "trip_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=2)).isoformat(),
            "location": "New Location",
            "description": "New Description",
            "max_participants": 30,
            "is_overnight": False,
            "trip_lead_name": "Jane Doe",
            "trip_lead_email": "jane@example.com",
            "trip_lead_phone": "555-5678",
        }
        
        # Should not raise validation error
        trip = TripCreate(**trip_data)
        
        assert trip.name == trip_data["name"]
        assert trip.trip_date == date.today()
        assert trip.location == trip_data["location"]


class TestSignupContracts:
    """Test Signup response structure matches frontend expectations"""
    
    def test_signup_response_structure(self):
        """Verify SignupResponse schema matches frontend SignupResponse type"""
        signup_data = {
            "id": "123e4567-e89b-12d3-a456-426614174001",
            "trip_id": "123e4567-e89b-12d3-a456-426614174000",
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
                }
            ],
            "warnings": [],
        }
        
        # Should not raise validation error
        signup = SignupResponse(**signup_data)
        
        # Verify all required fields including warnings
        assert signup.id == signup_data["id"]
        assert signup.trip_id == signup_data["trip_id"]
        assert signup.family_contact_name == signup_data["family_contact_name"]
        assert signup.family_contact_email == signup_data["family_contact_email"]
        assert signup.family_contact_phone == signup_data["family_contact_phone"]
        assert len(signup.participants) == 1
        assert signup.warnings == []  # Critical: warnings field must be present
    
    def test_signup_response_with_warnings(self):
        """Verify SignupResponse includes warnings field (the original 422 error cause)"""
        signup_data = {
            "id": "123e4567-e89b-12d3-a456-426614174001",
            "trip_id": "123e4567-e89b-12d3-a456-426614174000",
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
                }
            ],
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
            "trip_id": "123e4567-e89b-12d3-a456-426614174000",
            "family_contact": {
                "name": "Jane Smith",
                "email": "jane@example.com",
                "phone": "555-5678",
            },
            "participants": [
                {
                    "name": "Scout Smith",
                    "age": 12,
                    "participant_type": "scout",
                    "is_adult": False,
                    "gender": "female",
                    "troop_number": "789",
                    "patrol_name": "Bear Patrol",
                    "has_youth_protection": False,
                    "vehicle_capacity": 0,
                    "dietary_restrictions": ["vegetarian"],
                    "allergies": [],
                    "medical_notes": None,
                }
            ],
        }
        
        # Should not raise validation error
        signup = SignupCreate(**signup_data)
        
        assert signup.trip_id == signup_data["trip_id"]
        assert signup.family_contact.name == signup_data["family_contact"]["name"]
        assert len(signup.participants) == 1


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
        }
        
        # Should not raise validation error when used in SignupResponse
        signup_data = {
            "id": "123e4567-e89b-12d3-a456-426614174001",
            "trip_id": "123e4567-e89b-12d3-a456-426614174000",
            "family_contact_name": "John Doe",
            "family_contact_email": "john@example.com",
            "family_contact_phone": "555-1234",
            "participants": [participant_data],
            "warnings": [],
        }
        
        signup = SignupResponse(**signup_data)
        participant = signup.participants[0]
        
        # Verify all participant fields
        assert participant.id == participant_data["id"]
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
        invalid_trip_data = {
            "name": "Test",
            "trip_date": "invalid-date",  # Invalid date format
            "location": "Test",
            "max_participants": -1,  # Invalid negative number
        }
        
        with pytest.raises(ValidationError) as exc_info:
            TripCreate(**invalid_trip_data)
        
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
            "trip_id": "123e4567-e89b-12d3-a456-426614174000",
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
        # Test trip with minimal required fields
        minimal_trip = {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "name": "Test Trip",
            "trip_date": date.today().isoformat(),
            "end_date": None,  # Optional
            "location": "Test",
            "description": None,  # Optional
            "max_participants": 20,
            "is_overnight": False,
            "current_signups": 0,
            "available_spots": 20,
            "trip_lead_name": None,  # Optional
            "trip_lead_email": None,  # Optional
            "trip_lead_phone": None,  # Optional
        }
        
        # Should not raise validation error
        trip = TripResponse(**minimal_trip)
        assert trip.end_date is None
        assert trip.description is None
    
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
            # dietary_restrictions and allergies should default to empty lists
        }
        
        signup_data = {
            "id": "123e4567-e89b-12d3-a456-426614174001",
            "trip_id": "123e4567-e89b-12d3-a456-426614174000",
            "family_contact_name": "John Doe",
            "family_contact_email": "john@example.com",
            "family_contact_phone": "555-1234",
            "participants": [participant_data],
            "warnings": [],
        }
        
        signup = SignupResponse(**signup_data)
        participant = signup.participants[0]
        
        # Lists should be empty, not None
        assert participant.dietary_restrictions == []
        assert participant.allergies == []
        assert signup.warnings == []