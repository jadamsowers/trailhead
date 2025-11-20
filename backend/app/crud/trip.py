from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.models.trip import Trip
from app.models.signup import Signup
from app.models.participant import Participant
from app.schemas.trip import TripCreate, TripUpdate


async def get_trip(db: AsyncSession, trip_id: UUID) -> Optional[Trip]:
    """Get a trip by ID with all signups and participants"""
    result = await db.execute(
        select(Trip)
        .options(
            selectinload(Trip.signups).selectinload(Signup.participants)
        )
        .where(Trip.id == trip_id)
    )
    return result.scalar_one_or_none()


async def get_trips(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Trip]:
    """Get all trips with pagination"""
    result = await db.execute(
        select(Trip)
        .options(
            selectinload(Trip.signups).selectinload(Signup.participants)
        )
        .offset(skip)
        .limit(limit)
        .order_by(Trip.trip_date.desc())
    )
    return result.scalars().all()


async def get_available_trips(db: AsyncSession) -> list[Trip]:
    """Get trips that still have available spots"""
    result = await db.execute(
        select(Trip)
        .options(
            selectinload(Trip.signups).selectinload(Signup.participants)
        )
        .order_by(Trip.trip_date.asc())
    )
    trips = result.scalars().all()
    # Filter trips with available spots
    return [trip for trip in trips if not trip.is_full]


async def create_trip(db: AsyncSession, trip: TripCreate) -> Trip:
    """Create a new trip"""
    db_trip = Trip(**trip.model_dump())
    db.add(db_trip)
    await db.flush()
    await db.refresh(db_trip, ['signups'])
    return db_trip


async def update_trip(db: AsyncSession, trip_id: UUID, trip: TripUpdate) -> Optional[Trip]:
    """Update an existing trip"""
    db_trip = await get_trip(db, trip_id)
    if not db_trip:
        return None
    
    for key, value in trip.model_dump().items():
        setattr(db_trip, key, value)
    
    await db.flush()
    await db.refresh(db_trip)
    return db_trip


async def delete_trip(db: AsyncSession, trip_id: UUID) -> bool:
    """Delete a trip (only if no signups)"""
    db_trip = await get_trip(db, trip_id)
    if not db_trip:
        return False
    
    if db_trip.signups:
        return False  # Cannot delete trip with signups
    
    await db.delete(db_trip)
    await db.flush()
    return True


async def get_trip_count(db: AsyncSession) -> int:
    """Get total number of trips"""
    result = await db.execute(select(func.count(Trip.id)))
    return result.scalar_one()