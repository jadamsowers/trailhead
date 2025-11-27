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
from app.services.change_log import record_change, compute_payload_hash


async def get_outing(db: AsyncSession, outing_id: UUID) -> Optional[Outing]:
    """Get an outing by ID with all signups and participants"""
    result = await db.execute(
        select(Outing)
        .options(
            selectinload(Outing.signups).selectinload(Signup.participants).selectinload(Participant.family_member),
            # Eager-load place relationships to avoid async lazy-load during serialization
            selectinload(Outing.outing_place),
            selectinload(Outing.pickup_place),
            selectinload(Outing.dropoff_place)
        )
        .where(Outing.id == outing_id)
    )
    return result.scalar_one_or_none()


async def get(db: AsyncSession, outing_id: UUID) -> Optional[Outing]:
    """Get an outing by ID (alias for get_outing for consistency with other CRUD modules)"""
    return await get_outing(db, outing_id)


async def get_outing_with_details(db: AsyncSession, outing_id: UUID) -> Optional[Outing]:
    """Get an outing by ID with all details for PDF generation"""
    from app.models.requirement import OutingRequirement, RankRequirement, OutingMeritBadge, MeritBadge
    from app.models.packing_list import OutingPackingList

    result = await db.execute(
        select(Outing)
        .options(
            # Needed for participants' troop numbers on PDF
            selectinload(Outing.signups).selectinload(Signup.participants).selectinload(Participant.family_member),
            selectinload(Outing.outing_requirements).selectinload(OutingRequirement.requirement),
            selectinload(Outing.outing_merit_badges).selectinload(OutingMeritBadge.merit_badge),
            selectinload(Outing.packing_lists).selectinload(OutingPackingList.items),
            selectinload(Outing.outing_place),
            selectinload(Outing.pickup_place),
            selectinload(Outing.dropoff_place)
        )
        .where(Outing.id == outing_id)
    )
    return result.scalar_one_or_none()


async def get_outings(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Outing]:
    """Get all outings with pagination"""
    result = await db.execute(
        select(Outing)
        .options(
            selectinload(Outing.signups).selectinload(Signup.participants).selectinload(Participant.family_member),
            # Eager-load place relationships so responses can access them without additional IO
            selectinload(Outing.outing_place),
            selectinload(Outing.pickup_place),
            selectinload(Outing.dropoff_place)
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
            selectinload(Outing.signups).selectinload(Signup.participants).selectinload(Participant.family_member),
            selectinload(Outing.outing_place),
            selectinload(Outing.pickup_place),
            selectinload(Outing.dropoff_place)
        )
        .order_by(Outing.outing_date.asc())
    )
    outings = result.scalars().all()
    # Filter outings with available spots
    return [outing for outing in outings if not outing.is_full]


from datetime import timezone

async def create_outing(db: AsyncSession, outing: OutingCreate) -> Outing:
    """Create a new outing"""
    outing_data = outing.model_dump()
    
    # Ensure signups_close_at is naive UTC if present
    if outing_data.get('signups_close_at') and outing_data['signups_close_at'].tzinfo is not None:
        outing_data['signups_close_at'] = outing_data['signups_close_at'].astimezone(timezone.utc).replace(tzinfo=None)

    # Ensure cancellation_deadline is naive UTC if present
    if outing_data.get('cancellation_deadline') and outing_data['cancellation_deadline'].tzinfo is not None:
        outing_data['cancellation_deadline'] = outing_data['cancellation_deadline'].astimezone(timezone.utc).replace(tzinfo=None)
        
    db_outing = Outing(**outing_data)
    db.add(db_outing)
    await db.flush()  # Obtain ID
    # Record change before commit so version aligns with entity state
    payload_hash = compute_payload_hash(db_outing, ["name", "outing_date", "location", "updated_at"])  # lightweight fields
    await record_change(db, entity_type="outing", entity_id=db_outing.id, op_type="create", payload_hash=payload_hash)
    await db.commit()
    await db.refresh(db_outing)
    await db.refresh(db_outing, ['signups', 'outing_place', 'pickup_place', 'dropoff_place'])
    return db_outing


async def update_outing(db: AsyncSession, outing_id: UUID, outing: OutingUpdate) -> Optional[Outing]:
    """Update an existing outing"""
    db_outing = await get_outing(db, outing_id)
    if not db_outing:
        return None
    
    # Only update fields that were explicitly provided (exclude_unset=True)
    update_data = outing.model_dump(exclude_unset=True)

    # Ensure datetime fields are naive UTC if present
    for field in ['signups_close_at', 'cancellation_deadline']:
        if update_data.get(field) and update_data[field].tzinfo is not None:
            update_data[field] = update_data[field].astimezone(timezone.utc).replace(tzinfo=None)
    for key, value in update_data.items():
        setattr(db_outing, key, value)

    await db.flush()
    payload_hash = compute_payload_hash(db_outing, ["name", "outing_date", "location", "updated_at"])  # lightweight fields
    await record_change(db, entity_type="outing", entity_id=db_outing.id, op_type="update", payload_hash=payload_hash)
    await db.commit()
    await db.refresh(db_outing)
    await db.refresh(db_outing, ['signups', 'outing_place', 'pickup_place', 'dropoff_place'])
    return db_outing


async def delete_outing(db: AsyncSession, outing_id: UUID) -> bool:
    """Delete an outing (only if no signups)"""
    db_outing = await get_outing(db, outing_id)
    if not db_outing:
        return False
    
    if db_outing.signups:
        return False  # Cannot delete outing with signups
    
    # Record delete event prior to removal
    await record_change(db, entity_type="outing", entity_id=db_outing.id, op_type="delete")
    await db.delete(db_outing)
    await db.commit()
    return True


async def get_outing_count(db: AsyncSession) -> int:
    """Get total number of outings"""
    result = await db.execute(select(func.count(Outing.id)))
    return result.scalar_one()