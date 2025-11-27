"""Tests for timezone utilities"""
import pytest
from datetime import datetime
from zoneinfo import ZoneInfo

from app.utils.timezone import (
    validate_timezone,
    utc_now,
    local_to_utc,
    utc_to_local,
    DEFAULT_TZ,
)


class TestValidateTimezone:
    """Tests for validate_timezone function"""

    def test_valid_timezone(self):
        """Test with a valid IANA timezone"""
        result = validate_timezone("America/New_York")
        assert result == "America/New_York"

    def test_another_valid_timezone(self):
        """Test with another valid timezone"""
        result = validate_timezone("Europe/London")
        assert result == "Europe/London"

    def test_utc_timezone(self):
        """Test with UTC timezone"""
        result = validate_timezone("UTC")
        assert result == "UTC"

    def test_invalid_timezone_returns_default(self):
        """Test that invalid timezone returns default"""
        result = validate_timezone("Invalid/Timezone")
        assert result == DEFAULT_TZ

    def test_none_returns_default(self):
        """Test that None returns default timezone"""
        result = validate_timezone(None)
        assert result == DEFAULT_TZ

    def test_empty_string_returns_default(self):
        """Test that empty string returns default timezone"""
        result = validate_timezone("")
        assert result == DEFAULT_TZ


class TestUtcNow:
    """Tests for utc_now function"""

    def test_returns_datetime(self):
        """Test that utc_now returns a datetime object"""
        result = utc_now()
        assert isinstance(result, datetime)

    def test_returns_naive_datetime(self):
        """Test that utc_now returns a naive datetime (no timezone info)"""
        result = utc_now()
        assert result.tzinfo is None

    def test_returns_current_time(self):
        """Test that utc_now returns approximately current time"""
        before = datetime.utcnow()
        result = utc_now()
        after = datetime.utcnow()
        assert before <= result <= after


class TestLocalToUtc:
    """Tests for local_to_utc function"""

    def test_naive_datetime_conversion(self):
        """Test converting a naive local datetime to UTC"""
        # 12:00 PM in New York (Eastern Time)
        local_dt = datetime(2024, 6, 15, 12, 0, 0)  # Summer - EDT (-4)
        result = local_to_utc(local_dt, "America/New_York")
        
        # Should be 4 hours ahead in UTC during summer (EDT)
        assert result.tzinfo is None  # Returns naive UTC
        assert result.hour == 16  # 12 + 4 = 16

    def test_winter_conversion(self):
        """Test DST handling in winter (EST)"""
        # 12:00 PM in New York (Eastern Standard Time)
        local_dt = datetime(2024, 1, 15, 12, 0, 0)  # Winter - EST (-5)
        result = local_to_utc(local_dt, "America/New_York")
        
        # Should be 5 hours ahead in UTC during winter (EST)
        assert result.tzinfo is None
        assert result.hour == 17  # 12 + 5 = 17

    def test_aware_datetime_conversion(self):
        """Test converting an aware datetime to UTC"""
        # Create an aware datetime in Pacific time
        pacific = ZoneInfo("America/Los_Angeles")
        local_dt = datetime(2024, 6, 15, 12, 0, 0, tzinfo=pacific)  # Summer - PDT (-7)
        result = local_to_utc(local_dt, "America/New_York")  # tz_name ignored for aware dt
        
        # Should be 7 hours ahead in UTC during summer
        assert result.tzinfo is None
        assert result.hour == 19  # 12 + 7 = 19

    def test_with_invalid_timezone(self):
        """Test that invalid timezone falls back to default"""
        local_dt = datetime(2024, 6, 15, 12, 0, 0)
        # Should use DEFAULT_TZ (America/New_York) when invalid tz provided
        result = local_to_utc(local_dt, "Invalid/Timezone")
        
        # Result should be valid (using default timezone)
        assert result.tzinfo is None
        assert isinstance(result, datetime)

    def test_with_none_timezone(self):
        """Test with None timezone (should use default)"""
        local_dt = datetime(2024, 6, 15, 12, 0, 0)
        result = local_to_utc(local_dt, None)
        
        # Should use DEFAULT_TZ
        assert result.tzinfo is None
        assert isinstance(result, datetime)


class TestUtcToLocal:
    """Tests for utc_to_local function"""

    def test_basic_conversion(self):
        """Test converting UTC to local time"""
        # 16:00 UTC
        utc_dt = datetime(2024, 6, 15, 16, 0, 0)
        result = utc_to_local(utc_dt, "America/New_York")
        
        # Should be 4 hours behind in EDT (summer)
        assert result.tzinfo is not None  # Returns aware datetime
        assert result.hour == 12  # 16 - 4 = 12

    def test_winter_conversion(self):
        """Test DST handling in winter"""
        # 17:00 UTC
        utc_dt = datetime(2024, 1, 15, 17, 0, 0)
        result = utc_to_local(utc_dt, "America/New_York")
        
        # Should be 5 hours behind in EST (winter)
        assert result.tzinfo is not None
        assert result.hour == 12  # 17 - 5 = 12

    def test_different_timezone(self):
        """Test conversion to different timezone"""
        # 20:00 UTC
        utc_dt = datetime(2024, 6, 15, 20, 0, 0)
        result = utc_to_local(utc_dt, "America/Los_Angeles")
        
        # Should be 7 hours behind in PDT (summer)
        assert result.tzinfo is not None
        assert result.hour == 13  # 20 - 7 = 13

    def test_utc_timezone(self):
        """Test conversion to UTC timezone (no change)"""
        utc_dt = datetime(2024, 6, 15, 12, 0, 0)
        result = utc_to_local(utc_dt, "UTC")
        
        assert result.hour == 12  # Should be same

    def test_with_invalid_timezone(self):
        """Test that invalid timezone falls back to default"""
        utc_dt = datetime(2024, 6, 15, 16, 0, 0)
        result = utc_to_local(utc_dt, "Invalid/Timezone")
        
        # Should use DEFAULT_TZ (America/New_York)
        assert result.tzinfo is not None
        assert isinstance(result, datetime)

    def test_with_none_timezone(self):
        """Test with None timezone (should use default)"""
        utc_dt = datetime(2024, 6, 15, 16, 0, 0)
        result = utc_to_local(utc_dt, None)
        
        # Should use DEFAULT_TZ
        assert result.tzinfo is not None
        assert isinstance(result, datetime)


class TestRoundTrip:
    """Tests for round-trip conversion"""

    def test_roundtrip_conversion(self):
        """Test that local -> UTC -> local gives original time"""
        original = datetime(2024, 6, 15, 14, 30, 45)
        tz = "America/New_York"
        
        # Convert to UTC
        utc = local_to_utc(original, tz)
        
        # Convert back to local
        roundtrip = utc_to_local(utc, tz)
        
        # Should get back original time (compare without tzinfo)
        assert roundtrip.replace(tzinfo=None) == original

    def test_roundtrip_winter(self):
        """Test round-trip in winter (different DST offset)"""
        original = datetime(2024, 1, 15, 14, 30, 45)
        tz = "America/New_York"
        
        utc = local_to_utc(original, tz)
        roundtrip = utc_to_local(utc, tz)
        
        assert roundtrip.replace(tzinfo=None) == original

    def test_roundtrip_pacific(self):
        """Test round-trip with Pacific timezone"""
        original = datetime(2024, 6, 15, 10, 0, 0)
        tz = "America/Los_Angeles"
        
        utc = local_to_utc(original, tz)
        roundtrip = utc_to_local(utc, tz)
        
        assert roundtrip.replace(tzinfo=None) == original
