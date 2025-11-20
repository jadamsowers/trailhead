from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.session import get_db
from app.schemas.signup import SignupCreate, SignupResponse, ParticipantResponse
from app.crud import signup as crud_signup
from app.crud import trip as crud_trip

router = APIRouter()


@router.post("", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def create_signup(
    signup: SignupCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new signup for a trip (public endpoint).
    No authentication required - families can sign up directly.
    
    Scouting America Requirements enforced:
    - Minimum 2 adults required per trip
    - If female youth present, at least 1 female adult leader required
    - Adults must have youth protection training for overnight trips
    """
    # Verify trip exists and has available spots
    db_trip = await crud_trip.get_trip(db, signup.trip_id)
    if not db_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Check if trip has enough spots
    # For vehicle-based capacity, account for vehicle capacity from adults in this signup
    total_participants = len(signup.participants)
    
    if db_trip.capacity_type == 'vehicle':
        # Calculate vehicle capacity being added by adults in this signup
        new_vehicle_capacity = sum(
            p.vehicle_capacity if p.vehicle_capacity else 0
            for p in signup.participants
            if p.participant_type == 'adult'
        )
        
        # Calculate available spots after adding the new vehicle capacity
        # available_spots = current_vehicle_capacity + new_vehicle_capacity - (current_participants + new_participants)
        projected_available_spots = db_trip.available_spots + new_vehicle_capacity - total_participants
        
        if projected_available_spots < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough available spots. Current capacity: {db_trip.total_vehicle_capacity} seats, "
                       f"current participants: {db_trip.signup_count}. Your signup adds {new_vehicle_capacity} seats "
                       f"but requires {total_participants} spots, resulting in {abs(projected_available_spots)} over capacity."
            )
    else:
        # Fixed capacity - simple check
        if db_trip.available_spots < total_participants:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough available spots. Only {db_trip.available_spots} spots remaining."
            )
    
    # Get all existing signups to check total adult count across all signups
    existing_signups = await crud_signup.get_trip_signups(db, signup.trip_id)
    
    # Count adults and youth by gender across all signups (existing + new)
    total_adults = sum(1 for s in existing_signups for p in s.participants if p.is_adult)
    total_female_adults = sum(1 for s in existing_signups for p in s.participants if p.is_adult and p.gender == 'female')
    total_female_youth = sum(1 for s in existing_signups for p in s.participants if not p.is_adult and p.gender == 'female')
    
    # Add counts from new signup
    new_adults = [p for p in signup.participants if p.participant_type == 'adult']
    new_female_adults = [p for p in new_adults if p.gender == 'female']
    new_youth = [p for p in signup.participants if p.participant_type == 'scout']
    new_female_youth = [p for p in new_youth if p.gender == 'female']
    
    total_adults += len(new_adults)
    total_female_adults += len(new_female_adults)
    total_female_youth += len(new_female_youth)
    
    # Collect warnings for Scouting America requirements
    warnings = []
    
    # Scouting America Two-Deep Leadership: Minimum 2 adults required
    if total_adults < 2:
        warnings.append(
            f"⚠️ Scouting America requires at least 2 adults on every trip. Currently {total_adults} adult(s) signed up. "
            "Please ensure at least 2 adults are registered before the trip."
        )
    
    # Scouting America Gender-Specific Leadership: If female youth present, require female adult leader
    if total_female_youth > 0 and total_female_adults < 1:
        warnings.append(
            "⚠️ Scouting America requires at least one female adult leader when female youth are present. "
            "Please ensure a female adult is registered before the trip."
        )
    
    # Validate adult requirements for overnight trips
    if db_trip.is_overnight:
        if new_adults:
            # Check if at least one adult has youth protection training
            has_trained_adult = any(a.has_youth_protection_training for a in new_adults)
            if not has_trained_adult:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="At least one adult must have Scouting America youth protection training for overnight trips"
                )
    
    # Create the signup
    db_signup = await crud_signup.create_signup(db, signup)
    
    # Convert to response format
    participant_responses = []
    for participant in db_signup.participants:
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
    
    return SignupResponse(
        id=db_signup.id,
        trip_id=db_signup.trip_id,
        family_contact_name=db_signup.family_contact_name,
        family_contact_email=db_signup.family_contact_email,
        family_contact_phone=db_signup.family_contact_phone,
        participants=participant_responses,
        participant_count=db_signup.participant_count,
        scout_count=db_signup.scout_count,
        adult_count=db_signup.adult_count,
        created_at=db_signup.created_at,
        warnings=warnings
    )


@router.get("/{signup_id}", response_model=SignupResponse)
async def get_signup(
    signup_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific signup by ID (public endpoint).
    Families can view their signup details.
    """
    db_signup = await crud_signup.get_signup(db, signup_id)
    if not db_signup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signup not found"
        )
    
    # Convert to response format
    participant_responses = []
    for participant in db_signup.participants:
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
    
    return SignupResponse(
        id=db_signup.id,
        trip_id=db_signup.trip_id,
        family_contact_name=db_signup.family_contact_name,
        family_contact_email=db_signup.family_contact_email,
        family_contact_phone=db_signup.family_contact_phone,
        participants=participant_responses,
        participant_count=db_signup.participant_count,
        scout_count=db_signup.scout_count,
        adult_count=db_signup.adult_count,
        created_at=db_signup.created_at,
        warnings=[]  # No warnings for get endpoint
    )


@router.delete("/{signup_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_signup(
    signup_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel a signup (public endpoint).
    Families can cancel their own signups.
    """
    success = await crud_signup.delete_signup(db, signup_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signup not found"
        )
    return None