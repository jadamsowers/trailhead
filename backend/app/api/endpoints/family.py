"""
Family management endpoints for parents to manage their family members
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import date

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.family import FamilyMember
from app.crud import family as crud_family
from app.schemas.family import (
    FamilyMemberCreate,
    FamilyMemberUpdate,
    FamilyMemberResponse,
    FamilyMemberListResponse,
    FamilyMemberSummary,
)

router = APIRouter()


@router.get("/", response_model=FamilyMemberListResponse)
async def list_family_members(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all family members for the current user.
    Returns a list of family members with their dietary preferences and allergies.
    """
    members = await crud_family.get_family_members_for_user(db, current_user.id)
    return FamilyMemberListResponse(
        members=[FamilyMemberResponse.model_validate(member) for member in members],
        total=len(members)
    )


@router.get("/summary", response_model=List[FamilyMemberSummary])
async def list_family_members_summary(
    outing_id: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a simplified list of family members for selection during signup.
    Returns basic information without detailed medical/dietary data.
    
    If outing_id is provided, youth protection expiration is checked against
    the outing's end date (or outing date if no end date). Otherwise, it's
    checked against today's date.
    """
    print(f"📋 Getting family member summary for user: {current_user.email} (ID: {current_user.id})")
    
    members = await crud_family.get_family_members_for_user(db, current_user.id)
    
    print(f"   Found {len(members)} family members")
    for member in members:
        print(f"   - {member.name} ({member.member_type})")
    
    # Get outing end date if outing_id is provided
    comparison_date = date.today()
    if outing_id:
        from app.models.outing import Outing
        outing_result = await db.execute(
            select(Outing).where(Outing.id == outing_id)
        )
        outing = outing_result.scalar_one_or_none()
        if outing:
            # Use end_date if available, otherwise use outing_date
            comparison_date = outing.end_date if outing.end_date else outing.outing_date
    
    summaries = []
    for member in members:
        age = None
        if member.date_of_birth:
            today = date.today()
            age = today.year - member.date_of_birth.year - (
                (today.month, today.day) < (member.date_of_birth.month, member.date_of_birth.day)
            )
        
        # Check if youth protection is expired (for adults)
        # Compare against outing end date if provided, otherwise today
        youth_protection_expired = None
        if member.member_type == 'adult' and member.has_youth_protection and member.youth_protection_expiration:
            youth_protection_expired = member.youth_protection_expiration < comparison_date
        
        summaries.append(FamilyMemberSummary(
            id=member.id,
            name=member.name,
            member_type=member.member_type,
            troop_number=member.troop_number,
            age=age,
            vehicle_capacity=member.vehicle_capacity if member.member_type == 'adult' else None,
            has_youth_protection=member.has_youth_protection if member.member_type == 'adult' else None,
            youth_protection_expired=youth_protection_expired
        ))
    
    return summaries


@router.get("/{member_id}", response_model=FamilyMemberResponse)
async def get_family_member(
    member_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific family member by ID.
    Only returns members belonging to the current user.
    """
    member = await crud_family.get_family_member(db, member_id, current_user.id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    return FamilyMemberResponse.model_validate(member)


@router.post("/", response_model=FamilyMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_family_member(
    member_data: FamilyMemberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new family member.
    Includes dietary preferences and allergies.
    """
    member = await crud_family.create_family_member(db, current_user.id, member_data)
    return FamilyMemberResponse.model_validate(member)


@router.put("/{member_id}", response_model=FamilyMemberResponse)
async def update_family_member(
    member_id: str,
    member_data: FamilyMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an existing family member.
    Only the owner can update their family members.
    """
    member = await crud_family.update_family_member(db, member_id, current_user.id, member_data)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    return FamilyMemberResponse.model_validate(member)


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family_member(
    member_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a family member.
    Only the owner can delete their family members.
    """
    success = await crud_family.delete_family_member(db, member_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    return None