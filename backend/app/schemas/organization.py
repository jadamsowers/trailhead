from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class OrganizationBase(BaseModel):
    """Base schema for organization"""
    name: str = Field(..., max_length=255, description="Organization name (e.g., 'Troop 123', 'Ivy Scouts')")
    description: Optional[str] = Field(None, description="Optional description of the organization")


class OrganizationCreate(OrganizationBase):
    """Schema for creating an organization"""
    pass


class OrganizationUpdate(BaseModel):
    """Schema for updating an organization"""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    is_setup_complete: Optional[bool] = None


class OrganizationResponse(OrganizationBase):
    """Schema for organization response"""
    id: UUID
    is_setup_complete: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationListResponse(BaseModel):
    """Schema for list of organizations"""
    organizations: List[OrganizationResponse]
    total: int
