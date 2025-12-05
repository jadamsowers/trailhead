from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_user, get_current_admin_user
from app.models.user import User
from app.crud import organization as crud_organization
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationListResponse,
)

router = APIRouter()


@router.get("/organizations", response_model=OrganizationListResponse)
async def list_organizations(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all organizations (admin only in production, allow all for setup)"""
    organizations, total = await crud_organization.get_organizations(db, skip=skip, limit=limit)
    return OrganizationListResponse(organizations=organizations, total=total)


@router.post("/organizations", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    organization_in: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new organization - available to any authenticated user for initial setup"""
    organization = await crud_organization.create_organization(db, organization_in)
    
    # Automatically assign the creating user to this organization
    if not current_user.organization_id:
        current_user.organization_id = organization.id
        await db.commit()
        await db.refresh(current_user)
    
    return organization


@router.get("/organizations/{organization_id}", response_model=OrganizationResponse)
async def get_organization(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get organization by ID"""
    organization = await crud_organization.get_organization(db, organization_id)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization


@router.put("/organizations/{organization_id}", response_model=OrganizationResponse)
async def update_organization(
    organization_id: UUID,
    organization_in: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update an organization (admin only)"""
    organization = await crud_organization.update_organization(db, organization_id, organization_in)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization


@router.post("/organizations/{organization_id}/complete-setup", response_model=OrganizationResponse)
async def complete_setup(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Mark organization setup as complete"""
    organization = await crud_organization.mark_setup_complete(db, organization_id)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization


@router.delete("/organizations/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete an organization (admin only)"""
    success = await crud_organization.delete_organization(db, organization_id)
    if not success:
        raise HTTPException(status_code=404, detail="Organization not found")
    return None
