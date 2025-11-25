"""Tests for api/endpoints/packing_lists.py"""
import pytest
from httpx import AsyncClient
from uuid import uuid4


@pytest.fixture
async def test_template(db_session):
    """Create a test packing list template"""
    from app.models.packing_list import PackingListTemplate, PackingListTemplateItem
    
    template = PackingListTemplate(
        id=uuid4(),
        name="Camping Essentials",
        description="Basic camping gear"
    )
    db_session.add(template)
    await db_session.flush()
    
    # Add some items to the template
    items = [
        PackingListTemplateItem(
            id=uuid4(),
            template_id=template.id,
            name="Tent",
            quantity=1,
            sort_order=1
        ),
        PackingListTemplateItem(
            id=uuid4(),
            template_id=template.id,
            name="Sleeping Bag",
            quantity=1,
            sort_order=2
        ),
        PackingListTemplateItem(
            id=uuid4(),
            template_id=template.id,
            name="Water Bottle",
            quantity=2,
            sort_order=3
        ),
    ]
    for item in items:
        db_session.add(item)
    
    await db_session.commit()
    await db_session.refresh(template)
    return template


@pytest.fixture
async def test_outing_packing_list(db_session, test_outing, test_template):
    """Create a test outing packing list"""
    from app.models.packing_list import OutingPackingList, OutingPackingListItem
    
    packing_list = OutingPackingList(
        id=uuid4(),
        outing_id=test_outing.id,
        template_id=test_template.id
    )
    db_session.add(packing_list)
    await db_session.flush()
    
    # Add some items
    items = [
        OutingPackingListItem(
            id=uuid4(),
            outing_packing_list_id=packing_list.id,
            name="Tent",
            quantity=1,
            checked=False
        ),
        OutingPackingListItem(
            id=uuid4(),
            outing_packing_list_id=packing_list.id,
            name="Sleeping Bag",
            quantity=1,
            checked=True
        ),
    ]
    for item in items:
        db_session.add(item)
    
    await db_session.commit()
    await db_session.refresh(packing_list)
    return packing_list


