from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, Optional

from app.api import deps
from app.services.roster import RosterService
from app.models.user import User
from app.models.roster import RosterMember

router = APIRouter()

@router.post("/import", status_code=200)
async def import_roster(
    *,
    db: AsyncSession = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Import roster from CSV file.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    contents = await file.read()
    try:
        stats = await RosterService.import_roster(db, contents)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during import: {str(e)}")
        
    return {"message": "Roster imported successfully", "stats": stats}


@router.get("/lookup/{bsa_member_id}")
async def lookup_member(
    *,
    db: AsyncSession = Depends(deps.get_db),
    bsa_member_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Look up a member by BSA member ID from the roster.
    Returns basic member information that can be used to pre-fill family member forms.
    """
    result = await db.execute(
        select(RosterMember).where(RosterMember.bsa_member_id == bsa_member_id)
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(status_code=404, detail="BSA member ID not found in roster")
    
    return {
        "bsa_member_id": member.bsa_member_id,
        "full_name": member.full_name,
        "first_name": member.first_name,
        "middle_name": member.middle_name,
        "last_name": member.last_name,
        "suffix": member.suffix,
        "email": member.email,
        "mobile_phone": member.mobile_phone,
        "city": member.city,
        "state": member.state,
        "zip_code": member.zip_code,
        "position": member.position,
        "ypt_date": member.ypt_date.isoformat() if member.ypt_date else None,
        "ypt_expiration": member.ypt_expiration.isoformat() if member.ypt_expiration else None,
    }
