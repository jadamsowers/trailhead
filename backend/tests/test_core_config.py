"""Tests for core/config.py"""
import pytest
import os
from app.core.config import Settings


class TestSettings:
    """Test application settings configuration"""
    
    def test_default_settings(self):
        """Test default settings values"""
        # Create settings with minimal required fields
        settings = Settings(
            POSTGRES_SERVER="localhost",
            POSTGRES_USER="test",
            POSTGRES_PASSWORD="test",
            POSTGRES_DB="test",
            SECRET_KEY="test_secret_key_min_32_chars_long_12345",
        )
        
        assert settings.PROJECT_NAME == "Scouting Outing Manager"
        assert settings.VERSION == "1.0.0"
        assert settings.API_V1_STR == "/api"
        assert settings.DEBUG is False
        assert settings.ALGORITHM == "HS256"
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 15
        assert settings.REFRESH_TOKEN_EXPIRE_DAYS == 7
        assert settings.POSTGRES_PORT == 5432
    
    def test_database_url_construction(self):
        """Test DATABASE_URL is constructed correctly"""
        settings = Settings(
            POSTGRES_SERVER="db.example.com",
            POSTGRES_USER="dbuser",
            POSTGRES_PASSWORD="dbpass",
            POSTGRES_DB="scoutdb",
            POSTGRES_PORT=5433,
            SECRET_KEY="test_secret_key_min_32_chars_long_12345",
        )
        
        expected_url = "postgresql+asyncpg://dbuser:dbpass@db.example.com:5433/scoutdb"
        assert settings.DATABASE_URL == expected_url
    
    def test_custom_database_url(self):
        """Test custom DATABASE_URL is preserved"""
        custom_url = "postgresql+asyncpg://custom:pass@custom.host:5432/customdb"
        settings = Settings(
            POSTGRES_SERVER="localhost",
            POSTGRES_USER="test",
            POSTGRES_PASSWORD="test",
            POSTGRES_DB="test",
            SECRET_KEY="test_secret_key_min_32_chars_long_12345",
            DATABASE_URL=custom_url,
        )
        
        assert settings.DATABASE_URL == custom_url
    
    def test_cors_origins_string_parsing(self):
        """Test CORS origins are parsed from comma-separated string"""
        settings = Settings(
            POSTGRES_SERVER="localhost",
            POSTGRES_USER="test",
            POSTGRES_PASSWORD="test",
            POSTGRES_DB="test",
            SECRET_KEY="test_secret_key_min_32_chars_long_12345",
            BACKEND_CORS_ORIGINS="http://localhost:3000,http://localhost:8000,https://example.com",
        )
        
        assert isinstance(settings.BACKEND_CORS_ORIGINS, list)
        assert len(settings.BACKEND_CORS_ORIGINS) == 3
        assert "http://localhost:3000" in settings.BACKEND_CORS_ORIGINS
        assert "http://localhost:8000" in settings.BACKEND_CORS_ORIGINS
        assert "https://example.com" in settings.BACKEND_CORS_ORIGINS
    
    def test_cors_origins_with_spaces(self):
        """Test CORS origins parsing handles spaces"""
        settings = Settings(
            POSTGRES_SERVER="localhost",
            POSTGRES_USER="test",
            POSTGRES_PASSWORD="test",
            POSTGRES_DB="test",
            SECRET_KEY="test_secret_key_min_32_chars_long_12345",
            BACKEND_CORS_ORIGINS="http://localhost:3000 , http://localhost:8000 , https://example.com",
        )
        
        assert len(settings.BACKEND_CORS_ORIGINS) == 3
        assert all(origin.strip() == origin for origin in settings.BACKEND_CORS_ORIGINS)
    
    def test_cors_origins_list_input(self):
        """Test CORS origins can be provided as list"""
        origins = ["http://localhost:3000", "http://localhost:8000"]
        settings = Settings(
            POSTGRES_SERVER="localhost",
            POSTGRES_USER="test",
            POSTGRES_PASSWORD="test",
            POSTGRES_DB="test",
            SECRET_KEY="test_secret_key_min_32_chars_long_12345",
            BACKEND_CORS_ORIGINS=origins,
        )
        
        assert settings.BACKEND_CORS_ORIGINS == origins
    
    def test_cors_origins_empty_string(self):
        """Test CORS origins handles empty string"""
        settings = Settings(
            POSTGRES_SERVER="localhost",
            POSTGRES_USER="test",
            POSTGRES_PASSWORD="test",
            POSTGRES_DB="test",
            SECRET_KEY="test_secret_key_min_32_chars_long_12345",
            BACKEND_CORS_ORIGINS="",
        )
        
        assert isinstance(settings.BACKEND_CORS_ORIGINS, list)
        assert len(settings.BACKEND_CORS_ORIGINS) == 0
    
    def test_custom_token_expiration(self):
        """Test custom token expiration settings"""
        settings = Settings(
            POSTGRES_SERVER="localhost",
            POSTGRES_USER="test",
            POSTGRES_PASSWORD="test",
            POSTGRES_DB="test",
            SECRET_KEY="test_secret_key_min_32_chars_long_12345",
            ACCESS_TOKEN_EXPIRE_MINUTES=30,
            REFRESH_TOKEN_EXPIRE_DAYS=14,
        )
        
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 30
        assert settings.REFRESH_TOKEN_EXPIRE_DAYS == 14
    
    def test_debug_mode(self):
        """Test debug mode setting"""
        settings = Settings(
            POSTGRES_SERVER="localhost",
            POSTGRES_USER="test",
            POSTGRES_PASSWORD="test",
            POSTGRES_DB="test",
            SECRET_KEY="test_secret_key_min_32_chars_long_12345",
            DEBUG=True,
        )
        
        assert settings.DEBUG is True
    
    def test_custom_api_version(self):
        """Test custom API version string"""
        settings = Settings(
            POSTGRES_SERVER="localhost",
            POSTGRES_USER="test",
            POSTGRES_PASSWORD="test",
            POSTGRES_DB="test",
            SECRET_KEY="test_secret_key_min_32_chars_long_12345",
            API_V1_STR="/api/v1",
        )
        
        assert settings.API_V1_STR == "/api/v1"
    
    def test_custom_project_info(self):
        """Test custom project name and version"""
        settings = Settings(
            POSTGRES_SERVER="localhost",
            POSTGRES_USER="test",
            POSTGRES_PASSWORD="test",
            POSTGRES_DB="test",
            SECRET_KEY="test_secret_key_min_32_chars_long_12345",
            PROJECT_NAME="Custom Scout Manager",
            VERSION="2.0.0",
        )
        
        assert settings.PROJECT_NAME == "Custom Scout Manager"
        assert settings.VERSION == "2.0.0"