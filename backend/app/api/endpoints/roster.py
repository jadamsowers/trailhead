from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Any, Optional, List

from app.api import deps
from app.services.roster import RosterService
from app.models.user import User
from app.models.roster import RosterMember

router = APIRouter()


@router.get("/", status_code=200)
async def list_roster_members(
    *,
    db: AsyncSession = Depends(deps.get_db),
    q: Optional[str] = Query(None, description="Search query for name or email"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    List roster members. Admins only. Supports optional `q` search and pagination.
    """
    stmt = select(RosterMember)
    count_stmt = select(func.count()).select_from(RosterMember)

    if q:
        like_q = f"%{q}%"
        stmt = stmt.where(
            or_(
                RosterMember.full_name.ilike(like_q),
                RosterMember.email.ilike(like_q),
            )
        )
        count_stmt = count_stmt.where(
            or_(
                RosterMember.full_name.ilike(like_q),
                RosterMember.email.ilike(like_q),
            )
        )

    # Apply pagination
    stmt = stmt.limit(limit).offset(offset)

    result = await db.execute(stmt)
    members = result.scalars().all()

    total = await db.execute(count_stmt)
    total_count = total.scalar_one()

    def _member_to_dict(m: RosterMember):
        return {
            "bsa_member_id": m.bsa_member_id,
            "full_name": m.full_name,
            "first_name": m.first_name,
            "middle_name": m.middle_name,
            "last_name": m.last_name,
            "suffix": m.suffix,
            "email": m.email,
            "mobile_phone": m.mobile_phone,
            "city": m.city,
            "state": m.state,
            "zip_code": m.zip_code,
            "position": m.position,
            "ypt_date": m.ypt_date.isoformat() if m.ypt_date else None,
            "ypt_expiration": m.ypt_expiration.isoformat() if m.ypt_expiration else None,
        }

    return {"members": [_member_to_dict(m) for m in members], "total": int(total_count)}

@router.post("/import", status_code=200)
async def import_roster(
    *,
    db: AsyncSession = Depends(deps.get_db),
    file: list[UploadFile] = File(...),
    troop_id: Optional[str] = None,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Import roster from CSV file.
    """
    # Accept multiple CSV files (Scoutbook separates youth/adult exports)
    if not file:
        raise HTTPException(status_code=400, detail="No files provided")

    # Validate file extensions and read contents
    contents_list = []
    for f in file:
        if not f.filename or not f.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="All uploaded files must be CSVs")
        contents_list.append(await f.read())

    try:
        # troop_id is accepted for UI scoping but roster import is global (staging table)
        stats = await RosterService.import_roster(db, contents_list)
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
