from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.models.place import Place
from app.schemas.place import PlaceCreate, PlaceUpdate


def get_place(db: Session, place_id: UUID) -> Optional[Place]:
    """Get a place by ID"""
    return db.query(Place).filter(Place.id == place_id).first()


def get_places(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
) -> List[Place]:
    """Get all places with optional search filter"""
    query = db.query(Place)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Place.name.ilike(search_pattern)) | 
            (Place.address.ilike(search_pattern))
        )
    
    return query.order_by(Place.name).offset(skip).limit(limit).all()


def create_place(db: Session, place: PlaceCreate) -> Place:
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
    db.commit()
    db.refresh(db_place)
    return db_place


def update_place(db: Session, place_id: UUID, place: PlaceUpdate) -> Optional[Place]:
    """Update a place"""
    db_place = get_place(db, place_id)
    if not db_place:
        return None
    
    update_data = place.dict(exclude_unset=True)
    
    # If address is being updated and google_maps_url is not explicitly provided,
    # regenerate the URL
    if "address" in update_data and "google_maps_url" not in update_data:
        update_data["google_maps_url"] = Place.generate_google_maps_url(update_data["address"])
    
    for field, value in update_data.items():
        setattr(db_place, field, value)
    
    db.commit()
    db.refresh(db_place)
    return db_place


def delete_place(db: Session, place_id: UUID) -> bool:
    """Delete a place"""
    db_place = get_place(db, place_id)
    if not db_place:
        return False
    
    db.delete(db_place)
    db.commit()
    return True


def search_places_by_name(db: Session, name: str, limit: int = 10) -> List[Place]:
    """Search places by name (for autocomplete)"""
    search_pattern = f"%{name}%"
    return (
        db.query(Place)
        .filter(Place.name.ilike(search_pattern))
        .order_by(Place.name)
        .limit(limit)
        .all()
    )


def get_or_create_place(db: Session, name: str, address: str) -> Place:
    """Get existing place or create new one if it doesn't exist"""
    # Try to find existing place with same name and address
    existing = (
        db.query(Place)
        .filter(Place.name == name, Place.address == address)
        .first()
    )
    
    if existing:
        return existing
    
    # Create new place
    place_create = PlaceCreate(name=name, address=address)
    return create_place(db, place_create)
