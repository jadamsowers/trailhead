"""Tests for core/security.py"""
import pytest
from datetime import timedelta
from jose import jwt, JWTError
from fastapi import HTTPException

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.config import settings


class TestPasswordHashing:
    """Test password hashing and verification"""
    
    def test_hash_password(self):
        """Test password hashing"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith("$2b$")  # bcrypt prefix
    
    def test_verify_correct_password(self):
        """Test verifying correct password"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_incorrect_password(self):
        """Test verifying incorrect password"""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)
        
        assert verify_password(wrong_password, hashed) is False
    
    def test_different_hashes_for_same_password(self):
        """Test that same password produces different hashes (salt)"""
        password = "testpassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestAccessToken:
    """Test JWT access token creation and decoding"""
    
    def test_create_access_token(self):
        """Test creating access token"""
        data = {"sub": "user123", "role": "admin"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_access_token_with_custom_expiry(self):
        """Test creating access token with custom expiration"""
        data = {"sub": "user123", "role": "admin"}
        expires_delta = timedelta(minutes=30)
        token = create_access_token(data, expires_delta)
        
        assert isinstance(token, str)
        
        # Decode and verify expiration
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert "exp" in payload
        assert payload["type"] == "access"
    
    def test_decode_valid_access_token(self):
        """Test decoding valid access token"""
        data = {"sub": "user123", "role": "admin"}
        token = create_access_token(data)
        
        payload = decode_token(token)
        
        assert payload["sub"] == "user123"
        assert payload["role"] == "admin"
        assert payload["type"] == "access"
        assert "exp" in payload
    
    def test_decode_invalid_token(self):
        """Test decoding invalid token raises exception"""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(HTTPException) as exc_info:
            decode_token(invalid_token)
        
        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in exc_info.value.detail
    
    def test_decode_expired_token(self):
        """Test decoding expired token raises exception"""
        data = {"sub": "user123", "role": "admin"}
        # Create token that expires immediately
        token = create_access_token(data, timedelta(seconds=-1))
        
        with pytest.raises(HTTPException) as exc_info:
            decode_token(token)
        
        assert exc_info.value.status_code == 401
    
    def test_access_token_contains_type(self):
        """Test that access token contains type field"""
        data = {"sub": "user123"}
        token = create_access_token(data)
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["type"] == "access"


class TestRefreshToken:
    """Test JWT refresh token creation"""
    
    def test_create_refresh_token(self):
        """Test creating refresh token"""
        data = {"sub": "user123"}
        token = create_refresh_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_refresh_token_contains_type(self):
        """Test that refresh token contains type field"""
        data = {"sub": "user123"}
        token = create_refresh_token(data)
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["type"] == "refresh"
        assert payload["sub"] == "user123"
        assert "exp" in payload
    
    def test_refresh_token_longer_expiry(self):
        """Test that refresh token has longer expiry than access token"""
        data = {"sub": "user123"}
        access_token = create_access_token(data)
        refresh_token = create_refresh_token(data)
        
        access_payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        refresh_payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        assert refresh_payload["exp"] > access_payload["exp"]


class TestTokenSecurity:
    """Test token security features"""
    
    def test_token_with_tampered_payload(self):
        """Test that tampered token is rejected"""
        data = {"sub": "user123", "role": "user"}
        token = create_access_token(data)
        
        # Tamper with the token by changing a character
        tampered_token = token[:-5] + "XXXXX"
        
        with pytest.raises(HTTPException) as exc_info:
            decode_token(tampered_token)
        
        assert exc_info.value.status_code == 401
    
    def test_token_with_wrong_secret(self):
        """Test that token signed with wrong secret is rejected"""
        data = {"sub": "user123"}
        # Create token with wrong secret
        wrong_token = jwt.encode(data, "wrong_secret", algorithm=settings.ALGORITHM)
        
        with pytest.raises(HTTPException) as exc_info:
            decode_token(wrong_token)
        
        assert exc_info.value.status_code == 401
    
    def test_token_preserves_custom_claims(self):
        """Test that custom claims are preserved in token"""
        data = {
            "sub": "user123",
            "role": "admin",
            "custom_field": "custom_value",
            "number": 42,
        }
        token = create_access_token(data)
        
        payload = decode_token(token)
        
        assert payload["sub"] == "user123"
        assert payload["role"] == "admin"
        assert payload["custom_field"] == "custom_value"
        assert payload["number"] == 42