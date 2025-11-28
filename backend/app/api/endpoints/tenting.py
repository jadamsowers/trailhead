from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List
from datetime import date

from app.api.deps import get_current_outing_admin_user
from app.db.session import get_db
from app.models.user import User
from app.models.tenting_group import TentingGroup, TentingGroupMember
from app.crud import tenting_group as crud_tenting_group
from app.crud import outing as crud_outing
from app.crud import signup as crud_signup
from app.schemas.tenting_group import (
    TentingGroupCreate,
    TentingGroupUpdate,
    TentingGroupResponse,
    TentingGroupListResponse,
    TentingGroupMemberCreate,
    TentingGroupMemberResponse,
    TentingSummaryResponse,
    TentingSummaryParticipant,
    MoveTentingParticipantRequest,
    AutoAssignTentingRequest,
    TentingValidationIssue,
)

router = APIRouter()


def _calculate_age(date_of_birth: date) -> int:
    """Calculate age from date of birth"""
    today = date.today()
    return today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))


def _build_tenting_group_response(tenting_group: TentingGroup) -> TentingGroupResponse:
    """Convert TentingGroup model to response schema"""
    members = []
    for member in tenting_group.members:
        participant = member.participant
        family_member = participant.family_member if participant else None
        
        age = None
        gender = None
        patrol_name = None
        
        if family_member:
            if family_member.date_of_birth:
                age = _calculate_age(family_member.date_of_birth)
            gender = family_member.gender
            patrol_name = family_member.patrol_name
        
        members.append(TentingGroupMemberResponse(
            id=member.id,
            participant_id=member.participant_id,
            created_at=member.created_at,
            participant_name=participant.name if participant else None,
            age=age,
            gender=gender,
            patrol_name=patrol_name,
        ))
    
    return TentingGroupResponse(
        id=tenting_group.id,
        outing_id=tenting_group.outing_id,
        name=tenting_group.name,
        notes=tenting_group.notes,
        members=members,
        member_count=len(members),
        created_at=tenting_group.created_at,
        updated_at=tenting_group.updated_at,
    )


def _validate_tenting_group(tenting_group: TentingGroup, max_age_diff: int = 2) -> List[TentingValidationIssue]:
    """Validate a tenting group against Scouting America policies"""
    issues = []
    
    members = tenting_group.members
    if not members:
        return issues
    
    # Get member data
    member_data = []
    for member in members:
        participant = member.participant
        family_member = participant.family_member if participant else None
        if family_member:
            age = None
            if family_member.date_of_birth:
                age = _calculate_age(family_member.date_of_birth)
            member_data.append({
                'name': participant.name,
                'age': age,
                'gender': family_member.gender,
            })
    
    # Check group size (2-3 preferred, 3 if odd number)
    if len(member_data) > 3:
        issues.append(TentingValidationIssue(
            tenting_group_id=tenting_group.id,
            tenting_group_name=tenting_group.name,
            issue_type="group_size",
            message=f"Tent has {len(member_data)} scouts (max recommended is 3)",
            severity="warning"
        ))
    elif len(member_data) < 2:
        issues.append(TentingValidationIssue(
            tenting_group_id=tenting_group.id,
            tenting_group_name=tenting_group.name,
            issue_type="group_size",
            message=f"Tent has only {len(member_data)} scout{'s' if len(member_data) != 1 else ''} (minimum is 2)",
            severity="warning"
        ))
    
    # Check age differences
    ages = [m['age'] for m in member_data if m['age'] is not None]
    if len(ages) >= 2:
        max_age = max(ages)
        min_age = min(ages)
        age_diff = max_age - min_age
        if age_diff > max_age_diff:
            issues.append(TentingValidationIssue(
                tenting_group_id=tenting_group.id,
                tenting_group_name=tenting_group.name,
                issue_type="age_gap",
                message=f"Age difference of {age_diff} years exceeds {max_age_diff} year limit",
                severity="error"
            ))
    
    # Check gender matching
    genders = set(m['gender'] for m in member_data if m['gender'] is not None)
    if len(genders) > 1:
        issues.append(TentingValidationIssue(
            tenting_group_id=tenting_group.id,
            tenting_group_name=tenting_group.name,
            issue_type="gender_mismatch",
            message="Scouts of different genders cannot share a tent",
            severity="error"
        ))
    
    return issues


