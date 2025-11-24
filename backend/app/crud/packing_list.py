from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.models.packing_list import (
    PackingListTemplate,
    PackingListTemplateItem,
    OutingPackingList,
    OutingPackingListItem,
)
from app.schemas.packing_list import (
    PackingListTemplateCreate,
    OutingPackingListCreate,
    OutingPackingListItemCreate,
    OutingPackingListItemUpdate,
)


# Template CRUD operations
async def get_templates(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[PackingListTemplate]:
    """Get all packing list templates"""
    result = await db.execute(
        select(PackingListTemplate)
        .offset(skip)
        .limit(limit)
        .order_by(PackingListTemplate.name)
    )
    return result.scalars().all()


async def get_template(db: AsyncSession, template_id: UUID) -> Optional[PackingListTemplate]:
    """Get a single packing list template with its items"""
    result = await db.execute(
        select(PackingListTemplate)
        .options(selectinload(PackingListTemplate.items))
        .where(PackingListTemplate.id == template_id)
    )
    return result.scalar_one_or_none()


async def get_template_items(db: AsyncSession, template_id: UUID) -> List[PackingListTemplateItem]:
    """Get all items for a template"""
    result = await db.execute(
        select(PackingListTemplateItem)
        .where(PackingListTemplateItem.template_id == template_id)
        .order_by(PackingListTemplateItem.sort_order, PackingListTemplateItem.name)
    )
    return result.scalars().all()


async def create_template(db: AsyncSession, template_data: PackingListTemplateCreate) -> PackingListTemplate:
    """Create a new packing list template"""
    db_template = PackingListTemplate(**template_data.model_dump())
    db.add(db_template)
    await db.flush()
    await db.commit()
    await db.refresh(db_template)
    return db_template


# Outing Packing List CRUD operations
async def create_outing_packing_list(
    db: AsyncSession,
    outing_id: UUID,
    packing_list_data: OutingPackingListCreate
) -> OutingPackingList:
    """Create a packing list for an outing, optionally copying from a template"""
    # Create the outing packing list
    db_packing_list = OutingPackingList(
        outing_id=outing_id,
        template_id=packing_list_data.template_id
    )
    db.add(db_packing_list)
    await db.flush()
    
    # If a template was specified, copy its items
    if packing_list_data.template_id:
        template_items = await get_template_items(db, packing_list_data.template_id)
        for item in template_items:
            db_item = OutingPackingListItem(
                outing_packing_list_id=db_packing_list.id,
                name=item.name,
                quantity=item.quantity,
                checked=False
            )
            db.add(db_item)
    
    await db.commit()
    await db.refresh(db_packing_list)
    
    # Load relationships
    result = await db.execute(
        select(OutingPackingList)
        .options(
            selectinload(OutingPackingList.template),
            selectinload(OutingPackingList.items)
        )
        .where(OutingPackingList.id == db_packing_list.id)
    )
    return result.scalar_one()


async def get_outing_packing_lists(db: AsyncSession, outing_id: UUID) -> List[OutingPackingList]:
    """Get all packing lists for an outing"""
    result = await db.execute(
        select(OutingPackingList)
        .options(
            selectinload(OutingPackingList.template),
            selectinload(OutingPackingList.items)
        )
        .where(OutingPackingList.outing_id == outing_id)
    )
    return result.scalars().all()


async def get_outing_packing_list(db: AsyncSession, packing_list_id: UUID) -> Optional[OutingPackingList]:
    """Get a single outing packing list"""
    result = await db.execute(
        select(OutingPackingList)
        .options(
            selectinload(OutingPackingList.template),
            selectinload(OutingPackingList.items)
        )
        .where(OutingPackingList.id == packing_list_id)
    )
    return result.scalar_one_or_none()


async def delete_outing_packing_list(db: AsyncSession, packing_list_id: UUID) -> bool:
    """Delete an outing packing list"""
    result = await db.execute(
        select(OutingPackingList).where(OutingPackingList.id == packing_list_id)
    )
    packing_list = result.scalar_one_or_none()
    if not packing_list:
        return False
    
    await db.delete(packing_list)
    await db.commit()
    return True


# Outing Packing List Item CRUD operations
async def add_custom_item(
    db: AsyncSession,
    packing_list_id: UUID,
    item_data: OutingPackingListItemCreate
) -> OutingPackingListItem:
    """Add a custom item to an outing packing list"""
    db_item = OutingPackingListItem(
        outing_packing_list_id=packing_list_id,
        **item_data.model_dump()
    )
    db.add(db_item)
    await db.flush()
    await db.commit()
    await db.refresh(db_item)
    return db_item


async def update_item(
    db: AsyncSession,
    item_id: UUID,
    updates: OutingPackingListItemUpdate
) -> Optional[OutingPackingListItem]:
    """Update an outing packing list item"""
    result = await db.execute(
        select(OutingPackingListItem).where(OutingPackingListItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        return None
    
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    
    await db.commit()
    await db.refresh(item)
    return item


async def delete_item(db: AsyncSession, item_id: UUID) -> bool:
    """Delete an outing packing list item"""
    result = await db.execute(
        select(OutingPackingListItem).where(OutingPackingListItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        return False
    
    await db.delete(item)
    await db.commit()
    return True


async def get_item(db: AsyncSession, item_id: UUID) -> Optional[OutingPackingListItem]:
    """Get a single packing list item"""
    result = await db.execute(
        select(OutingPackingListItem).where(OutingPackingListItem.id == item_id)
    )
    return result.scalar_one_or_none()
