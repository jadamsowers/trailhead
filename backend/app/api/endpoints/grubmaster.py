from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional, List
from decimal import Decimal

from app.api.deps import get_current_outing_admin_user
from app.db.session import get_db
from app.models.user import User
from app.models.outing import Outing
from app.models.signup import Signup
from app.models.participant import Participant
from app.models.eating_group import EatingGroup, EatingGroupMember
from app.crud import eating_group as crud_eating_group
from app.crud import outing as crud_outing
from app.crud import signup as crud_signup
from app.crud import troop as crud_troop
from app.schemas.eating_group import (
    EatingGroupCreate,
    EatingGroupUpdate,
    EatingGroupResponse,
    EatingGroupListResponse,
    EatingGroupMemberCreate,
    EatingGroupMemberResponse,
    GrubmasterSummaryResponse,
    GrubmasterSummaryParticipant,
    MoveParticipantRequest,
    AutoAssignRequest,
    EatingGroupEmailRequest,
)

router = APIRouter()


def _build_eating_group_response(eating_group: EatingGroup) -> EatingGroupResponse:
    """Convert EatingGroup model to response schema"""
    members = []
    for member in eating_group.members:
        participant = member.participant
        family_member = participant.family_member if participant else None
        
        dietary_restrictions = []
        allergies = []
        if family_member:
            dietary_restrictions = [dp.preference for dp in family_member.dietary_preferences]
            allergies = [a.allergy for a in family_member.allergies]
        
        members.append(EatingGroupMemberResponse(
            id=member.id,
            participant_id=member.participant_id,
            is_grubmaster=member.is_grubmaster,
            created_at=member.created_at,
            participant_name=participant.name if participant else None,
            patrol_name=participant.patrol_name if participant else None,
            dietary_restrictions=dietary_restrictions,
            allergies=allergies,
        ))
    
    return EatingGroupResponse(
        id=eating_group.id,
        outing_id=eating_group.outing_id,
        name=eating_group.name,
        notes=eating_group.notes,
        members=members,
        member_count=len(members),
        grubmaster_count=sum(1 for m in members if m.is_grubmaster),
        created_at=eating_group.created_at,
        updated_at=eating_group.updated_at,
    )


