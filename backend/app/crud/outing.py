from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.models.outing import Outing
from app.models.signup import Signup
from app.models.participant import Participant
from app.models.family import FamilyMember
from app.schemas.outing import OutingCreate, OutingUpdate


async def get_outing(db: AsyncSession, outing_id: UUID) -> Optional[Outing]:
    """Get an outing by ID with all signups and participants"""
    result = await db.execute(
        select(Outing)
        .options(
            selectinload(Outing.signups).selectinload(Signup.participants).selectinload(Participant.family_member)
        )
        .where(Outing.id == outing_id)
    )
    return result.scalar_one_or_none()


async def get_outings(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Outing]:
    """Get all outings with pagination"""
    result = await db.execute(
        select(Outing)
        .options(
            selectinload(Outing.signups).selectinload(Signup.participants).selectinload(Participant.family_member)
        )
        .offset(skip)
        .limit(limit)
        .order_by(Outing.outing_date.desc())
    )
    return result.scalars().all()


async def get_available_outings(db: AsyncSession) -> list[Outing]:
    """Get outings that still have available spots"""
    result = await db.execute(
        select(Outing)
        .options(
            selectinload(Outing.signups).selectinload(Signup.participants).selectinload(Participant.family_member)
        )
        .order_by(Outing.outing_date.asc())
    )
    outings = result.scalars().all()
    # Filter outings with available spots
    return [outing for outing in outings if not outing.is_full]


async def create_outing(db: AsyncSession, outing: OutingCreate) -> Outing:
    """Create a new outing"""
    db_outing = Outing(**outing.model_dump())
    db.add(db_outing)
    await db.flush()
    await db.refresh(db_outing, ['signups'])
    return db_outing


async def update_outing(db: AsyncSession, outing_id: UUID, outing: OutingUpdate) -> Optional[Outing]:
    """Update an existing outing"""
    db_outing = await get_outing(db, outing_id)
    if not db_outing:
        return None
    
    for key, value in outing.model_dump().items():
        setattr(db_outing, key, value)
    
    await db.flush()
    await db.refresh(db_outing)
    return db_outing


async def delete_outing(db: AsyncSession, outing_id: UUID) -> bool:
    """Delete an outing (only if no signups)"""
    db_outing = await get_outing(db, outing_id)
    if not db_outing:
        return False
    
    if db_outing.signups:
        return False  # Cannot delete outing with signups
    
    await db.delete(db_outing)
    await db.flush()
    return True


async def get_outing_count(db: AsyncSession) -> int:
    """Get total number of outings"""
    result = await db.execute(select(func.count(Outing.id)))
    return result.scalar_one()