from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select, delete
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.utils.timezone import utc_now

from app.models.checkin import CheckIn
from app.models.participant import Participant
from app.models.signup import Signup
from app.models.outing import Outing
from app.models.family import FamilyMember
from app.schemas.checkin import CheckInCreate, CheckInParticipant, CheckInSummary


async def get_checkin_summary(db: AsyncSession, outing_id: UUID) -> Optional[CheckInSummary]:
    """
    Get check-in summary for an outing including all participants and their check-in status
    """
    # Get the outing
    result = await db.execute(select(Outing).filter(Outing.id == outing_id))
    outing = result.scalars().first()
    if not outing:
        return None
    
    # Get all signups for this outing with participants and their family members loaded
    result = await db.execute(
        select(Signup)
        .filter(Signup.outing_id == outing_id)
        .options(
            selectinload(Signup.participants).joinedload(Participant.family_member)
        )
    )
    signups = result.scalars().all()
    
    participants_data = []
    total_participants = 0
    checked_in_count = 0
    
    # Get all checkins for this outing to avoid N+1 queries
    result = await db.execute(
        select(CheckIn).filter(CheckIn.outing_id == outing_id)
    )
    all_checkins = result.scalars().all()
    # Create a map for faster lookup: participant_id -> CheckIn
    checkin_map = {c.participant_id: c for c in all_checkins}
    
    for signup in signups:
        for participant in signup.participants:
            total_participants += 1
            
            checkin = checkin_map.get(participant.id)
            
            is_checked_in = checkin is not None
            if is_checked_in:
                checked_in_count += 1
            
            participants_data.append(CheckInParticipant(
                id=participant.id,
                signup_id=signup.id,
                name=participant.name or "Unknown",
                member_type=participant.participant_type or "scout",
                family_name=signup.family_contact_name,
                patrol_name=participant.patrol_name,
                troop_number=participant.troop_number,
                is_checked_in=is_checked_in,
                checked_in_at=checkin.checked_in_at if checkin else None,
                checked_in_by=checkin.checked_in_by if checkin else None
            ))
    
    return CheckInSummary(
        outing_id=outing.id,
        outing_name=outing.name,
        outing_date=outing.outing_date,
        total_participants=total_participants,
        checked_in_count=checked_in_count,
        participants=participants_data
    )


async def create_checkins(
    db: AsyncSession,
    outing_id: UUID,
    participant_ids: List[UUID],
    checked_in_by: str
) -> List[CheckIn]:
    """
    Create check-in records for multiple participants
    Returns list of created check-in records
    """
    checkins = []
    checked_in_at = utc_now()
    
    for participant_id in participant_ids:
        # Get participant to find signup_id
        result = await db.execute(select(Participant).filter(Participant.id == participant_id))
        participant = result.scalars().first()
        if not participant:
            continue
        
        # Check if already checked in
        result = await db.execute(
            select(CheckIn).filter(
                and_(
                    CheckIn.outing_id == outing_id,
                    CheckIn.participant_id == participant_id
                )
            )
        )
        existing = result.scalars().first()
        
        if existing:
            # Already checked in, skip
            continue
        
        # Create new check-in
        checkin = CheckIn(
            outing_id=outing_id,
            signup_id=participant.signup_id,
            participant_id=participant_id,
            checked_in_by=checked_in_by,
            checked_in_at=checked_in_at
        )
        db.add(checkin)
        checkins.append(checkin)
    
    await db.commit()
    for checkin in checkins:
        await db.refresh(checkin)
    
    return checkins


async def delete_checkin(db: AsyncSession, outing_id: UUID, participant_id: UUID) -> bool:
    """
    Remove a check-in record (undo check-in)
    Returns True if deleted, False if not found
    """
    result = await db.execute(
        select(CheckIn).filter(
            and_(
                CheckIn.outing_id == outing_id,
                CheckIn.participant_id == participant_id
            )
        )
    )
    checkin = result.scalars().first()
    
    if checkin:
        await db.delete(checkin)
        await db.commit()
        return True
    return False


async def get_checkin_records(db: AsyncSession, outing_id: UUID) -> List[CheckIn]:
    """
    Get all check-in records for an outing
    """
    result = await db.execute(select(CheckIn).filter(CheckIn.outing_id == outing_id))
    return result.scalars().all()


async def delete_all_checkins(db: AsyncSession, outing_id: UUID) -> int:
    """
    Delete all check-ins for an outing (reset check-in status)
    Returns number of records deleted
    """
    # SQLAlchemy delete with async session requires execution
    result = await db.execute(
        delete(CheckIn).where(CheckIn.outing_id == outing_id)
    )
    await db.commit()
    return result.rowcount
