"""Tests for auth schema validators"""
import pytest
from datetime import date
from uuid import uuid4
from pydantic import ValidationError

from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    UserResponse,
    UserContactUpdate,
    TokenResponse,
)


class TestLoginRequest:
    """Tests for LoginRequest schema"""

    def test_valid_login(self):
        """Test creating a valid login request"""
        login = LoginRequest(
            email="user@example.com",
            password="password123"
        )
        assert login.email == "user@example.com"
        assert login.password == "password123"

    def test_invalid_email_raises_error(self):
        """Test that invalid email raises validation error"""
        with pytest.raises(ValidationError):
            LoginRequest(email="not-an-email", password="password123")

    def test_password_too_short_raises_error(self):
        """Test that password shorter than 8 chars raises error"""
        with pytest.raises(ValidationError):
            LoginRequest(email="user@example.com", password="short")

    def test_password_exactly_8_chars(self):
        """Test that password with exactly 8 chars is valid"""
        login = LoginRequest(email="user@example.com", password="12345678")
        assert login.password == "12345678"


class TestRefreshRequest:
    """Tests for RefreshRequest schema"""

    def test_valid_refresh(self):
        """Test creating a valid refresh request"""
        refresh = RefreshRequest(refresh_token="some_refresh_token_here")
        assert refresh.refresh_token == "some_refresh_token_here"

    def test_missing_token_raises_error(self):
        """Test that missing refresh_token raises error"""
        with pytest.raises(ValidationError):
            RefreshRequest()


class TestUserResponse:
    """Tests for UserResponse schema"""

    def test_valid_user_response(self):
        """Test creating a valid user response"""
        user = UserResponse(
            id=uuid4(),
            email="user@example.com",
            full_name="Test User"
        )
        assert user.email == "user@example.com"
        assert user.full_name == "Test User"
        assert user.role == "user"  # Default
        assert user.is_initial_admin is False

    def test_user_with_all_fields(self):
        """Test user response with all fields populated"""
        user = UserResponse(
            id=uuid4(),
            email="admin@example.com",
            full_name="Admin User",
            role="admin",
            is_initial_admin=True,
            initial_setup_complete=True,
            phone="555-1234",
            emergency_contact_name="Emergency Contact",
            emergency_contact_phone="555-9999",
            youth_protection_expiration=date(2025, 12, 31)
        )
        assert user.role == "admin"
        assert user.is_initial_admin is True
        assert user.phone == "555-1234"
        assert user.youth_protection_expiration == date(2025, 12, 31)

    def test_user_default_values(self):
        """Test that default values are set correctly"""
        user = UserResponse(
            id=uuid4(),
            email="test@example.com",
            full_name="Test"
        )
        assert user.role == "user"
        assert user.is_initial_admin is False
        assert user.initial_setup_complete is False
        assert user.phone is None
        assert user.emergency_contact_name is None
        assert user.emergency_contact_phone is None
        assert user.youth_protection_expiration is None


class TestUserContactUpdate:
    """Tests for UserContactUpdate schema"""

    def test_update_phone_only(self):
        """Test updating only phone"""
        update = UserContactUpdate(phone="555-1234")
        assert update.phone == "555-1234"
        assert update.emergency_contact_name is None
        assert update.emergency_contact_phone is None
        assert update.youth_protection_expiration is None

    def test_update_emergency_contact(self):
        """Test updating emergency contact information"""
        update = UserContactUpdate(
            emergency_contact_name="John Doe",
            emergency_contact_phone="555-9999"
        )
        assert update.emergency_contact_name == "John Doe"
        assert update.emergency_contact_phone == "555-9999"

    def test_update_youth_protection(self):
        """Test updating youth protection expiration"""
        update = UserContactUpdate(
            youth_protection_expiration=date(2026, 6, 15)
        )
        assert update.youth_protection_expiration == date(2026, 6, 15)

    def test_update_all_fields(self):
        """Test updating all fields"""
        update = UserContactUpdate(
            phone="555-1234",
            emergency_contact_name="Emergency Contact",
            emergency_contact_phone="555-9999",
            youth_protection_expiration=date(2025, 12, 31)
        )
        assert update.phone == "555-1234"
        assert update.emergency_contact_name == "Emergency Contact"
        assert update.emergency_contact_phone == "555-9999"
        assert update.youth_protection_expiration == date(2025, 12, 31)

    def test_empty_update(self):
        """Test update with no fields (all None)"""
        update = UserContactUpdate()
        assert update.phone is None
        assert update.emergency_contact_name is None
        assert update.emergency_contact_phone is None
        assert update.youth_protection_expiration is None

    def test_phone_too_long_raises_error(self):
        """Test that too long phone raises error"""
        with pytest.raises(ValidationError):
            UserContactUpdate(phone="x" * 51)

    def test_emergency_contact_name_too_long_raises_error(self):
        """Test that too long emergency contact name raises error"""
        with pytest.raises(ValidationError):
            UserContactUpdate(emergency_contact_name="x" * 256)


class TestTokenResponse:
    """Tests for TokenResponse schema"""

    def test_valid_token_response(self):
        """Test creating a valid token response"""
        user = UserResponse(
            id=uuid4(),
            email="user@example.com",
            full_name="Test User"
        )
        token = TokenResponse(
            access_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            user=user
        )
        assert token.access_token.startswith("eyJ")
        assert token.token_type == "bearer"
        assert token.user.email == "user@example.com"

    def test_token_type_default(self):
        """Test that token_type defaults to 'bearer'"""
        user = UserResponse(
            id=uuid4(),
            email="test@example.com",
            full_name="Test"
        )
        token = TokenResponse(
            access_token="test_token",
            user=user
        )
        assert token.token_type == "bearer"
