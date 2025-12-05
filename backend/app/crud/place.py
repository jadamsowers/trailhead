from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID

from app.models.place import Place
from app.schemas.place import PlaceCreate, PlaceUpdate
from app.services.change_log import record_change, compute_payload_hash


async def get_place(db: AsyncSession, place_id: UUID) -> Optional[Place]:
    """Get a place by ID"""
    result = await db.execute(select(Place).where(Place.id == place_id))
    return result.scalar_one_or_none()


async def get_places(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
) -> List[Place]:
    """Get all places with optional search filter"""
    query = select(Place)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Place.name.ilike(search_pattern)) |
            (Place.address.ilike(search_pattern))
        )
    
    query = query.order_by(Place.name).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_place(db: AsyncSession, place: PlaceCreate) -> Place:
    """Create a new place"""
    # Auto-generate Google Maps URL if address is provided
    google_maps_url = place.google_maps_url
    if not google_maps_url and place.address:
        google_maps_url = Place.generate_google_maps_url(place.address)
    
    db_place = Place(
        name=place.name,
        address=place.address,
        google_maps_url=google_maps_url
    )
    db.add(db_place)
    await db.flush()  # Flush to get the ID before commit
    payload_hash = compute_payload_hash(db_place, ["name", "address", "google_maps_url"]) 
    await record_change(db, entity_type="place", entity_id=db_place.id, op_type="create", payload_hash=payload_hash)
    await db.commit()
    await db.refresh(db_place)
    return db_place


async def update_place(db: AsyncSession, place_id: UUID, place: PlaceUpdate) -> Optional[Place]:
    """Update a place"""
    db_place = await get_place(db, place_id)
    if not db_place:
        return None
    
    update_data = place.model_dump(exclude_unset=True)
    
    # If address is being updated and google_maps_url is not explicitly provided,
    # regenerate the URL
    if "address" in update_data and "google_maps_url" not in update_data:
        update_data["google_maps_url"] = Place.generate_google_maps_url(update_data["address"])
    
    for field, value in update_data.items():
        setattr(db_place, field, value)
    
    await db.flush()
    payload_hash = compute_payload_hash(db_place, ["name", "address", "google_maps_url"]) 
    await record_change(db, entity_type="place", entity_id=db_place.id, op_type="update", payload_hash=payload_hash)
    await db.commit()
    await db.refresh(db_place)
    return db_place


async def delete_place(db: AsyncSession, place_id: UUID) -> bool:
    """Delete a place"""
    db_place = await get_place(db, place_id)
    if not db_place:
        return False
    
    await record_change(db, entity_type="place", entity_id=db_place.id, op_type="delete")
    await db.delete(db_place)
    await db.commit()
    return True


async def search_places_by_name(db: AsyncSession, name: str, limit: int = 10) -> List[Place]:
    """Search places by name (for autocomplete)"""
    search_pattern = f"%{name}%"
    query = (
        select(Place)
        .where(Place.name.ilike(search_pattern))
        .order_by(Place.name)
        .limit(limit)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_or_create_place(db: AsyncSession, name: str, address: str) -> Place:
    """Get existing place or create new one if it doesn't exist"""
    # Try to find existing place with same name and address
    query = select(Place).where(Place.name == name, Place.address == address)
    result = await db.execute(query)
    existing = result.scalar_one_or_none()
    
    if existing:
        return existing
    
    # Create new place
    place_create = PlaceCreate(name=name, address=address)
    return await create_place(db, place_create)
