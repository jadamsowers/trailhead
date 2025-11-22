from pydantic import BaseModel, Field, validator
from uuid import UUID
from typing import Optional, List
from datetime import date, datetime


class DietaryPreferenceBase(BaseModel):
    """Base schema for dietary preferences"""
    preference: str = Field(..., min_length=1, max_length=100, description="Dietary preference (e.g., vegetarian, vegan, gluten-free)")


class DietaryPreferenceCreate(DietaryPreferenceBase):
    """Schema for creating a dietary preference"""
    pass


class DietaryPreferenceResponse(DietaryPreferenceBase):
    """Schema for dietary preference response"""
    id: UUID

    class Config:
        from_attributes = True


class AllergyBase(BaseModel):
    """Base schema for allergies"""
    allergy: str = Field(..., min_length=1, max_length=100, description="Allergy type (e.g., peanuts, shellfish)")
    severity: Optional[str] = Field(None, max_length=50, description="Severity level (mild, moderate, severe, life-threatening)")


class AllergyCreate(AllergyBase):
    """Schema for creating an allergy"""
    pass


class AllergyResponse(AllergyBase):
    """Schema for allergy response"""
    id: UUID

    class Config:
        from_attributes = True


class FamilyMemberBase(BaseModel):
    """Base schema for family members"""
    name: str = Field(..., min_length=1, max_length=255, description="Full name")
    member_type: str = Field(..., description="Member type: 'adult' or 'scout'")
    date_of_birth: Optional[date] = Field(None, description="Date of birth (required for scouts)")
    troop_number: Optional[str] = Field(None, max_length=50, description="Troop number")
    patrol_name: Optional[str] = Field(None, max_length=100, description="Patrol name (for scouts)")
    has_youth_protection: bool = Field(default=False, description="Youth protection training status (for adults)")
    youth_protection_expiration: Optional[date] = Field(None, description="SAFE Youth Training certificate expiration date (for adults)")
    vehicle_capacity: int = Field(default=0, ge=0, description="Vehicle passenger capacity excluding driver (for adults)")
    medical_notes: Optional[str] = Field(None, description="Medical notes or conditions")

    @validator('member_type')
    def validate_member_type(cls, v):
        if v not in ['adult', 'scout']:
            raise ValueError('member_type must be either "adult" or "scout"')
        return v

    @validator('date_of_birth')
    def validate_date_of_birth(cls, v, values):
        if values.get('member_type') == 'scout' and v is None:
            raise ValueError('date_of_birth is required for scouts')
        return v


class FamilyMemberCreate(FamilyMemberBase):
    """Schema for creating a family member"""
    dietary_preferences: List[str] = Field(default_factory=list, description="List of dietary preferences")
    allergies: List[AllergyCreate] = Field(default_factory=list, description="List of allergies")


class FamilyMemberUpdate(BaseModel):
    """Schema for updating a family member"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    date_of_birth: Optional[date] = None
    troop_number: Optional[str] = Field(None, max_length=50)
    patrol_name: Optional[str] = Field(None, max_length=100)
    has_youth_protection: Optional[bool] = None
    youth_protection_expiration: Optional[date] = None
    vehicle_capacity: Optional[int] = Field(None, ge=0)
    medical_notes: Optional[str] = None
    dietary_preferences: Optional[List[str]] = None
    allergies: Optional[List[AllergyCreate]] = None


class FamilyMemberResponse(FamilyMemberBase):
    """Schema for family member response"""
    id: UUID
    user_id: UUID
    dietary_preferences: List[DietaryPreferenceResponse] = Field(default_factory=list)
    allergies: List[AllergyResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FamilyMemberListResponse(BaseModel):
    """Schema for listing family members"""
    members: List[FamilyMemberResponse]
    total: int


class FamilyMemberSummary(BaseModel):
    """Simplified schema for family member selection during signup"""
    id: UUID
    name: str
    member_type: str
    troop_number: Optional[str] = None
    age: Optional[int] = None  # Calculated from date_of_birth

    class Config:
        from_attributes = True