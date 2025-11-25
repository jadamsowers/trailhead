"""Tests for api/endpoints/family.py"""
import pytest
from httpx import AsyncClient
from uuid import uuid4
from datetime import date, timedelta


@pytest.mark.asyncio
class TestListFamilyMembers:
    """Test GET /api/family/ endpoint"""
    
    async def test_list_family_members_success(self, client: AsyncClient, auth_headers, test_family_member):
        """Test getting family members for current user"""
        response = await client.get(
            "/api/family/",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "members" in data
        assert "total" in data
        assert data["total"] >= 1
        assert len(data["members"]) >= 1
        
        # Verify structure
        member = data["members"][0]
        assert "id" in member
        assert "name" in member
        assert "member_type" in member
    
    async def test_list_family_members_empty(self, client: AsyncClient, regular_user_headers):
        """Test getting family members when none exist"""
        response = await client.get(
            "/api/family/",
            headers=regular_user_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["members"]) == 0
    
    async def test_list_family_members_no_auth(self, client: AsyncClient):
        """Test getting family members without authentication"""
        response = await client.get("/api/family/")
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestGetFamilyMembersSummary:
    """Test GET /api/family/summary endpoint"""
    
    async def test_get_summary_success(self, client: AsyncClient, auth_headers, test_family_member):
        """Test getting family member summary"""
        response = await client.get(
            "/api/family/summary",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Verify structure
        member = data[0]
        assert "id" in member
        assert "name" in member
        assert "member_type" in member
    
    async def test_get_summary_with_outing_id(self, client: AsyncClient, auth_headers, test_family_member, test_outing):
        """Test getting summary with outing_id parameter"""
        response = await client.get(
            f"/api/family/summary?outing_id={test_outing.id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_get_summary_no_auth(self, client: AsyncClient):
        """Test getting summary without authentication"""
        response = await client.get("/api/family/summary")
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestGetFamilyMember:
    """Test GET /api/family/{member_id} endpoint"""
    
    async def test_get_family_member_success(self, client: AsyncClient, auth_headers, test_family_member):
        """Test getting a specific family member"""
        response = await client.get(
            f"/api/family/{test_family_member.id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_family_member.id)
        assert data["name"] == test_family_member.name
        assert data["member_type"] == test_family_member.member_type
    
    async def test_get_family_member_not_found(self, client: AsyncClient, auth_headers):
        """Test getting non-existent family member"""
        fake_id = uuid4()
        response = await client.get(
            f"/api/family/{fake_id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 404
    
    async def test_get_other_users_family_member(self, client: AsyncClient, regular_user_headers, test_family_member):
        """Test getting another user's family member (should fail)"""
        response = await client.get(
            f"/api/family/{test_family_member.id}",
            headers=regular_user_headers,
        )
        
        assert response.status_code == 404
    
    async def test_get_family_member_no_auth(self, client: AsyncClient, test_family_member):
        """Test getting family member without authentication"""
        response = await client.get(f"/api/family/{test_family_member.id}")
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestCreateFamilyMember:
    """Test POST /api/family/ endpoint"""
    
    async def test_create_family_member_youth(self, client: AsyncClient, auth_headers):
        """Test creating a youth family member"""
        member_data = {
            "name": "New Scout",
            "date_of_birth": (date.today() - timedelta(days=365*14)).isoformat(),
            "member_type": "scout",
            "gender": "male",
            "troop_number": "100",
        }
        
        response = await client.post(
            "/api/family/",
            headers=auth_headers,
            json=member_data,
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Scout"
        assert data["member_type"] == "scout"
        assert data["troop_number"] == "100"
        assert "id" in data
    
    async def test_create_family_member_adult(self, client: AsyncClient, auth_headers):
        """Test creating an adult family member"""
        member_data = {
            "name": "Adult Leader",
            "date_of_birth": (date.today() - timedelta(days=365*40)).isoformat(),
            "member_type": "adult",
            "gender": "female",
            "has_youth_protection": True,
            "youth_protection_expiration": (date.today() + timedelta(days=365)).isoformat(),
            "vehicle_capacity": 5,
        }
        
        response = await client.post(
            "/api/family/",
            headers=auth_headers,
            json=member_data,
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Adult Leader"
        assert data["member_type"] == "adult"
        assert data["has_youth_protection"] is True
        assert data["vehicle_capacity"] == 5
    
    async def test_create_family_member_missing_required_fields(self, client: AsyncClient, auth_headers):
        """Test creating family member with missing required fields"""
        member_data = {
            "name": "Incomplete Member",
            # Missing required fields
        }
        
        response = await client.post(
            "/api/family/",
            headers=auth_headers,
            json=member_data,
        )
        
        assert response.status_code == 422
    
    async def test_create_family_member_no_auth(self, client: AsyncClient):
        """Test creating family member without authentication"""
        member_data = {
            "name": "New Member",
            "date_of_birth": date.today().isoformat(),
            "member_type": "scout",
            "gender": "male",
        }
        
        response = await client.post(
            "/api/family/",
            json=member_data,
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestUpdateFamilyMember:
    """Test PUT /api/family/{member_id} endpoint"""
    
    async def test_update_family_member_success(self, client: AsyncClient, auth_headers, test_family_member):
        """Test updating a family member"""
        update_data = {
            "name": "Updated Name",
            "troop_number": "200",
        }
        
        response = await client.put(
            f"/api/family/{test_family_member.id}",
            headers=auth_headers,
            json=update_data,
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["troop_number"] == "200"
    
    async def test_update_family_member_not_found(self, client: AsyncClient, auth_headers):
        """Test updating non-existent family member"""
        fake_id = uuid4()
        response = await client.put(
            f"/api/family/{fake_id}",
            headers=auth_headers,
            json={"name": "Updated"},
        )
        
        assert response.status_code == 404
    
    async def test_update_other_users_family_member(self, client: AsyncClient, regular_user_headers, test_family_member):
        """Test updating another user's family member (should fail)"""
        response = await client.put(
            f"/api/family/{test_family_member.id}",
            headers=regular_user_headers,
            json={"name": "Hacked Name"},
        )
        
        assert response.status_code == 404
    
    async def test_update_family_member_no_auth(self, client: AsyncClient, test_family_member):
        """Test updating family member without authentication"""
        response = await client.put(
            f"/api/family/{test_family_member.id}",
            json={"name": "Updated"},
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestDeleteFamilyMember:
    """Test DELETE /api/family/{member_id} endpoint"""
    
    async def test_delete_family_member_success(self, client: AsyncClient, auth_headers, db_session, test_user):
        """Test deleting a family member"""
        from app.models.family import FamilyMember
        
        # Create a member to delete
        member = FamilyMember(
            id=uuid4(),
            user_id=test_user.id,
            name="To Delete",
            date_of_birth=date.today() - timedelta(days=365*15),
            member_type="scout",
            gender="male",
        )
        db_session.add(member)
        await db_session.commit()
        
        response = await client.delete(
            f"/api/family/{member.id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 204
    
    async def test_delete_family_member_not_found(self, client: AsyncClient, auth_headers):
        """Test deleting non-existent family member"""
        fake_id = uuid4()
        response = await client.delete(
            f"/api/family/{fake_id}",
            headers=auth_headers,
        )
        
        assert response.status_code == 404
    
    async def test_delete_other_users_family_member(self, client: AsyncClient, regular_user_headers, test_family_member):
        """Test deleting another user's family member (should fail)"""
        response = await client.delete(
            f"/api/family/{test_family_member.id}",
            headers=regular_user_headers,
        )
        
        assert response.status_code == 404
    
    async def test_delete_family_member_no_auth(self, client: AsyncClient, test_family_member):
        """Test deleting family member without authentication"""
        response = await client.delete(f"/api/family/{test_family_member.id}")
        
        assert response.status_code == 403
