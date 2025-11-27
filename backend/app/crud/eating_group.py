from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.models.eating_group import EatingGroup, EatingGroupMember
from app.models.participant import Participant
from app.models.family import FamilyMember
from app.schemas.eating_group import (
    EatingGroupCreate,
    EatingGroupUpdate,
    EatingGroupMemberCreate,
)


# ==== Eating Groups CRUD ====

async def get_eating_group(db: AsyncSession, eating_group_id: UUID) -> Optional[EatingGroup]:
    """Get a single eating group with members"""
    result = await db.execute(
        select(EatingGroup)
        .options(
            selectinload(EatingGroup.members)
            .selectinload(EatingGroupMember.participant)
            .selectinload(Participant.family_member)
            .selectinload(FamilyMember.dietary_preferences)
        )
        .options(
            selectinload(EatingGroup.members)
            .selectinload(EatingGroupMember.participant)
            .selectinload(Participant.family_member)
            .selectinload(FamilyMember.allergies)
        )
        .where(EatingGroup.id == eating_group_id)
    )
    return result.scalar_one_or_none()


async def get_eating_groups_by_outing(db: AsyncSession, outing_id: UUID) -> List[EatingGroup]:
    """Get all eating groups for an outing"""
    result = await db.execute(
        select(EatingGroup)
        .options(
            selectinload(EatingGroup.members)
            .selectinload(EatingGroupMember.participant)
            .selectinload(Participant.family_member)
            .selectinload(FamilyMember.dietary_preferences)
        )
        .options(
            selectinload(EatingGroup.members)
            .selectinload(EatingGroupMember.participant)
            .selectinload(Participant.family_member)
            .selectinload(FamilyMember.allergies)
        )
        .where(EatingGroup.outing_id == outing_id)
        .order_by(EatingGroup.name)
    )
    return list(result.scalars().all())


async def create_eating_group(
    db: AsyncSession,
    eating_group_in: EatingGroupCreate
) -> EatingGroup:
    """Create a new eating group"""
    eating_group = EatingGroup(
        outing_id=eating_group_in.outing_id,
        name=eating_group_in.name,
        notes=eating_group_in.notes,
    )
    db.add(eating_group)
    await db.flush()
    
    # Add initial members if provided
    if eating_group_in.member_ids:
        for participant_id in eating_group_in.member_ids:
            member = EatingGroupMember(
                eating_group_id=eating_group.id,
                participant_id=participant_id,
                is_grubmaster=False,
            )
            db.add(member)
    
    await db.commit()
    
    # Re-fetch with relationships
    return await get_eating_group(db, eating_group.id)


async def update_eating_group(
    db: AsyncSession,
    eating_group_id: UUID,
    eating_group_in: EatingGroupUpdate
) -> Optional[EatingGroup]:
    """Update an eating group"""
    eating_group = await get_eating_group(db, eating_group_id)
    if not eating_group:
        return None
    
    update_data = eating_group_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(eating_group, field, value)
    
    await db.commit()
    return await get_eating_group(db, eating_group_id)


async def delete_eating_group(db: AsyncSession, eating_group_id: UUID) -> bool:
    """Delete an eating group"""
    eating_group = await get_eating_group(db, eating_group_id)
    if not eating_group:
        return False
    
    await db.delete(eating_group)
    await db.commit()
    return True


# ==== Eating Group Members CRUD ====

async def add_member_to_eating_group(
    db: AsyncSession,
    eating_group_id: UUID,
    member_in: EatingGroupMemberCreate
) -> Optional[EatingGroupMember]:
    """Add a participant to an eating group"""
    # Check if participant is already in any eating group
    existing_result = await db.execute(
        select(EatingGroupMember)
        .where(EatingGroupMember.participant_id == member_in.participant_id)
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        # Remove from current group
        await db.delete(existing)
    
    member = EatingGroupMember(
        eating_group_id=eating_group_id,
        participant_id=member_in.participant_id,
        is_grubmaster=member_in.is_grubmaster,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


async def remove_member_from_eating_group(
    db: AsyncSession,
    participant_id: UUID
) -> bool:
    """Remove a participant from their eating group"""
    result = await db.execute(
        select(EatingGroupMember)
        .where(EatingGroupMember.participant_id == participant_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        return False
    
    await db.delete(member)
    await db.commit()
    return True


async def set_grubmaster(
    db: AsyncSession,
    participant_id: UUID,
    is_grubmaster: bool
) -> Optional[EatingGroupMember]:
    """Set or unset a participant as grubmaster"""
    result = await db.execute(
        select(EatingGroupMember)
        .where(EatingGroupMember.participant_id == participant_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        return None
    
    member.is_grubmaster = is_grubmaster
    await db.commit()
    await db.refresh(member)
    return member


async def move_participant_to_group(
    db: AsyncSession,
    participant_id: UUID,
    target_eating_group_id: Optional[UUID],
    is_grubmaster: Optional[bool] = None
) -> bool:
    """Move a participant to a different eating group or remove from all groups"""
    # Get current membership
    result = await db.execute(
        select(EatingGroupMember)
        .where(EatingGroupMember.participant_id == participant_id)
    )
    current_member = result.scalar_one_or_none()
    
    if target_eating_group_id is None:
        # Remove from all groups
        if current_member:
            await db.delete(current_member)
            await db.commit()
        return True
    
    if current_member:
        # Update existing membership
        current_member.eating_group_id = target_eating_group_id
        if is_grubmaster is not None:
            current_member.is_grubmaster = is_grubmaster
        await db.commit()
    else:
        # Create new membership
        member = EatingGroupMember(
            eating_group_id=target_eating_group_id,
            participant_id=participant_id,
            is_grubmaster=is_grubmaster if is_grubmaster is not None else False,
        )
        db.add(member)
        await db.commit()
    
    return True


async def get_unassigned_participants(
    db: AsyncSession,
    outing_id: UUID
) -> List[Participant]:
    """Get participants in an outing who are not in any eating group"""
    from app.models.signup import Signup
    
    # Get all participants for the outing
    all_participants_result = await db.execute(
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
        .options(selectinload(Participant.eating_group_membership))
        .where(Signup.outing_id == outing_id)
    )
    all_participants = all_participants_result.scalars().all()
    
    # Filter to those without eating group membership
    unassigned = [p for p in all_participants if p.eating_group_membership is None]
    return unassigned


async def get_grubmaster_requests(
    db: AsyncSession,
    outing_id: UUID
) -> List[Participant]:
    """Get participants who have requested to be grubmaster"""
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
        .options(selectinload(Participant.eating_group_membership))
        .where(Signup.outing_id == outing_id)
        .where(Participant.grubmaster_interest == True)
    )
    return list(result.scalars().all())
