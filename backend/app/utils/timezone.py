"""Timezone utilities for consistent UTC storage and DST-safe user rendering.

Policy:
- All timestamps stored in the database are UTC (naive). Use datetime.utcnow() when generating server-side timestamps.
- Users have a preferred IANA timezone (e.g., "America/New_York").
- Convert to/from user time using Python's zoneinfo (stdlib) for DST correctness.

Usage:
- When receiving a local datetime string from a client for scheduling, interpret it in the user's timezone and convert to UTC before persisting.
- When returning datetimes to a client for display, convert UTC (naive) to user's timezone and return an ISO string or datetime per API contract.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

try:
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover
    # Fallback for very old Python; project uses modern Python so this should not happen.
    ZoneInfo = None  # type: ignore

DEFAULT_TZ = "America/New_York"


def validate_timezone(tz: Optional[str]) -> str:
    """Validate an IANA timezone string and return a safe value.
    Falls back to DEFAULT_TZ if invalid or missing.
    """
    if not tz:
        return DEFAULT_TZ
    if ZoneInfo is None:
        return DEFAULT_TZ
    try:
        ZoneInfo(tz)
        return tz
    except Exception:
        return DEFAULT_TZ


def utc_now() -> datetime:
    """Get current UTC time as a naive datetime for DB storage."""
    return datetime.utcnow()


def local_to_utc(local_dt: datetime, tz_name: Optional[str]) -> datetime:
    """Convert a local datetime to UTC (naive) using the user's timezone.

    - If local_dt is naive, interpret it as wall time in tz_name.
    - If local_dt is aware, convert to UTC.
    Returns a naive UTC datetime suitable for DB storage.
    """
    tz_name = validate_timezone(tz_name)
    if ZoneInfo is None:
        # Best-effort: assume input is already UTC
        return local_dt if local_dt.tzinfo is None else local_dt.astimezone().replace(tzinfo=None)
    tz = ZoneInfo(tz_name)
    if local_dt.tzinfo is None:
        aware = local_dt.replace(tzinfo=tz)
    else:
        aware = local_dt.astimezone(tz)
    utc_aware = aware.astimezone(ZoneInfo("UTC"))
    return utc_aware.replace(tzinfo=None)


def utc_to_local(utc_dt: datetime, tz_name: Optional[str]) -> datetime:
    """Convert a naive UTC datetime from DB to user's local timezone as aware datetime.

    Returns an aware datetime in tz_name. If tz_name invalid, uses DEFAULT_TZ.
    """
    tz_name = validate_timezone(tz_name)
    if ZoneInfo is None:
        # Return naive when zoneinfo unavailable
        return utc_dt
    tz = ZoneInfo(tz_name)
    # Attach UTC to naive then convert
    utc_aware = utc_dt.replace(tzinfo=ZoneInfo("UTC"))
    return utc_aware.astimezone(tz)
