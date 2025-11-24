from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# Packing List Template Schemas
class PackingListTemplateBase(BaseModel):
    """Base schema for packing list templates"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class PackingListTemplateCreate(PackingListTemplateBase):
    """Schema for creating a packing list template"""
    pass


class PackingListTemplateResponse(PackingListTemplateBase):
    """Schema for packing list template responses"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PackingListTemplateWithItemsResponse(PackingListTemplateResponse):
    """Schema for packing list template with items"""
    items: List["PackingListTemplateItemResponse"] = []


# Packing List Template Item Schemas
class PackingListTemplateItemBase(BaseModel):
    """Base schema for packing list template items"""
    name: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(default=1, ge=1)
    sort_order: int = Field(default=0, ge=0)


class PackingListTemplateItemCreate(PackingListTemplateItemBase):
    """Schema for creating a packing list template item"""
    template_id: UUID


class PackingListTemplateItemResponse(PackingListTemplateItemBase):
    """Schema for packing list template item responses"""
    id: UUID
    template_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Outing Packing List Schemas
class OutingPackingListCreate(BaseModel):
    """Schema for creating an outing packing list"""
    template_id: Optional[UUID] = None


class OutingPackingListResponse(BaseModel):
    """Schema for outing packing list responses"""
    id: UUID
    outing_id: UUID
    template_id: Optional[UUID] = None
    template: Optional[PackingListTemplateResponse] = None
    items: List["OutingPackingListItemResponse"] = []
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Outing Packing List Item Schemas
class OutingPackingListItemBase(BaseModel):
    """Base schema for outing packing list items"""
    name: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(default=1, ge=1)
    checked: bool = Field(default=False)


class OutingPackingListItemCreate(OutingPackingListItemBase):
    """Schema for creating an outing packing list item"""
    pass


class OutingPackingListItemUpdate(BaseModel):
    """Schema for updating an outing packing list item"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    quantity: Optional[int] = Field(None, ge=1)
    checked: Optional[bool] = None


class OutingPackingListItemResponse(OutingPackingListItemBase):
    """Schema for outing packing list item responses"""
    id: UUID
    outing_packing_list_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# List response schemas
class PackingListTemplateListResponse(BaseModel):
    """Schema for list of packing list templates"""
    items: List[PackingListTemplateResponse]
    total: int
