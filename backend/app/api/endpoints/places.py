from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.crud import place as crud_place
from app.schemas.place import PlaceCreate, PlaceUpdate, PlaceResponse

router = APIRouter()


@router.get("/places", response_model=List[PlaceResponse])
def list_places(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search by name or address"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all places with optional search filter"""
    return crud_place.get_places(db, skip=skip, limit=limit, search=search)


@router.get("/places/{place_id}", response_model=PlaceResponse)
def get_place(
    place_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific place by ID"""
    place = crud_place.get_place(db, place_id)
    if not place:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Place not found"
        )
    return place


@router.post("/places", response_model=PlaceResponse, status_code=status.HTTP_201_CREATED)
def create_place(
    place: PlaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new place (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create places"
        )
    return crud_place.create_place(db, place)


@router.put("/places/{place_id}", response_model=PlaceResponse)
def update_place(
    place_id: UUID,
    place: PlaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a place (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update places"
        )
    
    updated = crud_place.update_place(db, place_id, place)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Place not found"
        )
    return updated


@router.delete("/places/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_place(
    place_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a place (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete places"
        )
    
    success = crud_place.delete_place(db, place_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Place not found"
        )


@router.get("/places/search/{name}", response_model=List[PlaceResponse])
def search_places(
    name: str,
    limit: int = Query(10, le=50, description="Maximum number of results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search places by name (for autocomplete)"""
    return crud_place.search_places_by_name(db, name, limit=limit)
