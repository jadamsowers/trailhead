from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.api import deps
from app.services.roster import RosterService
from app.models.user import User

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
