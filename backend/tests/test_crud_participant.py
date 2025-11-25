"""Tests for participant CRUD functions"""
import pytest
from uuid import uuid4
from datetime import date, timedelta

from app.crud import participant as crud_participant, signup as crud_signup
from app.schemas.signup import SignupCreate
from app.models.outing import Outing
from app.models.family import FamilyMember

pytestmark = pytest.mark.asyncio


async def _create_outing_and_member(db_session, test_user):
    outing = Outing(
        name="Participant Outing",
        outing_date=date.today() + timedelta(days=10),
        end_date=date.today() + timedelta(days=11),
        location="Loc",
        description="Desc",
        max_participants=10,
    )
    db_session.add(outing)
    member = FamilyMember(
        user_id=test_user.id,
        name="Scout",
        date_of_birth=date.today() - timedelta(days=365*13),
        member_type="scout",
        gender="male",
        troop_number="123"
    )
    db_session.add(member)
    await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(member)
    signup = await crud_signup.create_signup(db_session, SignupCreate(
        outing_id=outing.id,
        family_contact={"email": "fam@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"},
        family_member_ids=[member.id]
    ))
    return outing, member, signup


class TestCreateAndGetParticipant:
    async def test_create_and_get_participant(self, db_session, test_user):
        outing, member, signup = await _create_outing_and_member(db_session, test_user)
        # Create second member
        member2 = FamilyMember(
            user_id=test_user.id,
            name="Scout2",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member2); await db_session.commit(); await db_session.refresh(member2)
        participant = await crud_participant.create_participant(db_session, signup.id, member2.id)
        assert participant.id is not None
        fetched = await crud_participant.get_participant(db_session, participant.id)
        assert fetched is not None
        assert fetched.family_member.id == member2.id

    async def test_get_participant_not_found(self, db_session):
        result = await crud_participant.get_participant(db_session, uuid4())
        assert result is None


class TestListingParticipants:
    async def test_get_participants_for_signup(self, db_session, test_user):
        outing, member, signup = await _create_outing_and_member(db_session, test_user)
        members = await crud_participant.get_participants_for_signup(db_session, signup.id)
        assert len(members) == 1
        # Add one more
        member2 = FamilyMember(
            user_id=test_user.id,
            name="Scout2",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member2); await db_session.commit(); await db_session.refresh(member2)
        await crud_participant.create_participant(db_session, signup.id, member2.id)
        members = await crud_participant.get_participants_for_signup(db_session, signup.id)
        assert len(members) == 2

    async def test_get_participants_for_outing(self, db_session, test_user):
        outing, member, signup = await _create_outing_and_member(db_session, test_user)
        participants = await crud_participant.get_participants_for_outing(db_session, outing.id)
        assert len(participants) == 1


class TestDeleteParticipant:
    async def test_delete_participant_success(self, db_session, test_user):
        outing, member, signup = await _create_outing_and_member(db_session, test_user)
        participant = signup.participants[0]
        success = await crud_participant.delete_participant(db_session, participant.id)
        assert success is True
        # Verify gone
        result = await crud_participant.get_participant(db_session, participant.id)
        assert result is None

    async def test_delete_participant_not_found(self, db_session):
        success = await crud_participant.delete_participant(db_session, uuid4())
        assert success is False


class TestGetByCompositeKeys:
    async def test_get_participant_by_signup_and_family_member(self, db_session, test_user):
        outing, member, signup = await _create_outing_and_member(db_session, test_user)
        participant = signup.participants[0]
        fetched = await crud_participant.get_participant_by_signup_and_family_member(db_session, signup.id, member.id)
        assert fetched is not None
        assert fetched.id == participant.id

    async def test_get_participant_by_signup_and_family_member_not_found(self, db_session):
        result = await crud_participant.get_participant_by_signup_and_family_member(db_session, uuid4(), uuid4())
        assert result is None
