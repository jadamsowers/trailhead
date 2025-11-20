from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import csv
import io
from typing import List

from app.db.session import get_db
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.schemas.signup import SignupCreate, ParticipantCreate, FamilyContact
from app.crud import signup as crud_signup
from app.crud import trip as crud_trip

router = APIRouter()


@router.post("/trips/{trip_id}/import-roster")
async def import_roster_csv(
    trip_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Import troop roster from CSV file (admin only).
    
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
    # Verify trip exists
    db_trip = await crud_trip.get_trip(db, trip_id)
    if not db_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Check file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file"
        )
    
    # Read CSV file
    contents = await file.read()
    csv_data = contents.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(csv_data))
    
    # Group participants by family contact
    family_groups = {}
    errors = []
    row_num = 1
    
    for row in csv_reader:
        row_num += 1
        try:
            # Validate required fields
            required_fields = ['name', 'age', 'participant_type', 'gender', 
                             'family_contact_name', 'family_contact_email', 'family_contact_phone']
            missing_fields = [field for field in required_fields if not row.get(field)]
            if missing_fields:
                errors.append(f"Row {row_num}: Missing required fields: {', '.join(missing_fields)}")
                continue
            
            # Parse dietary restrictions and allergies
            dietary_restrictions = []
            if row.get('dietary_restrictions'):
                dietary_restrictions = [d.strip() for d in row['dietary_restrictions'].split(',') if d.strip()]
            
            allergies = []
            if row.get('allergies'):
                allergies = [a.strip() for a in row['allergies'].split(',') if a.strip()]
            
            # Parse boolean fields
            is_adult = row['participant_type'].lower() == 'adult'
            has_youth_protection = row.get('has_youth_protection', '').lower() == 'true'
            vehicle_capacity = int(row.get('vehicle_capacity', 0))
            
            # Create participant
            participant = ParticipantCreate(
                name=row['name'],
                age=int(row['age']),
                participant_type=row['participant_type'].lower(),
                is_adult=is_adult,
                gender=row['gender'].lower(),
                troop_number=row.get('troop_number') or None,
                patrol_name=row.get('patrol_name') or None,
                has_youth_protection=has_youth_protection,
                vehicle_capacity=vehicle_capacity,
                dietary_restrictions=dietary_restrictions,
                allergies=allergies,
                medical_notes=row.get('medical_notes') or None
            )
            
            # Group by family contact
            family_key = f"{row['family_contact_email']}_{row['family_contact_phone']}"
            if family_key not in family_groups:
                family_groups[family_key] = {
                    'contact': FamilyContact(
                        name=row['family_contact_name'],
                        email=row['family_contact_email'],
                        phone=row['family_contact_phone']
                    ),
                    'participants': []
                }
            family_groups[family_key]['participants'].append(participant)
            
        except ValueError as e:
            errors.append(f"Row {row_num}: Invalid data format - {str(e)}")
        except Exception as e:
            errors.append(f"Row {row_num}: Error processing row - {str(e)}")
    
    # If there were errors, return them
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "CSV import failed with errors",
                "errors": errors
            }
        )
    
    # Create signups for each family group
    created_signups = []
    signup_errors = []
    
    for family_key, family_data in family_groups.items():
        try:
            signup_request = SignupCreate(
                trip_id=trip_id,
                family_contact=family_data['contact'],
                participants=family_data['participants']
            )
            
            # Create the signup
            db_signup = await crud_signup.create_signup(db, signup_request)
            created_signups.append({
                'signup_id': str(db_signup.id),
                'family_contact': family_data['contact'].name,
                'participant_count': len(family_data['participants'])
            })
            
        except Exception as e:
            signup_errors.append(f"Family {family_data['contact'].name}: {str(e)}")
    
    # Return results
    return {
        "success": True,
        "message": f"Successfully imported {len(created_signups)} family signups",
        "created_signups": created_signups,
        "total_participants": sum(s['participant_count'] for s in created_signups),
        "errors": signup_errors if signup_errors else None
    }


@router.get("/trips/{trip_id}/export-roster")
async def export_roster_csv(
    trip_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export trip roster as CSV file (admin only).
    Returns CSV with all participants and their details.
    """
    from fastapi.responses import StreamingResponse
    
    # Verify trip exists
    db_trip = await crud_trip.get_trip(db, trip_id)
    if not db_trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Get all signups
    signups = await crud_signup.get_trip_signups(db, trip_id)
    
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
            "Content-Disposition": f"attachment; filename=trip_{trip_id}_roster.csv"
        }
    )