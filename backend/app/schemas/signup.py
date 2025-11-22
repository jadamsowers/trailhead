from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from uuid import UUID
from typing import Optional


class DietaryRestriction(BaseModel):
    """Schema for dietary restriction"""
    restriction_type: str = Field(..., description="Type of dietary restriction")
    notes: Optional[str] = Field(None, description="Additional notes")


class Allergy(BaseModel):
    """Schema for allergy"""
    allergy_type: str = Field(..., description="Type of allergy")
    severity: str = Field(..., pattern="^(mild|moderate|severe)$", description="Severity: mild, moderate, or severe")
    notes: Optional[str] = Field(None, description="Additional notes")


class ParticipantCreate(BaseModel):
    """Schema for creating a participant"""
    full_name: str = Field(..., min_length=1, max_length=255, description="Participant name")
    participant_type: str = Field(..., pattern="^(scout|adult)$", description="Type: scout or adult")
    gender: str = Field(..., pattern="^(male|female|other)$", description="Gender: male, female, or other")
    age: Optional[int] = Field(None, gt=0, lt=150, description="Participant age (required for scouts)")
    troop_number: Optional[str] = Field(None, max_length=50, description="Troop number (scouts only)")
    patrol: Optional[str] = Field(None, max_length=100, description="Patrol name (scouts only)")
    has_youth_protection_training: bool = Field(False, description="Scouting America youth protection training status (adults only)")
    vehicle_capacity: Optional[int] = Field(None, ge=0, description="Number of people can transport (adults only)")
    dietary_restrictions: list[DietaryRestriction] = Field(default_factory=list, description="List of dietary restrictions")
    allergies: list[Allergy] = Field(default_factory=list, description="List of allergies")


class FamilyContact(BaseModel):
    """Schema for family contact information"""
    email: EmailStr = Field(..., description="Contact email")
    phone: str = Field(..., min_length=1, max_length=50, description="Contact phone")
    emergency_contact_name: str = Field(..., min_length=1, max_length=255, description="Emergency contact name")
    emergency_contact_phone: str = Field(..., min_length=1, max_length=50, description="Emergency contact phone")


class SignupCreate(BaseModel):
    """Schema for creating a signup"""
    outing_id: UUID = Field(..., description="ID of the outing to sign up for")
    family_contact: FamilyContact = Field(..., description="Family contact information")
    participants: list[ParticipantCreate] = Field(..., min_length=1, description="List of participants (at least one required)")


class ParticipantResponse(BaseModel):
    """Schema for participant response"""
    id: UUID
    name: str
    age: int
    participant_type: str
    is_adult: bool
    gender: str
    troop_number: Optional[str]
    patrol_name: Optional[str]
    has_youth_protection: bool
    vehicle_capacity: int
    dietary_restrictions: list[str]
    allergies: list[str]
    medical_notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SignupResponse(BaseModel):
    """Schema for signup response"""
    id: UUID
    outing_id: UUID
    family_contact_name: str
    family_contact_email: str
    family_contact_phone: str
    participants: list[ParticipantResponse]
    participant_count: int
    scout_count: int
    adult_count: int
    created_at: datetime
    warnings: list[str] = Field(default_factory=list, description="Warning messages about Scouting America requirements")

    class Config:
        from_attributes = True


class SignupListResponse(BaseModel):
    """Schema for list of signups"""
    signups: list[SignupResponse]
    total: int