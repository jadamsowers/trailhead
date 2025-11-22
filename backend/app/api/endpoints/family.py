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
from app.models.family import FamilyMember, FamilyMemberDietaryPreference, FamilyMemberAllergy
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
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.user_id == current_user.id)
        .options(
            selectinload(FamilyMember.dietary_preferences),
            selectinload(FamilyMember.allergies)
        )
        .order_by(FamilyMember.created_at)
    )
    members = result.scalars().all()
    
    return FamilyMemberListResponse(
        members=[FamilyMemberResponse.model_validate(member) for member in members],
        total=len(members)
    )


@router.get("/summary", response_model=List[FamilyMemberSummary])
async def list_family_members_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a simplified list of family members for selection during signup.
    Returns basic information without detailed medical/dietary data.
    """
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.user_id == current_user.id)
        .order_by(FamilyMember.member_type, FamilyMember.name)
    )
    members = result.scalars().all()
    
    summaries = []
    for member in members:
        age = None
        if member.date_of_birth:
            today = date.today()
            age = today.year - member.date_of_birth.year - (
                (today.month, today.day) < (member.date_of_birth.month, member.date_of_birth.day)
            )
        
        # Check if youth protection is expired (for adults)
        youth_protection_expired = None
        if member.member_type == 'adult' and member.has_youth_protection and member.youth_protection_expiration:
            youth_protection_expired = member.youth_protection_expiration < date.today()
        
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
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.id == member_id, FamilyMember.user_id == current_user.id)
        .options(
            selectinload(FamilyMember.dietary_preferences),
            selectinload(FamilyMember.allergies)
        )
    )
    member = result.scalar_one_or_none()
    
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
    # Create the family member
    member = FamilyMember(
        user_id=current_user.id,
        name=member_data.name,
        member_type=member_data.member_type,
        date_of_birth=member_data.date_of_birth,
        troop_number=member_data.troop_number,
        patrol_name=member_data.patrol_name,
        has_youth_protection=member_data.has_youth_protection,
        youth_protection_expiration=member_data.youth_protection_expiration,
        vehicle_capacity=member_data.vehicle_capacity,
        medical_notes=member_data.medical_notes,
    )
    db.add(member)
    await db.flush()  # Get the member ID
    
    # Add dietary preferences
    for pref in member_data.dietary_preferences:
        dietary_pref = FamilyMemberDietaryPreference(
            family_member_id=member.id,
            preference=pref
        )
        db.add(dietary_pref)
    
    # Add allergies
    for allergy_data in member_data.allergies:
        allergy = FamilyMemberAllergy(
            family_member_id=member.id,
            allergy=allergy_data.allergy,
            severity=allergy_data.severity
        )
        db.add(allergy)
    
    await db.commit()
    await db.refresh(member)
    
    # Reload with relationships
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.id == member.id)
        .options(
            selectinload(FamilyMember.dietary_preferences),
            selectinload(FamilyMember.allergies)
        )
    )
    member = result.scalar_one()
    
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
    # Get the member
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.id == member_id, FamilyMember.user_id == current_user.id)
        .options(
            selectinload(FamilyMember.dietary_preferences),
            selectinload(FamilyMember.allergies)
        )
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    
    # Update basic fields
    update_data = member_data.model_dump(exclude_unset=True, exclude={'dietary_preferences', 'allergies'})
    for field, value in update_data.items():
        setattr(member, field, value)
    
    # Update dietary preferences if provided
    if member_data.dietary_preferences is not None:
        # Remove existing preferences
        await db.execute(
            select(FamilyMemberDietaryPreference)
            .where(FamilyMemberDietaryPreference.family_member_id == member.id)
        )
        for pref in member.dietary_preferences:
            await db.delete(pref)
        
        # Add new preferences
        for pref in member_data.dietary_preferences:
            dietary_pref = FamilyMemberDietaryPreference(
                family_member_id=member.id,
                preference=pref
            )
            db.add(dietary_pref)
    
    # Update allergies if provided
    if member_data.allergies is not None:
        # Remove existing allergies
        for allergy in member.allergies:
            await db.delete(allergy)
        
        # Add new allergies
        for allergy_data in member_data.allergies:
            allergy = FamilyMemberAllergy(
                family_member_id=member.id,
                allergy=allergy_data.allergy,
                severity=allergy_data.severity
            )
            db.add(allergy)
    
    await db.commit()
    await db.refresh(member)
    
    # Reload with relationships
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.id == member.id)
        .options(
            selectinload(FamilyMember.dietary_preferences),
            selectinload(FamilyMember.allergies)
        )
    )
    member = result.scalar_one()
    
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
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.id == member_id, FamilyMember.user_id == current_user.id)
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found"
        )
    
    await db.delete(member)
    await db.commit()
    
    return None