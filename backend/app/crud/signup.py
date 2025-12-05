from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.models.signup import Signup
from app.models.participant import Participant
from app.models.family import FamilyMember
from app.schemas.signup import SignupCreate, SignupUpdate
from app.services.change_log import record_change, compute_payload_hash


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
    
    # Create grubmaster request lookup
    grubmaster_lookup = {}
    if signup.grubmaster_requests:
        for request in signup.grubmaster_requests:
            grubmaster_lookup[request.family_member_id] = request
    
    # Create signup
    db_signup = Signup(
        outing_id=signup.outing_id,
        family_contact_name=signup.family_contact.emergency_contact_name,
        family_contact_email=signup.family_contact.email,
        family_contact_phone=signup.family_contact.phone,
    )
    db.add(db_signup)
    await db.flush()
    # Record signup creation
    payload_hash = compute_payload_hash(db_signup, ["outing_id", "family_contact_email", "family_contact_name"]) 
    await record_change(db, entity_type="signup", entity_id=db_signup.id, op_type="create", payload_hash=payload_hash)
    
    # Create participant records linking to family members
    for family_member in family_members:
        grubmaster_request = grubmaster_lookup.get(family_member.id)
        db_participant = Participant(
            signup_id=db_signup.id,
            family_member_id=family_member.id,
            grubmaster_interest=grubmaster_request.grubmaster_interest if grubmaster_request else False,
            grubmaster_reason=grubmaster_request.grubmaster_reason if grubmaster_request else None,
        )
        db.add(db_participant)
    
    await db.flush()
    payload_hash = compute_payload_hash(db_signup, ["outing_id", "family_contact_email", "family_contact_name"]) 
    await record_change(db, entity_type="signup", entity_id=db_signup.id, op_type="update", payload_hash=payload_hash)
    try:
        await db.commit()
        await db.refresh(db_signup)
    except Exception:
        await db.rollback()
        # Check if signup exists (race condition)
        query = select(Signup).where(
            Signup.outing_id == signup.outing_id,
            Signup.family_contact_email == signup.family_contact.email
        )
        result = await db.execute(query)
        existing_signup = result.scalar_one_or_none()
        if existing_signup:
            return existing_signup
        raise

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
        .where(Signup.id == db_signup.id)
    )
    return result.scalar_one()


async def update_signup(db: AsyncSession, signup_id: UUID, signup_update: SignupUpdate) -> Optional[Signup]:
    """Update a signup's contact info and/or participants"""
    db_signup = await get_signup(db, signup_id)
    if not db_signup:
        return None
    
    # Update contact info if provided
    if signup_update.family_contact:
        db_signup.family_contact_name = signup_update.family_contact.emergency_contact_name
        db_signup.family_contact_email = signup_update.family_contact.email
        db_signup.family_contact_phone = signup_update.family_contact.phone
    
    # Update participants if provided
    if signup_update.family_member_ids is not None:
        # Verify all family members exist
        family_members = []
        for family_member_id in signup_update.family_member_ids:
            result = await db.execute(
                select(FamilyMember).where(FamilyMember.id == family_member_id)
            )
            family_member = result.scalar_one_or_none()
            if not family_member:
                raise ValueError(f"Family member with ID {family_member_id} not found")
            family_members.append(family_member)
        
        # Create grubmaster request lookup
        grubmaster_lookup = {}
        if signup_update.grubmaster_requests:
            for request in signup_update.grubmaster_requests:
                grubmaster_lookup[request.family_member_id] = request
        
        # Delete existing participants
        for participant in db_signup.participants:
            await db.delete(participant)
        await db.flush()
        
        # Create new participant records
        for family_member in family_members:
            grubmaster_request = grubmaster_lookup.get(family_member.id)
            db_participant = Participant(
                signup_id=db_signup.id,
                family_member_id=family_member.id,
                grubmaster_interest=grubmaster_request.grubmaster_interest if grubmaster_request else False,
                grubmaster_reason=grubmaster_request.grubmaster_reason if grubmaster_request else None,
            )
            db.add(db_participant)
    elif signup_update.grubmaster_requests:
        # Update grubmaster requests for existing participants
        grubmaster_lookup = {r.family_member_id: r for r in signup_update.grubmaster_requests}
        for participant in db_signup.participants:
            if participant.family_member_id in grubmaster_lookup:
                request = grubmaster_lookup[participant.family_member_id]
                participant.grubmaster_interest = request.grubmaster_interest
                participant.grubmaster_reason = request.grubmaster_reason
    
    await db.flush()
    payload_hash = compute_payload_hash(db_signup, ["outing_id", "family_contact_email", "family_contact_name"]) 
    await record_change(db, entity_type="signup", entity_id=db_signup.id, op_type="update", payload_hash=payload_hash)
    await db.commit()
    await db.refresh(db_signup)

    # Reload with relationships
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
        .where(Signup.id == signup_id)
    )
    return result.scalar_one()


async def delete_signup(db: AsyncSession, signup_id: UUID) -> bool:
    """Delete a signup and all associated participants"""
    db_signup = await get_signup(db, signup_id)
    if not db_signup:
        return False
    
    await record_change(db, entity_type="signup", entity_id=db_signup.id, op_type="delete")
    await db.delete(db_signup)
    await db.commit()
    return True