from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.deps import get_current_admin_user, get_current_outing_admin_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.outing import OutingCreate, OutingUpdate, OutingResponse, OutingListResponse, OutingUpdateResponse, OutingUpdateEmailDraft
from app.utils.outing_email import diff_outing, generate_outing_update_email
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
    
    # Convert to response format with computed fields and allowed_troop_ids
    outing_responses = []
    for outing in outings:
        outing_dict = {k: getattr(outing, k) for k in OutingResponse.model_fields.keys() if hasattr(outing, k)}
        outing_dict['allowed_troop_ids'] = [troop.id for troop in outing.allowed_troops]
        outing_responses.append(OutingResponse.model_validate(outing_dict))
    
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
    
    # Convert to response format with computed fields and allowed_troop_ids
    outing_responses = []
    for outing in outings:
        outing_dict = {k: getattr(outing, k) for k in OutingResponse.model_fields.keys() if hasattr(outing, k)}
        outing_dict['allowed_troop_ids'] = [troop.id for troop in outing.allowed_troops]
        outing_responses.append(OutingResponse.model_validate(outing_dict))
    
    return OutingListResponse(outings=outing_responses, total=total)


@router.post("", response_model=OutingResponse, status_code=status.HTTP_201_CREATED)
async def create_outing(
    outing: OutingCreate,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new outing (admin or outing-admin).
    """
    db_outing = await crud_outing.create_outing(db, outing)
    
    # Build response with allowed_troop_ids from relationship
    outing_dict = {k: getattr(db_outing, k) for k in OutingResponse.model_fields.keys() if hasattr(db_outing, k)}
    outing_dict['allowed_troop_ids'] = [troop.id for troop in db_outing.allowed_troops]
    
    return OutingResponse.model_validate(outing_dict)


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
    
    # Build response with allowed_troop_ids from relationship
    outing_dict = {k: getattr(db_outing, k) for k in OutingResponse.model_fields.keys() if hasattr(db_outing, k)}
    outing_dict['allowed_troop_ids'] = [troop.id for troop in db_outing.allowed_troops]
    
    return OutingResponse.model_validate(outing_dict)


@router.put("/{outing_id}", response_model=OutingUpdateResponse)
async def update_outing(
    outing_id: UUID,
    outing: OutingUpdate,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an outing (admin or outing-admin).
    Ensures a proper before/after diff by cloning the original state before mutation.
    """
    # Get existing outing for diff
    existing = await crud_outing.get_outing(db, outing_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    # Clone original values to avoid in-place mutation eliminating diff
    import copy
    before_snapshot = copy.deepcopy(existing)

    db_outing = await crud_outing.update_outing(db, outing_id, outing)

    # Compute diff using snapshot
    changed_fields = diff_outing(before_snapshot, db_outing)
    email_draft = None
    if changed_fields:
        subject, body = generate_outing_update_email(before_snapshot, db_outing, changed_fields)
        email_draft = OutingUpdateEmailDraft(subject=subject, body=body, changed_fields=changed_fields)

    return OutingUpdateResponse(
        outing=OutingResponse.model_validate(db_outing),
        email_draft=email_draft
    )


@router.delete("/{outing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_outing(
    outing_id: UUID,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an outing (admin or outing-admin).
    Can only delete outings with no signups.
    """
    success = await crud_outing.delete_outing(db, outing_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete outing with existing signups or outing not found"
        )
    return None


@router.post("/{outing_id}/close-signups", response_model=OutingResponse)
async def close_signups(
    outing_id: UUID,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually close signups for an outing (admin or outing-admin).
    """
    db_outing = await crud_outing.get_outing(db, outing_id)
    if not db_outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Update signups_closed flag
    update_data = OutingUpdate(**db_outing.__dict__)
    update_data.signups_closed = True
    
    db_outing = await crud_outing.update_outing(db, outing_id, update_data)
    return OutingResponse.model_validate(db_outing)


@router.post("/{outing_id}/open-signups", response_model=OutingResponse)
async def open_signups(
    outing_id: UUID,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually open signups for an outing (admin or outing-admin).
    This will override the automatic closure date if set.
    """
    db_outing = await crud_outing.get_outing(db, outing_id)
    if not db_outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Update signups_closed flag
    update_data = OutingUpdate(**db_outing.__dict__)
    update_data.signups_closed = False
    
    db_outing = await crud_outing.update_outing(db, outing_id, update_data)
    return OutingResponse.model_validate(db_outing)


@router.get("/{outing_id}/signups")
async def get_outing_signups(
    outing_id: UUID,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all signups for a specific outing (admin or outing-admin).
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
            # Get dietary preferences and allergies from family member relationships
            dietary_prefs = [dp.preference for dp in participant.family_member.dietary_preferences] if participant.family_member else []
            allergies = [a.allergy for a in participant.family_member.allergies] if participant.family_member else []
            
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
                dietary_restrictions=dietary_prefs,
                allergies=allergies,
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


@router.get("/{outing_id}/handout")
async def get_outing_handout(
    outing_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a PDF handout for the outing (public endpoint).
    """
    from fastapi import Response
    from app.services.pdf_generator import pdf_generator
    
    # Get outing with all details
    db_outing = await crud_outing.get_outing_with_details(db, outing_id)
    if not db_outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Generate PDF
    pdf_bytes = pdf_generator.generate_outing_handout(db_outing, db_outing.packing_lists)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=outing_handout_{db_outing.id}.pdf"
        }
    )