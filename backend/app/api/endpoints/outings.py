from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.deps import get_current_admin_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.outing import OutingCreate, OutingUpdate, OutingResponse, OutingListResponse
from app.crud import outing as crud_outing
from app.crud import signup as crud_signup

router = APIRouter()


@router.get("/available", response_model=OutingListResponse)
async def get_available_outings(
    db: AsyncSession = Depends(get_db)
):
    """
    Get all outings with available spots (public endpoint).
    No authentication required.
    """
    outings = await crud_outing.get_available_outings(db)
    
    # Convert to response format with computed fields
    outing_responses = [OutingResponse.model_validate(outing) for outing in outings]
    
    return OutingListResponse(outings=outing_responses, total=len(outing_responses))


@router.get("", response_model=OutingListResponse)
async def get_all_outings(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all outings (public endpoint).
    Includes outings that are full.
    """
    outings = await crud_outing.get_outings(db, skip=skip, limit=limit)
    total = await crud_outing.get_outing_count(db)
    
    # Convert to response format with computed fields
    outing_responses = [OutingResponse.model_validate(outing) for outing in outings]
    
    return OutingListResponse(outings=outing_responses, total=total)


@router.post("", response_model=OutingResponse, status_code=status.HTTP_201_CREATED)
async def create_outing(
    outing: OutingCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new outing (admin only).
    """
    db_outing = await crud_outing.create_outing(db, outing)
    
    return OutingResponse(
        id=db_outing.id,
        name=db_outing.name,
        outing_date=db_outing.outing_date,
        end_date=db_outing.end_date,
        location=db_outing.location,
        description=db_outing.description,
        max_participants=db_outing.max_participants,
        capacity_type=db_outing.capacity_type,
        is_overnight=db_outing.is_overnight,
        signup_count=db_outing.signup_count,
        available_spots=db_outing.available_spots,
        is_full=db_outing.is_full,
        total_vehicle_capacity=db_outing.total_vehicle_capacity,
        needs_more_drivers=db_outing.needs_more_drivers,
        created_at=db_outing.created_at,
        updated_at=db_outing.updated_at,
        icon=db_outing.icon
    )


@router.get("/{outing_id}", response_model=OutingResponse)
async def get_outing(
    outing_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific outing by ID.
    """
    db_outing = await crud_outing.get_outing(db, outing_id)
    if not db_outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    return OutingResponse(
        id=db_outing.id,
        name=db_outing.name,
        outing_date=db_outing.outing_date,
        end_date=db_outing.end_date,
        location=db_outing.location,
        description=db_outing.description,
        max_participants=db_outing.max_participants,
        capacity_type=db_outing.capacity_type,
        is_overnight=db_outing.is_overnight,
        signup_count=db_outing.signup_count,
        available_spots=db_outing.available_spots,
        is_full=db_outing.is_full,
        total_vehicle_capacity=db_outing.total_vehicle_capacity,
        needs_more_drivers=db_outing.needs_more_drivers,
        created_at=db_outing.created_at,
        updated_at=db_outing.updated_at
    )


@router.put("/{outing_id}", response_model=OutingResponse)
async def update_outing(
    outing_id: UUID,
    outing: OutingUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an outing (admin only).
    """
    db_outing = await crud_outing.update_outing(db, outing_id, outing)
    if not db_outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    return OutingResponse(
        id=db_outing.id,
        name=db_outing.name,
        outing_date=db_outing.outing_date,
        end_date=db_outing.end_date,
        location=db_outing.location,
        description=db_outing.description,
        max_participants=db_outing.max_participants,
        capacity_type=db_outing.capacity_type,
        is_overnight=db_outing.is_overnight,
        signup_count=db_outing.signup_count,
        available_spots=db_outing.available_spots,
        is_full=db_outing.is_full,
        total_vehicle_capacity=db_outing.total_vehicle_capacity,
        needs_more_drivers=db_outing.needs_more_drivers,
        created_at=db_outing.created_at,
        updated_at=db_outing.updated_at
    )


@router.delete("/{outing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_outing(
    outing_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an outing (admin only).
    Can only delete outings with no signups.
    """
    success = await crud_outing.delete_outing(db, outing_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete outing with existing signups or outing not found"
        )
    return None


@router.get("/{outing_id}/signups")
async def get_outing_signups(
    outing_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all signups for a specific outing (admin only).
    """
    # Verify outing exists
    db_outing = await crud_outing.get_outing(db, outing_id)
    if not db_outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    signups = await crud_signup.get_outing_signups(db, outing_id)
    
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
            outing_id=signup.outing_id,
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