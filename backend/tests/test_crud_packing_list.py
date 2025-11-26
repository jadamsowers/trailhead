"""Tests for app/crud/packing_list.py

These tests cover CRUD operations for packing list templates and outing packing lists.
"""
import pytest
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import packing_list as crud_packing_list
from app.schemas.packing_list import (
    OutingPackingListCreate,
    OutingPackingListItemCreate,
    OutingPackingListItemUpdate,
)

pytestmark = pytest.mark.asyncio


class TestTemplateOperations:
    """Test packing list template CRUD operations"""
    
    async def test_get_templates_empty(self, db_session: AsyncSession):
        """Test getting templates when none exist"""
        templates = await crud_packing_list.get_templates(db_session)
        assert templates == []
    
    async def test_get_templates_with_data(self, db_session: AsyncSession):
        """Test getting templates"""
        from app.models.packing_list import PackingListTemplate
        
        template = PackingListTemplate(
            id=uuid4(),
            name="Test Template",
            description="Test description"
        )
        db_session.add(template)
        await db_session.commit()
        
        templates = await crud_packing_list.get_templates(db_session)
        assert len(templates) == 1
        assert templates[0].name == "Test Template"
    
    async def test_get_template_not_found(self, db_session: AsyncSession):
        """Test getting non-existent template"""
        template = await crud_packing_list.get_template(db_session, uuid4())
        assert template is None
    
    async def test_get_template_with_items(self, db_session: AsyncSession):
        """Test getting template with items"""
        from app.models.packing_list import PackingListTemplate, PackingListTemplateItem
        
        template = PackingListTemplate(
            id=uuid4(),
            name="Camping Template",
            description="Camping essentials"
        )
        db_session.add(template)
        await db_session.flush()
        
        item1 = PackingListTemplateItem(
            id=uuid4(),
            template_id=template.id,
            name="Tent",
            quantity=1,
            sort_order=1
        )
        item2 = PackingListTemplateItem(
            id=uuid4(),
            template_id=template.id,
            name="Sleeping Bag",
            quantity=1,
            sort_order=2
        )
        db_session.add(item1)
        db_session.add(item2)
        await db_session.commit()
        await db_session.refresh(template)
        
        result = await crud_packing_list.get_template(db_session, template.id)
        assert result is not None
        assert result.name == "Camping Template"
        assert len(result.items) == 2


class TestOutingPackingListOperations:
    """Test outing packing list CRUD operations"""
    
    async def test_create_outing_packing_list_without_template(
        self, db_session: AsyncSession, test_outing
    ):
        """Test creating outing packing list without template"""
        packing_list_data = OutingPackingListCreate(template_id=None)
        
        packing_list = await crud_packing_list.create_outing_packing_list(
            db_session, test_outing.id, packing_list_data
        )
        
        assert packing_list.outing_id == test_outing.id
        assert packing_list.template_id is None
        assert len(packing_list.items) == 0
    
    async def test_create_outing_packing_list_with_template(
        self, db_session: AsyncSession, test_outing
    ):
        """Test creating outing packing list from template"""
        from app.models.packing_list import PackingListTemplate, PackingListTemplateItem
        
        # Create template with items
        template = PackingListTemplate(
            id=uuid4(),
            name="Test Template",
            description="Test"
        )
        db_session.add(template)
        await db_session.flush()
        
        item = PackingListTemplateItem(
            id=uuid4(),
            template_id=template.id,
            name="Test Item",
            quantity=2,
            sort_order=1
        )
        db_session.add(item)
        await db_session.commit()
        await db_session.refresh(template)
        
        # Create outing packing list from template
        packing_list_data = OutingPackingListCreate(template_id=template.id)
        
        packing_list = await crud_packing_list.create_outing_packing_list(
            db_session, test_outing.id, packing_list_data
        )
        
        assert packing_list.outing_id == test_outing.id
        assert packing_list.template_id == template.id
        assert len(packing_list.items) == 1
        assert packing_list.items[0].name == "Test Item"
        assert packing_list.items[0].quantity == 2
        assert packing_list.items[0].checked is False
    
    async def test_get_outing_packing_lists_empty(
        self, db_session: AsyncSession, test_outing
    ):
        """Test getting packing lists for outing with none"""
        lists = await crud_packing_list.get_outing_packing_lists(db_session, test_outing.id)
        assert lists == []
    
    async def test_get_outing_packing_list_not_found(
        self, db_session: AsyncSession
    ):
        """Test getting non-existent outing packing list"""
        result = await crud_packing_list.get_outing_packing_list(db_session, uuid4())
        assert result is None
    
    async def test_delete_outing_packing_list(
        self, db_session: AsyncSession, test_outing
    ):
        """Test deleting outing packing list"""
        from app.models.packing_list import OutingPackingList
        
        packing_list = OutingPackingList(
            id=uuid4(),
            outing_id=test_outing.id,
            template_id=None
        )
        db_session.add(packing_list)
        await db_session.commit()
        await db_session.refresh(packing_list)
        
        # Delete it
        await crud_packing_list.delete_outing_packing_list(db_session, packing_list.id)
        
        # Verify it's deleted
        result = await crud_packing_list.get_outing_packing_list(db_session, packing_list.id)
        assert result is None


