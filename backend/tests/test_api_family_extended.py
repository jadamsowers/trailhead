"""Extended coverage tests for api/endpoints/family.py

These tests cover edge cases in family member endpoints including summary
endpoint with outing validation and youth protection expiration checks.
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4
from datetime import date, timedelta

pytestmark = pytest.mark.asyncio


class TestFamilyMemberSummary:
    """Test family member summary endpoint"""
    
    async def test_summary_without_outing(
        self, client: AsyncClient, auth_headers, test_family_member
    ):
        """Test getting family member summary without outing context"""
        response = await client.get(
            "/api/family/summary",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify summary structure
        member = data[0]
        assert "id" in member
        assert "name" in member
        assert "member_type" in member
        assert "age" in member
    
    async def test_summary_with_outing(
        self, client: AsyncClient, auth_headers, test_family_member, test_outing
    ):
        """Test getting family member summary with outing context"""
        response = await client.get(
            f"/api/family/summary?outing_id={test_outing.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_summary_with_invalid_outing(
        self, client: AsyncClient, auth_headers, test_family_member
    ):
        """Test summary with non-existent outing still works"""
        fake_outing_id = uuid4()
        
        response = await client.get(
            f"/api/family/summary?outing_id={fake_outing_id}",
            headers=auth_headers
        )
        
        # Should still return members, just uses today's date for comparison
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    async def test_summary_youth_protection_expiration(
        self, client: AsyncClient, auth_headers, db_session, test_user, test_outing
    ):
        """Test youth protection expiration check in summary"""
        from app.models.family import FamilyMember
        
        # Create adult with expired YPT
        expired_adult = FamilyMember(
            id=uuid4(),
            user_id=test_user.id,
            name="Expired Adult",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
            youth_protection_expiration=date.today() - timedelta(days=1)  # Expired yesterday
        )
        db_session.add(expired_adult)
        await db_session.commit()
        
        response = await client.get(
            "/api/family/summary",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Find the expired adult in response
        expired_member = next((m for m in data if m["name"] == "Expired Adult"), None)
        assert expired_member is not None
        assert expired_member["youth_protection_expired"] is True
    
    async def test_summary_age_calculation(
        self, client: AsyncClient, auth_headers, db_session, test_user
    ):
        """Test age calculation in summary"""
        from app.models.family import FamilyMember
        
        # Create member with known birth date
        birth_date = date.today() - timedelta(days=365*15)  # 15 years old
        member = FamilyMember(
            id=uuid4(),
            user_id=test_user.id,
            name="Test Scout",
            date_of_birth=birth_date,
            member_type="scout",
            gender="male"
        )
        db_session.add(member)
        await db_session.commit()
        
        response = await client.get(
            "/api/family/summary",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Find the member in response
        test_member = next((m for m in data if m["name"] == "Test Scout"), None)
        assert test_member is not None
        assert test_member["age"] == 15


class TestFamilyMemberCRUD:
    """Test family member CRUD edge cases"""
    
    async def test_get_family_member_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test getting non-existent family member"""
        fake_id = uuid4()
        
        response = await client.get(
            f"/api/family/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "family member not found" in response.json()["detail"].lower()
    
    async def test_get_family_member_wrong_user(
        self, client: AsyncClient, regular_user_headers, test_family_member
    ):
        """Test getting family member belonging to different user"""
        # test_family_member belongs to test_user (admin)
        # regular_user_headers is for a different user
        
        response = await client.get(
            f"/api/family/{test_family_member.id}",
            headers=regular_user_headers
        )
        
        # Should return 404 since member doesn't belong to regular user
        assert response.status_code == 404
    
    async def test_create_family_member_with_dietary_preferences(
        self, client: AsyncClient, auth_headers
    ):
        """Test creating family member with dietary preferences"""
        member_data = {
            "name": "Test Member",
            "date_of_birth": (date.today() - timedelta(days=365*13)).isoformat(),
            "member_type": "scout",
            "gender": "male",
            "dietary_preferences": ["vegetarian", "no_pork"],
            "allergies": ["peanuts"]
        }
        
        response = await client.post(
            "/api/family/",
            headers=auth_headers,
            json=member_data
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Member"
        assert len(data["dietary_preferences"]) == 2
        assert len(data["allergies"]) == 1
    
    async def test_update_family_member_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test updating non-existent family member"""
        fake_id = uuid4()
        update_data = {"name": "Updated Name"}
        
        response = await client.put(
            f"/api/family/{fake_id}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == 404
        assert "family member not found" in response.json()["detail"].lower()
    
    async def test_update_family_member_wrong_user(
        self, client: AsyncClient, regular_user_headers, test_family_member
    ):
        """Test updating family member belonging to different user"""
        update_data = {"name": "Hacked Name"}
        
        response = await client.put(
            f"/api/family/{test_family_member.id}",
            headers=regular_user_headers,
            json=update_data
        )
        
        # Should return 404 since member doesn't belong to regular user
        assert response.status_code == 404
    
    async def test_delete_family_member_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test deleting non-existent family member"""
        fake_id = uuid4()
        
        response = await client.delete(
            f"/api/family/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "family member not found" in response.json()["detail"].lower()
    
    async def test_delete_family_member_wrong_user(
        self, client: AsyncClient, regular_user_headers, test_family_member
    ):
        """Test deleting family member belonging to different user"""
        response = await client.delete(
            f"/api/family/{test_family_member.id}",
            headers=regular_user_headers
        )
        
        # Should return 404 since member doesn't belong to regular user
        assert response.status_code == 404


class TestListFamilyMembers:
    """Test list_family_members endpoint"""
    
    async def test_list_family_members_empty(
        self, client: AsyncClient, regular_user_headers
    ):
        """Test listing family members when user has none"""
        response = await client.get(
            "/api/family/",
            headers=regular_user_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["members"]) == 0
    
    async def test_list_family_members_with_data(
        self, client: AsyncClient, auth_headers, test_family_member
    ):
        """Test listing family members with data"""
        response = await client.get(
            "/api/family/",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] > 0
        assert len(data["members"]) > 0
        
        # Verify member structure
        member = data["members"][0]
        assert "id" in member
        assert "name" in member
        assert "member_type" in member
        assert "dietary_preferences" in member
        assert "allergies" in member
    
    async def test_list_only_shows_own_members(
        self, client: AsyncClient, auth_headers, regular_user_headers, test_family_member
    ):
        """Test that users only see their own family members"""
        # Admin user should see their members
        admin_response = await client.get(
            "/api/family/",
            headers=auth_headers
        )
        admin_data = admin_response.json()
        admin_count = admin_data["total"]
        
        # Regular user should see different (likely 0) members
        regular_response = await client.get(
            "/api/family/",
            headers=regular_user_headers
        )
        regular_data = regular_response.json()
        
        # They should have different counts (unless both have same number by coincidence)
        # More importantly, the member IDs should be different
        if admin_count > 0 and regular_data["total"] > 0:
            admin_ids = {m["id"] for m in admin_data["members"]}
            regular_ids = {m["id"] for m in regular_data["members"]}
            assert admin_ids != regular_ids
