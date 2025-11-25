"""Tests for api/checkin.py"""
import pytest
from httpx import AsyncClient
from uuid import uuid4
from datetime import datetime, timezone


@pytest.fixture
async def test_checkin(db_session, test_outing, test_signup):
    """Create a test checkin record"""
    from app.models.checkin import CheckIn
    from app.models.participant import Participant
    from sqlalchemy import select
    
    # Get first participant from the signup
    result = await db_session.execute(
        select(Participant).where(Participant.signup_id == test_signup.id).limit(1)
    )
    participant = result.scalar_one()
    
    checkin = CheckIn(
        id=uuid4(),
        outing_id=test_outing.id,
        signup_id=test_signup.id,
        participant_id=participant.id,
        checked_in_by="Test Admin",
        checked_in_at=datetime.now(timezone.utc).replace(tzinfo=None)
    )
    db_session.add(checkin)
    await db_session.commit()
    await db_session.refresh(checkin)
    return checkin


@pytest.mark.asyncio
class TestGetCheckinStatus:
    """Test GET /api/outings/{outing_id}/checkin endpoint"""
    
    async def test_get_checkin_status_success(
        self, client: AsyncClient, auth_headers, test_outing, test_signup
    ):
        """Test getting check-in status for an outing"""
        response = await client.get(
            f"/api/outings/{test_outing.id}/checkin",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "outing_id" in data
        assert "outing_name" in data
        assert "total_participants" in data
        assert "checked_in_count" in data
        assert "participants" in data
        assert data["outing_id"] == str(test_outing.id)
        assert data["total_participants"] > 0
    
    async def test_get_checkin_status_with_checkins(
        self, client: AsyncClient, auth_headers, test_outing, test_signup, test_checkin
    ):
        """Test getting check-in status with some participants checked in"""
        response = await client.get(
            f"/api/outings/{test_outing.id}/checkin",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["checked_in_count"] > 0
        
        # Verify participant structure
        participant = data["participants"][0]
        assert "id" in participant
        assert "name" in participant
        assert "is_checked_in" in participant
        assert "member_type" in participant
    
    async def test_get_checkin_status_outing_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test getting check-in status for non-existent outing"""
        fake_id = uuid4()
        
        response = await client.get(
            f"/api/outings/{fake_id}/checkin",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    async def test_get_checkin_status_no_auth(self, client: AsyncClient, test_outing):
        """Test getting check-in status without authentication fails"""
        response = await client.get(f"/api/outings/{test_outing.id}/checkin")
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestCheckInParticipants:
    """Test POST /api/outings/{outing_id}/checkin endpoint"""
    
    async def test_check_in_single_participant(
        self, client: AsyncClient, auth_headers, test_outing, test_signup, db_session
    ):
        """Test checking in a single participant"""
        from app.models.participant import Participant
        from sqlalchemy import select
        
        # Get a participant
        result = await db_session.execute(
            select(Participant).where(Participant.signup_id == test_signup.id).limit(1)
        )
        participant = result.scalar_one()
        
        checkin_data = {
            "participant_ids": [str(participant.id)],
            "checked_in_by": "Test Admin"
        }
        
        response = await client.post(
            f"/api/outings/{test_outing.id}/checkin",
            headers=auth_headers,
            json=checkin_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "checked_in_count" in data
        assert data["checked_in_count"] == 1
        assert "participant_ids" in data
        assert str(participant.id) in data["participant_ids"]
    
    async def test_check_in_multiple_participants(
        self, client: AsyncClient, auth_headers, test_outing, test_signup, db_session
    ):
        """Test checking in multiple participants at once"""
        from app.models.participant import Participant
        from sqlalchemy import select
        
        # Get all participants
        result = await db_session.execute(
            select(Participant).where(Participant.signup_id == test_signup.id)
        )
        participants = result.scalars().all()
        participant_ids = [str(p.id) for p in participants]
        
        checkin_data = {
            "participant_ids": participant_ids,
            "checked_in_by": "Test Admin"
        }
        
        response = await client.post(
            f"/api/outings/{test_outing.id}/checkin",
            headers=auth_headers,
            json=checkin_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["checked_in_count"] == len(participants)
    
    async def test_check_in_duplicate_prevented(
        self, client: AsyncClient, auth_headers, test_outing, test_checkin, db_session
    ):
        """Test that duplicate check-ins are prevented"""
        checkin_data = {
            "participant_ids": [str(test_checkin.participant_id)],
            "checked_in_by": "Test Admin"
        }
        
        response = await client.post(
            f"/api/outings/{test_outing.id}/checkin",
            headers=auth_headers,
            json=checkin_data
        )
        
        assert response.status_code == 200
        data = response.json()
        # Should return 0 because participant is already checked in
        assert data["checked_in_count"] == 0
    
    async def test_check_in_outing_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test checking in for non-existent outing"""
        fake_id = uuid4()
        checkin_data = {
            "participant_ids": [str(uuid4())],
            "checked_in_by": "Test Admin"
        }
        
        response = await client.post(
            f"/api/outings/{fake_id}/checkin",
            headers=auth_headers,
            json=checkin_data
        )
        
        assert response.status_code == 404
    
    async def test_check_in_no_auth(self, client: AsyncClient, test_outing):
        """Test checking in without authentication fails"""
        checkin_data = {
            "participant_ids": [str(uuid4())],
            "checked_in_by": "Test Admin"
        }
        
        response = await client.post(
            f"/api/outings/{test_outing.id}/checkin",
            json=checkin_data
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestUndoCheckin:
    """Test DELETE /api/outings/{outing_id}/checkin/{participant_id} endpoint"""
    
    async def test_undo_checkin_success(
        self, client: AsyncClient, auth_headers, test_outing, test_checkin
    ):
        """Test undoing a check-in"""
        response = await client.delete(
            f"/api/outings/{test_outing.id}/checkin/{test_checkin.participant_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "removed" in data["message"].lower()
    
    async def test_undo_checkin_not_found(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test undoing non-existent check-in"""
        fake_id = uuid4()
        
        response = await client.delete(
            f"/api/outings/{test_outing.id}/checkin/{fake_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    async def test_undo_checkin_no_auth(
        self, client: AsyncClient, test_outing, test_checkin
    ):
        """Test undoing check-in without authentication fails"""
        response = await client.delete(
            f"/api/outings/{test_outing.id}/checkin/{test_checkin.participant_id}"
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestResetAllCheckins:
    """Test DELETE /api/outings/{outing_id}/checkin endpoint"""
    
    async def test_reset_all_checkins_success(
        self, client: AsyncClient, auth_headers, test_outing, test_checkin
    ):
        """Test resetting all check-ins for an outing"""
        response = await client.delete(
            f"/api/outings/{test_outing.id}/checkin",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "count" in data
        assert data["count"] > 0
    
    async def test_reset_all_checkins_empty(
        self, client: AsyncClient, auth_headers, test_outing
    ):
        """Test resetting when no check-ins exist"""
        response = await client.delete(
            f"/api/outings/{test_outing.id}/checkin",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
    
    async def test_reset_all_checkins_no_auth(
        self, client: AsyncClient, test_outing
    ):
        """Test resetting check-ins without authentication fails"""
        response = await client.delete(
            f"/api/outings/{test_outing.id}/checkin"
        )
        
        assert response.status_code == 403


@pytest.mark.asyncio
class TestExportCheckinData:
    """Test GET /api/outings/{outing_id}/checkin/export endpoint"""
    
    async def test_export_checkin_data_success(
        self, client: AsyncClient, auth_headers, test_outing, test_signup
    ):
        """Test exporting check-in data as CSV"""
        response = await client.get(
            f"/api/outings/{test_outing.id}/checkin/export",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        assert "attachment" in response.headers["content-disposition"]
        
        # Verify CSV content
        content = response.text
        assert "Participant Name" in content
        assert "Checked In" in content
        assert "Check-in Time" in content
    
    async def test_export_checkin_data_with_checkins(
        self, client: AsyncClient, auth_headers, test_outing, test_signup, test_checkin
    ):
        """Test exporting check-in data with checked-in participants"""
        response = await client.get(
            f"/api/outings/{test_outing.id}/checkin/export",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        content = response.text
        
        # Should contain "Yes" for checked-in participants
        assert "Yes" in content
    
    async def test_export_checkin_data_outing_not_found(
        self, client: AsyncClient, auth_headers
    ):
        """Test exporting for non-existent outing"""
        fake_id = uuid4()
        
        response = await client.get(
            f"/api/outings/{fake_id}/checkin/export",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    async def test_export_checkin_data_no_auth(
        self, client: AsyncClient, test_outing
    ):
        """Test exporting without authentication fails"""
        response = await client.get(
            f"/api/outings/{test_outing.id}/checkin/export"
        )
        
        assert response.status_code == 403
