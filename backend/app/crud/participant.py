from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.models.participant import Participant
from app.models.family import FamilyMember


async def get_participant(db: AsyncSession, participant_id: UUID) -> Optional[Participant]:
    """Get a participant by ID with family member data loaded"""
    result = await db.execute(
        select(Participant)
        .options(
            selectinload(Participant.family_member)
            .selectinload(FamilyMember.dietary_preferences)
        )
        .options(
            selectinload(Participant.family_member)
            .selectinload(FamilyMember.allergies)
        )
        .where(Participant.id == participant_id)
    )
    return result.scalar_one_or_none()


async def get_participants_for_signup(db: AsyncSession, signup_id: UUID) -> List[Participant]:
    """Get all participants for a specific signup"""
    result = await db.execute(
        select(Participant)
        .options(
            selectinload(Participant.family_member)
            .selectinload(FamilyMember.dietary_preferences)
        )
        .options(
            selectinload(Participant.family_member)
            .selectinload(FamilyMember.allergies)
        )
        .where(Participant.signup_id == signup_id)
        .order_by(Participant.created_at)
    )
    return list(result.scalars().all())


async def get_participants_for_outing(db: AsyncSession, outing_id: UUID) -> List[Participant]:
    """Get all participants for a specific outing"""
    from app.models.signup import Signup
    
    result = await db.execute(
        select(Participant)
        .join(Signup, Participant.signup_id == Signup.id)
        .options(
            selectinload(Participant.family_member)
            .selectinload(FamilyMember.dietary_preferences)
        )
        .options(
            selectinload(Participant.family_member)
            .selectinload(FamilyMember.allergies)
        )
        .where(Signup.outing_id == outing_id)
        .order_by(Participant.created_at)
    )
    return list(result.scalars().all())


async def create_participant(
    db: AsyncSession,
    signup_id: UUID,
    family_member_id: UUID
) -> Participant:
    """Create a new participant linking a signup to a family member"""
    db_participant = Participant(
        signup_id=signup_id,
        family_member_id=family_member_id
    )
    db.add(db_participant)
    await db.flush()
    await db.commit()
    await db.refresh(db_participant)
    
    # Reload with relationships
    result = await db.execute(
        select(Participant)
        .options(
            selectinload(Participant.family_member)
            .selectinload(FamilyMember.dietary_preferences)
        )
        .options(
            selectinload(Participant.family_member)
            .selectinload(FamilyMember.allergies)
        )
        .where(Participant.id == db_participant.id)
    )
    return result.scalar_one()


async def delete_participant(db: AsyncSession, participant_id: UUID) -> bool:
    """Delete a participant"""
    db_participant = await get_participant(db, participant_id)
    if not db_participant:
        return False
    
    await db.delete(db_participant)
    await db.commit()
    return True


async def get_participant_by_signup_and_family_member(
    db: AsyncSession,
    signup_id: UUID,
    family_member_id: UUID
) -> Optional[Participant]:
    """Get a participant by signup and family member IDs"""
    result = await db.execute(
        select(Participant)
        .options(
            selectinload(Participant.family_member)
            .selectinload(FamilyMember.dietary_preferences)
        )
        .options(
            selectinload(Participant.family_member)
            .selectinload(FamilyMember.allergies)
        )
        .where(
            Participant.signup_id == signup_id,
            Participant.family_member_id == family_member_id
        )
    )
    return result.scalar_one_or_none()
