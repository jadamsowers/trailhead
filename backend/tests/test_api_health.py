import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import status
from app.main import app
from unittest.mock import mock_open, patch

import sys
import os
import asyncio
import types

@pytest.mark.asyncio
async def test_health_check_success(monkeypatch):
    # Patch AsyncSessionLocal to simulate DB OK, tables present, migrations up to date
    class DummySession:
        async def __aenter__(self):
            return self
        async def __aexit__(self, exc_type, exc, tb):
            pass
        async def execute(self, query):
            sql = str(query)
            if "SELECT 1" in sql:
                return types.SimpleNamespace(scalar=lambda: 1)
            if "to_regclass" in sql:
                return types.SimpleNamespace(scalar=lambda: 'public.users')
            if "atlas_schema_revisions" in sql:
                return types.SimpleNamespace(scalar=lambda: '20250101000000')
            raise Exception("Unexpected query")
    
    monkeypatch.setattr("app.api.endpoints.health.AsyncSessionLocal", lambda: DummySession())
    
    mock_file_content = "20250101000000 somehash somefile.sql\n"
    with patch("builtins.open", mock_open(read_data=mock_file_content)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/api/health")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert data["db_status"] == "ok"
        assert data["tables_present"] is True
        assert data["migrations_up_to_date"] is True
        assert data["error"] is None

@pytest.mark.asyncio
async def test_health_check_db_error(monkeypatch):
    class DummySession:
        async def __aenter__(self):
            return self
        async def __aexit__(self, exc_type, exc, tb):
            pass
        async def execute(self, query):
            raise Exception("DB error!")
    monkeypatch.setattr("app.api.endpoints.health.AsyncSessionLocal", lambda: DummySession())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    data = response.json()
    assert data["status"] == "unhealthy"
    assert data["db_status"] == "error"
    assert data["tables_present"] is False
    assert data["migrations_up_to_date"] is False
    assert data["error"] is not None

@pytest.mark.asyncio
async def test_ready_success(monkeypatch):
    class DummySession:
        async def __aenter__(self):
            return self
        async def __aexit__(self, exc_type, exc, tb):
            pass
        async def execute(self, query):
            sql = str(query)
            if "SELECT 1" in sql:
                return types.SimpleNamespace(scalar=lambda: 1)
            if "to_regclass" in sql:
                return types.SimpleNamespace(scalar=lambda: 'public.users')
            raise Exception("Unexpected query")
    monkeypatch.setattr("app.api.endpoints.health.AsyncSessionLocal", lambda: DummySession())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/ready")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "ready"

@pytest.mark.asyncio
async def test_ready_failure(monkeypatch):
    class DummySession:
        async def __aenter__(self):
            return self
        async def __aexit__(self, exc_type, exc, tb):
            pass
        async def execute(self, query):
            raise Exception("DB error!")
    monkeypatch.setattr("app.api.endpoints.health.AsyncSessionLocal", lambda: DummySession())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/ready")
    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert response.json()["status"] == "not ready"
