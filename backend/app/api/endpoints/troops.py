from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud import troop as crud_troop
from sqlalchemy.exc import IntegrityError
from app.schemas.troop import (
    TroopCreate,
    TroopUpdate,
    TroopResponse,
    TroopListResponse,
    PatrolCreate,
    PatrolUpdate,
    PatrolResponse,
    PatrolListResponse,
)

router = APIRouter()


# ===== Troops =====

@router.get("/troops", response_model=TroopListResponse)
async def list_troops(
    skip: int = 0,
    limit: int = Query(100, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    troops = await crud_troop.get_troops(db, skip=skip, limit=limit)
    return TroopListResponse(troops=troops, total=len(troops))


@router.post("/troops", response_model=TroopResponse, status_code=status.HTTP_201_CREATED)
async def create_troop(
    troop_in: TroopCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create troops")
    try:
        troop = await crud_troop.create_troop(db, troop_in)
    except IntegrityError as e:
        # Unique constraint on troop.number — return 409 Conflict with message
        # Log details are handled by global error handlers; surface a clear client error here
        raise HTTPException(status_code=409, detail="Troop with that number already exists")
    return troop


@router.get("/troops/{troop_id}", response_model=TroopResponse)
async def get_troop(
    troop_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    troop = await crud_troop.get_troop(db, troop_id)
    if not troop:
        raise HTTPException(status_code=404, detail="Troop not found")
    return troop


@router.put("/troops/{troop_id}", response_model=TroopResponse)
async def update_troop(
    troop_id: UUID,
    troop_in: TroopUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update troops")
    troop = await crud_troop.update_troop(db, troop_id, troop_in)
    if not troop:
        raise HTTPException(status_code=404, detail="Troop not found")
    return troop


@router.delete("/troops/{troop_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_troop(
    troop_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete troops")
    success = await crud_troop.delete_troop(db, troop_id)
    if not success:
        raise HTTPException(status_code=404, detail="Troop not found")


# ===== Patrols =====

@router.get("/troops/{troop_id}/patrols", response_model=PatrolListResponse)
async def list_patrols(
    troop_id: UUID,
    skip: int = 0,
    limit: int = Query(100, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    troop = await crud_troop.get_troop(db, troop_id)
    if not troop:
        raise HTTPException(status_code=404, detail="Troop not found")
    patrols = await crud_troop.get_patrols_by_troop(db, troop_id, skip=skip, limit=limit)
    return PatrolListResponse(patrols=patrols, total=len(patrols))


@router.post("/patrols", response_model=PatrolResponse, status_code=status.HTTP_201_CREATED)
async def create_patrol(
    patrol_in: PatrolCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create patrols")
    try:
        patrol = await crud_troop.create_patrol(db, patrol_in)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return patrol


@router.put("/patrols/{patrol_id}", response_model=PatrolResponse)
async def update_patrol(
    patrol_id: UUID,
    patrol_in: PatrolUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update patrols")
    patrol = await crud_troop.update_patrol(db, patrol_id, patrol_in)
    if not patrol:
        raise HTTPException(status_code=404, detail="Patrol not found")
    return patrol


@router.delete("/patrols/{patrol_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patrol(
    patrol_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete patrols")
    success = await crud_troop.delete_patrol(db, patrol_id)
    if not success:
        raise HTTPException(status_code=404, detail="Patrol not found")
