from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID

from app.models.requirement import RankRequirement, MeritBadge, OutingRequirement, OutingMeritBadge
from app.models.outing import Outing
from app.schemas.requirement import (
    RankRequirementCreate,
    RankRequirementUpdate,
    MeritBadgeCreate,
    MeritBadgeUpdate,
    OutingRequirementCreate,
    OutingRequirementUpdate,
    OutingMeritBadgeCreate,
    OutingMeritBadgeUpdate,
)


# ============================================================================
# Rank Requirement CRUD
# ============================================================================

def get_rank_requirements(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    rank: Optional[str] = None,
    category: Optional[str] = None
) -> List[RankRequirement]:
    """Get all rank requirements with optional filtering"""
    query = db.query(RankRequirement)
    
    if rank:
        query = query.filter(RankRequirement.rank == rank)
    if category:
        query = query.filter(RankRequirement.category == category)
    
    return query.offset(skip).limit(limit).all()


def get_rank_requirement(db: Session, requirement_id: UUID) -> Optional[RankRequirement]:
    """Get a specific rank requirement by ID"""
    return db.query(RankRequirement).filter(RankRequirement.id == requirement_id).first()


def create_rank_requirement(db: Session, requirement: RankRequirementCreate) -> RankRequirement:
    """Create a new rank requirement"""
    db_requirement = RankRequirement(**requirement.model_dump())
    db.add(db_requirement)
    db.commit()
    db.refresh(db_requirement)
    return db_requirement


def update_rank_requirement(
    db: Session,
    requirement_id: UUID,
    requirement: RankRequirementUpdate
) -> Optional[RankRequirement]:
    """Update a rank requirement"""
    db_requirement = get_rank_requirement(db, requirement_id)
    if not db_requirement:
        return None
    
    update_data = requirement.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_requirement, field, value)
    
    db.commit()
    db.refresh(db_requirement)
    return db_requirement


def delete_rank_requirement(db: Session, requirement_id: UUID) -> bool:
    """Delete a rank requirement"""
    db_requirement = get_rank_requirement(db, requirement_id)
    if not db_requirement:
        return False
    
    db.delete(db_requirement)
    db.commit()
    return True


def search_rank_requirements_by_keywords(
    db: Session,
    keywords: List[str]
) -> List[RankRequirement]:
    """Search rank requirements by keywords"""
    # Use array overlap operator to find requirements with matching keywords
    return db.query(RankRequirement).filter(
        RankRequirement.keywords.overlap(keywords)
    ).all()


# ============================================================================
# Merit Badge CRUD
# ============================================================================

def get_merit_badges(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[MeritBadge]:
    """Get all merit badges"""
    return db.query(MeritBadge).offset(skip).limit(limit).all()


def get_merit_badge(db: Session, badge_id: UUID) -> Optional[MeritBadge]:
    """Get a specific merit badge by ID"""
    return db.query(MeritBadge).filter(MeritBadge.id == badge_id).first()


def get_merit_badge_by_name(db: Session, name: str) -> Optional[MeritBadge]:
    """Get a merit badge by name"""
    return db.query(MeritBadge).filter(MeritBadge.name == name).first()


def create_merit_badge(db: Session, badge: MeritBadgeCreate) -> MeritBadge:
    """Create a new merit badge"""
    db_badge = MeritBadge(**badge.model_dump())
    db.add(db_badge)
    db.commit()
    db.refresh(db_badge)
    return db_badge


def update_merit_badge(
    db: Session,
    badge_id: UUID,
    badge: MeritBadgeUpdate
) -> Optional[MeritBadge]:
    """Update a merit badge"""
    db_badge = get_merit_badge(db, badge_id)
    if not db_badge:
        return None
    
    update_data = badge.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_badge, field, value)
    
    db.commit()
    db.refresh(db_badge)
    return db_badge


def delete_merit_badge(db: Session, badge_id: UUID) -> bool:
    """Delete a merit badge"""
    db_badge = get_merit_badge(db, badge_id)
    if not db_badge:
        return False
    
    db.delete(db_badge)
    db.commit()
    return True


def search_merit_badges_by_keywords(
    db: Session,
    keywords: List[str]
) -> List[MeritBadge]:
    """Search merit badges by keywords"""
    # Use array overlap operator to find badges with matching keywords
    return db.query(MeritBadge).filter(
        MeritBadge.keywords.overlap(keywords)
    ).all()


