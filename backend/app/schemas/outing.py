from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime, time
from uuid import UUID
from typing import Optional
from decimal import Decimal

from app.schemas.place import PlaceResponse  # Safe import (place does not import outing)


class OutingBase(BaseModel):
    """Base outing schema with common fields"""
    name: str = Field(..., min_length=1, max_length=255, description="Outing name")
    outing_date: date = Field(..., description="Start date of the outing")
    end_date: Optional[date] = Field(None, description="End date for overnight outings")
    location: str = Field(..., min_length=1, max_length=255, description="Outing location")
    description: Optional[str] = Field(None, description="Detailed outing description")
    max_participants: int = Field(..., gt=0, description="Maximum number of participants")
    capacity_type: str = Field('fixed', description="Capacity type: 'fixed' or 'vehicle'")
    is_overnight: bool = Field(False, description="Whether outing requires overnight stay")
    outing_lead_name: Optional[str] = Field(None, max_length=255, description="Outing lead name")
    outing_lead_email: Optional[str] = Field(None, max_length=255, description="Outing lead email")
    outing_lead_phone: Optional[str] = Field(None, max_length=50, description="Outing lead phone")
    drop_off_time: Optional[time] = Field(None, description="Drop-off time")
    drop_off_location: Optional[str] = Field(None, max_length=255, description="Drop-off location")
    pickup_time: Optional[time] = Field(None, description="Pickup time")
    pickup_location: Optional[str] = Field(None, max_length=255, description="Pickup location")
    cost: Optional[Decimal] = Field(None, ge=0, description="Cost of the outing in dollars")
    gear_list: Optional[str] = Field(None, description="Suggested gear list for participants")
    signups_close_at: Optional[datetime] = Field(None, description="Automatic signup closure date/time")
    signups_closed: bool = Field(False, description="Manual signup closure flag")
    icon: Optional[str] = Field(None, max_length=50, description="Outing icon (Bootstrap icon name or emoji)")
    
    # Address fields with Place relationships
    outing_address: Optional[str] = Field(None, description="Full address of outing location")
    outing_place_id: Optional[UUID] = Field(None, description="Reference to saved place for outing location")
    pickup_address: Optional[str] = Field(None, description="Full address for pickup location")
    pickup_place_id: Optional[UUID] = Field(None, description="Reference to saved place for pickup")
    dropoff_address: Optional[str] = Field(None, description="Full address for drop-off location")
    dropoff_place_id: Optional[UUID] = Field(None, description="Reference to saved place for drop-off")

    @field_validator('capacity_type')
    @classmethod
    def validate_capacity_type(cls, v):
        """Validate capacity type is either 'fixed' or 'vehicle'"""
        if v not in ['fixed', 'vehicle']:
            raise ValueError("capacity_type must be either 'fixed' or 'vehicle'")
        return v

    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v, info):
        """Validate that end_date is after outing_date for overnight outings"""
        if v is not None and 'outing_date' in info.data:
            outing_date = info.data['outing_date']
            if v < outing_date:
                raise ValueError('end_date must be after outing_date')
        return v


class OutingCreate(OutingBase):
    """Schema for creating a new outing"""
    
    @field_validator('end_date')
    @classmethod
    def validate_overnight_end_date(cls, v, info):
        """Require end_date for overnight outings"""
        if 'is_overnight' in info.data and info.data['is_overnight'] and v is None:
            raise ValueError('end_date is required for overnight outings')
        return v


class OutingUpdate(OutingBase):
    """Schema for updating an existing outing"""
    
    @field_validator('end_date')
    @classmethod
    def validate_overnight_end_date(cls, v, info):
        """Require end_date for overnight outings"""
        if 'is_overnight' in info.data and info.data['is_overnight'] and v is None:
            raise ValueError('end_date is required for overnight outings')
        return v


class OutingResponse(OutingBase):
    """Schema for outing response with computed fields"""
    id: UUID
    signup_count: int = Field(0, description="Total number of participants signed up")
    available_spots: int = Field(0, description="Remaining available spots")
    is_full: bool = Field(False, description="Whether outing is at capacity")
    total_vehicle_capacity: int = Field(0, description="Total vehicle capacity from adults")
    needs_more_drivers: bool = Field(False, description="Whether outing needs more drivers")
    adult_count: int = Field(0, description="Total number of adults signed up")
    needs_two_deep_leadership: bool = Field(False, description="Whether outing needs more adults (Scouting America requires minimum 2)")
    needs_female_leader: bool = Field(False, description="Whether outing needs a female adult leader (required when female youth present)")
    are_signups_closed: bool = Field(False, description="Whether signups are closed (manually or automatically)")
    created_at: datetime
    updated_at: datetime
    
    # Place details (populated from relationships)
    outing_place: Optional['PlaceResponse'] = None
    pickup_place: Optional['PlaceResponse'] = None
    dropoff_place: Optional['PlaceResponse'] = None

    class Config:
        from_attributes = True


class OutingListResponse(BaseModel):
    """Schema for list of outings"""
    outings: list[OutingResponse]
    total: int

# Rebuild models to resolve forward references to PlaceResponse
OutingResponse.model_rebuild()
OutingListResponse.model_rebuild()


class OutingUpdateEmailDraft(BaseModel):
    """Email draft generated when an outing is updated"""
    subject: str
    body: str
    changed_fields: list[str] = Field(default_factory=list, description="List of field names that changed")


class OutingUpdateResponse(BaseModel):
    """Response for outing update including email draft"""
    outing: OutingResponse
    email_draft: Optional[OutingUpdateEmailDraft] = Field(None, description="Email draft if changes occurred")

OutingUpdateResponse.model_rebuild()