from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.models.signup import Signup
from app.models.participant import Participant, DietaryRestriction, Allergy
from app.schemas.signup import SignupCreate


async def get_signup(db: AsyncSession, signup_id: UUID) -> Optional[Signup]:
    """Get a signup by ID with all participants"""
    result = await db.execute(
        select(Signup)
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


async def get_trip_signups(db: AsyncSession, trip_id: UUID) -> list[Signup]:
    """Get all signups for a specific trip"""
    result = await db.execute(
        select(Signup)
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.dietary_restrictions)
        )
        .options(
            selectinload(Signup.participants)
            .selectinload(Participant.allergies)
        )
        .where(Signup.trip_id == trip_id)
        .order_by(Signup.created_at.desc())
    )
    return result.scalars().all()


async def create_signup(db: AsyncSession, signup: SignupCreate) -> Signup:
    """Create a new signup with participants"""
    # Create signup
    db_signup = Signup(
        trip_id=signup.trip_id,
        family_contact_name=signup.family_contact.emergency_contact_name,
        family_contact_email=signup.family_contact.email,
        family_contact_phone=signup.family_contact.phone,
    )
    db.add(db_signup)
    await db.flush()
    
    # Create participants
    for participant_data in signup.participants:
        # Determine if adult based on participant_type
        is_adult = participant_data.participant_type == 'adult'
        
        db_participant = Participant(
            signup_id=db_signup.id,
            name=participant_data.full_name,
            age=participant_data.age if participant_data.age else 0,
            participant_type=participant_data.participant_type,
            is_adult=is_adult,
            gender=participant_data.gender,
            troop_number=participant_data.troop_number,
            patrol_name=participant_data.patrol,
            has_youth_protection=participant_data.has_youth_protection_training,
            vehicle_capacity=participant_data.vehicle_capacity if participant_data.vehicle_capacity else 0,
            medical_notes=None,
        )
        db.add(db_participant)
        await db.flush()
        
        # Add dietary restrictions
        for restriction in participant_data.dietary_restrictions:
            db_restriction = DietaryRestriction(
                participant_id=db_participant.id,
                restriction_type=restriction.restriction_type
            )
            db.add(db_restriction)
        
        # Add allergies
        for allergy in participant_data.allergies:
            db_allergy = Allergy(
                participant_id=db_participant.id,
                allergy_type=allergy.allergy_type
            )
            db.add(db_allergy)
    
    await db.flush()
    await db.refresh(db_signup)
    
    # Load relationships
    result = await db.execute(
        select(Signup)
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