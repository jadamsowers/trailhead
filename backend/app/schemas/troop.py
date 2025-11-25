from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class TroopBase(BaseModel):
    number: str = Field(..., max_length=50, description="Troop number identifier (e.g., 123)")
    charter_org: Optional[str] = Field(None, max_length=255, description="Chartering organization")
    meeting_location: Optional[str] = Field(None, max_length=255, description="Usual meeting location")
    meeting_day: Optional[str] = Field(None, max_length=20, description="Regular meeting day (e.g., Tuesday)")
    notes: Optional[str] = Field(None, description="Administrative notes")


class TroopCreate(TroopBase):
    pass


class TroopUpdate(BaseModel):
    number: Optional[str] = Field(None, max_length=50)
    charter_org: Optional[str] = Field(None, max_length=255)
    meeting_location: Optional[str] = Field(None, max_length=255)
    meeting_day: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None


class PatrolBase(BaseModel):
    troop_id: UUID = Field(..., description="Parent troop ID")
    name: str = Field(..., max_length=100, description="Patrol name")
    is_active: bool = Field(default=True, description="Whether patrol is active")


class PatrolCreate(PatrolBase):
    pass


class PatrolUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class PatrolResponse(PatrolBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TroopResponse(TroopBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    patrols: List[PatrolResponse] = []

    model_config = ConfigDict(from_attributes=True)


class TroopListResponse(BaseModel):
    troops: List[TroopResponse]
    total: int


class PatrolListResponse(BaseModel):
    patrols: List[PatrolResponse]
    total: int
