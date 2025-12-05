"""Offline data endpoints for bulk & incremental data synchronization."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from uuid import UUID

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.crud import outing as crud_outing
from app.crud import signup as crud_signup
from app.schemas.outing import OutingResponse
from app.schemas.signup import SignupResponse, ParticipantResponse
from app.schemas.auth import UserResponse
from app.schemas.change_log import ChangeLogDeltaResponse, ChangeLogEntry
from app.models.change_log import ChangeLog
from app.services.change_log import get_deltas

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
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_initial_admin=current_user.is_initial_admin,
        phone=current_user.phone,
        emergency_contact_name=current_user.emergency_contact_name,
        emergency_contact_phone=current_user.emergency_contact_phone,
        youth_protection_expiration=current_user.youth_protection_expiration
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


@router.get("/deltas", response_model=ChangeLogDeltaResponse)
async def get_change_deltas(
    since: Optional[str] = Query(None, description="ISO8601 timestamp; ignored if cursor provided"),
    cursor: Optional[str] = Query(None, description="UUID cursor of last item received"),
    limit: int = Query(200, ge=1, le=500, description="Max change log entries"),
    entity_types: Optional[str] = Query(None, description="Comma-separated list of entity types to restrict (admin only)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Incremental change log entries with keyset pagination & basic permission scoping.

    Non-admin users receive only public entity types (outing, place); admin receives all.
    """
    cursor_uuid: Optional[UUID] = None
    if cursor:
        try:
            cursor_uuid = UUID(cursor)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cursor UUID")

    since_dt: Optional[datetime] = None
    if since and not cursor_uuid:
        try:
            since_dt = datetime.fromisoformat(since.replace("Z", ""))
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 'since' timestamp format")
    elif not cursor_uuid:
        since_dt = datetime.utcnow() - timedelta(hours=24)

    # Determine allowed types
    requested_types = None
    if entity_types and current_user.role == "admin":
        requested_types = {t.strip() for t in entity_types.split(',') if t.strip()}

    if current_user.role != "admin":
        # Non-admin: restrict fixed public list
        requested_types = {"outing", "place"}

    rows_all = await get_deltas(db, since=since_dt, cursor_id=cursor_uuid, limit=limit + 1, entity_types=requested_types)

    has_more = len(rows_all) > limit
    page_rows = rows_all[:limit]
    next_cursor = str(page_rows[-1].id) if has_more else None
    latest_ts = page_rows[-1].created_at if page_rows else datetime.utcnow()

    items = [
        ChangeLogEntry(
            id=row.id,
            entity_type=row.entity_type,
            entity_id=row.entity_id,
            op_type=row.op_type,
            version=row.version,
            payload_hash=row.payload_hash,
            created_at=row.created_at,
        )
        for row in page_rows
    ]

    return ChangeLogDeltaResponse(
        items=items,
        has_more=has_more,
        next_cursor=next_cursor,
        latest_timestamp=latest_ts,
    )