class TestPackingListItemOperations:
    """Test packing list item CRUD operations"""
    
    async def test_add_custom_item(
        self, db_session: AsyncSession, test_outing
    ):
        """Test adding custom item to packing list"""
        from app.models.packing_list import OutingPackingList
        
        # Create packing list
        packing_list = OutingPackingList(
            id=uuid4(),
            outing_id=test_outing.id,
            template_id=None
        )
        db_session.add(packing_list)
        await db_session.commit()
        await db_session.refresh(packing_list)
        
        # Add custom item
        item_data = OutingPackingListItemCreate(
            name="Custom Item",
            quantity=3,
            checked=False
        )
        
        item = await crud_packing_list.add_custom_item(
            db_session, packing_list.id, item_data
        )
        
        assert item.name == "Custom Item"
        assert item.quantity == 3
        assert item.checked is False
        assert item.outing_packing_list_id == packing_list.id
    
    async def test_get_item_not_found(
        self, db_session: AsyncSession
    ):
        """Test getting non-existent item"""
        item = await crud_packing_list.get_item(db_session, uuid4())
        assert item is None
    
    async def test_update_item(
        self, db_session: AsyncSession, test_outing
    ):
        """Test updating packing list item"""
        from app.models.packing_list import OutingPackingList, OutingPackingListItem
        
        # Create packing list with item
        packing_list = OutingPackingList(
            id=uuid4(),
            outing_id=test_outing.id,
            template_id=None
        )
        db_session.add(packing_list)
        await db_session.flush()
        
        item = OutingPackingListItem(
            id=uuid4(),
            outing_packing_list_id=packing_list.id,
            name="Test Item",
            quantity=1,
            checked=False
        )
        db_session.add(item)
        await db_session.commit()
        await db_session.refresh(item)
        
        # Update item
        updates = OutingPackingListItemUpdate(
            checked=True,
            quantity=5
        )
        
        updated_item = await crud_packing_list.update_item(
            db_session, item.id, updates
        )
        
        assert updated_item.checked is True
        assert updated_item.quantity == 5
    
    async def test_update_item_not_found(
        self, db_session: AsyncSession
    ):
        """Test updating non-existent item"""
        updates = OutingPackingListItemUpdate(checked=True)
        
        result = await crud_packing_list.update_item(
            db_session, uuid4(), updates
        )
        
        assert result is None
    
    async def test_delete_item(
        self, db_session: AsyncSession, test_outing
    ):
        """Test deleting packing list item"""
        from app.models.packing_list import OutingPackingList, OutingPackingListItem
        
        # Create packing list with item
        packing_list = OutingPackingList(
            id=uuid4(),
            outing_id=test_outing.id,
            template_id=None
        )
        db_session.add(packing_list)
        await db_session.flush()
        
        item = OutingPackingListItem(
            id=uuid4(),
            outing_packing_list_id=packing_list.id,
            name="Test Item",
            quantity=1,
            checked=False
        )
        db_session.add(item)
        await db_session.commit()
        await db_session.refresh(item)
        
        # Delete item
        await crud_packing_list.delete_item(db_session, item.id)
        
        # Verify it's deleted
        result = await crud_packing_list.get_item(db_session, item.id)
        assert result is None