@router.get("/{outing_id}/tenting", response_model=TentingSummaryResponse)
async def get_tenting_summary(
    outing_id: UUID,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive tenting management summary for an outing.
    Includes all scouts, tenting groups, and validation issues.
    """
    # Get outing
    outing = await crud_outing.get_outing(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Get tenting groups
    tenting_groups = await crud_tenting_group.get_tenting_groups_by_outing(db, outing_id)
    tenting_group_responses = [_build_tenting_group_response(tg) for tg in tenting_groups]
    
    # Get all signups for the outing
    signups = await crud_signup.get_outing_signups(db, outing_id)
    
    # Build participant summaries
    participants = []
    unassigned_count = 0
    scout_count = 0
    
    # Create map of participant_id to tenting group membership
    participant_groups = {}
    for tg in tenting_groups:
        for member in tg.members:
            participant_groups[member.participant_id] = {
                'tenting_group_id': tg.id,
                'tenting_group_name': tg.name,
            }
    
    for signup in signups:
        for participant in signup.participants:
            family_member = participant.family_member
            
            # Skip adults - they don't need tenting assignments
            if family_member and family_member.member_type == 'adult':
                continue
            
            scout_count += 1
            
            age = None
            gender = None
            patrol_name = None
            troop_number = None
            
            if family_member:
                if family_member.date_of_birth:
                    age = _calculate_age(family_member.date_of_birth)
                gender = family_member.gender
                patrol_name = family_member.patrol_name
                troop_number = family_member.troop_number
            
            group_info = participant_groups.get(participant.id, {})
            
            is_in_group = participant.id in participant_groups
            if not is_in_group:
                unassigned_count += 1
            
            participants.append(TentingSummaryParticipant(
                participant_id=participant.id,
                name=participant.name,
                age=age,
                gender=gender,
                patrol_name=patrol_name,
                troop_number=troop_number,
                is_adult=False,
                tenting_group_id=group_info.get('tenting_group_id'),
                tenting_group_name=group_info.get('tenting_group_name'),
            ))
    
    return TentingSummaryResponse(
        outing_id=outing.id,
        outing_name=outing.name,
        participants=participants,
        tenting_groups=tenting_group_responses,
        unassigned_count=unassigned_count,
        scout_count=scout_count,
    )


@router.get("/{outing_id}/tenting/validate", response_model=List[TentingValidationIssue])
async def validate_tenting_assignments(
    outing_id: UUID,
    max_age_difference: int = 2,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Validate all tenting assignments for an outing against Scouting America policies.
    Returns a list of validation issues.
    """
    # Get outing
    outing = await crud_outing.get_outing(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Get tenting groups
    tenting_groups = await crud_tenting_group.get_tenting_groups_by_outing(db, outing_id)
    
    all_issues = []
    for tg in tenting_groups:
        issues = _validate_tenting_group(tg, max_age_difference)
        all_issues.extend(issues)
    
    return all_issues


@router.get("/{outing_id}/tenting-groups", response_model=TentingGroupListResponse)
async def get_tenting_groups(
    outing_id: UUID,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all tenting groups for an outing."""
    # Verify outing exists
    outing = await crud_outing.get_outing(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    tenting_groups = await crud_tenting_group.get_tenting_groups_by_outing(db, outing_id)
    tenting_group_responses = [_build_tenting_group_response(tg) for tg in tenting_groups]
    
    return TentingGroupListResponse(
        tenting_groups=tenting_group_responses,
        total=len(tenting_group_responses)
    )


@router.post("/{outing_id}/tenting-groups", response_model=TentingGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_tenting_group(
    outing_id: UUID,
    tenting_group_in: TentingGroupCreate,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new tenting group for an outing."""
    # Verify outing exists
    outing = await crud_outing.get_outing(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Ensure outing_id matches
    if tenting_group_in.outing_id != outing_id:
        tenting_group_in.outing_id = outing_id
    
    tenting_group = await crud_tenting_group.create_tenting_group(db, tenting_group_in)
    return _build_tenting_group_response(tenting_group)


@router.put("/{outing_id}/tenting-groups/{tenting_group_id}", response_model=TentingGroupResponse)
async def update_tenting_group(
    outing_id: UUID,
    tenting_group_id: UUID,
    tenting_group_in: TentingGroupUpdate,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a tenting group."""
    tenting_group = await crud_tenting_group.get_tenting_group(db, tenting_group_id)
    if not tenting_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenting group not found"
        )
    
    if tenting_group.outing_id != outing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenting group does not belong to this outing"
        )
    
    updated = await crud_tenting_group.update_tenting_group(db, tenting_group_id, tenting_group_in)
    return _build_tenting_group_response(updated)


@router.delete("/{outing_id}/tenting-groups/{tenting_group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenting_group(
    outing_id: UUID,
    tenting_group_id: UUID,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a tenting group."""
    tenting_group = await crud_tenting_group.get_tenting_group(db, tenting_group_id)
    if not tenting_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenting group not found"
        )
    
    if tenting_group.outing_id != outing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenting group does not belong to this outing"
        )
    
    await crud_tenting_group.delete_tenting_group(db, tenting_group_id)
    return None


@router.post("/{outing_id}/tenting-groups/{tenting_group_id}/members", response_model=TentingGroupMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member_to_tenting_group(
    outing_id: UUID,
    tenting_group_id: UUID,
    member_in: TentingGroupMemberCreate,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a participant to a tenting group."""
    tenting_group = await crud_tenting_group.get_tenting_group(db, tenting_group_id)
    if not tenting_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenting group not found"
        )
    
    if tenting_group.outing_id != outing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenting group does not belong to this outing"
        )
    
    member = await crud_tenting_group.add_member_to_tenting_group(db, tenting_group_id, member_in)
    
    return TentingGroupMemberResponse(
        id=member.id,
        participant_id=member.participant_id,
        created_at=member.created_at,
        participant_name=None,
        age=None,
        gender=None,
        patrol_name=None,
    )


@router.post("/{outing_id}/move-tenting-participant", response_model=dict)
async def move_tenting_participant(
    outing_id: UUID,
    request: MoveTentingParticipantRequest,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Move a participant to a different tenting group or remove from all groups."""
    # Verify outing exists
    outing = await crud_outing.get_outing(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # If moving to a group, verify it belongs to this outing
    if request.target_tenting_group_id:
        target_group = await crud_tenting_group.get_tenting_group(db, request.target_tenting_group_id)
        if not target_group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target tenting group not found"
            )
        if target_group.outing_id != outing_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target tenting group does not belong to this outing"
            )
    
    success = await crud_tenting_group.move_participant_to_tenting_group(
        db,
        request.participant_id,
        request.target_tenting_group_id,
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to move participant"
        )
    
    return {"message": "Participant moved successfully"}


@router.post("/{outing_id}/auto-assign-tenting", response_model=TentingGroupListResponse)
async def auto_assign_tenting_groups(
    outing_id: UUID,
    request: AutoAssignTentingRequest,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Automatically assign scouts to tenting groups based on Scouting America policies.
    - Scouts must be within max_age_difference years of each other
    - Scouts of different genders cannot share a tent
    - Prefers keeping patrol members together
    - Groups of 2-3 (2 preferred, 3 if odd number of scouts)
    """
    # Verify outing exists
    outing = await crud_outing.get_outing(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Get all unassigned scouts
    unassigned = await crud_tenting_group.get_unassigned_scouts(db, outing_id)
    
    if not unassigned:
        # Return existing groups
        tenting_groups = await crud_tenting_group.get_tenting_groups_by_outing(db, outing_id)
        return TentingGroupListResponse(
            tenting_groups=[_build_tenting_group_response(tg) for tg in tenting_groups],
            total=len(tenting_groups)
        )
    
    # Build scout data for grouping
    scouts_data = []
    for participant in unassigned:
        family_member = participant.family_member
        age = None
        gender = None
        patrol_name = None
        
        if family_member:
            if family_member.date_of_birth:
                age = _calculate_age(family_member.date_of_birth)
            gender = family_member.gender
            patrol_name = family_member.patrol_name
        
        scouts_data.append({
            'participant': participant,
            'id': participant.id,
            'name': participant.name,
            'age': age,
            'gender': gender or 'unknown',
            'patrol': patrol_name or 'unassigned',
        })
    
    # Group by gender first (required by policy)
    gender_groups = {}
    for scout in scouts_data:
        gender = scout['gender']
        if gender not in gender_groups:
            gender_groups[gender] = []
        gender_groups[gender].append(scout)
    
    tents_to_create = []
    tent_number = 1
    
    for gender, gender_scouts in gender_groups.items():
        # Sort by patrol if keeping patrols together, then by age
        if request.keep_patrols_together:
            gender_scouts.sort(key=lambda s: (s['patrol'], s['age'] or 0))
        else:
            gender_scouts.sort(key=lambda s: s['age'] or 0)
        
        # Group by age compatibility
        remaining_scouts = gender_scouts.copy()
        
        while remaining_scouts:
            tent_scouts = [remaining_scouts.pop(0)]
            base_age = tent_scouts[0]['age']
            base_patrol = tent_scouts[0]['patrol']
            
            # Try to fill tent with compatible scouts
            for scout in remaining_scouts.copy():
                if len(tent_scouts) >= request.tent_size_max:
                    break
                
                # Check age compatibility
                scout_age = scout['age']
                if base_age is not None and scout_age is not None:
                    if abs(scout_age - base_age) > request.max_age_difference:
                        continue
                
                # Prefer same patrol, but allow different patrol members if needed to fill tent
                if request.keep_patrols_together and scout['patrol'] != base_patrol:
                    # Only add non-patrol members if we need to fill the tent to minimum size
                    # or if we can't find any same-patrol members
                    if len(tent_scouts) < request.tent_size_max:
                        # Try to fill with patrol members first, then others
                        same_patrol_available = any(
                            s['patrol'] == base_patrol 
                            for s in remaining_scouts 
                            if s != scout
                        )
                        if not same_patrol_available or len(tent_scouts) < request.tent_size_min:
                            remaining_scouts.remove(scout)
                            tent_scouts.append(scout)
                else:
                    remaining_scouts.remove(scout)
                    tent_scouts.append(scout)
            
            # If we couldn't find enough compatible scouts from remaining, 
            # add anyway (better than leaving scouts unassigned)
            while len(tent_scouts) < request.tent_size_min and remaining_scouts:
                scout = remaining_scouts.pop(0)
                tent_scouts.append(scout)
            
            # Name the tent
            gender_prefix = ""
            if gender == 'male':
                gender_prefix = "Boys "
            elif gender == 'female':
                gender_prefix = "Girls "
            
            tent_name = f"{gender_prefix}Tent {tent_number}"
            tent_number += 1
            
            tents_to_create.append({
                'name': tent_name,
                'members': tent_scouts
            })
    
    # Create the tenting groups
    for tent_data in tents_to_create:
        tenting_group_in = TentingGroupCreate(
            outing_id=outing_id,
            name=tent_data['name'],
            member_ids=[s['id'] for s in tent_data['members']]
        )
        await crud_tenting_group.create_tenting_group(db, tenting_group_in)
    
    # Return all groups (including previously existing ones)
    all_groups = await crud_tenting_group.get_tenting_groups_by_outing(db, outing_id)
    
    return TentingGroupListResponse(
        tenting_groups=[_build_tenting_group_response(tg) for tg in all_groups],
        total=len(all_groups)
    )
