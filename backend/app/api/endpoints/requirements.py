from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud import requirement as crud_requirement
from app.crud import outing as crud_outing
from app.schemas.requirement import (
    RankRequirementCreate,
    RankRequirementUpdate,
    RankRequirementResponse,
    MeritBadgeCreate,
    MeritBadgeUpdate,
    MeritBadgeResponse,
    OutingRequirementCreate,
    OutingRequirementUpdate,
    OutingRequirementResponse,
    OutingMeritBadgeCreate,
    OutingMeritBadgeUpdate,
    OutingMeritBadgeResponse,
    OutingSuggestions,
)
from app.utils.suggestions import get_outing_suggestions

router = APIRouter()


# ============================================================================
# Rank Requirements Endpoints
# ============================================================================

@router.get("/rank-requirements", response_model=List[RankRequirementResponse])
async def list_rank_requirements(
    skip: int = 0,
    limit: int = 100,
    rank: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all rank requirements with optional filtering by rank and category (async)"""
    return await crud_requirement.get_rank_requirements(
        db, skip=skip, limit=limit, rank=rank, category=category
    )


@router.get("/rank-requirements/{requirement_id}", response_model=RankRequirementResponse)
async def get_rank_requirement(
    requirement_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific rank requirement by ID (async)"""
    requirement = await crud_requirement.get_rank_requirement(db, requirement_id)
    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rank requirement not found"
        )
    return requirement


@router.post("/rank-requirements", response_model=RankRequirementResponse, status_code=status.HTTP_201_CREATED)
async def create_rank_requirement(
    requirement: RankRequirementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new rank requirement (admin only, async)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create rank requirements"
        )
    return await crud_requirement.create_rank_requirement(db, requirement)


@router.put("/rank-requirements/{requirement_id}", response_model=RankRequirementResponse)
async def update_rank_requirement(
    requirement_id: UUID,
    requirement: RankRequirementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a rank requirement (admin only, async)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update rank requirements"
        )
    updated = await crud_requirement.update_rank_requirement(db, requirement_id, requirement)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rank requirement not found"
        )
    return updated


@router.delete("/rank-requirements/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rank_requirement(
    requirement_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a rank requirement (admin only, async)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete rank requirements"
        )
    success = await crud_requirement.delete_rank_requirement(db, requirement_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rank requirement not found"
        )


# ============================================================================
# Merit Badge Endpoints
# ============================================================================

@router.get("/merit-badges", response_model=List[MeritBadgeResponse])
async def list_merit_badges(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all merit badges (async)"""
    return await crud_requirement.get_merit_badges(db, skip=skip, limit=limit)


@router.get("/merit-badges/{badge_id}", response_model=MeritBadgeResponse)
async def get_merit_badge(
    badge_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific merit badge by ID (async)"""
    badge = await crud_requirement.get_merit_badge(db, badge_id)
    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merit badge not found"
        )
    return badge


@router.post("/merit-badges", response_model=MeritBadgeResponse, status_code=status.HTTP_201_CREATED)
async def create_merit_badge(
    badge: MeritBadgeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new merit badge (admin only, async)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create merit badges"
        )
    existing = await crud_requirement.get_merit_badge_by_name(db, badge.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Merit badge '{badge.name}' already exists"
        )
    return await crud_requirement.create_merit_badge(db, badge)


@router.put("/merit-badges/{badge_id}", response_model=MeritBadgeResponse)
async def update_merit_badge(
    badge_id: UUID,
    badge: MeritBadgeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a merit badge (admin only, async)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update merit badges"
        )
    updated = await crud_requirement.update_merit_badge(db, badge_id, badge)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merit badge not found"
        )
    return updated


@router.delete("/merit-badges/{badge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_merit_badge(
    badge_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a merit badge (admin only, async)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete merit badges"
        )
    success = await crud_requirement.delete_merit_badge(db, badge_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merit badge not found"
        )


# ============================================================================
# Outing Requirements Endpoints
# ============================================================================

