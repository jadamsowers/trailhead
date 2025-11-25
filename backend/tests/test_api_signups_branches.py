"""Additional branch coverage tests for signups endpoints"""
import pytest
from httpx import AsyncClient
from datetime import date, timedelta
import uuid

from app.models.outing import Outing
from app.models.family import FamilyMember
from app.models.signup import Signup
from app.schemas.signup import SignupCreate
from app.crud import signup as crud_signup

pytestmark = pytest.mark.asyncio


class TestUpdateSignupVehicleCapacity:
    async def test_update_signup_vehicle_capacity_overflow(self, client: AsyncClient, auth_headers, db_session, test_user):
        # Outing with vehicle capacity logic
        outing = Outing(
            id=uuid.uuid4(),
            name="VehicleUpdateOuting",
            outing_date=date.today() + timedelta(days=12),
            end_date=date.today() + timedelta(days=13),
            location="Loc",
            description="Desc",
            max_participants=0,
            capacity_type="vehicle",
        )
        db_session.add(outing)
        # Original adult driver adds capacity 2
        driver = FamilyMember(
            user_id=test_user.id,
            name="Driver",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
            vehicle_capacity=2
        )
        scout = FamilyMember(
            user_id=test_user.id,
            name="Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(driver); db_session.add(scout); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(driver); await db_session.refresh(scout)
        signup = await crud_signup.create_signup(db_session, SignupCreate(
            outing_id=outing.id,
            family_contact={"email": "x@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"},
            family_member_ids=[driver.id, scout.id]
        ))
        # Attempt update: replace driver with two adults each small capacity summing to less than spots required -> overflow
        new_driver1 = FamilyMember(
            user_id=test_user.id,
            name="DriverSmall1",
            date_of_birth=date.today() - timedelta(days=365*38),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
            vehicle_capacity=1
        )
        new_driver2 = FamilyMember(
            user_id=test_user.id,
            name="DriverSmall2",
            date_of_birth=date.today() - timedelta(days=365*39),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
            vehicle_capacity=0
        )
        db_session.add(new_driver1); db_session.add(new_driver2); await db_session.commit(); await db_session.refresh(new_driver1); await db_session.refresh(new_driver2)
        update_payload = {"family_member_ids": [str(new_driver1.id), str(new_driver2.id), str(scout.id)]}
        r = await client.put(f"/api/signups/{signup.id}", json=update_payload, headers=auth_headers)
        assert r.status_code == 400
        assert "over capacity" in r.json()["detail"].lower()


class TestCreateSignupAdditionalBranches:
    async def test_create_signup_combined_warnings(self, client: AsyncClient, auth_headers, db_session, test_user):
        """Female youth present AND only 1 adult -> two warnings (2 adults + female adult)."""
        outing = Outing(
            id=uuid.uuid4(),
            name="CombinedWarningsOuting",
            outing_date=date.today() + timedelta(days=10),
            end_date=date.today() + timedelta(days=11),
            location="Loc",
            description="Desc",
            max_participants=10,
        )
        db_session.add(outing)
        female_scout = FamilyMember(
            user_id=test_user.id,
            name="Female Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="female",
            troop_number="123"
        )
        lone_adult = FamilyMember(
            user_id=test_user.id,
            name="Male Adult",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
        )
        db_session.add(female_scout); db_session.add(lone_adult); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(female_scout); await db_session.refresh(lone_adult)
        payload = {
            "outing_id": str(outing.id),
            "family_contact": {"email": "cw@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"},
            "family_member_ids": [str(female_scout.id), str(lone_adult.id)]
        }
        r = await client.post("/api/signups", json=payload, headers=auth_headers)
        assert r.status_code == 201
        warnings = r.json().get("warnings", [])
        assert any("2 adults" in w for w in warnings)
        assert any("female adult" in w.lower() for w in warnings)

    async def test_create_signup_no_warnings_female_youth(self, client: AsyncClient, auth_headers, db_session, test_user):
        """Female youth with sufficient adults including one female adult -> no warnings."""
        outing = Outing(
            id=uuid.uuid4(),
            name="NoWarningsOuting",
            outing_date=date.today() + timedelta(days=12),
            end_date=date.today() + timedelta(days=13),
            location="Loc",
            description="Desc",
            max_participants=10,
        )
        db_session.add(outing)
        female_scout = FamilyMember(
            user_id=test_user.id,
            name="Female Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="female",
            troop_number="123"
        )
        female_adult = FamilyMember(
            user_id=test_user.id,
            name="Female Adult",
            date_of_birth=date.today() - timedelta(days=365*38),
            member_type="adult",
            gender="female",
            has_youth_protection=True,
        )
        male_adult = FamilyMember(
            user_id=test_user.id,
            name="Male Adult",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
        )
        db_session.add(female_scout); db_session.add(female_adult); db_session.add(male_adult); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(female_scout); await db_session.refresh(female_adult); await db_session.refresh(male_adult)
        payload = {
            "outing_id": str(outing.id),
            "family_contact": {"email": "nw@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"},
            "family_member_ids": [str(female_scout.id), str(female_adult.id), str(male_adult.id)]
        }
        r = await client.post("/api/signups", json=payload, headers=auth_headers)
        assert r.status_code == 201
        assert r.json().get("warnings") == []

    async def test_create_signup_missing_family_member(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="MissingMemberOuting",
            outing_date=date.today() + timedelta(days=14),
            end_date=date.today() + timedelta(days=15),
            location="Loc",
            description="Desc",
            max_participants=10,
        )
        db_session.add(outing); await db_session.commit(); await db_session.refresh(outing)
        bogus_id = uuid.uuid4()
        payload = {
            "outing_id": str(outing.id),
            "family_contact": {"email": "mm@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"},
            "family_member_ids": [str(bogus_id)]
        }
        r = await client.post("/api/signups", json=payload, headers=auth_headers)
        assert r.status_code == 404
        assert str(bogus_id) in r.json()["detail"]

    async def test_create_signup_vehicle_capacity_borderline_success(self, client: AsyncClient, auth_headers, db_session, test_user):
        """Vehicle capacity projected_available_spots == 0 should succeed."""
        outing = Outing(
            id=uuid.uuid4(),
            name="VehicleBorderlineOuting",
            outing_date=date.today() + timedelta(days=16),
            end_date=date.today() + timedelta(days=17),
            location="Loc",
            description="Desc",
            max_participants=0,
            capacity_type="vehicle",
        )
        db_session.add(outing)
        driver = FamilyMember(
            user_id=test_user.id,
            name="Driver",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
            vehicle_capacity=3
        )
        scout1 = FamilyMember(
            user_id=test_user.id,
            name="Scout1",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        scout2 = FamilyMember(
            user_id=test_user.id,
            name="Scout2",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(driver); db_session.add(scout1); db_session.add(scout2); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(driver); await db_session.refresh(scout1); await db_session.refresh(scout2)
        payload = {
            "outing_id": str(outing.id),
            "family_contact": {"email": "vb@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"},
            "family_member_ids": [str(driver.id), str(scout1.id), str(scout2.id)]
        }
        r = await client.post("/api/signups", json=payload, headers=auth_headers)
        assert r.status_code == 201


class TestUpdateSignupAdditionalBranches:
    async def _create_vehicle_signup(self, db_session, test_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="VehicleUpdateSuccessOuting",
            outing_date=date.today() + timedelta(days=18),
            end_date=date.today() + timedelta(days=19),
            location="Loc",
            description="Desc",
            max_participants=0,
            capacity_type="vehicle",
        )
        db_session.add(outing)
        driver = FamilyMember(
            user_id=test_user.id,
            name="Driver1",
            date_of_birth=date.today() - timedelta(days=365*40),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
            vehicle_capacity=1
        )
        scout = FamilyMember(
            user_id=test_user.id,
            name="ScoutX",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(driver); db_session.add(scout); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(driver); await db_session.refresh(scout)
        signup = await crud_signup.create_signup(db_session, SignupCreate(
            outing_id=outing.id,
            family_contact={"email": "vu@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"},
            family_member_ids=[driver.id, scout.id]
        ))
        return outing, driver, scout, signup

    async def test_update_signup_vehicle_capacity_success(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing, driver, scout, signup = await self._create_vehicle_signup(db_session, test_user)
        new_driver = FamilyMember(
            user_id=test_user.id,
            name="Driver2",
            date_of_birth=date.today() - timedelta(days=365*41),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
            vehicle_capacity=2
        )
        db_session.add(new_driver); await db_session.commit(); await db_session.refresh(new_driver)
        update_payload = {"family_member_ids": [str(driver.id), str(new_driver.id), str(scout.id)]}
        r = await client.put(f"/api/signups/{signup.id}", json=update_payload, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["participant_count"] == 3

    async def test_update_signup_outing_deleted(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing, driver, scout, signup = await self._create_vehicle_signup(db_session, test_user)
        # Delete outing before update
        await db_session.delete(outing); await db_session.commit()
        update_payload = {"family_member_ids": [str(driver.id), str(scout.id)]}
        r = await client.put(f"/api/signups/{signup.id}", json=update_payload, headers=auth_headers)
        # After deleting outing the signup still exists so outing check will occur only if participants are updated.
        # Our update attempts participant change and should yield 404 with 'Outing not found' OR 'Signup not found' if cascade deleted.
        assert r.status_code == 404
        assert any(phrase in r.json()["detail"] for phrase in ["Outing not found", "Signup not found"])

    async def test_update_signup_fixed_capacity_success(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="FixedCapacityOuting",
            outing_date=date.today() + timedelta(days=20),
            end_date=date.today() + timedelta(days=21),
            location="Loc",
            description="Desc",
            max_participants=3,
        )
        db_session.add(outing)
        scout1 = FamilyMember(
            user_id=test_user.id,
            name="Scout1",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(scout1); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(scout1)
        signup = await crud_signup.create_signup(db_session, SignupCreate(
            outing_id=outing.id,
            family_contact={"email": "fc@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"},
            family_member_ids=[scout1.id]
        ))
        scout2 = FamilyMember(
            user_id=test_user.id,
            name="Scout2",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        scout3 = FamilyMember(
            user_id=test_user.id,
            name="Scout3",
            date_of_birth=date.today() - timedelta(days=365*15),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(scout2); db_session.add(scout3); await db_session.commit(); await db_session.refresh(scout2); await db_session.refresh(scout3)
        update_payload = {"family_member_ids": [str(scout1.id), str(scout2.id), str(scout3.id)]}
        r = await client.put(f"/api/signups/{signup.id}", json=update_payload, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["participant_count"] == 3

    async def test_update_signup_missing_family_member(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing, driver, scout, signup = await self._create_vehicle_signup(db_session, test_user)
        bogus_id = uuid.uuid4()
        update_payload = {"family_member_ids": [str(driver.id), str(bogus_id)]}
        r = await client.put(f"/api/signups/{signup.id}", json=update_payload, headers=auth_headers)
        assert r.status_code == 404
        assert str(bogus_id) in r.json()["detail"]


class TestAdminEmptySignupAccess:
    async def test_admin_get_empty_signup(self, client: AsyncClient, auth_headers, db_session):
        outing = Outing(
            id=uuid.uuid4(),
            name="AdminEmptyGet",
            outing_date=date.today() + timedelta(days=22),
            end_date=date.today() + timedelta(days=23),
            location="Loc",
            description="Desc",
            max_participants=5,
        )
        db_session.add(outing)
        empty_signup = Signup(
            outing_id=outing.id,
            family_contact_name="Contact",
            family_contact_email="ae@test.com",
            family_contact_phone="555",
        )
        db_session.add(empty_signup); await db_session.commit(); await db_session.refresh(empty_signup)
        r = await client.get(f"/api/signups/{empty_signup.id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["participant_count"] == 0

    async def test_admin_delete_empty_signup(self, client: AsyncClient, auth_headers, db_session):
        outing = Outing(
            id=uuid.uuid4(),
            name="AdminEmptyDelete",
            outing_date=date.today() + timedelta(days=24),
            end_date=date.today() + timedelta(days=25),
            location="Loc",
            description="Desc",
            max_participants=5,
        )
        db_session.add(outing)
        empty_signup = Signup(
            outing_id=outing.id,
            family_contact_name="Contact",
            family_contact_email="aed@test.com",
            family_contact_phone="555",
        )
        db_session.add(empty_signup); await db_session.commit(); await db_session.refresh(empty_signup)
        r = await client.delete(f"/api/signups/{empty_signup.id}", headers=auth_headers)
        assert r.status_code == 204


class TestSignupListingPagination:
    async def test_list_signups_pagination(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="PaginationOuting",
            outing_date=date.today() + timedelta(days=26),
            end_date=date.today() + timedelta(days=27),
            location="Loc",
            description="Desc",
            max_participants=20,
        )
        db_session.add(outing)
        # Create 5 separate signups each with one scout
        for i in range(5):
            scout = FamilyMember(
                user_id=test_user.id,
                name=f"Scout{i}",
                date_of_birth=date.today() - timedelta(days=365*(13+i)),
                member_type="scout",
                gender="male",
                troop_number="123"
            )
            db_session.add(scout); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(scout)
            await crud_signup.create_signup(db_session, SignupCreate(
                outing_id=outing.id,
                family_contact={"email": f"p{i}@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"},
                family_member_ids=[scout.id]
            ))
        r1 = await client.get(f"/api/signups?skip=0&limit=2", headers=auth_headers)
        r2 = await client.get(f"/api/signups?skip=2&limit=2", headers=auth_headers)
        assert r1.status_code == 200 and r2.status_code == 200
        data1 = r1.json(); data2 = r2.json()
        assert data1["total"] >= 5
        assert len(data1["signups"]) == 2
        assert len(data2["signups"]) == 2
        # Ensure different signup IDs between pages
        ids_page1 = {s["id"] for s in data1["signups"]}
        ids_page2 = {s["id"] for s in data2["signups"]}
        assert ids_page1.isdisjoint(ids_page2)


class TestMySignupsEmptyCases:
    async def test_my_signups_no_family_members(self, client: AsyncClient, regular_user_headers):
        # regular user with no family members -> empty list
        r = await client.get("/api/signups/my-signups", headers=regular_user_headers)
        assert r.status_code == 200
        assert r.json() == []

    async def test_my_signups_family_members_no_signups(self, client: AsyncClient, regular_user_headers, db_session, test_regular_user):
        member = FamilyMember(
            user_id=test_regular_user.id,
            name="Lonely Scout",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member); await db_session.commit(); await db_session.refresh(member)
        r = await client.get("/api/signups/my-signups", headers=regular_user_headers)
        assert r.status_code == 200
        assert r.json() == []


class TestUpdateSignupYouthProtection:
    async def test_update_signup_adult_missing_ypt(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="UpdateYPTOuting",
            outing_date=date.today() + timedelta(days=20),
            end_date=date.today() + timedelta(days=21),
            location="Loc",
            description="Desc",
            max_participants=5,
        )
        db_session.add(outing)
        adult_good = FamilyMember(
            user_id=test_user.id,
            name="AdultGood",
            date_of_birth=date.today() - timedelta(days=365*42),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
        )
        db_session.add(adult_good); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(adult_good)
        signup = await crud_signup.create_signup(db_session, SignupCreate(
            outing_id=outing.id,
            family_contact={"email": "x@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"},
            family_member_ids=[adult_good.id]
        ))
        adult_bad = FamilyMember(
            user_id=test_user.id,
            name="AdultBad",
            date_of_birth=date.today() - timedelta(days=365*41),
            member_type="adult",
            gender="male",
            has_youth_protection=False,
        )
        db_session.add(adult_bad); await db_session.commit(); await db_session.refresh(adult_bad)
        update_payload = {"family_member_ids": [str(adult_bad.id)]}
        r = await client.put(f"/api/signups/{signup.id}", json=update_payload, headers=auth_headers)
        assert r.status_code == 400
        assert "must have valid" in r.json()["detail"].lower()

    async def test_update_signup_adult_ypt_expired(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="UpdateYPTExpiredOuting",
            outing_date=date.today() + timedelta(days=25),
            end_date=date.today() + timedelta(days=26),
            location="Loc",
            description="Desc",
            max_participants=5,
        )
        db_session.add(outing)
        adult_good = FamilyMember(
            user_id=test_user.id,
            name="AdultGood",
            date_of_birth=date.today() - timedelta(days=365*42),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
        )
        db_session.add(adult_good); await db_session.commit(); await db_session.refresh(outing); await db_session.refresh(adult_good)
        signup = await crud_signup.create_signup(db_session, SignupCreate(
            outing_id=outing.id,
            family_contact={"email": "x@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"},
            family_member_ids=[adult_good.id]
        ))
        adult_expired = FamilyMember(
            user_id=test_user.id,
            name="AdultExpired",
            date_of_birth=date.today() - timedelta(days=365*41),
            member_type="adult",
            gender="male",
            has_youth_protection=True,
            youth_protection_expiration=date.today(),  # expires before end date
        )
        db_session.add(adult_expired); await db_session.commit(); await db_session.refresh(adult_expired)
        update_payload = {"family_member_ids": [str(adult_expired.id)]}
        r = await client.put(f"/api/signups/{signup.id}", json=update_payload, headers=auth_headers)
        assert r.status_code == 400
        assert "expires" in r.json()["detail"].lower()


class TestEmptySignupEdgeCases:
    async def test_get_signup_forbidden_empty_non_admin(self, client: AsyncClient, regular_user_headers, db_session, test_regular_user):
        outing = Outing(
            id=uuid.uuid4(),
            name="EmptyGetOuting",
            outing_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=31),
            location="Loc",
            description="Desc",
            max_participants=5,
        )
        db_session.add(outing)
        empty_signup = Signup(
            outing_id=outing.id,
            family_contact_name="Contact",
            family_contact_email="contact@test.com",
            family_contact_phone="555",
        )
        db_session.add(empty_signup); await db_session.commit(); await db_session.refresh(empty_signup)
        r = await client.get(f"/api/signups/{empty_signup.id}", headers=regular_user_headers)
        assert r.status_code == 403
        assert "permission" in r.json()["detail"].lower()

    async def test_cancel_signup_no_participants(self, client: AsyncClient, regular_user_headers, db_session):
        outing = Outing(
            id=uuid.uuid4(),
            name="EmptyCancelOuting",
            outing_date=date.today() + timedelta(days=32),
            end_date=date.today() + timedelta(days=33),
            location="Loc",
            description="Desc",
            max_participants=5,
        )
        db_session.add(outing)
        empty_signup = Signup(
            outing_id=outing.id,
            family_contact_name="Contact",
            family_contact_email="contact@test.com",
            family_contact_phone="555",
        )
        db_session.add(empty_signup); await db_session.commit(); await db_session.refresh(empty_signup)
        r = await client.delete(f"/api/signups/{empty_signup.id}", headers=regular_user_headers)
        assert r.status_code == 404
        assert "no participants" in r.json()["detail"].lower()


class TestListSignupsFilter:
    async def test_list_signups_filtered(self, client: AsyncClient, auth_headers, db_session, test_user):
        outing_a = Outing(
            id=uuid.uuid4(),
            name="FilterA",
            outing_date=date.today() + timedelta(days=40),
            end_date=date.today() + timedelta(days=41),
            location="Loc",
            description="Desc",
            max_participants=5,
        )
        outing_b = Outing(
            id=uuid.uuid4(),
            name="FilterB",
            outing_date=date.today() + timedelta(days=42),
            end_date=date.today() + timedelta(days=43),
            location="Loc",
            description="Desc",
            max_participants=5,
        )
        db_session.add(outing_a); db_session.add(outing_b)
        member_a = FamilyMember(
            user_id=test_user.id,
            name="ScoutA",
            date_of_birth=date.today() - timedelta(days=365*13),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        member_b = FamilyMember(
            user_id=test_user.id,
            name="ScoutB",
            date_of_birth=date.today() - timedelta(days=365*14),
            member_type="scout",
            gender="male",
            troop_number="123"
        )
        db_session.add(member_a); db_session.add(member_b); await db_session.commit(); await db_session.refresh(outing_a); await db_session.refresh(outing_b); await db_session.refresh(member_a); await db_session.refresh(member_b)
        await crud_signup.create_signup(db_session, SignupCreate(outing_id=outing_a.id, family_contact={"email": "a@test.com", "phone": "1", "emergency_contact_name": "EC", "emergency_contact_phone": "1"}, family_member_ids=[member_a.id]))
        await crud_signup.create_signup(db_session, SignupCreate(outing_id=outing_b.id, family_contact={"email": "b@test.com", "phone": "2", "emergency_contact_name": "EC", "emergency_contact_phone": "2"}, family_member_ids=[member_b.id]))
        r = await client.get(f"/api/signups?outing_id={outing_a.id}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json(); assert data["total"] >= 1
        # Ensure all returned signups match filter
        assert all(s["outing_id"] == str(outing_a.id) for s in data["signups"])
