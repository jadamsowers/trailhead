from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from uuid import UUID
from typing import Optional


class TripBase(BaseModel):
    """Base trip schema with common fields"""
    name: str = Field(..., min_length=1, max_length=255, description="Trip name")
    trip_date: date = Field(..., description="Start date of the trip")
    end_date: Optional[date] = Field(None, description="End date for overnight trips")
    location: str = Field(..., min_length=1, max_length=255, description="Trip location")
    description: Optional[str] = Field(None, description="Detailed trip description")
    max_participants: int = Field(..., gt=0, description="Maximum number of participants")
    capacity_type: str = Field('fixed', description="Capacity type: 'fixed' or 'vehicle'")
    is_overnight: bool = Field(False, description="Whether trip requires overnight stay")
    trip_lead_name: Optional[str] = Field(None, max_length=255, description="Trip lead name")
    trip_lead_email: Optional[str] = Field(None, max_length=255, description="Trip lead email")
    trip_lead_phone: Optional[str] = Field(None, max_length=50, description="Trip lead phone")

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
        """Validate that end_date is after trip_date for overnight trips"""
        if v is not None and 'trip_date' in info.data:
            trip_date = info.data['trip_date']
            if v < trip_date:
                raise ValueError('end_date must be after trip_date')
        return v


class TripCreate(TripBase):
    """Schema for creating a new trip"""
    
    @field_validator('end_date')
    @classmethod
    def validate_overnight_end_date(cls, v, info):
        """Require end_date for overnight trips"""
        if 'is_overnight' in info.data and info.data['is_overnight'] and v is None:
            raise ValueError('end_date is required for overnight trips')
        return v


class TripUpdate(TripBase):
    """Schema for updating an existing trip"""
    
    @field_validator('end_date')
    @classmethod
    def validate_overnight_end_date(cls, v, info):
        """Require end_date for overnight trips"""
        if 'is_overnight' in info.data and info.data['is_overnight'] and v is None:
            raise ValueError('end_date is required for overnight trips')
        return v


class TripResponse(TripBase):
    """Schema for trip response with computed fields"""
    id: UUID
    signup_count: int = Field(0, description="Total number of participants signed up")
    available_spots: int = Field(0, description="Remaining available spots")
    is_full: bool = Field(False, description="Whether trip is at capacity")
    total_vehicle_capacity: int = Field(0, description="Total vehicle capacity from adults")
    needs_more_drivers: bool = Field(False, description="Whether trip needs more drivers")
    adult_count: int = Field(0, description="Total number of adults signed up")
    needs_two_deep_leadership: bool = Field(False, description="Whether trip needs more adults (Scouting America requires minimum 2)")
    needs_female_leader: bool = Field(False, description="Whether trip needs a female adult leader (required when female youth present)")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TripListResponse(BaseModel):
    """Schema for list of trips"""
    trips: list[TripResponse]
    total: int