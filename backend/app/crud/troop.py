from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.models.troop import Troop, Patrol
from app.schemas.troop import TroopCreate, TroopUpdate, PatrolCreate, PatrolUpdate


# ==== Troops CRUD ====

async def get_troop(db: AsyncSession, troop_id: UUID) -> Optional[Troop]:
    result = await db.execute(
        select(Troop)
        .options(selectinload(Troop.patrols))
        .where(Troop.id == troop_id)
    )
    return result.scalar_one_or_none()


async def get_troops(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Troop]:
    query = (
        select(Troop)
        .options(selectinload(Troop.patrols))
        .order_by(Troop.number)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_troop(db: AsyncSession, troop_in: TroopCreate) -> Troop:
    troop = Troop(
        number=troop_in.number,
        charter_org=troop_in.charter_org,
        meeting_location=troop_in.meeting_location,
        meeting_day=troop_in.meeting_day,
        notes=troop_in.notes,
    )
    db.add(troop)
    await db.commit()
    # Re-query with patrols eagerly loaded to avoid lazy-loading in response serialization
    result = await db.execute(
        select(Troop).options(selectinload(Troop.patrols)).where(Troop.id == troop.id)
    )
    return result.scalar_one()


async def update_troop(db: AsyncSession, troop_id: UUID, troop_in: TroopUpdate) -> Optional[Troop]:
    troop = await get_troop(db, troop_id)
    if not troop:
        return None
    update_data = troop_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(troop, field, value)
    await db.commit()
    # Re-query to ensure patrols are eagerly loaded
    result = await db.execute(
        select(Troop).options(selectinload(Troop.patrols)).where(Troop.id == troop.id)
    )
    return result.scalar_one()


async def delete_troop(db: AsyncSession, troop_id: UUID) -> bool:
    troop = await get_troop(db, troop_id)
    if not troop:
        return False
    await db.delete(troop)
    await db.commit()
    return True


# ==== Patrols CRUD ====

async def get_patrol(db: AsyncSession, patrol_id: UUID) -> Optional[Patrol]:
    result = await db.execute(select(Patrol).where(Patrol.id == patrol_id))
    return result.scalar_one_or_none()


async def get_patrols_by_troop(db: AsyncSession, troop_id: UUID, skip: int = 0, limit: int = 100) -> List[Patrol]:
    query = (
        select(Patrol)
        .where(Patrol.troop_id == troop_id)
        .order_by(Patrol.name)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_patrol(db: AsyncSession, patrol_in: PatrolCreate) -> Patrol:
    # Ensure troop exists
    troop = await get_troop(db, patrol_in.troop_id)
    if not troop:
        raise ValueError("Troop not found")
    patrol = Patrol(
        troop_id=patrol_in.troop_id,
        name=patrol_in.name,
        is_active=patrol_in.is_active,
    )
    db.add(patrol)
    await db.commit()
    await db.refresh(patrol)
    return patrol


async def update_patrol(db: AsyncSession, patrol_id: UUID, patrol_in: PatrolUpdate) -> Optional[Patrol]:
    patrol = await get_patrol(db, patrol_id)
    if not patrol:
        return None
    update_data = patrol_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patrol, field, value)
    await db.commit()
    await db.refresh(patrol)
    return patrol


async def delete_patrol(db: AsyncSession, patrol_id: UUID) -> bool:
    patrol = await get_patrol(db, patrol_id)
    if not patrol:
        return False
    await db.delete(patrol)
    await db.commit()
    return True
