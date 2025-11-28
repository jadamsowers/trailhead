from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.models.tenting_group import TentingGroup, TentingGroupMember
from app.models.participant import Participant
from app.models.family import FamilyMember
from app.schemas.tenting_group import (
    TentingGroupCreate,
    TentingGroupUpdate,
    TentingGroupMemberCreate,
)


# ==== Tenting Groups CRUD ====

async def get_tenting_group(db: AsyncSession, tenting_group_id: UUID) -> Optional[TentingGroup]:
    """Get a single tenting group with members"""
    result = await db.execute(
        select(TentingGroup)
        .options(
            selectinload(TentingGroup.members)
            .selectinload(TentingGroupMember.participant)
            .selectinload(Participant.family_member)
        )
        .where(TentingGroup.id == tenting_group_id)
    )
    return result.scalar_one_or_none()


async def get_tenting_groups_by_outing(db: AsyncSession, outing_id: UUID) -> List[TentingGroup]:
    """Get all tenting groups for an outing"""
    result = await db.execute(
        select(TentingGroup)
        .options(
            selectinload(TentingGroup.members)
            .selectinload(TentingGroupMember.participant)
            .selectinload(Participant.family_member)
        )
        .where(TentingGroup.outing_id == outing_id)
        .order_by(TentingGroup.name)
    )
    return list(result.scalars().all())


async def create_tenting_group(
    db: AsyncSession,
    tenting_group_in: TentingGroupCreate
) -> TentingGroup:
    """Create a new tenting group"""
    tenting_group = TentingGroup(
        outing_id=tenting_group_in.outing_id,
        name=tenting_group_in.name,
        notes=tenting_group_in.notes,
    )
    db.add(tenting_group)
    await db.flush()
    
    # Add initial members if provided
    if tenting_group_in.member_ids:
        for participant_id in tenting_group_in.member_ids:
            member = TentingGroupMember(
                tenting_group_id=tenting_group.id,
                participant_id=participant_id,
            )
            db.add(member)
    
    await db.commit()
    
    # Re-fetch with relationships
    return await get_tenting_group(db, tenting_group.id)


async def update_tenting_group(
    db: AsyncSession,
    tenting_group_id: UUID,
    tenting_group_in: TentingGroupUpdate
) -> Optional[TentingGroup]:
    """Update a tenting group"""
    tenting_group = await get_tenting_group(db, tenting_group_id)
    if not tenting_group:
        return None
    
    update_data = tenting_group_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenting_group, field, value)
    
    await db.commit()
    return await get_tenting_group(db, tenting_group_id)


async def delete_tenting_group(db: AsyncSession, tenting_group_id: UUID) -> bool:
    """Delete a tenting group"""
    tenting_group = await get_tenting_group(db, tenting_group_id)
    if not tenting_group:
        return False
    
    await db.delete(tenting_group)
    await db.commit()
    return True


# ==== Tenting Group Members CRUD ====

async def add_member_to_tenting_group(
    db: AsyncSession,
    tenting_group_id: UUID,
    member_in: TentingGroupMemberCreate
) -> Optional[TentingGroupMember]:
    """Add a participant to a tenting group"""
    # Check if participant is already in any tenting group
    existing_result = await db.execute(
        select(TentingGroupMember)
        .where(TentingGroupMember.participant_id == member_in.participant_id)
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        # Remove from current group
        await db.delete(existing)
    
    member = TentingGroupMember(
        tenting_group_id=tenting_group_id,
        participant_id=member_in.participant_id,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


async def remove_member_from_tenting_group(
    db: AsyncSession,
    participant_id: UUID
) -> bool:
    """Remove a participant from their tenting group"""
    result = await db.execute(
        select(TentingGroupMember)
        .where(TentingGroupMember.participant_id == participant_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        return False
    
    await db.delete(member)
    await db.commit()
    return True


async def move_participant_to_tenting_group(
    db: AsyncSession,
    participant_id: UUID,
    target_tenting_group_id: Optional[UUID]
) -> bool:
    """Move a participant to a different tenting group or remove from all groups"""
    # Get current membership
    result = await db.execute(
        select(TentingGroupMember)
        .where(TentingGroupMember.participant_id == participant_id)
    )
    current_member = result.scalar_one_or_none()
    
    if target_tenting_group_id is None:
        # Remove from all groups
        if current_member:
            await db.delete(current_member)
            await db.commit()
        return True
    
    if current_member:
        # Update existing membership
        current_member.tenting_group_id = target_tenting_group_id
        await db.commit()
    else:
        # Create new membership
        member = TentingGroupMember(
            tenting_group_id=target_tenting_group_id,
            participant_id=participant_id,
        )
        db.add(member)
        await db.commit()
    
    return True


async def get_unassigned_scouts(
    db: AsyncSession,
    outing_id: UUID
) -> List[Participant]:
    """Get scouts in an outing who are not in any tenting group (excluding adults)"""
    from app.models.signup import Signup
    
    # Get all participants for the outing
    all_participants_result = await db.execute(
        select(Participant)
        .join(Signup, Participant.signup_id == Signup.id)
        .options(
            selectinload(Participant.family_member)
        )
        .options(selectinload(Participant.tenting_group_membership))
        .where(Signup.outing_id == outing_id)
    )
    all_participants = all_participants_result.scalars().all()
    
    # Filter to scouts (non-adults) without tenting group membership
    unassigned = [
        p for p in all_participants 
        if p.tenting_group_membership is None 
        and p.family_member 
        and p.family_member.member_type != 'adult'
    ]
    return unassigned


async def get_all_scouts_for_outing(
    db: AsyncSession,
    outing_id: UUID
) -> List[Participant]:
    """Get all scouts (non-adults) in an outing"""
    from app.models.signup import Signup
    
    result = await db.execute(
        select(Participant)
        .join(Signup, Participant.signup_id == Signup.id)
        .options(
            selectinload(Participant.family_member)
        )
        .options(selectinload(Participant.tenting_group_membership))
        .where(Signup.outing_id == outing_id)
    )
    all_participants = result.scalars().all()
    
    # Filter to scouts (non-adults) only
    scouts = [
        p for p in all_participants 
        if p.family_member 
        and p.family_member.member_type != 'adult'
    ]
    return scouts
