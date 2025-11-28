from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class TentingGroupMemberBase(BaseModel):
    """Base schema for tenting group member"""
    participant_id: UUID = Field(..., description="ID of the participant")


class TentingGroupMemberCreate(TentingGroupMemberBase):
    """Schema for adding a member to a tenting group"""
    pass


class TentingGroupMemberResponse(TentingGroupMemberBase):
    """Schema for tenting group member response"""
    id: UUID
    created_at: datetime
    # Participant details for display
    participant_name: Optional[str] = Field(None, description="Name of the participant")
    age: Optional[int] = Field(None, description="Age of the participant")
    gender: Optional[str] = Field(None, description="Gender of the participant")
    patrol_name: Optional[str] = Field(None, description="Patrol name of the participant")

    model_config = ConfigDict(from_attributes=True)


class TentingGroupBase(BaseModel):
    """Base schema for tenting group"""
    name: str = Field(..., max_length=100, description="Name of the tenting group (e.g., 'Tent 1')")
    notes: Optional[str] = Field(None, description="Notes about the tenting group")


class TentingGroupCreate(TentingGroupBase):
    """Schema for creating a tenting group"""
    outing_id: UUID = Field(..., description="ID of the outing")
    member_ids: Optional[List[UUID]] = Field(None, description="Optional list of participant IDs to add initially")


class TentingGroupUpdate(BaseModel):
    """Schema for updating a tenting group"""
    name: Optional[str] = Field(None, max_length=100, description="Name of the tenting group")
    notes: Optional[str] = Field(None, description="Notes about the tenting group")


class TentingGroupResponse(TentingGroupBase):
    """Schema for tenting group response"""
    id: UUID
    outing_id: UUID
    members: List[TentingGroupMemberResponse] = Field(default_factory=list)
    member_count: int = Field(0, description="Number of members in the group")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TentingGroupListResponse(BaseModel):
    """Schema for list of tenting groups"""
    tenting_groups: List[TentingGroupResponse]
    total: int


class TentingSummaryParticipant(BaseModel):
    """Summary of a participant for tenting management"""
    participant_id: UUID
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    patrol_name: Optional[str] = None
    troop_number: Optional[str] = None
    is_adult: bool = False
    tenting_group_id: Optional[UUID] = None
    tenting_group_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TentingSummaryResponse(BaseModel):
    """Summary of tenting assignments for an outing"""
    outing_id: UUID
    outing_name: str
    participants: List[TentingSummaryParticipant] = Field(default_factory=list)
    tenting_groups: List[TentingGroupResponse] = Field(default_factory=list)
    unassigned_count: int = Field(0, description="Number of scouts not in a tenting group")
    scout_count: int = Field(0, description="Total number of scouts (non-adults)")


class MoveTentingParticipantRequest(BaseModel):
    """Request to move a participant to a different tenting group"""
    participant_id: UUID = Field(..., description="ID of the participant to move")
    target_tenting_group_id: Optional[UUID] = Field(None, description="ID of the tenting group to move to (None to remove from group)")


class TentingValidationIssue(BaseModel):
    """A validation issue with a tenting group"""
    tenting_group_id: UUID
    tenting_group_name: str
    issue_type: str = Field(..., description="Type of issue: age_gap, gender_mismatch, group_size")
    message: str
    severity: str = Field("warning", description="Severity: warning, error")


class AutoAssignTentingRequest(BaseModel):
    """Request to auto-assign participants to tenting groups"""
    tent_size_min: int = Field(2, ge=2, description="Minimum scouts per tent")
    tent_size_max: int = Field(3, le=4, description="Maximum scouts per tent")
    keep_patrols_together: bool = Field(True, description="Try to keep patrol members together")
    max_age_difference: int = Field(2, ge=1, le=5, description="Maximum age difference between tentmates")
