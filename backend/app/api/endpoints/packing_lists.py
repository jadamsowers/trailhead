from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.outing import Outing
from app.crud import packing_list as crud_packing_list
from app.crud import outing as crud_outing
from app.schemas.packing_list import (
    PackingListTemplateResponse,
    PackingListTemplateWithItemsResponse,
    PackingListTemplateListResponse,
    OutingPackingListCreate,
    OutingPackingListResponse,
    OutingPackingListItemCreate,
    OutingPackingListItemUpdate,
    OutingPackingListItemResponse,
)

router = APIRouter()


# Template endpoints (public)
@router.get("/templates", response_model=PackingListTemplateListResponse)
async def list_templates(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all packing list templates.
    
    Public endpoint - no authentication required.
    """
    templates = await crud_packing_list.get_templates(db, skip=skip, limit=limit)
    return PackingListTemplateListResponse(
        items=templates,
        total=len(templates)
    )


@router.get("/templates/{template_id}", response_model=PackingListTemplateWithItemsResponse)
async def get_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a single packing list template with its items.
    
    Public endpoint - no authentication required.
    """
    template = await crud_packing_list.get_template(db, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    return template


# Outing packing list endpoints (authenticated)
@router.post("/outings/{outing_id}/packing-lists", response_model=OutingPackingListResponse, status_code=status.HTTP_201_CREATED)
async def create_outing_packing_list(
    outing_id: UUID,
    packing_list_data: OutingPackingListCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a packing list to an outing.
    
    Requires authentication. If template_id is provided, items will be copied from the template.
    """
    # Verify outing exists
    outing = await crud_outing.get(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    # Verify template exists if provided
    if packing_list_data.template_id:
        template = await crud_packing_list.get_template(db, packing_list_data.template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
    
    packing_list = await crud_packing_list.create_outing_packing_list(
        db, outing_id, packing_list_data
    )
    return packing_list


@router.get("/outings/{outing_id}/packing-lists", response_model=List[OutingPackingListResponse])
async def get_outing_packing_lists(
    outing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all packing lists for an outing.
    
    Requires authentication.
    """
    # Verify outing exists
    outing = await crud_outing.get(db, outing_id)
    if not outing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outing not found"
        )
    
    packing_lists = await crud_packing_list.get_outing_packing_lists(db, outing_id)
    return packing_lists


@router.delete("/outings/{outing_id}/packing-lists/{packing_list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_outing_packing_list(
    outing_id: UUID,
    packing_list_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an outing packing list.
    
    Requires authentication.
    """
    # Verify packing list exists and belongs to the outing
    packing_list = await crud_packing_list.get_outing_packing_list(db, packing_list_id)
    if not packing_list or packing_list.outing_id != outing_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Packing list not found"
        )
    
    await crud_packing_list.delete_outing_packing_list(db, packing_list_id)


# Packing list item endpoints
@router.post("/outings/{outing_id}/packing-lists/{packing_list_id}/items", response_model=OutingPackingListItemResponse, status_code=status.HTTP_201_CREATED)
async def add_packing_list_item(
    outing_id: UUID,
    packing_list_id: UUID,
    item_data: OutingPackingListItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a custom item to an outing packing list.
    
    Requires authentication.
    """
    # Verify packing list exists and belongs to the outing
    packing_list = await crud_packing_list.get_outing_packing_list(db, packing_list_id)
    if not packing_list or packing_list.outing_id != outing_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Packing list not found"
        )
    
    item = await crud_packing_list.add_custom_item(db, packing_list_id, item_data)
    return item


@router.patch("/outings/{outing_id}/packing-lists/items/{item_id}", response_model=OutingPackingListItemResponse)
async def update_packing_list_item(
    outing_id: UUID,
    item_id: UUID,
    updates: OutingPackingListItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a packing list item (quantity, checked status, etc.).
    
    Requires authentication.
    """
    # Verify item exists and belongs to the outing
    item = await crud_packing_list.get_item(db, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Verify item belongs to the outing
    packing_list = await crud_packing_list.get_outing_packing_list(db, item.outing_packing_list_id)
    if not packing_list or packing_list.outing_id != outing_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    updated_item = await crud_packing_list.update_item(db, item_id, updates)
    return updated_item


@router.delete("/outings/{outing_id}/packing-lists/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_packing_list_item(
    outing_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a packing list item.
    
    Requires authentication.
    """
    # Verify item exists and belongs to the outing
    item = await crud_packing_list.get_item(db, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Verify item belongs to the outing
    packing_list = await crud_packing_list.get_outing_packing_list(db, item.outing_packing_list_id)
    if not packing_list or packing_list.outing_id != outing_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    await crud_packing_list.delete_item(db, item_id)
