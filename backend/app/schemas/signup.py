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


class FamilyContact(BaseModel):
    """Schema for family contact information"""
    email: EmailStr = Field(..., description="Contact email")
    phone: str = Field(..., min_length=1, max_length=50, description="Contact phone")
    emergency_contact_name: str = Field(..., min_length=1, max_length=255, description="Emergency contact name")
    emergency_contact_phone: str = Field(..., min_length=1, max_length=50, description="Emergency contact phone")


class SignupCreate(BaseModel):
    """Schema for creating a signup with family member IDs"""
    outing_id: UUID = Field(..., description="ID of the outing to sign up for")
    family_contact: FamilyContact = Field(..., description="Family contact information")
    family_member_ids: list[UUID] = Field(..., min_length=1, description="List of family member IDs to sign up (at least one required)")


class SignupUpdate(BaseModel):
    """Schema for updating a signup - can update contact info and/or participants"""
    family_contact: Optional[FamilyContact] = Field(None, description="Updated family contact information")
    family_member_ids: Optional[list[UUID]] = Field(None, min_length=1, description="Updated list of family member IDs (replaces existing participants)")


class ParticipantResponse(BaseModel):
    """Schema for participant response"""
    id: UUID
    name: str
    age: Optional[int]
    participant_type: str
    is_adult: bool
    gender: Optional[str]
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