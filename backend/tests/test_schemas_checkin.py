"""Tests for checkin schema validators"""
import pytest
from datetime import datetime
from uuid import uuid4
from pydantic import ValidationError

from app.schemas.checkin import (
    CheckInParticipant,
    CheckInSummary,
    CheckInCreate,
    CheckInBulkCreate,
    CheckInRecord,
    CheckInResponse,
    CheckInExportRow,
)


class TestCheckInParticipant:
    """Tests for CheckInParticipant schema"""

    def test_valid_participant(self):
        """Test creating a valid check-in participant"""
        participant = CheckInParticipant(
            id=uuid4(),
            signup_id=uuid4(),
            name="Test Scout",
            member_type="scout",
            family_name="Smith Family"
        )
        assert participant.name == "Test Scout"
        assert participant.member_type == "scout"
        assert participant.is_checked_in is False

    def test_participant_with_all_fields(self):
        """Test participant with all fields populated"""
        checked_in_time = datetime.now()
        participant = CheckInParticipant(
            id=uuid4(),
            signup_id=uuid4(),
            name="Test Scout",
            member_type="scout",
            family_name="Smith Family",
            patrol_name="Eagle Patrol",
            troop_number="123",
            is_checked_in=True,
            checked_in_at=checked_in_time,
            checked_in_by="Leader Name"
        )
        assert participant.patrol_name == "Eagle Patrol"
        assert participant.troop_number == "123"
        assert participant.is_checked_in is True
        assert participant.checked_in_at == checked_in_time
        assert participant.checked_in_by == "Leader Name"

    def test_participant_default_values(self):
        """Test participant default values"""
        participant = CheckInParticipant(
            id=uuid4(),
            signup_id=uuid4(),
            name="Test",
            member_type="scout",
            family_name="Family"
        )
        assert participant.patrol_name is None
        assert participant.troop_number is None
        assert participant.is_checked_in is False
        assert participant.checked_in_at is None
        assert participant.checked_in_by is None


class TestCheckInSummary:
    """Tests for CheckInSummary schema"""

    def test_valid_summary(self):
        """Test creating a valid check-in summary"""
        summary = CheckInSummary(
            outing_id=uuid4(),
            outing_name="Fall Campout",
            outing_date=datetime.now(),
            total_participants=10,
            checked_in_count=5,
            participants=[]
        )
        assert summary.outing_name == "Fall Campout"
        assert summary.total_participants == 10
        assert summary.checked_in_count == 5

    def test_summary_with_participants(self):
        """Test summary with participant list"""
        participant = CheckInParticipant(
            id=uuid4(),
            signup_id=uuid4(),
            name="Test Scout",
            member_type="scout",
            family_name="Smith"
        )
        summary = CheckInSummary(
            outing_id=uuid4(),
            outing_name="Camping Trip",
            outing_date=datetime.now(),
            total_participants=1,
            checked_in_count=0,
            participants=[participant]
        )
        assert len(summary.participants) == 1
        assert summary.participants[0].name == "Test Scout"


class TestCheckInCreate:
    """Tests for CheckInCreate schema"""

    def test_valid_checkin_create(self):
        """Test creating a valid check-in request"""
        checkin = CheckInCreate(
            participant_ids=[uuid4()],
            checked_in_by="Leader Name"
        )
        assert len(checkin.participant_ids) == 1
        assert checkin.checked_in_by == "Leader Name"

    def test_multiple_participants(self):
        """Test check-in with multiple participants"""
        checkin = CheckInCreate(
            participant_ids=[uuid4(), uuid4(), uuid4()],
            checked_in_by="Leader Email"
        )
        assert len(checkin.participant_ids) == 3

    def test_empty_participant_ids_raises_error(self):
        """Test that empty participant_ids raises error"""
        with pytest.raises(ValidationError):
            CheckInCreate(
                participant_ids=[],
                checked_in_by="Leader"
            )

    def test_empty_checked_in_by_raises_error(self):
        """Test that empty checked_in_by raises error"""
        with pytest.raises(ValidationError):
            CheckInCreate(
                participant_ids=[uuid4()],
                checked_in_by=""
            )

    def test_checked_in_by_too_long_raises_error(self):
        """Test that checked_in_by too long raises error"""
        with pytest.raises(ValidationError):
            CheckInCreate(
                participant_ids=[uuid4()],
                checked_in_by="x" * 256
            )


class TestCheckInBulkCreate:
    """Tests for CheckInBulkCreate schema"""

    def test_valid_bulk_create(self):
        """Test creating a valid bulk check-in request"""
        bulk = CheckInBulkCreate(participant_ids=[uuid4()])
        assert len(bulk.participant_ids) == 1

    def test_multiple_participants(self):
        """Test bulk check-in with multiple participants"""
        bulk = CheckInBulkCreate(
            participant_ids=[uuid4(), uuid4(), uuid4(), uuid4()]
        )
        assert len(bulk.participant_ids) == 4

    def test_empty_list_raises_error(self):
        """Test that empty list raises error"""
        with pytest.raises(ValidationError):
            CheckInBulkCreate(participant_ids=[])


class TestCheckInRecord:
    """Tests for CheckInRecord schema"""

    def test_valid_record(self):
        """Test creating a valid check-in record"""
        now = datetime.now()
        record = CheckInRecord(
            id=uuid4(),
            outing_id=uuid4(),
            signup_id=uuid4(),
            participant_id=uuid4(),
            participant_name="Test Scout",
            checked_in_at=now,
            checked_in_by="Leader Name",
            created_at=now
        )
        assert record.participant_name == "Test Scout"
        assert record.checked_in_at == now
        assert record.checked_in_by == "Leader Name"


class TestCheckInResponse:
    """Tests for CheckInResponse schema"""

    def test_valid_response(self):
        """Test creating a valid check-in response"""
        response = CheckInResponse(
            message="Successfully checked in 3 participants",
            checked_in_count=3,
            participant_ids=[uuid4(), uuid4(), uuid4()],
            checked_in_at=datetime.now()
        )
        assert response.message.startswith("Successfully")
        assert response.checked_in_count == 3
        assert len(response.participant_ids) == 3


class TestCheckInExportRow:
    """Tests for CheckInExportRow schema"""

    def test_valid_export_row(self):
        """Test creating a valid export row"""
        row = CheckInExportRow(
            participant_name="Test Scout",
            member_type="scout",
            family_name="Smith Family",
            checked_in=True
        )
        assert row.participant_name == "Test Scout"
        assert row.checked_in is True

    def test_export_row_all_fields(self):
        """Test export row with all fields"""
        row = CheckInExportRow(
            participant_name="Test Scout",
            member_type="scout",
            family_name="Smith Family",
            patrol_name="Eagle Patrol",
            troop_number="123",
            checked_in=True,
            checked_in_at="2024-06-15 10:30:00",
            checked_in_by="Leader Name"
        )
        assert row.patrol_name == "Eagle Patrol"
        assert row.troop_number == "123"
        assert row.checked_in_at == "2024-06-15 10:30:00"
        assert row.checked_in_by == "Leader Name"

    def test_export_row_not_checked_in(self):
        """Test export row for participant not checked in"""
        row = CheckInExportRow(
            participant_name="Not Here Scout",
            member_type="scout",
            family_name="Family",
            checked_in=False
        )
        assert row.checked_in is False
        assert row.checked_in_at is None
        assert row.checked_in_by is None
