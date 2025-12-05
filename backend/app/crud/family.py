from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.models.family import FamilyMember, FamilyMemberDietaryPreference, FamilyMemberAllergy
from app.models.participant import Participant
from app.models.signup import Signup
from app.schemas.family import FamilyMemberCreate, FamilyMemberUpdate
from app.services.change_log import record_change, compute_payload_hash


async def get_family_members_for_user(db: AsyncSession, user_id: UUID) -> List[FamilyMember]:
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.user_id == user_id)
        .options(
            selectinload(FamilyMember.dietary_preferences),
            selectinload(FamilyMember.allergies)
        )
        .order_by(FamilyMember.created_at)
    )
    return result.scalars().all()


async def get_family_member(db: AsyncSession, member_id: UUID, user_id: Optional[UUID] = None) -> Optional[FamilyMember]:
    stmt = select(FamilyMember).where(FamilyMember.id == member_id)
    if user_id is not None:
        stmt = stmt.where(FamilyMember.user_id == user_id)
    stmt = stmt.options(
        selectinload(FamilyMember.dietary_preferences),
        selectinload(FamilyMember.allergies)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_family_member(db: AsyncSession, user_id: UUID, member_data: FamilyMemberCreate) -> FamilyMember:
    member = FamilyMember(
        user_id=user_id,
        name=member_data.name,
        member_type=member_data.member_type,
        date_of_birth=member_data.date_of_birth,
        troop_number=member_data.troop_number,
        patrol_name=member_data.patrol_name,
        has_youth_protection=member_data.has_youth_protection,
        youth_protection_expiration=member_data.youth_protection_expiration,
        vehicle_capacity=member_data.vehicle_capacity,
        medical_notes=member_data.medical_notes,
    )
    db.add(member)
    await db.flush()
    payload_hash = compute_payload_hash(member, ["name", "member_type", "troop_number", "patrol_name"]) 
    await record_change(db, entity_type="family_member", entity_id=member.id, op_type="create", payload_hash=payload_hash)

    for pref in member_data.dietary_preferences:
        dietary_pref = FamilyMemberDietaryPreference(
            family_member_id=member.id,
            preference=pref
        )
        db.add(dietary_pref)

    for allergy_data in member_data.allergies:
        allergy = FamilyMemberAllergy(
            family_member_id=member.id,
            allergy=allergy_data.allergy,
            severity=allergy_data.severity
        )
        db.add(allergy)

    await db.commit()
    await db.refresh(member)

    # Reload with relationships
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.id == member.id)
        .options(
            selectinload(FamilyMember.dietary_preferences),
            selectinload(FamilyMember.allergies)
        )
    )
    return result.scalar_one()


async def update_family_member(db: AsyncSession, member_id: UUID, user_id: UUID, member_data: FamilyMemberUpdate) -> Optional[FamilyMember]:
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.id == member_id, FamilyMember.user_id == user_id)
        .options(
            selectinload(FamilyMember.dietary_preferences),
            selectinload(FamilyMember.allergies)
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        return None

    update_data = member_data.model_dump(exclude_unset=True, exclude={'dietary_preferences', 'allergies'})
    for field, value in update_data.items():
        setattr(member, field, value)

    # Update dietary preferences if provided
    if member_data.dietary_preferences is not None:
        # Delete existing
        for pref in list(member.dietary_preferences):
            await db.delete(pref)
        # Add new
        for pref in member_data.dietary_preferences:
            dietary_pref = FamilyMemberDietaryPreference(
                family_member_id=member.id,
                preference=pref
            )
            db.add(dietary_pref)

    # Update allergies if provided
    if member_data.allergies is not None:
        for allergy in list(member.allergies):
            await db.delete(allergy)
        for allergy_data in member_data.allergies:
            allergy = FamilyMemberAllergy(
                family_member_id=member.id,
                allergy=allergy_data.allergy,
                severity=allergy_data.severity
            )
            db.add(allergy)

    await db.flush()
    payload_hash = compute_payload_hash(member, ["name", "member_type", "troop_number", "patrol_name"]) 
    await record_change(db, entity_type="family_member", entity_id=member.id, op_type="update", payload_hash=payload_hash)
    await db.commit()
    await db.refresh(member)

    # Reload with relationships
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.id == member.id)
        .options(
            selectinload(FamilyMember.dietary_preferences),
            selectinload(FamilyMember.allergies)
        )
    )
    return result.scalar_one()


async def delete_family_member(db: AsyncSession, member_id: UUID, user_id: UUID) -> bool:
    result = await db.execute(
        select(FamilyMember).where(FamilyMember.id == member_id, FamilyMember.user_id == user_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        return False

    # Get signups that this family member is part of before deletion
    participant_signups_result = await db.execute(
        select(Participant.signup_id).where(Participant.family_member_id == member.id)
    )
    signup_ids = participant_signups_result.scalars().all()

    # Explicitly delete participants first to ensure cascade works in tests
    if signup_ids:
        # Fetch participants to delete them via ORM to keep session in sync
        participants_result = await db.execute(
            select(Participant).where(Participant.family_member_id == member.id)
        )
        participants = participants_result.scalars().all()
        for participant in participants:
            await db.execute(delete(Participant).where(Participant.id == participant.id))
        
        # Force expiration of signups to ensure fresh data in session
        for signup_id in set(signup_ids):
            signup = await db.get(Signup, signup_id)
            if signup:
                db.expire(signup, ['participants'])

    await record_change(db, entity_type="family_member", entity_id=member.id, op_type="delete")
    await db.delete(member)
    await db.flush()

    # Check for empty signups and delete them
    if signup_ids:
        for signup_id in set(signup_ids):
            remaining_result = await db.execute(
                select(Participant).where(Participant.signup_id == signup_id)
            )
            remaining = remaining_result.scalars().all()
            if not remaining:
                signup_result = await db.execute(select(Signup).where(Signup.id == signup_id))
                signup = signup_result.scalar_one_or_none()
                if signup:
                    await db.delete(signup)

    await db.commit()
    return True
