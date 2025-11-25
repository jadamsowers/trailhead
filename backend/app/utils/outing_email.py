from datetime import datetime
from typing import Any, Dict, List

EMAIL_DATE_FORMAT = "%b %d, %Y"
EMAIL_TIME_FORMAT = "%I:%M %p"


def _format_value(value: Any) -> str:
    """Format values for readability in email body."""
    if value is None:
        return "(empty)"
    if isinstance(value, datetime):
        return value.strftime(f"{EMAIL_DATE_FORMAT} {EMAIL_TIME_FORMAT}")
    return str(value)


OUTING_FIELD_LABELS: Dict[str, str] = {
    "name": "Outing Name",
    "outing_date": "Start Date",
    "end_date": "End Date",
    "location": "Location (Legacy)",
    "description": "Description",
    "max_participants": "Max Participants",
    "capacity_type": "Capacity Type",
    "is_overnight": "Overnight",
    "outing_lead_name": "Outing Lead Name",
    "outing_lead_email": "Outing Lead Email",
    "outing_lead_phone": "Outing Lead Phone",
    "drop_off_time": "Drop-off Time",
    "drop_off_location": "Drop-off Location",
    "pickup_time": "Pickup Time",
    "pickup_location": "Pickup Location",
    "cost": "Cost",
    "gear_list": "Suggested Gear List",
    "signups_close_at": "Signups Close At",
    "signups_closed": "Signups Closed (Manual)",
    "icon": "Icon",
    "outing_address": "Outing Address",
    "outing_place_id": "Outing Place",
    "pickup_address": "Pickup Address",
    "pickup_place_id": "Pickup Place",
    "dropoff_address": "Drop-off Address",
    "dropoff_place_id": "Drop-off Place",
}


def generate_outing_update_email(before: Any, after: Any, changed_fields: List[str]) -> (str, str):
    """
    Generate subject and body for outing update email.
    :param before: Outing instance before update
    :param after: Outing instance after update
    :param changed_fields: list of changed attribute names
    :return: (subject, body)
    """
    subject = f"Update: {after.name} details changed"
    lines = [
        f"The outing '{after.name}' has been updated.",
        "",
        "Changed Fields:",
    ]
    for field in changed_fields:
        label = OUTING_FIELD_LABELS.get(field, field)
        before_val = _format_value(getattr(before, field))
        after_val = _format_value(getattr(after, field))
        if before_val == after_val:
            continue  # Skip if formatting made them appear same
        lines.append(f"- {label}: {before_val} → {after_val}")

    lines.append("")
    lines.append("If you have any questions about these changes, please contact the outing lead.")
    if after.outing_lead_name and after.outing_lead_email:
        lines.append(f"Lead: {after.outing_lead_name} <{after.outing_lead_email}>")
    elif after.outing_lead_name:
        lines.append(f"Lead: {after.outing_lead_name}")

    body = "\n".join(lines)
    return subject, body


def diff_outing(before: Any, after: Any) -> List[str]:
    """Return list of field names that changed between two Outing objects."""
    changed = []
    for field in OUTING_FIELD_LABELS.keys():
        if getattr(before, field) != getattr(after, field):
            changed.append(field)
    return changed