# ============================================================================
# Outing Requirement CRUD
# ============================================================================

def get_outing_requirements(db: Session, outing_id: UUID) -> List[OutingRequirement]:
    """Get all requirements for a specific outing"""
    return db.query(OutingRequirement).filter(
        OutingRequirement.outing_id == outing_id
    ).all()


def get_outing_requirement(
    db: Session,
    outing_id: UUID,
    requirement_id: UUID
) -> Optional[OutingRequirement]:
    """Get a specific outing requirement"""
    return db.query(OutingRequirement).filter(
        OutingRequirement.outing_id == outing_id,
        OutingRequirement.rank_requirement_id == requirement_id
    ).first()


def add_requirement_to_outing(
    db: Session,
    outing_id: UUID,
    requirement: OutingRequirementCreate
) -> OutingRequirement:
    """Add a requirement to an outing"""
    db_outing_req = OutingRequirement(
        outing_id=outing_id,
        **requirement.model_dump()
    )
    db.add(db_outing_req)
    db.commit()
    db.refresh(db_outing_req)
    return db_outing_req


def update_outing_requirement(
    db: Session,
    outing_requirement_id: UUID,
    requirement: OutingRequirementUpdate
) -> Optional[OutingRequirement]:
    """Update an outing requirement's notes"""
    db_outing_req = db.query(OutingRequirement).filter(
        OutingRequirement.id == outing_requirement_id
    ).first()
    
    if not db_outing_req:
        return None
    
    update_data = requirement.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_outing_req, field, value)
    
    db.commit()
    db.refresh(db_outing_req)
    return db_outing_req


def remove_requirement_from_outing(
    db: Session,
    outing_requirement_id: UUID
) -> bool:
    """Remove a requirement from an outing"""
    db_outing_req = db.query(OutingRequirement).filter(
        OutingRequirement.id == outing_requirement_id
    ).first()
    
    if not db_outing_req:
        return False
    
    db.delete(db_outing_req)
    db.commit()
    return True


# ============================================================================
# Outing Merit Badge CRUD
# ============================================================================

def get_outing_merit_badges(db: Session, outing_id: UUID) -> List[OutingMeritBadge]:
    """Get all merit badges for a specific outing"""
    return db.query(OutingMeritBadge).filter(
        OutingMeritBadge.outing_id == outing_id
    ).all()


def get_outing_merit_badge(
    db: Session,
    outing_id: UUID,
    badge_id: UUID
) -> Optional[OutingMeritBadge]:
    """Get a specific outing merit badge"""
    return db.query(OutingMeritBadge).filter(
        OutingMeritBadge.outing_id == outing_id,
        OutingMeritBadge.merit_badge_id == badge_id
    ).first()


def add_merit_badge_to_outing(
    db: Session,
    outing_id: UUID,
    badge: OutingMeritBadgeCreate
) -> OutingMeritBadge:
    """Add a merit badge to an outing"""
    db_outing_badge = OutingMeritBadge(
        outing_id=outing_id,
        **badge.model_dump()
    )
    db.add(db_outing_badge)
    db.commit()
    db.refresh(db_outing_badge)
    return db_outing_badge


def update_outing_merit_badge(
    db: Session,
    outing_badge_id: UUID,
    badge: OutingMeritBadgeUpdate
) -> Optional[OutingMeritBadge]:
    """Update an outing merit badge's notes"""
    db_outing_badge = db.query(OutingMeritBadge).filter(
        OutingMeritBadge.id == outing_badge_id
    ).first()
    
    if not db_outing_badge:
        return None
    
    update_data = badge.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_outing_badge, field, value)
    
    db.commit()
    db.refresh(db_outing_badge)
    return db_outing_badge


def remove_merit_badge_from_outing(
    db: Session,
    outing_badge_id: UUID
) -> bool:
    """Remove a merit badge from an outing"""
    db_outing_badge = db.query(OutingMeritBadge).filter(
        OutingMeritBadge.id == outing_badge_id
    ).first()
    
    if not db_outing_badge:
        return False
    
    db.delete(db_outing_badge)
    db.commit()
    return True
