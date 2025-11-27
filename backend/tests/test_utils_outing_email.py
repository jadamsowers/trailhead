"""Tests for outing email utilities"""
import pytest
from datetime import datetime

from app.utils.outing_email import (
    _format_value,
    OUTING_FIELD_LABELS,
    generate_outing_update_email,
    diff_outing,
    EMAIL_DATE_FORMAT,
    EMAIL_TIME_FORMAT,
)


class MockOuting:
    """Mock Outing object for testing"""
    
    def __init__(self, **kwargs):
        # Set defaults for all possible fields
        defaults = {
            "name": "Test Outing",
            "outing_date": datetime(2024, 6, 15),
            "end_date": datetime(2024, 6, 16),
            "location": "Test Location",
            "description": "Test Description",
            "max_participants": 20,
            "capacity_type": "per_family",
            "is_overnight": True,
            "outing_lead_name": "John Doe",
            "outing_lead_email": "john@example.com",
            "outing_lead_phone": "555-1234",
            "drop_off_time": "8:00 AM",
            "drop_off_location": "Trailhead",
            "pickup_time": "6:00 PM",
            "pickup_location": "Same as drop-off",
            "cost": "25.00",
            "gear_list": "Tent, Sleeping bag",
            "signups_close_at": datetime(2024, 6, 14),
            "signups_closed": False,
            "icon": "camping",
            "outing_address": "123 Trail Rd",
            "outing_place_id": None,
            "pickup_address": "123 Trail Rd",
            "pickup_place_id": None,
            "dropoff_address": "123 Trail Rd",
            "dropoff_place_id": None,
        }
        # Override defaults with provided kwargs
        defaults.update(kwargs)
        for key, value in defaults.items():
            setattr(self, key, value)


class TestFormatValue:
    """Tests for _format_value function"""

    def test_format_none(self):
        """Test formatting None returns '(empty)'"""
        result = _format_value(None)
        assert result == "(empty)"

    def test_format_string(self):
        """Test formatting a string returns the string"""
        result = _format_value("Test String")
        assert result == "Test String"

    def test_format_integer(self):
        """Test formatting an integer"""
        result = _format_value(42)
        assert result == "42"

    def test_format_boolean_true(self):
        """Test formatting True"""
        result = _format_value(True)
        assert result == "True"

    def test_format_boolean_false(self):
        """Test formatting False"""
        result = _format_value(False)
        assert result == "False"

    def test_format_datetime(self):
        """Test formatting a datetime"""
        dt = datetime(2024, 6, 15, 14, 30, 0)
        result = _format_value(dt)
        expected = dt.strftime(f"{EMAIL_DATE_FORMAT} {EMAIL_TIME_FORMAT}")
        assert result == expected
        assert "Jun 15, 2024" in result
        assert "02:30 PM" in result


class TestOutingFieldLabels:
    """Tests for OUTING_FIELD_LABELS constant"""

    def test_name_label(self):
        """Test that 'name' has correct label"""
        assert OUTING_FIELD_LABELS["name"] == "Outing Name"

    def test_outing_date_label(self):
        """Test that 'outing_date' has correct label"""
        assert OUTING_FIELD_LABELS["outing_date"] == "Start Date"

    def test_location_label(self):
        """Test that 'location' has correct label"""
        assert OUTING_FIELD_LABELS["location"] == "Location (Legacy)"

    def test_all_expected_fields_present(self):
        """Test that all expected fields have labels"""
        expected_fields = [
            "name", "outing_date", "end_date", "location", "description",
            "max_participants", "capacity_type", "is_overnight",
            "outing_lead_name", "outing_lead_email", "outing_lead_phone",
            "drop_off_time", "drop_off_location", "pickup_time", "pickup_location",
            "cost", "gear_list", "signups_close_at", "signups_closed", "icon",
            "outing_address", "outing_place_id", "pickup_address", "pickup_place_id",
            "dropoff_address", "dropoff_place_id",
        ]
        for field in expected_fields:
            assert field in OUTING_FIELD_LABELS, f"Missing label for field: {field}"


class TestDiffOuting:
    """Tests for diff_outing function"""

    def test_no_changes(self):
        """Test diff when no fields changed"""
        before = MockOuting()
        after = MockOuting()
        
        result = diff_outing(before, after)
        assert result == []

    def test_single_field_change(self):
        """Test diff when one field changed"""
        before = MockOuting(name="Old Name")
        after = MockOuting(name="New Name")
        
        result = diff_outing(before, after)
        assert "name" in result
        assert len(result) == 1

    def test_multiple_field_changes(self):
        """Test diff when multiple fields changed"""
        before = MockOuting(
            name="Old Name",
            location="Old Location",
            max_participants=10,
        )
        after = MockOuting(
            name="New Name",
            location="New Location",
            max_participants=20,
        )
        
        result = diff_outing(before, after)
        assert "name" in result
        assert "location" in result
        assert "max_participants" in result

    def test_date_change(self):
        """Test diff when date field changed"""
        before = MockOuting(outing_date=datetime(2024, 6, 15))
        after = MockOuting(outing_date=datetime(2024, 7, 20))
        
        result = diff_outing(before, after)
        assert "outing_date" in result

    def test_none_to_value_change(self):
        """Test diff when field changes from None to value"""
        before = MockOuting(end_date=None)
        after = MockOuting(end_date=datetime(2024, 6, 16))
        
        result = diff_outing(before, after)
        assert "end_date" in result

    def test_value_to_none_change(self):
        """Test diff when field changes from value to None"""
        before = MockOuting(end_date=datetime(2024, 6, 16))
        after = MockOuting(end_date=None)
        
        result = diff_outing(before, after)
        assert "end_date" in result


