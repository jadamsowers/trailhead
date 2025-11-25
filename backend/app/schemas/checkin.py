from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID


class CheckInParticipant(BaseModel):
    """Participant information for check-in display"""
    id: UUID
    signup_id: UUID
    name: str
    member_type: str
    family_name: str
    patrol_name: Optional[str] = None
    troop_number: Optional[str] = None
    is_checked_in: bool = False
    checked_in_at: Optional[datetime] = None
    checked_in_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CheckInSummary(BaseModel):
    """Summary of check-in status for an outing"""
    outing_id: UUID
    outing_name: str
    outing_date: datetime
    total_participants: int
    checked_in_count: int
    participants: list[CheckInParticipant]

    model_config = ConfigDict(from_attributes=True)


class CheckInCreate(BaseModel):
    """Request to check in participants"""
    participant_ids: list[UUID] = Field(..., min_length=1, description="List of participant IDs to check in")
    checked_in_by: str = Field(..., min_length=1, max_length=255, description="Name or email of person performing check-in")


class CheckInBulkCreate(BaseModel):
    """Request to check in multiple participants at once"""
    participant_ids: list[UUID] = Field(..., min_length=1, description="List of participant IDs to check in")


class CheckInRecord(BaseModel):
    """Individual check-in record"""
    id: UUID
    outing_id: UUID
    signup_id: UUID
    participant_id: UUID
    participant_name: str
    checked_in_at: datetime
    checked_in_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CheckInResponse(BaseModel):
    """Response after checking in participants"""
    message: str
    checked_in_count: int
    participant_ids: list[UUID]
    checked_in_at: datetime


class CheckInExportRow(BaseModel):
    """Single row for check-in export"""
    participant_name: str
    member_type: str
    family_name: str
    patrol_name: Optional[str] = None
    troop_number: Optional[str] = None
    checked_in: bool
    checked_in_at: Optional[str] = None
    checked_in_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
