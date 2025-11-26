"""Extended coverage tests for api/endpoints/requirements.py

These tests cover outing requirements, outing merit badges, and participant progress tracking.
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4
from datetime import date, timedelta

from app.models.outing import Outing
from app.models.family import FamilyMember
from app.models.requirement import RankRequirement, MeritBadge

pytestmark = pytest.mark.asyncio


class TestOutingRequirements:
    """Test outing requirements CRUD operations"""
    
    async def test_list_outing_requirements_empty(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test listing requirements for outing with none"""
        response = await client.get(
            f"/api/requirements/outings/{test_outing.id}/requirements",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    async def test_add_requirement_to_outing(
        self, client: AsyncClient, auth_headers, test_outing, test_rank_requirement
    ):
        """Test adding a rank requirement to an outing"""
        payload = {
            "rank_requirement_id": str(test_rank_requirement.id),
            "notes": "Complete during camping trip"
        }
        
        response = await client.post(
            f"/api/requirements/outings/{test_outing.id}/requirements",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["outing_id"] == str(test_outing.id)
        assert data["rank_requirement_id"] == str(test_rank_requirement.id)
        assert data["notes"] == "Complete during camping trip"
        assert "id" in data
    
    async def test_add_requirement_outing_not_found(
        self, client: AsyncClient, auth_headers, test_rank_requirement
    ):
        """Test adding requirement to non-existent outing"""
        fake_outing_id = uuid4()
        payload = {
            "rank_requirement_id": str(test_rank_requirement.id),
            "notes": "Test"
        }
        
        response = await client.post(
            f"/api/requirements/outings/{fake_outing_id}/requirements",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 404
        assert "outing" in response.json()["detail"].lower()
    
    async def test_add_requirement_requirement_not_found(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test adding non-existent requirement to outing"""
        fake_req_id = uuid4()
        payload = {
            "rank_requirement_id": str(fake_req_id),
            "notes": "Test"
        }
        
        response = await client.post(
            f"/api/requirements/outings/{test_outing.id}/requirements",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 404
        assert "requirement" in response.json()["detail"].lower()
    
    async def test_update_outing_requirement(
        self, client: AsyncClient, auth_headers, test_outing, test_rank_requirement, db_session
    ):
        """Test updating notes for an outing requirement"""
        from app.models.requirement import OutingRequirement
        
        # Create outing requirement
        outing_req = OutingRequirement(
            id=uuid4(),
            outing_id=test_outing.id,
            rank_requirement_id=test_rank_requirement.id,
            notes="Original notes"
        )
        db_session.add(outing_req)
        await db_session.commit()
        await db_session.refresh(outing_req)
        
        # Update notes
        update_payload = {"notes": "Updated notes"}
        response = await client.put(
            f"/api/requirements/outing-requirements/{outing_req.id}",
            headers=auth_headers,
            json=update_payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["notes"] == "Updated notes"
    
    async def test_update_outing_requirement_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test updating non-existent outing requirement"""
        fake_id = uuid4()
        update_payload = {"notes": "Test"}
        
        response = await client.put(
            f"/api/requirements/outing-requirements/{fake_id}",
            headers=auth_headers,
            json=update_payload
        )
        
        assert response.status_code == 404
    
    async def test_remove_requirement_from_outing(
        self, client: AsyncClient, auth_headers, test_outing, test_rank_requirement, db_session
    ):
        """Test removing a requirement from an outing"""
        from app.models.requirement import OutingRequirement
        
        # Create outing requirement
        outing_req = OutingRequirement(
            id=uuid4(),
            outing_id=test_outing.id,
            rank_requirement_id=test_rank_requirement.id,
            notes="Test notes"
        )
        db_session.add(outing_req)
        await db_session.commit()
        await db_session.refresh(outing_req)
        
        # Remove it
        response = await client.delete(
            f"/api/requirements/outing-requirements/{outing_req.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
    
    async def test_remove_outing_requirement_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test removing non-existent outing requirement"""
        fake_id = uuid4()
        
        response = await client.delete(
            f"/api/requirements/outing-requirements/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404


class TestOutingMeritBadges:
    """Test outing merit badges CRUD operations"""
    
    async def test_list_outing_merit_badges_empty(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test listing merit badges for outing with none"""
        response = await client.get(
            f"/api/requirements/outings/{test_outing.id}/merit-badges",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    async def test_add_merit_badge_to_outing(
        self, client: AsyncClient, auth_headers, test_outing, test_merit_badge
    ):
        """Test adding a merit badge to an outing"""
        payload = {
            "merit_badge_id": str(test_merit_badge.id),
            "notes": "Work on requirements during outing"
        }
        
        response = await client.post(
            f"/api/requirements/outings/{test_outing.id}/merit-badges",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["outing_id"] == str(test_outing.id)
        assert data["merit_badge_id"] == str(test_merit_badge.id)
        assert data["notes"] == "Work on requirements during outing"
        assert "id" in data
    
    async def test_add_merit_badge_outing_not_found(
        self, client: AsyncClient, auth_headers, test_merit_badge
    ):
        """Test adding merit badge to non-existent outing"""
        fake_outing_id = uuid4()
        payload = {
            "merit_badge_id": str(test_merit_badge.id),
            "notes": "Test"
        }
        
        response = await client.post(
            f"/api/requirements/outings/{fake_outing_id}/merit-badges",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 404
        assert "outing" in response.json()["detail"].lower()
    
    async def test_add_merit_badge_badge_not_found(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test adding non-existent merit badge to outing"""
        fake_badge_id = uuid4()
        payload = {
            "merit_badge_id": str(fake_badge_id),
            "notes": "Test"
        }
        
        response = await client.post(
            f"/api/requirements/outings/{test_outing.id}/merit-badges",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 404
        assert "merit badge" in response.json()["detail"].lower()
    
    async def test_update_outing_merit_badge(
        self, client: AsyncClient, auth_headers, test_outing, test_merit_badge, db_session
    ):
        """Test updating notes for an outing merit badge"""
        from app.models.requirement import OutingMeritBadge
        
        # Create outing merit badge
        outing_badge = OutingMeritBadge(
            id=uuid4(),
            outing_id=test_outing.id,
            merit_badge_id=test_merit_badge.id,
            notes="Original notes"
        )
        db_session.add(outing_badge)
        await db_session.commit()
        await db_session.refresh(outing_badge)
        
        # Update notes
        update_payload = {"notes": "Updated notes"}
        response = await client.put(
            f"/api/requirements/outing-merit-badges/{outing_badge.id}",
            headers=auth_headers,
            json=update_payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["notes"] == "Updated notes"
    
    async def test_update_outing_merit_badge_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test updating non-existent outing merit badge"""
        fake_id = uuid4()
        update_payload = {"notes": "Test"}
        
        response = await client.put(
            f"/api/requirements/outing-merit-badges/{fake_id}",
            headers=auth_headers,
            json=update_payload
        )
        
        assert response.status_code == 404
    
    async def test_remove_merit_badge_from_outing(
        self, client: AsyncClient, auth_headers, test_outing, test_merit_badge, db_session
    ):
        """Test removing a merit badge from an outing"""
        from app.models.requirement import OutingMeritBadge
        
        # Create outing merit badge
        outing_badge = OutingMeritBadge(
            id=uuid4(),
            outing_id=test_outing.id,
            merit_badge_id=test_merit_badge.id,
            notes="Test notes"
        )
        db_session.add(outing_badge)
        await db_session.commit()
        await db_session.refresh(outing_badge)
        
        # Remove it
        response = await client.delete(
            f"/api/requirements/outing-merit-badges/{outing_badge.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
    
    async def test_remove_outing_merit_badge_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test removing non-existent outing merit badge"""
        fake_id = uuid4()
        
        response = await client.delete(
            f"/api/requirements/outing-merit-badges/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404


class TestParticipantProgress:
    """Test participant progress tracking endpoints"""
    
    async def test_list_participant_progress_empty(
        self, client: AsyncClient, auth_headers, test_family_member
    ):
        """Test listing progress for participant with none"""
        response = await client.get(
            f"/api/requirements/participants/{test_family_member.id}/progress",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    async def test_record_participant_progress(
        self, client: AsyncClient, auth_headers, test_family_member, test_rank_requirement, test_outing
    ):
        """Test recording progress for a participant"""
        payload = {
            "rank_requirement_id": str(test_rank_requirement.id),
            "outing_id": str(test_outing.id),
            "completed": True,
            "notes": "Completed during camping trip"
        }
        
        response = await client.post(
            f"/api/requirements/participants/{test_family_member.id}/progress",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["family_member_id"] == str(test_family_member.id)
        assert data["rank_requirement_id"] == str(test_rank_requirement.id)
        assert data["outing_id"] == str(test_outing.id)
        assert data["completed"] is True
        assert data["notes"] == "Completed during camping trip"
        assert "id" in data
    
    async def test_record_progress_participant_not_found(
        self, client: AsyncClient, auth_headers, test_rank_requirement, test_outing
    ):
        """Test recording progress for non-existent participant"""
        fake_participant_id = uuid4()
        payload = {
            "rank_requirement_id": str(test_rank_requirement.id),
            "outing_id": str(test_outing.id),
            "completed": True
        }
        
        response = await client.post(
            f"/api/requirements/participants/{fake_participant_id}/progress",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 404
        assert "participant" in response.json()["detail"].lower()
    
    async def test_record_progress_requirement_not_found(
        self, client: AsyncClient, auth_headers, test_family_member, test_outing
    ):
        """Test recording progress for non-existent requirement"""
        fake_req_id = uuid4()
        payload = {
            "rank_requirement_id": str(fake_req_id),
            "outing_id": str(test_outing.id),
            "completed": True
        }
        
        response = await client.post(
            f"/api/requirements/participants/{test_family_member.id}/progress",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 404
        assert "requirement" in response.json()["detail"].lower()
    
    async def test_update_participant_progress(
        self, client: AsyncClient, auth_headers, test_family_member, test_rank_requirement, test_outing, db_session
    ):
        """Test updating participant progress"""
        from app.models.requirement import ParticipantProgress
        
        # Create progress record
        progress = ParticipantProgress(
            id=uuid4(),
            family_member_id=test_family_member.id,
            rank_requirement_id=test_rank_requirement.id,
            outing_id=test_outing.id,
            completed=False,
            notes="In progress"
        )
        db_session.add(progress)
        await db_session.commit()
        await db_session.refresh(progress)
        
        # Update to completed
        update_payload = {
            "completed": True,
            "notes": "Completed successfully"
        }
        
        response = await client.put(
            f"/api/requirements/progress/{progress.id}",
            headers=auth_headers,
            json=update_payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is True
        assert data["notes"] == "Completed successfully"
    
    async def test_update_progress_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test updating non-existent progress record"""
        fake_id = uuid4()
        update_payload = {"completed": True}
        
        response = await client.put(
            f"/api/requirements/progress/{fake_id}",
            headers=auth_headers,
            json=update_payload
        )
        
        assert response.status_code == 404
    
    async def test_delete_participant_progress(
        self, client: AsyncClient, auth_headers, test_family_member, test_rank_requirement, test_outing, db_session
    ):
        """Test deleting participant progress"""
        from app.models.requirement import ParticipantProgress
        
        # Create progress record
        progress = ParticipantProgress(
            id=uuid4(),
            family_member_id=test_family_member.id,
            rank_requirement_id=test_rank_requirement.id,
            outing_id=test_outing.id,
            completed=True
        )
        db_session.add(progress)
        await db_session.commit()
        await db_session.refresh(progress)
        
        # Delete it
        response = await client.delete(
            f"/api/requirements/progress/{progress.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
    
    async def test_delete_progress_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test deleting non-existent progress record"""
        fake_id = uuid4()
        
        response = await client.delete(
            f"/api/requirements/progress/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
