from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.models.signup import Signup
from app.models.participant import Participant, DietaryRestriction, Allergy
from app.models.family import FamilyMember
from app.schemas.signup import SignupCreate


async def get_signup(db: AsyncSession, signup_id: UUID) -> Optional[Signup]:
    """Get a signup by ID with all participants and their family member data"""
    result = await db.execute(
        select(Signup)
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.family_member)
            .selectinload(FamilyMember.dietary_preferences)
        )
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.family_member)
            .selectinload(FamilyMember.allergies)
        )
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.dietary_restrictions)
        )
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.allergies)
        )
        .where(Signup.id == signup_id)
    )
    return result.scalar_one_or_none()


async def get_outing_signups(db: AsyncSession, outing_id: UUID) -> list[Signup]:
    """Get all signups for a specific outing"""
    result = await db.execute(
        select(Signup)
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.family_member)
            .selectinload(FamilyMember.dietary_preferences)
        )
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.family_member)
            .selectinload(FamilyMember.allergies)
        )
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.dietary_restrictions)
        )
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.allergies)
        )
        .where(Signup.outing_id == outing_id)
        .order_by(Signup.created_at.desc())
    )
    return result.scalars().all()


async def create_signup(db: AsyncSession, signup: SignupCreate) -> Signup:
    """Create a new signup with family member references"""
    # Verify all family members exist
    family_members = []
    for family_member_id in signup.family_member_ids:
        result = await db.execute(
            select(FamilyMember).where(FamilyMember.id == family_member_id)
        )
        family_member = result.scalar_one_or_none()
        if not family_member:
            raise ValueError(f"Family member with ID {family_member_id} not found")
        family_members.append(family_member)
    
    # Create signup
    db_signup = Signup(
        outing_id=signup.outing_id,
        family_contact_name=signup.family_contact.emergency_contact_name,
        family_contact_email=signup.family_contact.email,
        family_contact_phone=signup.family_contact.phone,
    )
    db.add(db_signup)
    await db.flush()
    
    # Create participant records linking to family members
    for family_member in family_members:
        db_participant = Participant(
            signup_id=db_signup.id,
            family_member_id=family_member.id
        )
        db.add(db_participant)
    
    await db.flush()
    await db.refresh(db_signup)
    
    # Load relationships
    result = await db.execute(
        select(Signup)
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.family_member)
            .selectinload(FamilyMember.dietary_preferences)
        )
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.family_member)
            .selectinload(FamilyMember.allergies)
        )
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.dietary_restrictions)
        )
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.allergies)
        )
        .where(Signup.id == db_signup.id)
    )
    return result.scalar_one()


async def delete_signup(db: AsyncSession, signup_id: UUID) -> bool:
    """Delete a signup and all associated participants"""
    db_signup = await get_signup(db, signup_id)
    if not db_signup:
        return False
    
    await db.delete(db_signup)
    await db.flush()
    return True