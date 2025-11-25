"""Tests for user CRUD functions"""
import pytest
from uuid import uuid4

from app.crud import user as crud_user

pytestmark = pytest.mark.asyncio


class TestCreateAndRetrieveUser:
    async def test_create_user(self, db_session):
        created = await crud_user.create_user(
            db_session,
            email="newuser@example.com",
            password="plainpassword",
            full_name="New User",
            role="user",
            phone="555-1234",
            emergency_contact_name="Parent",
            emergency_contact_phone="555-5678"
        )
        assert created.id is not None
        assert created.email == "newuser@example.com"
        # hashed password should differ from plain
        assert created.hashed_password != "plainpassword"
        fetched = await crud_user.get_user(db_session, created.id)
        assert fetched is not None
        assert fetched.email == created.email

    async def test_get_user_not_found(self, db_session):
        result = await crud_user.get_user(db_session, uuid4())
        assert result is None

    async def test_get_user_by_email(self, db_session):
        u = await crud_user.create_user(db_session, email="mail@example.com", password="x", full_name="Mail User")
        fetched = await crud_user.get_user_by_email(db_session, "mail@example.com")
        assert fetched is not None
        assert fetched.id == u.id

    async def test_get_user_by_email_not_found(self, db_session):
        result = await crud_user.get_user_by_email(db_session, "missing@example.com")
        assert result is None


class TestListUsers:
    async def test_get_users_filters(self, db_session):
        # Create mix of roles and active states
        u1 = await crud_user.create_user(db_session, email="r1@example.com", password="p", full_name="R1", role="admin")
        u2 = await crud_user.create_user(db_session, email="r2@example.com", password="p", full_name="R2", role="user")
        u3 = await crud_user.create_user(db_session, email="r3@example.com", password="p", full_name="R3", role="user")
        # deactivate u3
        await crud_user.update_user(db_session, u3.id, is_active=False)
        all_users = await crud_user.get_users(db_session)
        assert len(all_users) >= 3
        admins = await crud_user.get_users(db_session, role="admin")
        assert any(u.id == u1.id for u in admins)
        assert all(u.role == "admin" for u in admins)
        inactive = await crud_user.get_users(db_session, is_active=False)
        assert len(inactive) == 1
        assert inactive[0].id == u3.id

    async def test_get_users_pagination(self, db_session):
        # Ensure at least 5 users exist
        for i in range(5):
            await crud_user.create_user(db_session, email=f"pag{i}@example.com", password="p", full_name=f"Pag {i}")
        limited = await crud_user.get_users(db_session, limit=2)
        assert len(limited) == 2
        skipped = await crud_user.get_users(db_session, skip=2, limit=2)
        assert len(skipped) == 2
        # confirm different sets
        assert {u.id for u in limited} != {u.id for u in skipped}


class TestUpdateUser:
    async def test_update_user_fields(self, db_session):
        u = await crud_user.create_user(db_session, email="up@example.com", password="p", full_name="Up", role="user")
        updated = await crud_user.update_user(db_session, u.id, full_name="Updated Name", role="admin", phone="123")
        assert updated is not None
        assert updated.full_name == "Updated Name"
        assert updated.role == "admin"
        assert updated.phone == "123"

    async def test_update_user_not_found(self, db_session):
        result = await crud_user.update_user(db_session, uuid4(), full_name="Nope")
        assert result is None

    async def test_update_user_deactivate(self, db_session):
        u = await crud_user.create_user(db_session, email="active@example.com", password="p", full_name="Active")
        updated = await crud_user.update_user(db_session, u.id, is_active=False)
        assert updated.is_active is False


class TestUpdatePassword:
    async def test_update_user_password(self, db_session):
        u = await crud_user.create_user(db_session, email="pw@example.com", password="old", full_name="Pw")
        old_hash = u.hashed_password
        updated = await crud_user.update_user_password(db_session, u.id, "newpass")
        assert updated is not None
        assert updated.hashed_password != old_hash

    async def test_update_user_password_not_found(self, db_session):
        result = await crud_user.update_user_password(db_session, uuid4(), "new")
        assert result is None


class TestDeleteUser:
    async def test_delete_user_success(self, db_session):
        u = await crud_user.create_user(db_session, email="del@example.com", password="p", full_name="Del")
        success = await crud_user.delete_user(db_session, u.id)
        assert success is True
        gone = await crud_user.get_user(db_session, u.id)
        assert gone is None

    async def test_delete_user_not_found(self, db_session):
        success = await crud_user.delete_user(db_session, uuid4())
        assert success is False
