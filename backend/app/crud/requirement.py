from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, any_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.models.requirement import RankRequirement, MeritBadge, OutingRequirement, OutingMeritBadge
from app.services.change_log import record_change, compute_payload_hash
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

async def get_rank_requirements(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    rank: Optional[str] = None,
    category: Optional[str] = None
) -> List[RankRequirement]:
    """Get all rank requirements with optional filtering (async)"""
    stmt = select(RankRequirement)
    if rank:
        stmt = stmt.where(RankRequirement.rank == rank)
    if category:
        stmt = stmt.where(RankRequirement.category == category)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_rank_requirement(db: AsyncSession, requirement_id: UUID) -> Optional[RankRequirement]:
    """Get a specific rank requirement by ID (async)"""
    result = await db.execute(select(RankRequirement).where(RankRequirement.id == requirement_id))
    return result.scalar_one_or_none()


async def create_rank_requirement(db: AsyncSession, requirement: RankRequirementCreate) -> RankRequirement:
    """Create a new rank requirement (async)"""
    db_requirement = RankRequirement(**requirement.model_dump())
    db.add(db_requirement)
    await db.flush()
    payload_hash = compute_payload_hash(db_requirement, ["rank", "title", "category"]) 
    await record_change(db, entity_type="rank_requirement", entity_id=db_requirement.id, op_type="create", payload_hash=payload_hash)
    await db.commit()
    await db.refresh(db_requirement)
    return db_requirement


async def update_rank_requirement(
    db: AsyncSession,
    requirement_id: UUID,
    requirement: RankRequirementUpdate
) -> Optional[RankRequirement]:
    """Update a rank requirement (async)"""
    db_requirement = await get_rank_requirement(db, requirement_id)
    if not db_requirement:
        return None
    update_data = requirement.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_requirement, field, value)
    await db.flush()
    payload_hash = compute_payload_hash(db_requirement, ["rank", "title", "category"]) 
    await record_change(db, entity_type="rank_requirement", entity_id=db_requirement.id, op_type="update", payload_hash=payload_hash)
    await db.commit()
    await db.refresh(db_requirement)
    return db_requirement


async def delete_rank_requirement(db: AsyncSession, requirement_id: UUID) -> bool:
    """Delete a rank requirement (async)"""
    db_requirement = await get_rank_requirement(db, requirement_id)
    if not db_requirement:
        return False
    await record_change(db, entity_type="rank_requirement", entity_id=db_requirement.id, op_type="delete")
    await db.delete(db_requirement)
    await db.commit()
    return True


async def search_rank_requirements_by_keywords(
    db: AsyncSession,
    keywords: List[str]
) -> List[RankRequirement]:
    """Search rank requirements by keywords (async)"""
    # Use any_ to check if any keyword in the search list is in the database array
    from sqlalchemy import or_
    conditions = [RankRequirement.keywords.any(keyword) for keyword in keywords]
    stmt = select(RankRequirement).where(or_(*conditions))
    result = await db.execute(stmt)
    return result.scalars().all()


# ============================================================================
# Merit Badge CRUD
# ============================================================================

async def get_merit_badges(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100
) -> List[MeritBadge]:
    """Get all merit badges (async)"""
    stmt = select(MeritBadge).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_merit_badge(db: AsyncSession, badge_id: UUID) -> Optional[MeritBadge]:
    """Get a specific merit badge by ID (async)"""
    result = await db.execute(select(MeritBadge).where(MeritBadge.id == badge_id))
    return result.scalar_one_or_none()


async def get_merit_badge_by_name(db: AsyncSession, name: str) -> Optional[MeritBadge]:
    """Get a merit badge by name (async)"""
    result = await db.execute(select(MeritBadge).where(MeritBadge.name == name))
    return result.scalar_one_or_none()


