"""Extended tests for api/endpoints/signups.py to raise coverage"""
import pytest
from httpx import AsyncClient
from datetime import date, timedelta, datetime
import uuid

from app.models.family import FamilyMember
from app.models.outing import Outing
from app.schemas.signup import SignupCreate, SignupUpdate


@pytest.mark.asyncio
class TestCreateSignupAdditionalCases:
    async def test_create_signup_signups_closed(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="Closed Outing",
            outing_date=date.today() + timedelta(days=10),
            end_date=date.today() + timedelta(days=11),
            location="Test",
            description="Desc",
            max_participants=10,
            signups_closed=True,
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
        payload = {
            "outing_id": str(outing.id),
            "family_contact": {"email": "x@test.com", "phone": "555", "emergency_contact_name": "EC", "emergency_contact_phone": "555"},
            "family_member_ids": [str(member.id)]
        }
        r = await client.post("/api/signups", json=payload, headers=auth_headers)
        assert r.status_code == 400
        assert "closed" in r.json()["detail"].lower()

    async def test_create_signup_family_member_forbidden(self, client: AsyncClient, auth_headers, db_session, test_user, test_regular_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="Outing",
            outing_date=date.today() + timedelta(days=15),
            end_date=date.today() + timedelta(days=16),
            location="Test",
            description="Desc",
            max_participants=10,
        )
        db_session.add(outing)
        # Family member belongs to regular user, admin tries to sign up (allowed? code enforces ownership) should 403
        other_member = FamilyMember(
            user_id=test_regular_user.id,
            name="Other Scout",
            date_of_birth=date.today() - timedelta(days=365*12),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(other_member)
        await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(other_member)
        payload = {
            "outing_id": str(outing.id),
            "family_contact": {"email": "x@test.com", "phone": "555", "emergency_contact_name": "EC", "emergency_contact_phone": "555"},
            "family_member_ids": [str(other_member.id)]
        }
        r = await client.post("/api/signups", json=payload, headers=auth_headers)
        assert r.status_code == 403
        assert "permission" in r.json()["detail"].lower()

    async def test_create_signup_ypt_expired(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="YPT Outing",
            outing_date=date.today() + timedelta(days=20),
            end_date=date.today() + timedelta(days=21),
            location="Test",
            description="Desc",
            max_participants=10,
        )
        db_session.add(outing)
        adult = FamilyMember(
            user_id=test_user.id,
            name="Adult",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
            youth_protection_expiration=date.today()  # expires before end_date
        )
        db_session.add(adult)
        await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(adult)
        payload = {
            "outing_id": str(outing.id),
            "family_contact": {"email": "x@test.com", "phone": "555", "emergency_contact_name": "EC", "emergency_contact_phone": "555"},
            "family_member_ids": [str(adult.id)]
        }
        r = await client.post("/api/signups", json=payload, headers=auth_headers)
        assert r.status_code == 400
        assert "expires" in r.json()["detail"].lower()

    async def test_create_signup_vehicle_capacity_overflow(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="Vehicle Outing",
            outing_date=date.today() + timedelta(days=25),
            end_date=date.today() + timedelta(days=26),
            location="Test",
            description="Desc",
            max_participants=0,
            capacity_type="vehicle",
        )
        db_session.add(outing)
        adult_driver = FamilyMember(
            user_id=test_user.id,
            name="Driver",
            date_of_birth=date.today() - timedelta(days=365*45),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
            vehicle_capacity=1
        )
        scout = FamilyMember(
            user_id=test_user.id,
            name="Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(adult_driver); db_session.add(scout)
        await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(adult_driver); await db_session.refresh(scout)
        payload = {
            "outing_id": str(outing.id),
            "family_contact": {"email": "x@test.com", "phone": "555", "emergency_contact_name": "EC", "emergency_contact_phone": "555"},
            "family_member_ids": [str(adult_driver.id), str(scout.id)]
        }
        r = await client.post("/api/signups", json=payload, headers=auth_headers)
        assert r.status_code == 400
        assert "over capacity" in r.json()["detail"].lower()


@pytest.mark.asyncio
class TestUpdateSignup:
    async def _create_basic_signup(self, db_session, test_user):
        # Helper to create outing + member + signup directly via CRUD
        outing = Outing(
            id=uuid.uuid4(),
            name="Update Outing",
            outing_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=31),
            location="Loc",
            description="Desc",
            max_participants=2,
        )
        db_session.add(outing)
        scout = FamilyMember(
            user_id=test_user.id,
            name="Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(scout)
        await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(scout)
        signup_payload = SignupCreate(
            outing_id=outing.id,
            family_contact={"email": "fam@test.com", "phone": "555", "emergency_contact_name": "EC", "emergency_contact_phone": "555"},
            family_member_ids=[scout.id]
        )
        from app.crud import signup as crud_signup
        signup = await crud_signup.create_signup(db_session, signup_payload)
        return outing, scout, signup

    async def test_update_signup_contact_info(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing, scout, signup = await self._create_basic_signup(db_session, test_user)
        update_payload = {
            "family_contact": {"email": "new@test.com", "phone": "999", "emergency_contact_name": "New EC", "emergency_contact_phone": "000"}
        }
        r = await client.put(f"/api/signups/{signup.id}", json=update_payload, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["family_contact_email"] == "new@test.com"

    async def test_update_signup_add_participants_over_capacity(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing, scout, signup = await self._create_basic_signup(db_session, test_user)
        # Add two more members (would exceed capacity: old 1 -> new 3 delta 2 but available spots =1)
        extra1 = FamilyMember(
            user_id=test_user.id,
            name="Extra1",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        extra2 = FamilyMember(
            user_id=test_user.id,
            name="Extra2",
            date_of_birth=date.today() - timedelta(days=365*15),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(extra1); db_session.add(extra2); await db_session.commit(); await db_session.refresh(extra1); await db_session.refresh(extra2)
        update_payload = {"family_member_ids": [str(scout.id), str(extra1.id), str(extra2.id)]}
        r = await client.put(f"/api/signups/{signup.id}", json=update_payload, headers=auth_headers)
        assert r.status_code == 400
        assert "available spots" in r.json()["detail"].lower()

    async def test_update_signup_forbidden_not_owner(self, client: AsyncClient, regular_user_headers, db_session, test_user, test_regular_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="Foreign Signup Outing",
            outing_date=date.today() + timedelta(days=40),
            end_date=date.today() + timedelta(days=41),
            location="Loc",
            description="Desc",
            max_participants=5,
        )
        db_session.add(outing)
        member = FamilyMember(
            user_id=test_user.id,
            name="Admin Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(member)
        signup_payload = SignupCreate(
            outing_id=outing.id,
            family_contact={"email": "fam@test.com", "phone": "555", "emergency_contact_name": "EC", "emergency_contact_phone": "555"},
            family_member_ids=[member.id]
        )
        from app.crud import signup as crud_signup
        signup = await crud_signup.create_signup(db_session, signup_payload)
        update_payload = {"family_contact": {"email": "new@x.com", "phone": "000", "emergency_contact_name": "X", "emergency_contact_phone": "111"}}
        r = await client.put(f"/api/signups/{signup.id}", json=update_payload, headers=regular_user_headers)
        assert r.status_code == 403
        assert "update your own" in r.json()["detail"].lower()


@pytest.mark.asyncio
class TestOwnershipAndListing:
    async def test_get_my_signups(self, client: AsyncClient, auth_headers, db_session, test_user):
        # Create outing + signup for user
        outing = Outing(
            id=uuid.uuid4(),
            name="Mine",
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
        db_session.add(member); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(member)
        signup_payload = SignupCreate(
            outing_id=outing.id,
            family_contact={"email": "fam@test.com", "phone": "555", "emergency_contact_name": "EC", "emergency_contact_phone": "555"},
            family_member_ids=[member.id]
        )
        from app.crud import signup as crud_signup
        await crud_signup.create_signup(db_session, signup_payload)
        r = await client.get("/api/signups/my-signups", headers=auth_headers)
        assert r.status_code == 200
        data = r.json(); assert len(data) >= 1

    async def test_list_signups_admin_success(self, client: AsyncClient, auth_headers, db_session, test_user):
        # Create one signup
        outing = Outing(
            id=uuid.uuid4(),
            name="ListOuting",
            outing_date=date.today() + timedelta(days=12),
            end_date=date.today() + timedelta(days=13),
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
        db_session.add(member); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(member)
        signup_payload = SignupCreate(
            outing_id=outing.id,
            family_contact={"email": "fam@test.com", "phone": "555", "emergency_contact_name": "EC", "emergency_contact_phone": "555"},
            family_member_ids=[member.id]
        )
        from app.crud import signup as crud_signup
        await crud_signup.create_signup(db_session, signup_payload)
        r = await client.get("/api/signups", headers=auth_headers)
        assert r.status_code == 200
        data = r.json(); assert data["total"] >= 1

    async def test_list_signups_regular_forbidden(self, client: AsyncClient, regular_user_headers):
        r = await client.get("/api/signups", headers=regular_user_headers)
        assert r.status_code == 403

    async def test_get_signup_forbidden_not_owner(self, client: AsyncClient, regular_user_headers, db_session, test_user, test_regular_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="ForeignGetOuting",
            outing_date=date.today() + timedelta(days=22),
            end_date=date.today() + timedelta(days=23),
            location="Loc",
            description="Desc",
            max_participants=5,
        )
        db_session.add(outing)
        member = FamilyMember(
            user_id=test_user.id,
            name="Admin Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(member)
        signup_payload = SignupCreate(
            outing_id=outing.id,
            family_contact={"email": "fam@test.com", "phone": "555", "emergency_contact_name": "EC", "emergency_contact_phone": "555"},
            family_member_ids=[member.id]
        )
        from app.crud import signup as crud_signup
        signup = await crud_signup.create_signup(db_session, signup_payload)
        r = await client.get(f"/api/signups/{signup.id}", headers=regular_user_headers)
        assert r.status_code == 403

    async def test_cancel_signup_forbidden_not_owner(self, client: AsyncClient, regular_user_headers, db_session, test_user, test_regular_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="ForeignCancelOuting",
            outing_date=date.today() + timedelta(days=28),
            end_date=date.today() + timedelta(days=29),
            location="Loc",
            description="Desc",
            max_participants=5,
        )
        db_session.add(outing)
        member = FamilyMember(
            user_id=test_user.id,
            name="Admin Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(member)
        signup_payload = SignupCreate(
            outing_id=outing.id,
            family_contact={"email": "fam@test.com", "phone": "555", "emergency_contact_name": "EC", "emergency_contact_phone": "555"},
            family_member_ids=[member.id]
        )
        from app.crud import signup as crud_signup
        signup = await crud_signup.create_signup(db_session, signup_payload)
        r = await client.delete(f"/api/signups/{signup.id}", headers=regular_user_headers)
        assert r.status_code == 403


@pytest.mark.asyncio
class TestEmailAndExport:
    async def test_get_outing_emails_success(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="EmailOuting",
            outing_date=date.today() + timedelta(days=18),
            end_date=date.today() + timedelta(days=19),
            location="Loc",
            description="Desc",
            max_participants=10,
        )
        db_session.add(outing)
        # Create two signups with distinct emails
        member1 = FamilyMember(
            user_id=test_user.id,
            name="Scout1",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        member2 = FamilyMember(
            user_id=test_user.id,
            name="Scout2",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member1); db_session.add(member2); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(member1); await db_session.refresh(member2)
        from app.crud import signup as crud_signup
        await crud_signup.create_signup(db_session, SignupCreate(outing_id=outing.id, family_contact={"email": "a@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"}, family_member_ids=[member1.id]))
        await crud_signup.create_signup(db_session, SignupCreate(outing_id=outing.id, family_contact={"email": "b@test.com", "phone": "2", "emergency_contact_name": "EC", "emergency_contact_phone": "2"}, family_member_ids=[member2.id]))
        r = await client.get(f"/api/signups/outings/{outing.id}/emails", headers=auth_headers)
        assert r.status_code == 200
        data = r.json(); assert data["count"] == 2; assert set(data["emails"]) == {"a@test.com", "b@test.com"}

    async def test_send_email_no_recipients(self, client: AsyncClient, auth_headers, db_session):
        outing = Outing(
            id=uuid.uuid4(),
            name="EmptyEmailOuting",
            outing_date=date.today() + timedelta(days=21),
            end_date=date.today() + timedelta(days=22),
            location="Loc",
            description="Desc",
            max_participants=10,
        )
        db_session.add(outing); await db_session.commit(); await db_session.refresh(outing)
        payload = {"subject": "Hello", "message": "Body", "from_email": "sender@test.com"}
        r = await client.post(f"/api/signups/outings/{outing.id}/send-email", json=payload, headers=auth_headers)
        assert r.status_code == 400
        assert "no email" in r.json()["detail"].lower()

    async def test_send_email_success(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="EmailSendOuting",
            outing_date=date.today() + timedelta(days=24),
            end_date=date.today() + timedelta(days=25),
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
        db_session.add(member); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(member)
        from app.crud import signup as crud_signup
        await crud_signup.create_signup(db_session, SignupCreate(outing_id=outing.id, family_contact={"email": "family@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"}, family_member_ids=[member.id]))
        payload = {"subject": "Subject", "message": "Msg", "from_email": "sender@test.com"}
        r = await client.post(f"/api/signups/outings/{outing.id}/send-email", json=payload, headers=auth_headers)
        assert r.status_code == 200
        data = r.json(); assert data["recipient_count"] == 1; assert data["recipients"] == ["family@test.com"]

    async def test_export_outing_roster_pdf(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="PDFOuting",
            outing_date=date.today() + timedelta(days=26),
            end_date=date.today() + timedelta(days=27),
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
        db_session.add(member); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(member)
        from app.crud import signup as crud_signup
        await crud_signup.create_signup(db_session, SignupCreate(outing_id=outing.id, family_contact={"email": "x@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"}, family_member_ids=[member.id]))
        r = await client.get(f"/api/signups/outings/{outing.id}/export-pdf", headers=auth_headers)
        assert r.status_code == 200
        assert r.headers.get("content-type") == "application/pdf"


@pytest.mark.asyncio
class TestTroopRestriction:
    async def test_create_signup_troop_restriction_success(self, client: AsyncClient, auth_headers, db_session, test_user):
        """Test signup with matching troop restriction"""
        from app.models.troop import Troop
        
        # Create restricted troop
        troop = Troop(number="999", meeting_location="Location")
        db_session.add(troop)
        await db_session.commit(); await db_session.refresh(troop)
        
        # Create restricted outing
        outing = Outing(
            id=uuid.uuid4(),
            name="Restricted Outing",
            outing_date=date.today() + timedelta(days=30),
            location="Loc",
            max_participants=10,
            restricted_troop_id=troop.id
        )
        db_session.add(outing)
        
        # Create family member in that troop
        member = FamilyMember(
            user_id=test_user.id,
            name="Troop Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="999",
            troop_id=troop.id
        )
        db_session.add(member)
        await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(member)
        
        payload = {
            "outing_id": str(outing.id),
            "family_contact": {"email": "x@test.com", "phone": "555", "emergency_contact_name": "EC", "emergency_contact_phone": "555"},
            "family_member_ids": [str(member.id)]
        }
        r = await client.post("/api/signups", json=payload, headers=auth_headers)
        assert r.status_code == 201

    async def test_create_signup_troop_restriction_mismatch(self, client: AsyncClient, auth_headers, db_session, test_user):
        """Test signup with mismatched troop restriction"""
        from app.models.troop import Troop
        
        # Create restricted troop
        troop = Troop(number="999", meeting_location="Location")
        db_session.add(troop)
        await db_session.commit(); await db_session.refresh(troop)
        
        # Create restricted outing
        outing = Outing(
            id=uuid.uuid4(),
            name="Restricted Outing 2",
            outing_date=date.today() + timedelta(days=30),
            location="Loc",
            max_participants=10,
            restricted_troop_id=troop.id
        )
        db_session.add(outing)
        
        # Create family member in DIFFERENT troop
        member = FamilyMember(
            user_id=test_user.id,
            name="Other Troop Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="888" # Mismatch
        )
        db_session.add(member)
        await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(member)
        
        payload = {
            "outing_id": str(outing.id),
            "family_contact": {"email": "x@test.com", "phone": "555", "emergency_contact_name": "EC", "emergency_contact_phone": "555"},
            "family_member_ids": [str(member.id)]
        }
        r = await client.post("/api/signups", json=payload, headers=auth_headers)
        assert r.status_code == 400
        assert "not part of restricted troop" in r.json()["detail"]

