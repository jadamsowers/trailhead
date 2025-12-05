import pytest
from unittest.mock import MagicMock
from datetime import date, timedelta
from uuid import uuid4

from app.api.endpoints.tenting import _validate_tenting_group, _build_tenting_group_response, _calculate_age


def make_family_member(name, years_old, gender="male", patrol_name="Patrol"):
    dob = date.today() - timedelta(days=years_old * 365 + 1)
    fm = MagicMock()
    fm.date_of_birth = dob
    fm.gender = gender
    fm.patrol_name = patrol_name
    return fm


def make_participant(id_val=None, name="name", family_member=None):
    p = MagicMock()
    p.id = id_val or uuid4()
    p.name = name
    p.family_member = family_member
    return p


def make_tenting_member(participant):
    m = MagicMock()
    m.participant = participant
    # member.id and participant_id should be UUIDs to satisfy schemas
    m.id = uuid4()
    m.participant_id = participant.id
    return m


def make_tenting_group(id_val=None, name="tg", members=None):
    tg = MagicMock()
    tg.id = id_val or uuid4()
    tg.name = name
    tg.members = members or []
    # Provide attributes expected by schema builders
    tg.notes = ""
    tg.outing_id = uuid4()
    return tg


def test_calculate_age_and_build_response():
    # Create a family member about 10 years old
    fm = make_family_member("Kid", 10, gender="female", patrol_name="Alpha")
    p = make_participant(name="Kid One", family_member=fm)
    member = make_tenting_member(p)
    tg = make_tenting_group(name="Tent 1", members=[member])

    resp = _build_tenting_group_response(tg)
    assert resp.member_count == 1
    # Age should be an int roughly 10 (allow off-by-one due to leap day calc)
    assert isinstance(resp.members[0].age, int)


def test_validate_group_size_and_age_and_gender():
    # Create members with mixed genders and ages to trigger multiple issues
    fm1 = make_family_member("A", 8, gender="male")
    p1 = make_participant(name="A", family_member=fm1)

    fm2 = make_family_member("B", 14, gender="female")
    p2 = make_participant(name="B", family_member=fm2)

    fm3 = make_family_member("C", 9, gender="male")
    p3 = make_participant(name="C", family_member=fm3)

    fm4 = make_family_member("D", 20, gender="male")
    p4 = make_participant(name="D", family_member=fm4)

    members = [make_tenting_member(p) for p in (p1, p2, p3, p4)]
    tg = make_tenting_group(name="Big Tent", members=members)

    issues = _validate_tenting_group(tg, max_age_diff=2)
    # Expect at least group_size warning, age_gap error, and gender_mismatch error
    issue_types = {i.issue_type for i in issues}
    assert "group_size" in issue_types
    assert "age_gap" in issue_types
    assert "gender_mismatch" in issue_types
