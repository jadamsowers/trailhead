from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
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
def list_rank_requirements(
    skip: int = 0,
    limit: int = 100,
    rank: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all rank requirements with optional filtering by rank and category"""
    return crud_requirement.get_rank_requirements(
        db, skip=skip, limit=limit, rank=rank, category=category
    )


@router.get("/rank-requirements/{requirement_id}", response_model=RankRequirementResponse)
def get_rank_requirement(
    requirement_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific rank requirement by ID"""
    requirement = crud_requirement.get_rank_requirement(db, requirement_id)
    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rank requirement not found"
        )
    return requirement


@router.post("/rank-requirements", response_model=RankRequirementResponse, status_code=status.HTTP_201_CREATED)
def create_rank_requirement(
    requirement: RankRequirementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new rank requirement (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create rank requirements"
        )
    return crud_requirement.create_rank_requirement(db, requirement)


@router.put("/rank-requirements/{requirement_id}", response_model=RankRequirementResponse)
def update_rank_requirement(
    requirement_id: UUID,
    requirement: RankRequirementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a rank requirement (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update rank requirements"
        )
    
    updated = crud_requirement.update_rank_requirement(db, requirement_id, requirement)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rank requirement not found"
        )
    return updated


@router.delete("/rank-requirements/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rank_requirement(
    requirement_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a rank requirement (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete rank requirements"
        )
    
    success = crud_requirement.delete_rank_requirement(db, requirement_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rank requirement not found"
        )


# ============================================================================
# Merit Badge Endpoints
# ============================================================================

@router.get("/merit-badges", response_model=List[MeritBadgeResponse])
def list_merit_badges(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all merit badges"""
    return crud_requirement.get_merit_badges(db, skip=skip, limit=limit)


@router.get("/merit-badges/{badge_id}", response_model=MeritBadgeResponse)
def get_merit_badge(
    badge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific merit badge by ID"""
    badge = crud_requirement.get_merit_badge(db, badge_id)
    if not badge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merit badge not found"
        )
    return badge


@router.post("/merit-badges", response_model=MeritBadgeResponse, status_code=status.HTTP_201_CREATED)
def create_merit_badge(
    badge: MeritBadgeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new merit badge (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create merit badges"
        )
    
    # Check if badge with same name already exists
    existing = crud_requirement.get_merit_badge_by_name(db, badge.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Merit badge '{badge.name}' already exists"
        )
    
    return crud_requirement.create_merit_badge(db, badge)


@router.put("/merit-badges/{badge_id}", response_model=MeritBadgeResponse)
def update_merit_badge(
    badge_id: UUID,
    badge: MeritBadgeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a merit badge (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update merit badges"
        )
    
    updated = crud_requirement.update_merit_badge(db, badge_id, badge)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merit badge not found"
        )
    return updated


@router.delete("/merit-badges/{badge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_merit_badge(
    badge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a merit badge (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete merit badges"
        )
    
    success = crud_requirement.delete_merit_badge(db, badge_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merit badge not found"
        )


# ============================================================================
# Outing Requirements Endpoints
# ============================================================================

@router.get("/outings/{outing_id}/requirements", response_model=List[OutingRequirementResponse])
def list_outing_requirements(
    outing_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all requirements for a specific outing"""
    return crud_requirement.get_outing_requirements(db, outing_id)


@router.post("/outings/{outing_id}/requirements", response_model=OutingRequirementResponse, status_code=status.HTTP_201_CREATED)
def add_requirement_to_outing(
    outing_id: UUID,
    requirement: OutingRequirementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a requirement to an outing (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can add requirements to outings"
        )
    
    # Check if requirement already exists for this outing
    existing = crud_requirement.get_outing_requirement(
        db, outing_id, requirement.rank_requirement_id
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This requirement is already associated with this outing"
        )
    
    return crud_requirement.add_requirement_to_outing(db, outing_id, requirement)


@router.put("/outings/requirements/{outing_requirement_id}", response_model=OutingRequirementResponse)
def update_outing_requirement(
    outing_requirement_id: UUID,
    requirement: OutingRequirementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update notes for an outing requirement (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update outing requirements"
        )
    
    updated = crud_requirement.update_outing_requirement(db, outing_requirement_id, requirement)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing requirement not found"
        )
    return updated


@router.delete("/outings/requirements/{outing_requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_requirement_from_outing(
    outing_requirement_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a requirement from an outing (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can remove requirements from outings"
        )
    
    success = crud_requirement.remove_requirement_from_outing(db, outing_requirement_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing requirement not found"
        )


# ============================================================================
# Outing Merit Badges Endpoints
# ============================================================================

@router.get("/outings/{outing_id}/merit-badges", response_model=List[OutingMeritBadgeResponse])
def list_outing_merit_badges(
    outing_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all merit badges for a specific outing"""
    return crud_requirement.get_outing_merit_badges(db, outing_id)


@router.post("/outings/{outing_id}/merit-badges", response_model=OutingMeritBadgeResponse, status_code=status.HTTP_201_CREATED)
def add_merit_badge_to_outing(
    outing_id: UUID,
    badge: OutingMeritBadgeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a merit badge to an outing (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can add merit badges to outings"
        )
    
    # Check if badge already exists for this outing
    existing = crud_requirement.get_outing_merit_badge(
        db, outing_id, badge.merit_badge_id
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This merit badge is already associated with this outing"
        )
    
    return crud_requirement.add_merit_badge_to_outing(db, outing_id, badge)


@router.put("/outings/merit-badges/{outing_badge_id}", response_model=OutingMeritBadgeResponse)
def update_outing_merit_badge(
    outing_badge_id: UUID,
    badge: OutingMeritBadgeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update notes for an outing merit badge (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update outing merit badges"
        )
    
    updated = crud_requirement.update_outing_merit_badge(db, outing_badge_id, badge)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing merit badge not found"
        )
    return updated


@router.delete("/outings/merit-badges/{outing_badge_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_merit_badge_from_outing(
    outing_badge_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a merit badge from an outing (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can remove merit badges from outings"
        )
    
    success = crud_requirement.remove_merit_badge_from_outing(db, outing_badge_id)
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
def get_preview_suggestions(
    request: PreviewSuggestionsRequest,
    min_score: float = 0.1,
    max_requirements: int = 10,
    max_merit_badges: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get suggested rank requirements and merit badges based on outing name and description
    before the outing is created. This is used in the outing creation wizard.
    """
    from app.utils.suggestions import extract_keywords_from_text
    
    # Extract keywords from the provided text
    text = f"{request.name} {request.description or ''}"
    keywords = extract_keywords_from_text(text)
    
    # Get matching requirements and merit badges
    requirements = crud_requirement.search_rank_requirements_by_keywords(db, keywords)
    merit_badges = crud_requirement.search_merit_badges_by_keywords(db, keywords)
    
    # Calculate match scores and prepare response
    from app.schemas.requirement import RequirementSuggestion, MeritBadgeSuggestion
    from app.utils.suggestions import calculate_match_score
    
    requirement_suggestions = [
        RequirementSuggestion(
            requirement_id=str(req.id),
            rank=req.rank,
            category=req.category,
            description=req.description,
            keywords=req.keywords,
            match_score=calculate_match_score(keywords, req.keywords)
        )
        for req in requirements
    ]
    
    merit_badge_suggestions = [
        MeritBadgeSuggestion(
            merit_badge_id=str(badge.id),
            name=badge.name,
            description=badge.description,
            keywords=badge.keywords,
            match_score=calculate_match_score(keywords, badge.keywords)
        )
        for badge in merit_badges
    ]
    
    # Filter by minimum score and limit results
    requirement_suggestions = [r for r in requirement_suggestions if r.match_score >= min_score]
    merit_badge_suggestions = [b for b in merit_badge_suggestions if b.match_score >= min_score]
    
    # Sort by match score descending
    requirement_suggestions.sort(key=lambda x: x.match_score, reverse=True)
    merit_badge_suggestions.sort(key=lambda x: x.match_score, reverse=True)
    
    # Limit results
    requirement_suggestions = requirement_suggestions[:max_requirements]
    merit_badge_suggestions = merit_badge_suggestions[:max_merit_badges]
    
    return OutingSuggestions(
        requirements=requirement_suggestions,
        merit_badges=merit_badge_suggestions
    )


@router.get("/outings/{outing_id}/suggestions", response_model=OutingSuggestions)
def get_suggestions_for_outing(
    outing_id: UUID,
    min_score: float = 0.1,
    max_requirements: int = 10,
    max_merit_badges: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get suggested rank requirements and merit badges for an outing
    based on keywords in the outing name and description
    """
    # Get the outing
    outing = crud_outing.get_outing(db, outing_id)
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