@router.get("/outings/{outing_id}/requirements", response_model=List[OutingRequirementResponse])
async def list_outing_requirements(
    outing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all requirements for a specific outing (async)"""
    return await crud_requirement.get_outing_requirements(db, outing_id)


@router.post("/outings/{outing_id}/requirements", response_model=OutingRequirementResponse, status_code=status.HTTP_201_CREATED)
async def add_requirement_to_outing(
    outing_id: UUID,
    requirement: OutingRequirementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a requirement to an outing (admin only, async)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can add requirements to outings"
        )
    existing = await crud_requirement.get_outing_requirement(
        db, outing_id, requirement.rank_requirement_id
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This requirement is already associated with this outing"
        )
    return await crud_requirement.add_requirement_to_outing(db, outing_id, requirement)


@router.put("/outings/requirements/{outing_requirement_id}", response_model=OutingRequirementResponse)
async def update_outing_requirement(
    outing_requirement_id: UUID,
    requirement: OutingRequirementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update notes for an outing requirement (admin only, async)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update outing requirements"
        )
    updated = await crud_requirement.update_outing_requirement(db, outing_requirement_id, requirement)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing requirement not found"
        )
    return updated


@router.delete("/outings/requirements/{outing_requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_requirement_from_outing(
    outing_requirement_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a requirement from an outing (admin only, async)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can remove requirements from outings"
        )
    success = await crud_requirement.remove_requirement_from_outing(db, outing_requirement_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing requirement not found"
        )


# ============================================================================
# Outing Merit Badges Endpoints
# ============================================================================

@router.get("/outings/{outing_id}/merit-badges", response_model=List[OutingMeritBadgeResponse])
async def list_outing_merit_badges(
    outing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all merit badges for a specific outing (async)"""
    return await crud_requirement.get_outing_merit_badges(db, outing_id)


@router.post("/outings/{outing_id}/merit-badges", response_model=OutingMeritBadgeResponse, status_code=status.HTTP_201_CREATED)
async def add_merit_badge_to_outing(
    outing_id: UUID,
    badge: OutingMeritBadgeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a merit badge to an outing (admin only, async)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can add merit badges to outings"
        )
    existing = await crud_requirement.get_outing_merit_badge(
        db, outing_id, badge.merit_badge_id
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This merit badge is already associated with this outing"
        )
    return await crud_requirement.add_merit_badge_to_outing(db, outing_id, badge)


@router.put("/outings/merit-badges/{outing_badge_id}", response_model=OutingMeritBadgeResponse)
async def update_outing_merit_badge(
    outing_badge_id: UUID,
    badge: OutingMeritBadgeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update notes for an outing merit badge (admin only, async)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update outing merit badges"
        )
    updated = await crud_requirement.update_outing_merit_badge(db, outing_badge_id, badge)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing merit badge not found"
        )
    return updated


@router.delete("/outings/merit-badges/{outing_badge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_merit_badge_from_outing(
    outing_badge_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a merit badge from an outing (admin only, async)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can remove merit badges from outings"
        )
    success = await crud_requirement.remove_merit_badge_from_outing(db, outing_badge_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing merit badge not found"
        )


# ============================================================================
# Suggestions Endpoint
# ============================================================================

from pydantic import BaseModel

class PreviewSuggestionsRequest(BaseModel):
    name: str
    description: Optional[str] = ""

@router.post("/requirements/preview-suggestions", response_model=OutingSuggestions)
async def get_preview_suggestions(
    request: PreviewSuggestionsRequest,
    min_score: float = 0.1,
    max_requirements: int = 10,
    max_merit_badges: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get suggested rank requirements and merit badges based on outing name and description
    before the outing is created. This is used in the outing creation wizard.

    NOTE: This endpoint returns nested objects matching the frontend's
    `RequirementSuggestion` and `MeritBadgeSuggestion` types where each
    suggestion includes the full requirement / merit badge object.
    """
    from app.utils.suggestions import extract_keywords_from_text, calculate_match_score
    from app.schemas.requirement import (
        RequirementSuggestion,
        MeritBadgeSuggestion,
        RankRequirementResponse,
        MeritBadgeResponse,
    )

    # Extract keywords from provided text
    text = f"{request.name} {request.description or ''}".strip()
    keywords = extract_keywords_from_text(text)

    # Fetch matching ORM objects
    requirements = await crud_requirement.search_rank_requirements_by_keywords(db, keywords)
    merit_badges = await crud_requirement.search_merit_badges_by_keywords(db, keywords)

    # Build suggestion objects with nested full resource + match metadata
    requirement_suggestions: list[RequirementSuggestion] = []
    for req in requirements:
        req_keywords = req.keywords or []
        match_score = calculate_match_score(keywords, req_keywords)
        if match_score < min_score:
            continue
        requirement_suggestions.append(
            RequirementSuggestion(
                requirement=RankRequirementResponse.model_validate(req),
                match_score=match_score,
                matched_keywords=[k for k in keywords if k in req_keywords],
            )
        )

    merit_badge_suggestions: list[MeritBadgeSuggestion] = []
    for badge in merit_badges:
        badge_keywords = badge.keywords or []
        match_score = calculate_match_score(keywords, badge_keywords)
        if match_score < min_score:
            continue
        merit_badge_suggestions.append(
            MeritBadgeSuggestion(
                merit_badge=MeritBadgeResponse.model_validate(badge),
                match_score=match_score,
                matched_keywords=[k for k in keywords if k in badge_keywords],
            )
        )

    # Sort by relevance
    requirement_suggestions.sort(key=lambda s: s.match_score, reverse=True)
    merit_badge_suggestions.sort(key=lambda s: s.match_score, reverse=True)

    # Limit results
    requirement_suggestions = requirement_suggestions[:max_requirements]
    merit_badge_suggestions = merit_badge_suggestions[:max_merit_badges]

    return OutingSuggestions(
        requirements=requirement_suggestions,
        merit_badges=merit_badge_suggestions,
    )


@router.get("/outings/{outing_id}/suggestions", response_model=OutingSuggestions)
async def get_suggestions_for_outing(
    outing_id: UUID,
    min_score: float = 0.1,
    max_requirements: int = 10,
    max_merit_badges: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get suggested rank requirements and merit badges for an outing
    based on keywords in the outing name and description
    """
    # Get the outing
    outing = await crud_outing.get_outing(db, outing_id)  # ensure outing CRUD is async
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Get suggestions
    return get_outing_suggestions(
        db,
        outing,
        min_score=min_score,
        max_requirements=max_requirements,
        max_merit_badges=max_merit_badges
    )
