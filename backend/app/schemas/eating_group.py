from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List


# Grubmaster reason options
GRUBMASTER_REASONS = ['rank_requirement', 'cooking_merit_badge', 'just_because']


class GrubmasterRequest(BaseModel):
    """Schema for grubmaster request in signup"""
    grubmaster_interest: bool = Field(False, description="Whether participant wants to be a grubmaster")
    grubmaster_reason: Optional[str] = Field(None, description="Reason for grubmaster interest: rank_requirement, cooking_merit_badge, just_because")


class EatingGroupMemberBase(BaseModel):
    """Base schema for eating group member"""
    participant_id: UUID = Field(..., description="ID of the participant")
    is_grubmaster: bool = Field(False, description="Whether this participant is a grubmaster for this group")


class EatingGroupMemberCreate(EatingGroupMemberBase):
    """Schema for adding a member to an eating group"""
    pass


class EatingGroupMemberResponse(EatingGroupMemberBase):
    """Schema for eating group member response"""
    id: UUID
    created_at: datetime
    # Participant details for display
    participant_name: Optional[str] = Field(None, description="Name of the participant")
    patrol_name: Optional[str] = Field(None, description="Patrol name of the participant")
    dietary_restrictions: List[str] = Field(default_factory=list, description="Dietary restrictions")
    allergies: List[str] = Field(default_factory=list, description="Allergies")

    model_config = ConfigDict(from_attributes=True)


class EatingGroupBase(BaseModel):
    """Base schema for eating group"""
    name: str = Field(..., max_length=100, description="Name of the eating group")
    notes: Optional[str] = Field(None, description="Notes about the eating group")


class EatingGroupCreate(EatingGroupBase):
    """Schema for creating an eating group"""
    outing_id: UUID = Field(..., description="ID of the outing")
    member_ids: Optional[List[UUID]] = Field(None, description="Optional list of participant IDs to add initially")


class EatingGroupUpdate(BaseModel):
    """Schema for updating an eating group"""
    name: Optional[str] = Field(None, max_length=100, description="Name of the eating group")
    notes: Optional[str] = Field(None, description="Notes about the eating group")


class EatingGroupResponse(EatingGroupBase):
    """Schema for eating group response"""
    id: UUID
    outing_id: UUID
    members: List[EatingGroupMemberResponse] = Field(default_factory=list)
    member_count: int = Field(0, description="Number of members in the group")
    grubmaster_count: int = Field(0, description="Number of grubmasters in the group")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EatingGroupListResponse(BaseModel):
    """Schema for list of eating groups"""
    eating_groups: List[EatingGroupResponse]
    total: int


class GrubmasterSummaryParticipant(BaseModel):
    """Summary of a participant for grubmaster management"""
    participant_id: UUID
    name: str
    patrol_name: Optional[str] = None
    troop_number: Optional[str] = None
    grubmaster_interest: bool = False
    grubmaster_reason: Optional[str] = None
    dietary_restrictions: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    eating_group_id: Optional[UUID] = None
    eating_group_name: Optional[str] = None
    is_grubmaster: bool = False

    model_config = ConfigDict(from_attributes=True)


class GrubmasterSummaryResponse(BaseModel):
    """Summary of grubmaster assignments for an outing"""
    outing_id: UUID
    outing_name: str
    food_budget_per_person: Optional[float] = None
    meal_count: Optional[int] = None
    budget_type: Optional[str] = None
    total_budget: Optional[float] = None
    treasurer_email: Optional[str] = None
    participants: List[GrubmasterSummaryParticipant] = Field(default_factory=list)
    eating_groups: List[EatingGroupResponse] = Field(default_factory=list)
    unassigned_count: int = Field(0, description="Number of participants not in an eating group")
    grubmaster_requests_count: int = Field(0, description="Number of participants requesting to be grubmaster")


class MoveParticipantRequest(BaseModel):
    """Request to move a participant to a different eating group"""
    participant_id: UUID = Field(..., description="ID of the participant to move")
    target_eating_group_id: Optional[UUID] = Field(None, description="ID of the eating group to move to (None to remove from group)")
    is_grubmaster: Optional[bool] = Field(None, description="Whether to set/unset as grubmaster")


class AutoAssignRequest(BaseModel):
    """Request to auto-assign participants to eating groups"""
    group_size_min: int = Field(4, ge=2, description="Minimum group size")
    group_size_max: int = Field(6, ge=2, description="Maximum group size")
    keep_patrols_together: bool = Field(True, description="Try to keep patrol members together")
    group_by_dietary: bool = Field(True, description="Try to group by dietary preferences")


class EatingGroupEmailRequest(BaseModel):
    """Request to send email notifications to eating groups"""
    eating_group_ids: Optional[List[UUID]] = Field(None, description="Specific groups to email (None for all)")
    include_budget_info: bool = Field(True, description="Include food budget information")
    include_dietary_info: bool = Field(True, description="Include dietary restrictions")
    custom_message: Optional[str] = Field(None, description="Custom message to include")
