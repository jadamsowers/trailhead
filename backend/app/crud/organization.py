from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from uuid import UUID

from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from app.services.change_log import record_change, compute_payload_hash


async def get_organization(db: AsyncSession, organization_id: UUID) -> Optional[Organization]:
    """Get organization by ID"""
    result = await db.execute(
        select(Organization).where(Organization.id == organization_id)
    )
    return result.scalar_one_or_none()


async def get_organizations(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100
) -> tuple[List[Organization], int]:
    """Get list of organizations with pagination"""
    # Get total count
    count_result = await db.execute(select(Organization))
    total = len(count_result.scalars().all())
    
    # Get paginated results
    result = await db.execute(
        select(Organization)
        .offset(skip)
        .limit(limit)
        .order_by(Organization.created_at.desc())
    )
    organizations = result.scalars().all()
    
    return list(organizations), total


async def create_organization(
    db: AsyncSession, 
    organization_in: OrganizationCreate
) -> Organization:
    """Create a new organization"""
    organization = Organization(
        name=organization_in.name,
        description=organization_in.description,
        is_setup_complete=False,
    )
    db.add(organization)
    await db.flush()
    
    payload_hash = compute_payload_hash(organization, ["name", "description"])
    await record_change(
        db, 
        entity_type="organization", 
        entity_id=organization.id, 
        op_type="create", 
        payload_hash=payload_hash
    )
    
    await db.commit()
    await db.refresh(organization)
    return organization


async def update_organization(
    db: AsyncSession,
    organization_id: UUID,
    organization_in: OrganizationUpdate
) -> Optional[Organization]:
    """Update an organization"""
    organization = await get_organization(db, organization_id)
    if not organization:
        return None
    
    update_data = organization_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(organization, field, value)
    
    await db.flush()
    
    payload_hash = compute_payload_hash(organization, list(update_data.keys()))
    await record_change(
        db, 
        entity_type="organization", 
        entity_id=organization.id, 
        op_type="update", 
        payload_hash=payload_hash
    )
    
    await db.commit()
    await db.refresh(organization)
    return organization


async def delete_organization(db: AsyncSession, organization_id: UUID) -> bool:
    """Delete an organization"""
    organization = await get_organization(db, organization_id)
    if not organization:
        return False
    
    await record_change(
        db, 
        entity_type="organization", 
        entity_id=organization.id, 
        op_type="delete", 
        payload_hash=""
    )
    
    await db.delete(organization)
    await db.commit()
    return True


async def mark_setup_complete(db: AsyncSession, organization_id: UUID) -> Optional[Organization]:
    """Mark organization setup as complete"""
    organization = await get_organization(db, organization_id)
    if not organization:
        return None
    
    organization.is_setup_complete = True
    
    await db.flush()
    
    payload_hash = compute_payload_hash(organization, ["is_setup_complete"])
    await record_change(
        db, 
        entity_type="organization", 
        entity_id=organization.id, 
        op_type="update", 
        payload_hash=payload_hash
    )
    
    await db.commit()
    await db.refresh(organization)
    return organization
