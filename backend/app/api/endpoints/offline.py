"""
Offline data endpoints for bulk data synchronization
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import Dict, List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.crud import outing as crud_outing
from app.crud import signup as crud_signup
from app.schemas.outing import OutingResponse
from app.schemas.signup import SignupResponse, ParticipantResponse
from app.schemas.auth import UserResponse

router = APIRouter()


@router.get("/data")
async def get_bulk_offline_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all offline data in a single request.
    Returns user info, all outings, and all rosters.
    This endpoint is optimized for offline sync to reduce request count.
    """
    # 1. Get user data for offline admin detection
    user_data = UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        phone=current_user.phone,
        emergency_contact_name=current_user.emergency_contact_name,
        emergency_contact_phone=current_user.emergency_contact_phone,
        youth_protection_expiration=current_user.youth_protection_expiration,
        timezone=current_user.timezone,
        initial_setup_complete=current_user.initial_setup_complete
    )
    
    # 2. Get all outings
    outings = await crud_outing.get_outings(db, skip=0, limit=100)
    outing_responses = [OutingResponse.model_validate(outing) for outing in outings]
    
    # 3. Get all rosters (only for admin users)
    rosters: Dict[str, List[SignupResponse]] = {}
    
    if current_user.role == "admin":
        for outing in outings:
            signups = await crud_signup.get_outing_signups(db, outing.id)
            
            # Convert to response format
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
            
            rosters[str(outing.id)] = signup_responses
    
    return {
        "user": user_data,
        "outings": outing_responses,
        "rosters": rosters,
        "last_updated": datetime.utcnow().isoformat()
    }
