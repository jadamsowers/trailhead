"""Async test data factories to reduce duplication in tests.

Usage: import the needed factory and pass the active AsyncSession (db_session fixture)
then await the factory to get a persisted model instance.
"""
from __future__ import annotations
import uuid
from datetime import date, timedelta
from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.outing import Outing
from app.models.signup import Signup
from app.models.participant import Participant, DietaryRestriction, Allergy
from app.models.requirement import RankRequirement, MeritBadge, OutingRequirement, OutingMeritBadge
from app.core.security import get_password_hash

# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
async def create_user(
    db: AsyncSession,
    *,
    email: str | None = None,
    role: str = "admin",
    full_name: str = "Factory User",
    password: str = "testpassword123",
    is_active: bool = True,
) -> User:
    user = User(
        id=uuid.uuid4(),
        email=email or f"factory_{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=get_password_hash(password),
        full_name=full_name,
        role=role,
        is_active=is_active,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

# ---------------------------------------------------------------------------
# Outing
# ---------------------------------------------------------------------------
async def create_outing(
    db: AsyncSession,
    *,
    name: str | None = None,
    days_from_now: int = 30,
    duration_days: int = 2,
    location: str = "Factory Location",
    description: str = "Factory outing description",
    max_participants: int = 20,
    is_overnight: bool = True,
) -> Outing:
    outing_date = date.today() + timedelta(days=days_from_now)
    end_date = outing_date + timedelta(days=duration_days) if is_overnight else None
    outing = Outing(
        id=uuid.uuid4(),
        name=name or f"Factory Outing {uuid.uuid4().hex[:6]}",
        outing_date=outing_date,
        end_date=end_date,
        location=location,
        description=description,
        max_participants=max_participants,
        is_overnight=is_overnight,
    )
    db.add(outing)
    await db.commit()
    await db.refresh(outing)
    return outing

# ---------------------------------------------------------------------------
# Rank Requirement / Merit Badge
# ---------------------------------------------------------------------------
async def create_rank_requirement(
    db: AsyncSession,
    *,
    rank: str = "Tenderfoot",
    requirement_number: str | None = None,
    requirement_text: str | None = None,
    keywords: Sequence[str] | None = None,
    category: str | None = "Camping",
) -> RankRequirement:
    req = RankRequirement(
        id=uuid.uuid4(),
        rank=rank,
        requirement_number=requirement_number or f"{uuid.uuid4().hex[:2]}",
        requirement_text=requirement_text or "Factory requirement text",
        keywords=list(keywords) if keywords else ["camping", "skills"],
        category=category,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return req

async def create_merit_badge(
    db: AsyncSession,
    *,
    name: str | None = None,
    description: str = "Factory merit badge description",
    keywords: Sequence[str] | None = None,
) -> MeritBadge:
    badge = MeritBadge(
        id=uuid.uuid4(),
        name=name or f"Badge-{uuid.uuid4().hex[:6]}",
        description=description,
        keywords=list(keywords) if keywords else ["outdoor", "skills"],
    )
    db.add(badge)
    await db.commit()
    await db.refresh(badge)
    return badge

# ---------------------------------------------------------------------------
# Signup + Participants
# ---------------------------------------------------------------------------
async def create_signup(
    db: AsyncSession,
    *,
    outing: Outing,
    family_contact_name: str = "Factory Family",
    family_contact_email: str | None = None,
    family_contact_phone: str = "555-0000",
) -> Signup:
    signup = Signup(
        id=uuid.uuid4(),
        outing_id=outing.id,
        family_contact_name=family_contact_name,
        family_contact_email=family_contact_email or f"family_{uuid.uuid4().hex[:6]}@test.com",
        family_contact_phone=family_contact_phone,
    )
    db.add(signup)
    await db.commit()
    await db.refresh(signup)
    return signup

async def add_participant(
    db: AsyncSession,
    *,
    signup: Signup,
    name: str | None = None,
    age: int = 14,
    participant_type: str = "scout",
    is_adult: bool | None = None,
    gender: str = "male",
    troop_number: str | None = "123",
    patrol_name: str | None = "Eagle",
    has_youth_protection: bool = False,
    vehicle_capacity: int = 0,
    dietary_restrictions: Sequence[str] | None = None,
    allergies: Sequence[str] | None = None,
    medical_notes: str | None = None,
) -> Participant:
    if is_adult is None:
        is_adult = participant_type == "adult"
    participant = Participant(
        id=uuid.uuid4(),
        signup_id=signup.id,
        name=name or f"Participant {uuid.uuid4().hex[:5]}",
        age=age,
        participant_type=participant_type,
        is_adult=is_adult,
        gender=gender,
        troop_number=troop_number if not is_adult else None,
        patrol_name=patrol_name if not is_adult else None,
        has_youth_protection=has_youth_protection,
        vehicle_capacity=vehicle_capacity,
        medical_notes=medical_notes,
    )
    db.add(participant)
    await db.flush()

    # Add restrictions / allergies if provided
    if dietary_restrictions:
        for r in dietary_restrictions:
            db.add(
                DietaryRestriction(
                    id=uuid.uuid4(),
                    participant_id=participant.id,
                    restriction_type=r,
                )
            )
    if allergies:
        for a in allergies:
            db.add(
                Allergy(
                    id=uuid.uuid4(),
                    participant_id=participant.id,
                    allergy_type=a,
                )
            )
    await db.commit()
    await db.refresh(participant)
    return participant

# ---------------------------------------------------------------------------
# Outing Requirement / Merit Badge association
# ---------------------------------------------------------------------------
async def associate_requirement_with_outing(
    db: AsyncSession,
    *,
    outing: Outing,
    requirement: RankRequirement,
    notes: str | None = None,
) -> OutingRequirement:
    assoc = OutingRequirement(
        id=uuid.uuid4(),
        outing_id=outing.id,
        rank_requirement_id=requirement.id,
        notes=notes,
    )
    db.add(assoc)
    await db.commit()
    await db.refresh(assoc)
    return assoc

async def associate_merit_badge_with_outing(
    db: AsyncSession,
    *,
    outing: Outing,
    badge: MeritBadge,
    notes: str | None = None,
) -> OutingMeritBadge:
    assoc = OutingMeritBadge(
        id=uuid.uuid4(),
        outing_id=outing.id,
        merit_badge_id=badge.id,
        notes=notes,
    )
    db.add(assoc)
    await db.commit()
    await db.refresh(assoc)
    return assoc