@router.get("/{outing_id}/grubmaster", response_model=GrubmasterSummaryResponse)
async def get_grubmaster_summary(
    outing_id: UUID,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive grubmaster management summary for an outing.
    Includes all participants, eating groups, and grubmaster requests.
    """
    # Get outing
    outing = await crud_outing.get_outing(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Get eating groups
    eating_groups = await crud_eating_group.get_eating_groups_by_outing(db, outing_id)
    eating_group_responses = [_build_eating_group_response(eg) for eg in eating_groups]
    
    # Get all signups for the outing
    signups = await crud_signup.get_outing_signups(db, outing_id)
    
    # Get treasurer email from troop if available
    treasurer_email = None
    if outing.restricted_troop_id:
        troop = await crud_troop.get_troop(db, outing.restricted_troop_id)
        if troop:
            treasurer_email = troop.treasurer_email
    
    # Build participant summaries
    participants = []
    unassigned_count = 0
    grubmaster_requests_count = 0
    
    # Create map of participant_id to eating group membership
    participant_groups = {}
    for eg in eating_groups:
        for member in eg.members:
            participant_groups[member.participant_id] = {
                'eating_group_id': eg.id,
                'eating_group_name': eg.name,
                'is_grubmaster': member.is_grubmaster,
            }
    
    for signup in signups:
        for participant in signup.participants:
            family_member = participant.family_member
            
            dietary_restrictions = []
            allergies = []
            if family_member:
                dietary_restrictions = [dp.preference for dp in family_member.dietary_preferences]
                allergies = [a.allergy for a in family_member.allergies]
            
            group_info = participant_groups.get(participant.id, {})
            
            is_in_group = participant.id in participant_groups
            if not is_in_group:
                unassigned_count += 1
            
            if participant.grubmaster_interest:
                grubmaster_requests_count += 1
            
            participants.append(GrubmasterSummaryParticipant(
                participant_id=participant.id,
                name=participant.name,
                patrol_name=participant.patrol_name,
                troop_number=participant.troop_number,
                grubmaster_interest=participant.grubmaster_interest,
                grubmaster_reason=participant.grubmaster_reason,
                dietary_restrictions=dietary_restrictions,
                allergies=allergies,
                eating_group_id=group_info.get('eating_group_id'),
                eating_group_name=group_info.get('eating_group_name'),
                is_grubmaster=group_info.get('is_grubmaster', False),
            ))
    
    # Calculate total budget
    total_budget = None
    if outing.food_budget_per_person:
        if outing.budget_type == 'per_meal' and outing.meal_count:
            total_budget = float(outing.food_budget_per_person) * outing.meal_count
        else:
            total_budget = float(outing.food_budget_per_person)
    
    return GrubmasterSummaryResponse(
        outing_id=outing.id,
        outing_name=outing.name,
        food_budget_per_person=float(outing.food_budget_per_person) if outing.food_budget_per_person else None,
        meal_count=outing.meal_count,
        budget_type=outing.budget_type,
        total_budget=total_budget,
        treasurer_email=treasurer_email,
        participants=participants,
        eating_groups=eating_group_responses,
        unassigned_count=unassigned_count,
        grubmaster_requests_count=grubmaster_requests_count,
    )


@router.get("/{outing_id}/eating-groups", response_model=EatingGroupListResponse)
async def get_eating_groups(
    outing_id: UUID,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all eating groups for an outing."""
    # Verify outing exists
    outing = await crud_outing.get_outing(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    eating_groups = await crud_eating_group.get_eating_groups_by_outing(db, outing_id)
    eating_group_responses = [_build_eating_group_response(eg) for eg in eating_groups]
    
    return EatingGroupListResponse(
        eating_groups=eating_group_responses,
        total=len(eating_group_responses)
    )


@router.post("/{outing_id}/eating-groups", response_model=EatingGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_eating_group(
    outing_id: UUID,
    eating_group_in: EatingGroupCreate,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new eating group for an outing."""
    # Verify outing exists
    outing = await crud_outing.get_outing(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Ensure outing_id matches
    if eating_group_in.outing_id != outing_id:
        eating_group_in.outing_id = outing_id
    
    eating_group = await crud_eating_group.create_eating_group(db, eating_group_in)
    return _build_eating_group_response(eating_group)


@router.put("/{outing_id}/eating-groups/{eating_group_id}", response_model=EatingGroupResponse)
async def update_eating_group(
    outing_id: UUID,
    eating_group_id: UUID,
    eating_group_in: EatingGroupUpdate,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an eating group."""
    eating_group = await crud_eating_group.get_eating_group(db, eating_group_id)
    if not eating_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Eating group not found"
        )
    
    if eating_group.outing_id != outing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eating group does not belong to this outing"
        )
    
    updated = await crud_eating_group.update_eating_group(db, eating_group_id, eating_group_in)
    return _build_eating_group_response(updated)


@router.delete("/{outing_id}/eating-groups/{eating_group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_eating_group(
    outing_id: UUID,
    eating_group_id: UUID,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an eating group."""
    eating_group = await crud_eating_group.get_eating_group(db, eating_group_id)
    if not eating_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Eating group not found"
        )
    
    if eating_group.outing_id != outing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eating group does not belong to this outing"
        )
    
    await crud_eating_group.delete_eating_group(db, eating_group_id)
    return None


@router.post("/{outing_id}/eating-groups/{eating_group_id}/members", response_model=EatingGroupMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member_to_eating_group(
    outing_id: UUID,
    eating_group_id: UUID,
    member_in: EatingGroupMemberCreate,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a participant to an eating group."""
    eating_group = await crud_eating_group.get_eating_group(db, eating_group_id)
    if not eating_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Eating group not found"
        )
    
    if eating_group.outing_id != outing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eating group does not belong to this outing"
        )
    
    member = await crud_eating_group.add_member_to_eating_group(db, eating_group_id, member_in)
    
    return EatingGroupMemberResponse(
        id=member.id,
        participant_id=member.participant_id,
        is_grubmaster=member.is_grubmaster,
        created_at=member.created_at,
        participant_name=None,
        patrol_name=None,
        dietary_restrictions=[],
        allergies=[],
    )


@router.post("/{outing_id}/move-participant", response_model=dict)
async def move_participant(
    outing_id: UUID,
    request: MoveParticipantRequest,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Move a participant to a different eating group or remove from all groups."""
    # Verify outing exists
    outing = await crud_outing.get_outing(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # If moving to a group, verify it belongs to this outing
    if request.target_eating_group_id:
        target_group = await crud_eating_group.get_eating_group(db, request.target_eating_group_id)
        if not target_group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target eating group not found"
            )
        if target_group.outing_id != outing_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target eating group does not belong to this outing"
            )
    
    success = await crud_eating_group.move_participant_to_group(
        db,
        request.participant_id,
        request.target_eating_group_id,
        request.is_grubmaster
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to move participant"
        )
    
    return {"message": "Participant moved successfully"}


@router.post("/{outing_id}/set-grubmaster", response_model=dict)
async def set_participant_grubmaster(
    outing_id: UUID,
    participant_id: UUID,
    is_grubmaster: bool = True,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Set or unset a participant as grubmaster for their eating group."""
    result = await crud_eating_group.set_grubmaster(db, participant_id, is_grubmaster)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant is not in an eating group"
        )
    
    return {"message": f"Grubmaster status {'set' if is_grubmaster else 'unset'} successfully"}


@router.post("/{outing_id}/auto-assign", response_model=EatingGroupListResponse)
async def auto_assign_eating_groups(
    outing_id: UUID,
    request: AutoAssignRequest,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Automatically assign participants to eating groups based on preferences.
    Groups by patrol if requested, and tries to group similar dietary needs.
    """
    # Verify outing exists
    outing = await crud_outing.get_outing(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Get all unassigned participants
    unassigned = await crud_eating_group.get_unassigned_participants(db, outing_id)
    
    if not unassigned:
        # Return existing groups
        eating_groups = await crud_eating_group.get_eating_groups_by_outing(db, outing_id)
        return EatingGroupListResponse(
            eating_groups=[_build_eating_group_response(eg) for eg in eating_groups],
            total=len(eating_groups)
        )
    
    # Get grubmaster requests
    grubmaster_requests = await crud_eating_group.get_grubmaster_requests(db, outing_id)
    grubmaster_ids = {p.id for p in grubmaster_requests}
    
    # Group participants
    groups_to_create = []
    
    if request.keep_patrols_together:
        # Group by patrol first
        patrol_groups = {}
        no_patrol = []
        
        for participant in unassigned:
            patrol = participant.patrol_name
            if patrol:
                if patrol not in patrol_groups:
                    patrol_groups[patrol] = []
                patrol_groups[patrol].append(participant)
            else:
                no_patrol.append(participant)
        
        # Create groups for each patrol
        group_num = 1
        for patrol_name, patrol_members in patrol_groups.items():
            # Check if patrol needs to be split (too large)
            while len(patrol_members) > request.group_size_max:
                group = patrol_members[:request.group_size_max]
                patrol_members = patrol_members[request.group_size_max:]
                groups_to_create.append({
                    'name': f"{patrol_name} Group {group_num}",
                    'members': group
                })
                group_num += 1
            
            if patrol_members:
                groups_to_create.append({
                    'name': f"{patrol_name} Group",
                    'members': patrol_members
                })
        
        # Handle participants without patrol
        if no_patrol:
            group_num = 1
            while len(no_patrol) > request.group_size_max:
                group = no_patrol[:request.group_size_max]
                no_patrol = no_patrol[request.group_size_max:]
                groups_to_create.append({
                    'name': f"Group {group_num}",
                    'members': group
                })
                group_num += 1
            
            if no_patrol:
                groups_to_create.append({
                    'name': f"Group {group_num}",
                    'members': no_patrol
                })
    else:
        # Simple grouping by size
        group_num = 1
        current_group = []
        
        for participant in unassigned:
            current_group.append(participant)
            if len(current_group) >= request.group_size_max:
                groups_to_create.append({
                    'name': f"Group {group_num}",
                    'members': current_group
                })
                current_group = []
                group_num += 1
        
        if current_group:
            groups_to_create.append({
                'name': f"Group {group_num}",
                'members': current_group
            })
    
    # Create the eating groups and assign members
    created_groups = []
    for group_data in groups_to_create:
        # Find a grubmaster for this group (prefer those who requested)
        grubmaster_id = None
        for member in group_data['members']:
            if member.id in grubmaster_ids:
                grubmaster_id = member.id
                break
        
        # Create the group
        eating_group_in = EatingGroupCreate(
            outing_id=outing_id,
            name=group_data['name'],
            member_ids=[m.id for m in group_data['members']]
        )
        eating_group = await crud_eating_group.create_eating_group(db, eating_group_in)
        
        # Set grubmaster if found
        if grubmaster_id:
            await crud_eating_group.set_grubmaster(db, grubmaster_id, True)
            # Refresh the group
            eating_group = await crud_eating_group.get_eating_group(db, eating_group.id)
        
        created_groups.append(eating_group)
    
    # Return all groups (including previously existing ones)
    all_groups = await crud_eating_group.get_eating_groups_by_outing(db, outing_id)
    
    return EatingGroupListResponse(
        eating_groups=[_build_eating_group_response(eg) for eg in all_groups],
        total=len(all_groups)
    )


@router.post("/{outing_id}/send-eating-group-emails", response_model=dict)
async def send_eating_group_emails(
    outing_id: UUID,
    request: EatingGroupEmailRequest,
    current_user: User = Depends(get_current_outing_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate email content for eating groups.
    Returns mailto links for each group's grubmaster with group details.
    """
    # Verify outing exists
    outing = await crud_outing.get_outing(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Get eating groups
    eating_groups = await crud_eating_group.get_eating_groups_by_outing(db, outing_id)
    
    # Filter to specific groups if requested
    if request.eating_group_ids:
        eating_groups = [eg for eg in eating_groups if eg.id in request.eating_group_ids]
    
    # Get treasurer email
    treasurer_email = None
    if outing.restricted_troop_id:
        troop = await crud_troop.get_troop(db, outing.restricted_troop_id)
        if troop:
            treasurer_email = troop.treasurer_email
    
    # Calculate budget per person
    budget_per_person = None
    if outing.food_budget_per_person:
        if outing.budget_type == 'per_meal' and outing.meal_count:
            budget_per_person = float(outing.food_budget_per_person) * outing.meal_count
        else:
            budget_per_person = float(outing.food_budget_per_person)
    
    # Build email data for each group
    email_data = []
    for eating_group in eating_groups:
        # Find grubmaster email(s)
        grubmaster_emails = []
        member_names = []
        dietary_info = []
        
        for member in eating_group.members:
            participant = member.participant
            family_member = participant.family_member if participant else None
            
            member_names.append(participant.name if participant else "Unknown")
            
            if family_member:
                restrictions = [dp.preference for dp in family_member.dietary_preferences]
                allergies = [a.allergy for a in family_member.allergies]
                
                if restrictions or allergies:
                    info_parts = []
                    if restrictions:
                        info_parts.append(f"Diet: {', '.join(restrictions)}")
                    if allergies:
                        info_parts.append(f"Allergies: {', '.join(allergies)}")
                    dietary_info.append(f"{participant.name}: {'; '.join(info_parts)}")
            
            if member.is_grubmaster:
                # Get the family contact email for the grubmaster's signup
                signup = participant.signup if participant else None
                if signup and signup.family_contact_email:
                    grubmaster_emails.append(signup.family_contact_email)
        
        # Build email body
        body_parts = [
            f"Eating Group: {eating_group.name}",
            f"Outing: {outing.name}",
            "",
            "Group Members:",
        ]
        body_parts.extend([f"- {name}" for name in member_names])
        
        if request.include_dietary_info and dietary_info:
            body_parts.extend(["", "Dietary Considerations:"])
            body_parts.extend([f"- {info}" for info in dietary_info])
        
        if request.include_budget_info and budget_per_person:
            group_budget = budget_per_person * len(eating_group.members)
            body_parts.extend([
                "",
                f"Food Budget: ${budget_per_person:.2f} per person",
                f"Total Group Budget: ${group_budget:.2f}",
            ])
            if treasurer_email:
                body_parts.append(f"Send receipts to: {treasurer_email}")
        
        if request.custom_message:
            body_parts.extend(["", "Additional Notes:", request.custom_message])
        
        body = "\n".join(body_parts)
        subject = f"{outing.name} - {eating_group.name} Grubmaster Information"
        
        email_data.append({
            "eating_group_id": str(eating_group.id),
            "eating_group_name": eating_group.name,
            "grubmaster_emails": grubmaster_emails,
            "subject": subject,
            "body": body,
            "member_count": len(eating_group.members),
        })
    
    return {
        "message": "Email data generated",
        "outing_name": outing.name,
        "groups": email_data,
        "treasurer_email": treasurer_email,
    }