@pytest.mark.asyncio
class TestListTemplates:
    """Test GET /api/packing-lists/templates endpoint (public)"""
    
    async def test_list_templates_success(self, client: AsyncClient, test_template):
        """Test listing all templates without authentication"""
        response = await client.get("/api/packing-lists/templates")
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) > 0
        
        # Verify template structure
        template = data["items"][0]
        assert "id" in template
        assert "name" in template
        assert "description" in template
    
    async def test_list_templates_empty(self, client: AsyncClient):
        """Test listing templates when none exist"""
        response = await client.get("/api/packing-lists/templates")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0
        assert data["total"] == 0
    
    async def test_list_templates_pagination(self, client: AsyncClient, test_template):
        """Test pagination parameters"""
        response = await client.get("/api/packing-lists/templates?skip=0&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) <= 5


@pytest.mark.asyncio
class TestGetTemplate:
    """Test GET /api/packing-lists/templates/{template_id} endpoint (public)"""
    
    async def test_get_template_success(self, client: AsyncClient, test_template):
        """Test getting a single template with its items"""
        response = await client.get(f"/api/packing-lists/templates/{test_template.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_template.id)
        assert data["name"] == test_template.name
        assert "items" in data
        assert len(data["items"]) == 3  # We created 3 items in fixture
        
        # Verify item structure
        item = data["items"][0]
        assert "id" in item
        assert "name" in item
        assert "quantity" in item
        assert "sort_order" in item
    
    async def test_get_template_not_found(self, client: AsyncClient):
        """Test getting non-existent template"""
        fake_id = uuid4()
        response = await client.get(f"/api/packing-lists/templates/{fake_id}")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
class TestCreateOutingPackingList:
    """Test POST /api/packing-lists/outings/{outing_id}/packing-lists endpoint"""
    
    async def test_create_packing_list_from_template(
        self, client: AsyncClient, auth_headers, test_outing, test_template
    ):
        """Test creating a packing list from a template"""
        data = {"template_id": str(test_template.id)}
        
        response = await client.post(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists",
            headers=auth_headers,
            json=data
        )
        
        assert response.status_code == 201
        result = response.json()
        assert result["outing_id"] == str(test_outing.id)
        assert result["template_id"] == str(test_template.id)
        assert "items" in result
        assert len(result["items"]) == 3  # Items copied from template
        
        # Verify items are not checked by default
        for item in result["items"]:
            assert item["checked"] is False
    
    async def test_create_packing_list_without_template(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test creating an empty packing list"""
        data = {"template_id": None}
        
        response = await client.post(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists",
            headers=auth_headers,
            json=data
        )
        
        assert response.status_code == 201
        result = response.json()
        assert result["outing_id"] == str(test_outing.id)
        assert result["template_id"] is None
        assert len(result["items"]) == 0
    
    async def test_create_packing_list_outing_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test creating packing list for non-existent outing"""
        fake_id = uuid4()
        data = {"template_id": None}
        
        response = await client.post(
            f"/api/packing-lists/outings/{fake_id}/packing-lists",
            headers=auth_headers,
            json=data
        )
        
        assert response.status_code == 404
        assert "outing" in response.json()["detail"].lower()
    
    async def test_create_packing_list_template_not_found(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test creating packing list with non-existent template"""
        fake_id = uuid4()
        data = {"template_id": str(fake_id)}
        
        response = await client.post(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists",
            headers=auth_headers,
            json=data
        )
        
        assert response.status_code == 404
        assert "template" in response.json()["detail"].lower()
    
    async def test_create_packing_list_no_auth(self, client: AsyncClient, test_outing):
        """Test creating packing list without authentication fails"""
        data = {"template_id": None}
        
        response = await client.post(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists",
            json=data
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestGetOutingPackingLists:
    """Test GET /api/packing-lists/outings/{outing_id}/packing-lists endpoint"""
    
    async def test_get_outing_packing_lists_success(
        self, client: AsyncClient, auth_headers, test_outing, test_outing_packing_list
    ):
        """Test getting all packing lists for an outing"""
        response = await client.get(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify packing list structure
        packing_list = data[0]
        assert "id" in packing_list
        assert "outing_id" in packing_list
        assert "items" in packing_list
    
    async def test_get_outing_packing_lists_empty(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test getting packing lists when none exist"""
        response = await client.get(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0
    
    async def test_get_outing_packing_lists_outing_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test getting packing lists for non-existent outing"""
        fake_id = uuid4()
        
        response = await client.get(
            f"/api/packing-lists/outings/{fake_id}/packing-lists",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    async def test_get_outing_packing_lists_no_auth(self, client: AsyncClient, test_outing):
        """Test getting packing lists without authentication fails"""
        response = await client.get(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists"
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestDeleteOutingPackingList:
    """Test DELETE /api/packing-lists/outings/{outing_id}/packing-lists/{packing_list_id} endpoint"""
    
    async def test_delete_packing_list_success(
        self, client: AsyncClient, auth_headers, test_outing, test_outing_packing_list
    ):
        """Test deleting a packing list"""
        response = await client.delete(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/{test_outing_packing_list.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
    
    async def test_delete_packing_list_not_found(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test deleting non-existent packing list"""
        fake_id = uuid4()
        
        response = await client.delete(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    async def test_delete_packing_list_wrong_outing(
        self, client: AsyncClient, auth_headers, test_day_outing, test_outing_packing_list
    ):
        """Test deleting packing list with wrong outing ID"""
        response = await client.delete(
            f"/api/packing-lists/outings/{test_day_outing.id}/packing-lists/{test_outing_packing_list.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    async def test_delete_packing_list_no_auth(
        self, client: AsyncClient, test_outing, test_outing_packing_list
    ):
        """Test deleting packing list without authentication fails"""
        response = await client.delete(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/{test_outing_packing_list.id}"
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestAddPackingListItem:
    """Test POST /api/packing-lists/outings/{outing_id}/packing-lists/{packing_list_id}/items endpoint"""
    
    async def test_add_item_success(
        self, client: AsyncClient, auth_headers, test_outing, test_outing_packing_list
    ):
        """Test adding a custom item to a packing list"""
        item_data = {
            "name": "First Aid Kit",
            "quantity": 1,
            "checked": False
        }
        
        response = await client.post(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/{test_outing_packing_list.id}/items",
            headers=auth_headers,
            json=item_data
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "First Aid Kit"
        assert data["quantity"] == 1
        assert data["checked"] is False
        assert "id" in data
    
    async def test_add_item_packing_list_not_found(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test adding item to non-existent packing list"""
        fake_id = uuid4()
        item_data = {"name": "Item", "quantity": 1, "checked": False}
        
        response = await client.post(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/{fake_id}/items",
            headers=auth_headers,
            json=item_data
        )
        
        assert response.status_code == 404
    
    async def test_add_item_no_auth(
        self, client: AsyncClient, test_outing, test_outing_packing_list
    ):
        """Test adding item without authentication fails"""
        item_data = {"name": "Item", "quantity": 1, "checked": False}
        
        response = await client.post(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/{test_outing_packing_list.id}/items",
            json=item_data
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestUpdatePackingListItem:
    """Test PATCH /api/packing-lists/outings/{outing_id}/packing-lists/items/{item_id} endpoint"""
    
    async def test_update_item_check_status(
        self, client: AsyncClient, auth_headers, test_outing, test_outing_packing_list, db_session
    ):
        """Test updating an item's checked status"""
        # Get first item from the packing list
        from app.models.packing_list import OutingPackingListItem
        from sqlalchemy import select
        
        result = await db_session.execute(
            select(OutingPackingListItem).where(
                OutingPackingListItem.outing_packing_list_id == test_outing_packing_list.id
            ).limit(1)
        )
        item = result.scalar_one()
        
        update_data = {"checked": True}
        
        response = await client.patch(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/items/{item.id}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["checked"] is True
    
    async def test_update_item_quantity(
        self, client: AsyncClient, auth_headers, test_outing, test_outing_packing_list, db_session
    ):
        """Test updating an item's quantity"""
        from app.models.packing_list import OutingPackingListItem
        from sqlalchemy import select
        
        result = await db_session.execute(
            select(OutingPackingListItem).where(
                OutingPackingListItem.outing_packing_list_id == test_outing_packing_list.id
            ).limit(1)
        )
        item = result.scalar_one()
        
        update_data = {"quantity": 5}
        
        response = await client.patch(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/items/{item.id}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["quantity"] == 5
    
    async def test_update_item_not_found(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test updating non-existent item"""
        fake_id = uuid4()
        update_data = {"checked": True}
        
        response = await client.patch(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/items/{fake_id}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == 404
    
    async def test_update_item_no_auth(
        self, client: AsyncClient, test_outing, test_outing_packing_list, db_session
    ):
        """Test updating item without authentication fails"""
        from app.models.packing_list import OutingPackingListItem
        from sqlalchemy import select
        
        result = await db_session.execute(
            select(OutingPackingListItem).where(
                OutingPackingListItem.outing_packing_list_id == test_outing_packing_list.id
            ).limit(1)
        )
        item = result.scalar_one()
        
        update_data = {"checked": True}
        
        response = await client.patch(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/items/{item.id}",
            json=update_data
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestDeletePackingListItem:
    """Test DELETE /api/packing-lists/outings/{outing_id}/packing-lists/items/{item_id} endpoint"""
    
    async def test_delete_item_success(
        self, client: AsyncClient, auth_headers, test_outing, test_outing_packing_list, db_session
    ):
        """Test deleting a packing list item"""
        from app.models.packing_list import OutingPackingListItem
        from sqlalchemy import select
        
        result = await db_session.execute(
            select(OutingPackingListItem).where(
                OutingPackingListItem.outing_packing_list_id == test_outing_packing_list.id
            ).limit(1)
        )
        item = result.scalar_one()
        
        response = await client.delete(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/items/{item.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
    
    async def test_delete_item_not_found(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test deleting non-existent item"""
        fake_id = uuid4()
        
        response = await client.delete(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/items/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    async def test_delete_item_no_auth(
        self, client: AsyncClient, test_outing, test_outing_packing_list, db_session
    ):
        """Test deleting item without authentication fails"""
        from app.models.packing_list import OutingPackingListItem
        from sqlalchemy import select
        
        result = await db_session.execute(
            select(OutingPackingListItem).where(
                OutingPackingListItem.outing_packing_list_id == test_outing_packing_list.id
            ).limit(1)
        )
        item = result.scalar_one()
        
        response = await client.delete(
            f"/api/packing-lists/outings/{test_outing.id}/packing-lists/items/{item.id}"
        )
        
        assert response.status_code == 403
