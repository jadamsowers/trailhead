from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import csv
import io
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.schemas.signup import SignupCreate, FamilyContact
from app.crud import signup as crud_signup
from app.crud import outing as crud_outing
from app.utils.pdf_generator import generate_outing_roster_pdf

router = APIRouter()


@router.post("/outings/{outing_id}/import-roster")
async def import_roster_csv(
    outing_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Import troop roster from CSV file (admin only).
    
    NOTE: This endpoint is temporarily disabled and needs to be refactored to work with
    the new family member reference system. CSV imports should create family members first,
    then reference them in signups.
    
    CSV Format:
    name,age,participant_type,gender,troop_number,patrol_name,has_youth_protection,vehicle_capacity,dietary_restrictions,allergies,medical_notes,family_contact_name,family_contact_email,family_contact_phone
    
    Example:
    John Scout,14,scout,male,123,Eagle Patrol,false,0,"vegetarian,dairy-free","peanuts","",Jane Doe,jane@example.com,555-1234
    Jane Leader,35,adult,female,,,true,5,"","","",Jane Leader,jane@example.com,555-1234
    
    Notes:
    - participant_type: scout or adult
    - gender: male, female, or other
    - has_youth_protection: true or false (adults only)
    - dietary_restrictions: comma-separated list in quotes
    - allergies: comma-separated list in quotes
    - Empty fields for troop_number and patrol_name for adults
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="CSV import is temporarily disabled. This feature needs to be refactored to work with the new family member reference system."
    )


@router.get("/outings/{outing_id}/export-roster")
async def export_roster_csv(
    outing_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export outing roster as CSV file (admin only).
    Returns CSV with all participants and their details.
    """
    from fastapi.responses import StreamingResponse
    
    # Verify outing exists
    db_outing = await crud_outing.get_outing(db, outing_id)
    if not db_outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Get all signups
    signups = await crud_signup.get_outing_signups(db, outing_id)
    
    # Create CSV
    output = io.StringIO()
    fieldnames = [
        'name', 'age', 'participant_type', 'gender', 'troop_number', 'patrol_name',
        'has_youth_protection', 'vehicle_capacity', 'dietary_restrictions', 'allergies',
        'medical_notes', 'family_contact_name', 'family_contact_email', 'family_contact_phone'
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for signup in signups:
        for participant in signup.participants:
            # Format age as "21+" for adults
            age_display = "21+" if participant.is_adult else participant.age
            writer.writerow({
                'name': participant.name,
                'age': age_display,
                'participant_type': participant.participant_type,
                'gender': participant.gender,
                'troop_number': participant.troop_number or '',
                'patrol_name': participant.patrol_name or '',
                'has_youth_protection': str(participant.has_youth_protection).lower(),
                'vehicle_capacity': participant.vehicle_capacity,
                'dietary_restrictions': ','.join([dr.restriction_type for dr in participant.dietary_restrictions]),
                'allergies': ','.join([a.allergy_type for a in participant.allergies]),
                'medical_notes': participant.medical_notes or '',
                'family_contact_name': signup.family_contact_name,
                'family_contact_email': signup.family_contact_email,
                'family_contact_phone': signup.family_contact_phone
            })
    
    # Return as downloadable file
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=outing_{outing_id}_roster.csv"
        }
    )


@router.get("/outings/{outing_id}/export-roster-pdf")
async def export_roster_pdf(
    outing_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export outing roster as PDF file with checkboxes for check-in (admin only).
    Returns an attractive, printable PDF document for outing leaders.
    """
    # Verify outing exists
    db_outing = await crud_outing.get_outing(db, outing_id)
    if not db_outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Get all signups
    signups = await crud_signup.get_outing_signups(db, outing_id)
    
    # Prepare outing data
    outing_data = {
        'name': db_outing.name,
        'outing_date': db_outing.outing_date.isoformat(),
        'end_date': db_outing.end_date.isoformat() if db_outing.end_date else None,
        'location': db_outing.location,
        'description': db_outing.description,
        'outing_lead_name': db_outing.outing_lead_name,
        'outing_lead_email': db_outing.outing_lead_email,
        'outing_lead_phone': db_outing.outing_lead_phone
    }
    
    # Prepare signups data
    signups_data = []
    for signup in signups:
        participants_data = []
        for participant in signup.participants:
            participants_data.append({
                'name': participant.name,
                'age': participant.age,
                'participant_type': participant.participant_type,
                'gender': participant.gender,
                'troop_number': participant.troop_number,
                'patrol_name': participant.patrol_name,
                'has_youth_protection': participant.has_youth_protection,
                'vehicle_capacity': participant.vehicle_capacity,
                'dietary_restrictions': [dr.restriction_type for dr in participant.dietary_restrictions],
                'allergies': [a.allergy_type for a in participant.allergies]
            })
        
        signups_data.append({
            'family_contact_name': signup.family_contact_name,
            'family_contact_phone': signup.family_contact_phone,
            'participants': participants_data
        })
    
    # Generate PDF
    pdf_buffer = generate_outing_roster_pdf(outing_data, signups_data)
    
    # Return as downloadable file
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=outing_{db_outing.name.replace(' ', '_')}_roster.pdf"
        }
    )