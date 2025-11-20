from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.deps import get_current_admin_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.trip import TripCreate, TripUpdate, TripResponse, TripListResponse
from app.crud import trip as crud_trip
from app.crud import signup as crud_signup

router = APIRouter()


@router.get("/available", response_model=TripListResponse)
async def get_available_trips(
    db: AsyncSession = Depends(get_db)
):
    """
    Get all trips with available spots (public endpoint).
    No authentication required.
    """
    trips = await crud_trip.get_available_trips(db)
    
    # Convert to response format with computed fields
    trip_responses = []
    for trip in trips:
        trip_responses.append(TripResponse(
            id=trip.id,
            name=trip.name,
            trip_date=trip.trip_date,
            end_date=trip.end_date,
            location=trip.location,
            description=trip.description,
            max_participants=trip.max_participants,
            capacity_type=trip.capacity_type,
            is_overnight=trip.is_overnight,
            signup_count=trip.signup_count,
            available_spots=trip.available_spots,
            is_full=trip.is_full,
            total_vehicle_capacity=trip.total_vehicle_capacity,
            needs_more_drivers=trip.needs_more_drivers,
            created_at=trip.created_at,
            updated_at=trip.updated_at
        ))
    
    return TripListResponse(trips=trip_responses, total=len(trip_responses))


@router.get("", response_model=TripListResponse)
async def get_all_trips(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all trips (public endpoint).
    Includes trips that are full.
    """
    trips = await crud_trip.get_trips(db, skip=skip, limit=limit)
    total = await crud_trip.get_trip_count(db)
    
    # Convert to response format with computed fields
    trip_responses = []
    for trip in trips:
        trip_responses.append(TripResponse(
            id=trip.id,
            name=trip.name,
            trip_date=trip.trip_date,
            end_date=trip.end_date,
            location=trip.location,
            description=trip.description,
            max_participants=trip.max_participants,
            capacity_type=trip.capacity_type,
            is_overnight=trip.is_overnight,
            trip_lead_name=trip.trip_lead_name,
            trip_lead_email=trip.trip_lead_email,
            trip_lead_phone=trip.trip_lead_phone,
            signup_count=trip.signup_count,
            available_spots=trip.available_spots,
            is_full=trip.is_full,
            total_vehicle_capacity=trip.total_vehicle_capacity,
            needs_more_drivers=trip.needs_more_drivers,
            adult_count=trip.adult_count,
            needs_two_deep_leadership=trip.needs_two_deep_leadership,
            needs_female_leader=trip.needs_female_leader,
            created_at=trip.created_at,
            updated_at=trip.updated_at
        ))
    
    return TripListResponse(trips=trip_responses, total=total)


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip: TripCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new trip (admin only).
    """
    db_trip = await crud_trip.create_trip(db, trip)
    
    return TripResponse(
        id=db_trip.id,
        name=db_trip.name,
        trip_date=db_trip.trip_date,
        end_date=db_trip.end_date,
        location=db_trip.location,
        description=db_trip.description,
        max_participants=db_trip.max_participants,
        capacity_type=db_trip.capacity_type,
        is_overnight=db_trip.is_overnight,
        signup_count=db_trip.signup_count,
        available_spots=db_trip.available_spots,
        is_full=db_trip.is_full,
        total_vehicle_capacity=db_trip.total_vehicle_capacity,
        needs_more_drivers=db_trip.needs_more_drivers,
        created_at=db_trip.created_at,
        updated_at=db_trip.updated_at
    )


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific trip by ID.
    """
    db_trip = await crud_trip.get_trip(db, trip_id)
    if not db_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    return TripResponse(
        id=db_trip.id,
        name=db_trip.name,
        trip_date=db_trip.trip_date,
        end_date=db_trip.end_date,
        location=db_trip.location,
        description=db_trip.description,
        max_participants=db_trip.max_participants,
        capacity_type=db_trip.capacity_type,
        is_overnight=db_trip.is_overnight,
        signup_count=db_trip.signup_count,
        available_spots=db_trip.available_spots,
        is_full=db_trip.is_full,
        total_vehicle_capacity=db_trip.total_vehicle_capacity,
        needs_more_drivers=db_trip.needs_more_drivers,
        created_at=db_trip.created_at,
        updated_at=db_trip.updated_at
    )


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: UUID,
    trip: TripUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a trip (admin only).
    """
    db_trip = await crud_trip.update_trip(db, trip_id, trip)
    if not db_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    return TripResponse(
        id=db_trip.id,
        name=db_trip.name,
        trip_date=db_trip.trip_date,
        end_date=db_trip.end_date,
        location=db_trip.location,
        description=db_trip.description,
        max_participants=db_trip.max_participants,
        capacity_type=db_trip.capacity_type,
        is_overnight=db_trip.is_overnight,
        signup_count=db_trip.signup_count,
        available_spots=db_trip.available_spots,
        is_full=db_trip.is_full,
        total_vehicle_capacity=db_trip.total_vehicle_capacity,
        needs_more_drivers=db_trip.needs_more_drivers,
        created_at=db_trip.created_at,
        updated_at=db_trip.updated_at
    )


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a trip (admin only).
    Can only delete trips with no signups.
    """
    success = await crud_trip.delete_trip(db, trip_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete trip with existing signups or trip not found"
        )
    return None


@router.get("/{trip_id}/signups")
async def get_trip_signups(
    trip_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all signups for a specific trip (admin only).
    """
    # Verify trip exists
    db_trip = await crud_trip.get_trip(db, trip_id)
    if not db_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    signups = await crud_signup.get_trip_signups(db, trip_id)
    
    # Convert to response format
    from app.schemas.signup import SignupResponse, ParticipantResponse
    
    signup_responses = []
    for signup in signups:
        participant_responses = []
        for participant in signup.participants:
            participant_responses.append(ParticipantResponse(
                id=participant.id,
                name=participant.name,
                age=participant.age,
                participant_type=participant.participant_type,
                is_adult=participant.is_adult,
                gender=participant.gender,
                troop_number=participant.troop_number,
                patrol_name=participant.patrol_name,
                has_youth_protection=participant.has_youth_protection,
                vehicle_capacity=participant.vehicle_capacity,
                dietary_restrictions=[dr.restriction_type for dr in participant.dietary_restrictions],
                allergies=[a.allergy_type for a in participant.allergies],
                medical_notes=participant.medical_notes,
                created_at=participant.created_at
            ))
        
        signup_responses.append(SignupResponse(
            id=signup.id,
            trip_id=signup.trip_id,
            family_contact_name=signup.family_contact_name,
            family_contact_email=signup.family_contact_email,
            family_contact_phone=signup.family_contact_phone,
            participants=participant_responses,
            participant_count=signup.participant_count,
            scout_count=signup.scout_count,
            adult_count=signup.adult_count,
            created_at=signup.created_at
        ))
    
    from app.schemas.signup import SignupListResponse
    return SignupListResponse(signups=signup_responses, total=len(signup_responses))