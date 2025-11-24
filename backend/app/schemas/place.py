from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from uuid import UUID


class PlaceBase(BaseModel):
    name: str = Field(..., description="Display name for the place")
    address: str = Field(..., description="Full address of the place")
    google_maps_url: Optional[str] = Field(None, description="Google Maps URL (auto-generated if not provided)")


class PlaceCreate(PlaceBase):
    pass


class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    google_maps_url: Optional[str] = None


class PlaceResponse(PlaceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