async def create_merit_badge(db: AsyncSession, badge: MeritBadgeCreate) -> MeritBadge:
    """Create a new merit badge (async)"""
    db_badge = MeritBadge(**badge.model_dump())
    db.add(db_badge)
    await db.flush()
    payload_hash = compute_payload_hash(db_badge, ["name", "is_eagle_required"]) 
    await record_change(db, entity_type="merit_badge", entity_id=db_badge.id, op_type="create", payload_hash=payload_hash)
    await db.commit()
    await db.refresh(db_badge)
    return db_badge


async def update_merit_badge(
    db: AsyncSession,
    badge_id: UUID,
    badge: MeritBadgeUpdate
) -> Optional[MeritBadge]:
    """Update a merit badge (async)"""
    db_badge = await get_merit_badge(db, badge_id)
    if not db_badge:
        return None
    update_data = badge.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_badge, field, value)
    await db.flush()
    payload_hash = compute_payload_hash(db_badge, ["name", "is_eagle_required"]) 
    await record_change(db, entity_type="merit_badge", entity_id=db_badge.id, op_type="update", payload_hash=payload_hash)
    await db.commit()
    await db.refresh(db_badge)
    return db_badge


async def delete_merit_badge(db: AsyncSession, badge_id: UUID) -> bool:
    """Delete a merit badge (async)"""
    db_badge = await get_merit_badge(db, badge_id)
    if not db_badge:
        return False
    await record_change(db, entity_type="merit_badge", entity_id=db_badge.id, op_type="delete")
    await db.delete(db_badge)
    await db.commit()
    return True


async def search_merit_badges_by_keywords(
    db: AsyncSession,
    keywords: List[str]
) -> List[MeritBadge]:
    """Search merit badges by keywords (async)"""
    # Use any_ to check if any keyword in the search list is in the database array
    from sqlalchemy import or_
    conditions = [MeritBadge.keywords.any(keyword) for keyword in keywords]
    stmt = select(MeritBadge).where(or_(*conditions))
    result = await db.execute(stmt)
    return result.scalars().all()


# ============================================================================
# Outing Requirement CRUD
# ============================================================================

