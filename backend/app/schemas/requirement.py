from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# ============================================================================
# Rank Requirement Schemas
# ============================================================================

class RankRequirementBase(BaseModel):
    """Base schema for rank requirements"""
    rank: str = Field(..., description="Scout rank (Scout, Tenderfoot, Second Class, First Class)")
    requirement_number: str = Field(..., description="Requirement number (e.g., '1a', '2b', '3')")
    requirement_text: str = Field(..., description="Full description of the requirement")
    keywords: Optional[List[str]] = Field(None, description="Keywords for matching with outings")
    category: Optional[str] = Field(None, description="Category (e.g., Camping, Hiking, First Aid)")


class RankRequirementCreate(RankRequirementBase):
    """Schema for creating a new rank requirement"""
    pass


class RankRequirementUpdate(BaseModel):
    """Schema for updating a rank requirement"""
    rank: Optional[str] = None
    requirement_number: Optional[str] = None
    requirement_text: Optional[str] = None
    keywords: Optional[List[str]] = None
    category: Optional[str] = None


class RankRequirementResponse(RankRequirementBase):
    """Schema for rank requirement response"""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Merit Badge Schemas
# ============================================================================

class MeritBadgeBase(BaseModel):
    """Base schema for merit badges"""
    name: str = Field(..., description="Merit badge name")
    description: Optional[str] = Field(None, description="Brief description of the merit badge")
    keywords: Optional[List[str]] = Field(None, description="Keywords for matching with outings")
    eagle_required: Optional[bool] = Field(False, description="Whether the merit badge is Eagle-required")


class MeritBadgeCreate(MeritBadgeBase):
    """Schema for creating a new merit badge"""
    pass


class MeritBadgeUpdate(BaseModel):
    """Schema for updating a merit badge"""
    name: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[List[str]] = None
    eagle_required: Optional[bool] = None


class MeritBadgeResponse(MeritBadgeBase):
    """Schema for merit badge response"""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Outing Requirement Schemas
# ============================================================================

class OutingRequirementBase(BaseModel):
    """Base schema for outing requirements"""
    rank_requirement_id: UUID = Field(..., description="ID of the rank requirement")
    notes: Optional[str] = Field(None, description="Notes about fulfilling this requirement on the outing")


class OutingRequirementCreate(OutingRequirementBase):
    """Schema for adding a requirement to an outing"""
    pass


class OutingRequirementUpdate(BaseModel):
    """Schema for updating an outing requirement"""
    notes: Optional[str] = None


class OutingRequirementResponse(BaseModel):
    """Schema for outing requirement response with full requirement details"""
    id: UUID
    outing_id: UUID
    rank_requirement_id: UUID
    notes: Optional[str]
    created_at: datetime
    requirement: RankRequirementResponse  # Include full requirement details

    class Config:
        from_attributes = True


# ============================================================================
# Outing Merit Badge Schemas
# ============================================================================

class OutingMeritBadgeBase(BaseModel):
    """Base schema for outing merit badges"""
    merit_badge_id: UUID = Field(..., description="ID of the merit badge")
    notes: Optional[str] = Field(None, description="Notes about which requirements can be worked on")


class OutingMeritBadgeCreate(OutingMeritBadgeBase):
    """Schema for adding a merit badge to an outing"""
    pass


class OutingMeritBadgeUpdate(BaseModel):
    """Schema for updating an outing merit badge"""
    notes: Optional[str] = None


class OutingMeritBadgeResponse(BaseModel):
    """Schema for outing merit badge response with full badge details"""
    id: UUID
    outing_id: UUID
    merit_badge_id: UUID
    notes: Optional[str]
    created_at: datetime
    merit_badge: MeritBadgeResponse  # Include full merit badge details

    class Config:
        from_attributes = True


# ============================================================================
# Suggestion Schemas
# ============================================================================

class RequirementSuggestion(BaseModel):
    """Flattened schema for suggested rank requirements.

    Returns only the fields requested by the client plus match metadata.
    """
    id: UUID = Field(..., description="Requirement UUID for selection")
    rank: str = Field(..., description="Scout rank")
    requirement_number: str = Field(..., description="Requirement number (e.g. '1a')")
    description: str = Field(..., description="Full requirement description")
    match_score: float = Field(..., description="Relevance score (0-1)")
    matched_keywords: List[str] = Field(..., description="Keywords that matched")


class MeritBadgeSuggestion(BaseModel):
    """Flattened schema for suggested merit badges.

    Returns badge name and description plus match metadata.
    """
    id: UUID = Field(..., description="Badge UUID for selection")
    name: str = Field(..., description="Merit badge name")
    description: Optional[str] = Field(None, description="Merit badge description")
    eagle_required: bool = Field(False, description="Eagle-required badge indicator")
    match_score: float = Field(..., description="Relevance score (0-1)")
    matched_keywords: List[str] = Field(..., description="Keywords that matched")


class OutingSuggestions(BaseModel):
    """Schema for all suggestions for an outing"""
    requirements: List[RequirementSuggestion] = Field(..., description="Suggested rank requirements")
    merit_badges: List[MeritBadgeSuggestion] = Field(..., description="Suggested merit badges")
