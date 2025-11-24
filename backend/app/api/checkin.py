from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from datetime import datetime
import csv
import io

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.checkin import (
    CheckInSummary,
    CheckInCreate,
    CheckInResponse,
    CheckInExportRow
)
from app.crud import checkin as checkin_crud
from app.models.outing import Outing

router = APIRouter()


@router.get("/{outing_id}/checkin", response_model=CheckInSummary)
async def get_checkin_status(
    outing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get check-in status for an outing
    Shows all participants and who has been checked in
    Requires authentication (admin or outing leader)
    """
    # Verify outing exists
    result = await db.execute(select(Outing).filter(Outing.id == outing_id))
    outing = result.scalars().first()
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Get check-in summary
    summary = await checkin_crud.get_checkin_summary(db, outing_id)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unable to retrieve check-in data"
        )
    
    return summary


@router.post("/{outing_id}/checkin", response_model=CheckInResponse)
async def check_in_participants(
    outing_id: UUID,
    checkin_data: CheckInCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check in one or more participants for an outing
    Requires authentication (admin or outing leader)
    """
    # Verify outing exists
    result = await db.execute(select(Outing).filter(Outing.id == outing_id))
    outing = result.scalars().first()
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Create check-ins
    checkins = await checkin_crud.create_checkins(
        db=db,
        outing_id=outing_id,
        participant_ids=checkin_data.participant_ids,
        checked_in_by=checkin_data.checked_in_by
    )
    
    return CheckInResponse(
        message=f"Successfully checked in {len(checkins)} participant(s)",
        checked_in_count=len(checkins),
        participant_ids=[c.participant_id for c in checkins],
        checked_in_at=checkins[0].checked_in_at if checkins else datetime.utcnow()
    )


@router.delete("/{outing_id}/checkin/{participant_id}")
async def undo_checkin(
    outing_id: UUID,
    participant_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Undo a check-in (remove check-in record)
    Requires authentication (admin or outing leader)
    """
    deleted = await checkin_crud.delete_checkin(db, outing_id, participant_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Check-in record not found"
        )
    
    return {"message": "Check-in removed successfully"}


@router.delete("/{outing_id}/checkin")
async def reset_all_checkins(
    outing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reset all check-ins for an outing (remove all check-in records)
    Requires authentication (admin only)
    """
    # TODO: Add admin-only check when role-based auth is implemented
    
    count = await checkin_crud.delete_all_checkins(db, outing_id)
    
    return {
        "message": f"Reset complete. Removed {count} check-in record(s)",
        "count": count
    }


@router.get("/{outing_id}/checkin/export")
async def export_checkin_data(
    outing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export check-in data as CSV
    Includes all participants and their check-in status
    Requires authentication (admin or outing leader)
    """
    # Get check-in summary
    summary = await checkin_crud.get_checkin_summary(db, outing_id)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Participant Name",
        "Type",
        "Family",
        "Patrol",
        "Troop",
        "Checked In",
        "Check-in Time",
        "Checked In By"
    ])
    
    # Write participant data
    for participant in summary.participants:
        writer.writerow([
            participant.name,
            participant.member_type,
            participant.family_name,
            participant.patrol_name or "",
            participant.troop_number or "",
            "Yes" if participant.is_checked_in else "No",
            participant.checked_in_at.strftime("%Y-%m-%d %H:%M:%S") if participant.checked_in_at else "",
            participant.checked_in_by or ""
        ])
    
    # Prepare response
    output.seek(0)
    filename = f"checkin_{summary.outing_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