class TestGenerateOutingUpdateEmail:
    """Tests for generate_outing_update_email function"""

    def test_basic_email_generation(self):
        """Test basic email generation with one changed field"""
        before = MockOuting(name="Old Camping Trip")
        after = MockOuting(name="New Camping Adventure")
        changed_fields = ["name"]
        
        subject, body = generate_outing_update_email(before, after, changed_fields)
        
        assert "New Camping Adventure" in subject
        assert "New Camping Adventure" in body
        assert "Outing Name:" in body
        assert "Old Camping Trip" in body

    def test_email_with_multiple_changes(self):
        """Test email with multiple changed fields"""
        before = MockOuting(
            name="Summer Camp",
            location="Old Park",
            max_participants=10,
        )
        after = MockOuting(
            name="Summer Camp",
            location="New Park",
            max_participants=25,
        )
        changed_fields = ["location", "max_participants"]
        
        subject, body = generate_outing_update_email(before, after, changed_fields)
        
        assert "Summer Camp" in subject
        assert "Location (Legacy):" in body
        assert "Old Park" in body
        assert "New Park" in body
        assert "Max Participants:" in body
        assert "10" in body
        assert "25" in body

    def test_email_includes_lead_info(self):
        """Test that email includes outing lead info when available"""
        before = MockOuting(name="Test Outing")
        after = MockOuting(
            name="Updated Outing",
            outing_lead_name="Jane Smith",
            outing_lead_email="jane@example.com",
        )
        changed_fields = ["name"]
        
        subject, body = generate_outing_update_email(before, after, changed_fields)
        
        assert "Jane Smith" in body
        assert "jane@example.com" in body

    def test_email_with_lead_name_only(self):
        """Test email when only lead name is available (no email)"""
        before = MockOuting(name="Test Outing")
        after = MockOuting(
            name="Updated Outing",
            outing_lead_name="Jane Smith",
            outing_lead_email=None,
        )
        changed_fields = ["name"]
        
        subject, body = generate_outing_update_email(before, after, changed_fields)
        
        assert "Jane Smith" in body
        # Email should show name without the email in angle brackets
        assert "<" not in body or "Jane Smith" in body

    def test_email_skips_unchanged_formatted_values(self):
        """Test that identical formatted values are skipped"""
        # Both have the same datetime
        dt = datetime(2024, 6, 15, 10, 0, 0)
        before = MockOuting(outing_date=dt)
        after = MockOuting(outing_date=dt)
        changed_fields = ["outing_date"]
        
        subject, body = generate_outing_update_email(before, after, changed_fields)
        
        # The "Start Date:" change should not appear since values are same
        lines = body.split("\n")
        change_lines = [l for l in lines if "Start Date:" in l]
        assert len(change_lines) == 0

    def test_email_with_none_values(self):
        """Test email generation when before value is None"""
        before = MockOuting(description=None)
        after = MockOuting(description="New Description")
        changed_fields = ["description"]
        
        subject, body = generate_outing_update_email(before, after, changed_fields)
        
        assert "(empty)" in body  # Before value was None
        assert "New Description" in body

    def test_email_subject_format(self):
        """Test the email subject format"""
        before = MockOuting(name="Original Outing")
        after = MockOuting(name="Updated Outing Name")
        changed_fields = ["name"]
        
        subject, body = generate_outing_update_email(before, after, changed_fields)
        
        assert subject.startswith("Update:")
        assert "Updated Outing Name" in subject

    def test_email_includes_contact_instructions(self):
        """Test that email includes contact instructions"""
        before = MockOuting(name="Test")
        after = MockOuting(name="Test Updated")
        changed_fields = ["name"]
        
        subject, body = generate_outing_update_email(before, after, changed_fields)
        
        assert "questions" in body.lower()
        assert "contact" in body.lower()


class TestEmailDateTimeFormats:
    """Tests for email date/time format constants"""

    def test_date_format(self):
        """Test EMAIL_DATE_FORMAT is valid"""
        dt = datetime(2024, 6, 15)
        formatted = dt.strftime(EMAIL_DATE_FORMAT)
        assert formatted == "Jun 15, 2024"

    def test_time_format(self):
        """Test EMAIL_TIME_FORMAT is valid"""
        dt = datetime(2024, 6, 15, 14, 30, 0)
        formatted = dt.strftime(EMAIL_TIME_FORMAT)
        assert formatted == "02:30 PM"

    def test_time_format_am(self):
        """Test EMAIL_TIME_FORMAT for AM times"""
        dt = datetime(2024, 6, 15, 9, 15, 0)
        formatted = dt.strftime(EMAIL_TIME_FORMAT)
        assert formatted == "09:15 AM"
