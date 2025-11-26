"""Tests for app/crud/checkin.py"""
import pytest
import uuid
from datetime import date, timedelta
from app.crud import checkin as crud_checkin
from app.models.outing import Outing
from app.models.family import FamilyMember
from app.models.signup import Signup
from app.models.participant import Participant
from app.models.checkin import CheckIn

pytestmark = pytest.mark.asyncio

class TestCheckInCRUD:
    async def test_create_checkins(self, db_session, test_user):
        # Setup outing and participants
        outing = Outing(
            id=uuid.uuid4(),
            name="CheckIn Outing",
            outing_date=date.today(),
            location="Test Loc",
            max_participants=10
        )
        db_session.add(outing)
        
        member = FamilyMember(
            user_id=test_user.id,
            name="Scout",
            date_of_birth=date.today() - timedelta(days=365*12),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member)
        await db_session.commit()
        
        signup = Signup(
            outing_id=outing.id,
            family_contact_name="Contact",
            family_contact_email="test@test.com",
            family_contact_phone="555"
        )
        db_session.add(signup)
        await db_session.commit()
        
        participant = Participant(
            signup_id=signup.id,
            family_member_id=member.id
        )
        db_session.add(participant)
        await db_session.commit()
        
        # Test create checkin
        checkins = await crud_checkin.create_checkins(
            db_session,
            outing.id,
            [participant.id],
            "Admin User"
        )
        
        assert len(checkins) == 1
        assert checkins[0].participant_id == participant.id
        assert checkins[0].checked_in_by == "Admin User"
        assert checkins[0].checked_in_at is not None

    async def test_get_checkin_summary(self, db_session, test_user):
        # Setup outing, signup, participant
        outing = Outing(
            id=uuid.uuid4(),
            name="Summary Outing",
            outing_date=date.today(),
            location="Test Loc",
            max_participants=10
        )
        db_session.add(outing)
        
        member = FamilyMember(
            user_id=test_user.id,
            name="Scout Summary",
            date_of_birth=date.today() - timedelta(days=365*12),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member)
        await db_session.commit()
        
        signup = Signup(
            outing_id=outing.id,
            family_contact_name="Contact",
            family_contact_email="test@test.com",
            family_contact_phone="555"
        )
        db_session.add(signup)
        await db_session.commit()
        
        participant = Participant(
            signup_id=signup.id,
            family_member_id=member.id
        )
        db_session.add(participant)
        await db_session.commit()
        
        # Verify summary before checkin
        summary = await crud_checkin.get_checkin_summary(db_session, outing.id)
        assert summary.total_participants == 1
        assert summary.checked_in_count == 0
        assert summary.participants[0].is_checked_in is False
        
        # Check in
        await crud_checkin.create_checkins(db_session, outing.id, [participant.id], "Admin")
        
        # Verify summary after checkin
        summary = await crud_checkin.get_checkin_summary(db_session, outing.id)
        assert summary.total_participants == 1
        assert summary.checked_in_count == 1
        assert summary.participants[0].is_checked_in is True

    async def test_delete_checkin(self, db_session, test_user):
        # Setup
        outing = Outing(
            id=uuid.uuid4(),
            name="Delete Outing",
            outing_date=date.today(),
            location="Test Loc",
            max_participants=10
        )
        db_session.add(outing)
        
        member = FamilyMember(
            user_id=test_user.id,
            name="Scout Delete",
            date_of_birth=date.today() - timedelta(days=365*12),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member)
        await db_session.commit()
        
        signup = Signup(
            outing_id=outing.id,
            family_contact_name="Contact",
            family_contact_email="test@test.com",
            family_contact_phone="555"
        )
        db_session.add(signup)
        await db_session.commit()
        
        participant = Participant(
            signup_id=signup.id,
            family_member_id=member.id
        )
        db_session.add(participant)
        await db_session.commit()
        
        await crud_checkin.create_checkins(db_session, outing.id, [participant.id], "Admin")
        
        # Test delete
        success = await crud_checkin.delete_checkin(db_session, outing.id, participant.id)
        assert success is True
        
        # Verify deleted
        records = await crud_checkin.get_checkin_records(db_session, outing.id)
        assert len(records) == 0
        
        # Test delete non-existent
        success = await crud_checkin.delete_checkin(db_session, outing.id, participant.id)
        assert success is False

    async def test_delete_all_checkins(self, db_session, test_user):
        # Setup
        outing = Outing(
            id=uuid.uuid4(),
            name="Delete All Outing",
            outing_date=date.today(),
            location="Test Loc",
            max_participants=10
        )
        db_session.add(outing)
        
        member1 = FamilyMember(
            user_id=test_user.id,
            name="Scout 1",
            date_of_birth=date.today() - timedelta(days=365*12),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        member2 = FamilyMember(
            user_id=test_user.id,
            name="Scout 2",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member1)
        db_session.add(member2)
        await db_session.commit()
        
        signup = Signup(
            outing_id=outing.id,
            family_contact_name="Contact",
            family_contact_email="test@test.com",
            family_contact_phone="555"
        )
        db_session.add(signup)
        await db_session.commit()
        
        p1 = Participant(signup_id=signup.id, family_member_id=member1.id)
        p2 = Participant(signup_id=signup.id, family_member_id=member2.id)
        db_session.add(p1)
        db_session.add(p2)
        await db_session.commit()
        
        await crud_checkin.create_checkins(db_session, outing.id, [p1.id, p2.id], "Admin")
        
        # Verify created
        records = await crud_checkin.get_checkin_records(db_session, outing.id)
        assert len(records) == 2
        
        # Test delete all
        count = await crud_checkin.delete_all_checkins(db_session, outing.id)
        assert count == 2
        
        # Verify deleted
        records = await crud_checkin.get_checkin_records(db_session, outing.id)
        assert len(records) == 0
