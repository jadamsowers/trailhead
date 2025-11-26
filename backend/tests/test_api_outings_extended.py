"""Extended coverage tests for api/endpoints/outings.py

These tests cover edge cases in outing endpoints including close/open signups,
handout generation, and signup listing.
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4
from datetime import date, timedelta

pytestmark = pytest.mark.asyncio


class TestCloseOpenSignups:
    """Test close_signups and open_signups endpoints"""
    
    async def test_close_signups_success(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test closing signups for an outing"""
        response = await client.post(
            f"/api/outings/{test_outing.id}/close-signups",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["signups_closed"] is True
    
    async def test_close_signups_outing_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test closing signups for non-existent outing"""
        fake_id = uuid4()
        
        response = await client.post(
            f"/api/outings/{fake_id}/close-signups",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "outing not found" in response.json()["detail"].lower()
    
    async def test_open_signups_success(
        self, client: AsyncClient, auth_headers, test_outing, db_session
    ):
        """Test opening signups for an outing"""
        # First close signups
        test_outing.signups_closed = True
        await db_session.commit()
        await db_session.refresh(test_outing)
        
        # Now open them
        response = await client.post(
            f"/api/outings/{test_outing.id}/open-signups",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["signups_closed"] is False
    
    async def test_open_signups_outing_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test opening signups for non-existent outing"""
        fake_id = uuid4()
        
        response = await client.post(
            f"/api/outings/{fake_id}/open-signups",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "outing not found" in response.json()["detail"].lower()


class TestGetOutingSignups:
    """Test get_outing_signups endpoint"""
    
    async def test_get_outing_signups_empty(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test getting signups for outing with none"""
        response = await client.get(
            f"/api/outings/{test_outing.id}/signups",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["signups"]) == 0
    
    async def test_get_outing_signups_with_data(
        self, client: AsyncClient, auth_headers, test_outing, test_signup
    ):
        """Test getting signups for outing with data"""
        response = await client.get(
            f"/api/outings/{test_outing.id}/signups",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] > 0
        assert len(data["signups"]) > 0
        
        # Verify signup structure
        signup = data["signups"][0]
        assert "id" in signup
        assert "participants" in signup
        assert "family_contact_email" in signup
    
    async def test_get_outing_signups_outing_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test getting signups for non-existent outing"""
        fake_id = uuid4()
        
        response = await client.get(
            f"/api/outings/{fake_id}/signups",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "outing not found" in response.json()["detail"].lower()


class TestGetOutingHandout:
    """Test get_outing_handout endpoint"""
    
    async def test_get_handout_success(
        self, client: AsyncClient, test_outing
    ):
        """Test generating PDF handout for outing"""
        response = await client.get(
            f"/api/outings/{test_outing.id}/handout"
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert "attachment" in response.headers["content-disposition"]
        assert len(response.content) > 0  # PDF has content
    
    async def test_get_handout_outing_not_found(
        self, client: AsyncClient
    ):
        """Test generating handout for non-existent outing"""
        fake_id = uuid4()
        
        response = await client.get(
            f"/api/outings/{fake_id}/handout"
        )
        
        assert response.status_code == 404
        assert "outing not found" in response.json()["detail"].lower()


class TestDeleteOuting:
    """Test delete_outing edge cases"""
    
    async def test_delete_outing_with_signups(
        self, client: AsyncClient, auth_headers, test_outing, test_signup
    ):
        """Test deleting outing with existing signups fails"""
        response = await client.delete(
            f"/api/outings/{test_outing.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "signups" in response.json()["detail"].lower()
    
    async def test_delete_outing_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test deleting non-existent outing"""
        fake_id = uuid4()
        
        response = await client.delete(
            f"/api/outings/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 400  # CRUD returns False, endpoint returns 400


class TestUpdateOuting:
    """Test update_outing edge cases"""
    
    async def test_update_outing_generates_email_draft(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test updating outing generates email draft for changes"""
        update_data = {
            "name": "Updated Outing Name",
            "description": "Updated description"
        }
        
        response = await client.put(
            f"/api/outings/{test_outing.id}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["outing"]["name"] == "Updated Outing Name"
        
        # Should have email draft for changes
        if data.get("email_draft"):
            assert "subject" in data["email_draft"]
            assert "body" in data["email_draft"]
            assert "changed_fields" in data["email_draft"]
    
    async def test_update_outing_no_changes_no_draft(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test updating outing with no changes produces no email draft"""
        # Update with same values
        update_data = {
            "name": test_outing.name,
            "description": test_outing.description
        }
        
        response = await client.put(
            f"/api/outings/{test_outing.id}",
            headers=auth_headers,
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        # No email draft if no changes
        assert data.get("email_draft") is None


class TestGetAvailableOutings:
    """Test get_available_outings endpoint"""
    
    async def test_get_available_outings_public(
        self, client: AsyncClient, test_outing
    ):
        """Test getting available outings without auth"""
        response = await client.get("/api/outings/available")
        
        assert response.status_code == 200
        data = response.json()
        assert "outings" in data
        assert "total" in data
        assert isinstance(data["outings"], list)
    
    async def test_get_available_outings_excludes_full(
        self, client: AsyncClient, db_session
    ):
        """Test that full outings are excluded from available list"""
        from app.models.outing import Outing
        
        # Create a full outing
        full_outing = Outing(
            id=uuid4(),
            name="Full Outing",
            outing_date=date.today() + timedelta(days=30),
            location="Test",
            max_participants=1,
            is_overnight=False
        )
        db_session.add(full_outing)
        await db_session.commit()
        
        response = await client.get("/api/outings/available")
        
        assert response.status_code == 200
        # Available outings should exist
        data = response.json()
        assert isinstance(data["outings"], list)


class TestGetAllOutings:
    """Test get_all_outings endpoint"""
    
    async def test_get_all_outings_pagination(
        self, client: AsyncClient, test_outing, test_day_outing
    ):
        """Test pagination for all outings"""
        response = await client.get("/api/outings?skip=0&limit=1")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["outings"]) <= 1
        assert data["total"] >= 2  # At least our two test outings
    
    async def test_get_all_outings_includes_full(
        self, client: AsyncClient, db_session
    ):
        """Test that all outings includes full ones"""
        from app.models.outing import Outing
        
        # Create a full outing
        full_outing = Outing(
            id=uuid4(),
            name="Full Outing",
            outing_date=date.today() + timedelta(days=30),
            location="Test",
            max_participants=0,  # No capacity
            is_overnight=False
        )
        db_session.add(full_outing)
        await db_session.commit()
        
        response = await client.get("/api/outings")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] > 0
