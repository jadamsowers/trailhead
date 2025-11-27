"""Tests for outing schema validators."""
import pytest
from datetime import date, time
from pydantic import ValidationError

from app.schemas.outing import OutingCreate, OutingUpdate


class TestOutingCreateTimeValidators:
    """Test time field validators in OutingCreate schema."""

    def test_valid_time_string(self):
        """Test that valid time strings are parsed correctly."""
        outing = OutingCreate(
            name="Test Outing",
            outing_date=date(2025, 12, 1),
            end_date=date(2025, 12, 2),
            location="Test Location",
            max_participants=30,
            drop_off_time="09:00:00",
            pickup_time="17:00:00",
        )
        assert outing.drop_off_time == time(9, 0, 0)
        assert outing.pickup_time == time(17, 0, 0)

    def test_none_time(self):
        """Test that None values are accepted."""
        outing = OutingCreate(
            name="Test Outing",
            outing_date=date(2025, 12, 1),
            end_date=date(2025, 12, 2),
            location="Test Location",
            max_participants=30,
            drop_off_time=None,
            pickup_time=None,
        )
        assert outing.drop_off_time is None
        assert outing.pickup_time is None

    def test_empty_string_converts_to_none(self):
        """Test that empty strings are converted to None."""
        outing = OutingCreate(
            name="Test Outing",
            outing_date=date(2025, 12, 1),
            end_date=date(2025, 12, 2),
            location="Test Location",
            max_participants=30,
            drop_off_time="",
            pickup_time="",
        )
        assert outing.drop_off_time is None
        assert outing.pickup_time is None

    def test_missing_time_fields(self):
        """Test that missing time fields default to None."""
        outing = OutingCreate(
            name="Test Outing",
            outing_date=date(2025, 12, 1),
            end_date=date(2025, 12, 2),
            location="Test Location",
            max_participants=30,
        )
        assert outing.drop_off_time is None
        assert outing.pickup_time is None

    def test_invalid_time_string_raises_error(self):
        """Test that invalid time strings raise validation errors."""
        with pytest.raises(ValidationError) as exc_info:
            OutingCreate(
                name="Test Outing",
                outing_date=date(2025, 12, 1),
                end_date=date(2025, 12, 2),
                location="Test Location",
                max_participants=30,
                drop_off_time="invalid",
            )
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("drop_off_time",) for e in errors)


class TestOutingUpdateTimeValidators:
    """Test time field validators in OutingUpdate schema."""

    def test_valid_time_string(self):
        """Test that valid time strings are parsed correctly."""
        update = OutingUpdate(
            drop_off_time="09:00:00",
            pickup_time="17:00:00",
        )
        assert update.drop_off_time == time(9, 0, 0)
        assert update.pickup_time == time(17, 0, 0)

    def test_none_time(self):
        """Test that None values are accepted."""
        update = OutingUpdate(
            drop_off_time=None,
            pickup_time=None,
        )
        assert update.drop_off_time is None
        assert update.pickup_time is None

    def test_empty_string_converts_to_none(self):
        """Test that empty strings are converted to None."""
        update = OutingUpdate(
            drop_off_time="",
            pickup_time="",
        )
        assert update.drop_off_time is None
        assert update.pickup_time is None

    def test_missing_time_fields(self):
        """Test that missing time fields default to None."""
        update = OutingUpdate(name="Updated Name")
        assert update.drop_off_time is None
        assert update.pickup_time is None

    def test_invalid_time_string_raises_error(self):
        """Test that invalid time strings raise validation errors."""
        with pytest.raises(ValidationError) as exc_info:
            OutingUpdate(drop_off_time="invalid")
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("drop_off_time",) for e in errors)