async def get_outing_requirements(db: AsyncSession, outing_id: UUID) -> List[OutingRequirement]:
    """Get all requirements for a specific outing (async)
    Eager-load related requirement to avoid greenlet errors during response serialization.
    """
    stmt = (
        select(OutingRequirement)
        .options(selectinload(OutingRequirement.requirement))
        .where(OutingRequirement.outing_id == outing_id)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_outing_requirement(
    db: AsyncSession,
    outing_id: UUID,
    requirement_id: UUID
) -> Optional[OutingRequirement]:
    """Get a specific outing requirement (async)"""
    stmt = (
        select(OutingRequirement)
        .options(selectinload(OutingRequirement.requirement))
        .where(
            OutingRequirement.outing_id == outing_id,
            OutingRequirement.rank_requirement_id == requirement_id
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def add_requirement_to_outing(
    db: AsyncSession,
    outing_id: UUID,
    requirement: OutingRequirementCreate
) -> OutingRequirement:
    """Add a requirement to an outing (async)"""
    db_outing_req = OutingRequirement(outing_id=outing_id, **requirement.model_dump())
    db.add(db_outing_req)
    await db.flush()
    await record_change(db, entity_type="outing_requirement", entity_id=db_outing_req.id, op_type="create")
    await db.commit()
    # Re-query with relationship eager-loaded to satisfy response schema
    stmt = select(OutingRequirement).options(selectinload(OutingRequirement.requirement)).where(OutingRequirement.id == db_outing_req.id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none() or db_outing_req


async def update_outing_requirement(
    db: AsyncSession,
    outing_requirement_id: UUID,
    requirement: OutingRequirementUpdate
) -> Optional[OutingRequirement]:
    """Update an outing requirement's notes (async)"""
    result = await db.execute(
        select(OutingRequirement)
        .options(selectinload(OutingRequirement.requirement))
        .where(OutingRequirement.id == outing_requirement_id)
    )
    db_outing_req = result.scalar_one_or_none()
    if not db_outing_req:
        return None
    update_data = requirement.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_outing_req, field, value)
    await db.flush()
    await record_change(db, entity_type="outing_requirement", entity_id=db_outing_req.id, op_type="update")
    await db.commit()
    # Return with relationship loaded
    stmt = select(OutingRequirement).options(selectinload(OutingRequirement.requirement)).where(OutingRequirement.id == outing_requirement_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def remove_requirement_from_outing(
    db: AsyncSession,
    outing_requirement_id: UUID
) -> bool:
    """Remove a requirement from an outing (async)"""
    result = await db.execute(select(OutingRequirement).where(OutingRequirement.id == outing_requirement_id))
    db_outing_req = result.scalar_one_or_none()
    if not db_outing_req:
        return False
    await record_change(db, entity_type="outing_requirement", entity_id=db_outing_req.id, op_type="delete")
    await db.delete(db_outing_req)
    await db.commit()
    return True


# ============================================================================
# Outing Merit Badge CRUD
# ============================================================================

async def get_outing_merit_badges(db: AsyncSession, outing_id: UUID) -> List[OutingMeritBadge]:
    """Get all merit badges for a specific outing (async)
    Eager-load related merit_badge to avoid greenlet errors during response serialization.
    """
    stmt = (
        select(OutingMeritBadge)
        .options(selectinload(OutingMeritBadge.merit_badge))
        .where(OutingMeritBadge.outing_id == outing_id)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_outing_merit_badge(
    db: AsyncSession,
    outing_id: UUID,
    badge_id: UUID
) -> Optional[OutingMeritBadge]:
    """Get a specific outing merit badge (async)"""
    stmt = (
        select(OutingMeritBadge)
        .options(selectinload(OutingMeritBadge.merit_badge))
        .where(
            OutingMeritBadge.outing_id == outing_id,
            OutingMeritBadge.merit_badge_id == badge_id
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def add_merit_badge_to_outing(
    db: AsyncSession,
    outing_id: UUID,
    badge: OutingMeritBadgeCreate
) -> OutingMeritBadge:
    """Add a merit badge to an outing (async)"""
    db_outing_badge = OutingMeritBadge(outing_id=outing_id, **badge.model_dump())
    db.add(db_outing_badge)
    await db.flush()
    await record_change(db, entity_type="outing_merit_badge", entity_id=db_outing_badge.id, op_type="create")
    await db.commit()
    # Re-query with relationship eager-loaded to satisfy response schema
    stmt = select(OutingMeritBadge).options(selectinload(OutingMeritBadge.merit_badge)).where(OutingMeritBadge.id == db_outing_badge.id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none() or db_outing_badge


async def update_outing_merit_badge(
    db: AsyncSession,
    outing_badge_id: UUID,
    badge: OutingMeritBadgeUpdate
) -> Optional[OutingMeritBadge]:
    """Update an outing merit badge's notes (async)"""
    result = await db.execute(select(OutingMeritBadge).where(OutingMeritBadge.id == outing_badge_id))
    db_outing_badge = result.scalar_one_or_none()
    if not db_outing_badge:
        return None
    update_data = badge.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_outing_badge, field, value)
    await db.flush()
    await record_change(db, entity_type="outing_merit_badge", entity_id=db_outing_badge.id, op_type="update")
    await db.commit()
    await db.refresh(db_outing_badge)
    return db_outing_badge


async def remove_merit_badge_from_outing(
    db: AsyncSession,
    outing_badge_id: UUID
) -> bool:
    """Remove a merit badge from an outing (async)"""
    result = await db.execute(select(OutingMeritBadge).where(OutingMeritBadge.id == outing_badge_id))
    db_outing_badge = result.scalar_one_or_none()
    if not db_outing_badge:
        return False
    await record_change(db, entity_type="outing_merit_badge", entity_id=db_outing_badge.id, op_type="delete")
    await db.delete(db_outing_badge)
    await db.commit()
    return True
