"""Tests for api/endpoints/requirements.py covering rank requirements and merit badges CRUD.

Focus: ensure admin auth enforced, basic create/update/delete lifecycle works, and list endpoints return expected structure.
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4

from .factories import (
    create_rank_requirement,
    create_merit_badge,
)


@pytest.mark.asyncio
class TestRankRequirementsCRUD:
    async def test_list_rank_requirements_empty(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/requirements/rank-requirements", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    async def test_create_rank_requirement_admin(self, client: AsyncClient, auth_headers):
        payload = {
            "rank": "Tenderfoot",
            "requirement_number": "1a",
            "requirement_text": "Demonstrate proper camping skills",
            "keywords": ["camping", "skills"],
            "category": "Camping",
        }
        response = await client.post(
            "/api/requirements/rank-requirements", headers=auth_headers, json=payload
        )
        assert response.status_code == 201
        body = response.json()
        assert body["rank"] == payload["rank"]
        assert body["requirement_number"] == payload["requirement_number"]
        assert body["requirement_text"] == payload["requirement_text"]
        assert body["keywords"] == payload["keywords"]
        assert body["category"] == payload["category"]
        assert "id" in body

    async def test_create_rank_requirement_forbidden_without_admin(self, client: AsyncClient):
        payload = {
            "rank": "Scout",
            "requirement_number": "1",
            "requirement_text": "Test requirement",
            "keywords": ["test"],
        }
        # No auth headers
        response = await client.post(
            "/api/requirements/rank-requirements", json=payload
        )
        assert response.status_code == 403

    async def test_update_rank_requirement(self, client: AsyncClient, auth_headers, db_session):
        # Create via factory directly (bypassing API) to test update endpoint
        req = await create_rank_requirement(db_session, rank="Tenderfoot", requirement_number="2b")
        update_payload = {"requirement_text": "Updated text", "category": "First Aid"}
        response = await client.put(
            f"/api/requirements/rank-requirements/{req.id}", headers=auth_headers, json=update_payload
        )
        assert response.status_code == 200
        body = response.json()
        assert body["requirement_text"] == update_payload["requirement_text"]
        assert body["category"] == update_payload["category"]

    async def test_update_rank_requirement_not_found(self, client: AsyncClient, auth_headers):
        response = await client.put(
            f"/api/requirements/rank-requirements/{uuid4()}", headers=auth_headers, json={"requirement_text": "X"}
        )
        assert response.status_code == 404

    async def test_delete_rank_requirement(self, client: AsyncClient, auth_headers, db_session):
        req = await create_rank_requirement(db_session, rank="First Class", requirement_number="3")
        response = await client.delete(
            f"/api/requirements/rank-requirements/{req.id}", headers=auth_headers
        )
        assert response.status_code == 204
        # Subsequent get should 404
        get_resp = await client.get(
            f"/api/requirements/rank-requirements/{req.id}", headers=auth_headers
        )
        assert get_resp.status_code == 404


@pytest.mark.asyncio
class TestMeritBadgesCRUD:
    async def test_list_merit_badges_empty(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/requirements/merit-badges", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    async def test_create_merit_badge_admin(self, client: AsyncClient, auth_headers):
        payload = {
            "name": "Cooking",
            "description": "Learn outdoor cooking skills",
            "keywords": ["cooking", "food", "camp"],
        }
        response = await client.post(
            "/api/requirements/merit-badges", headers=auth_headers, json=payload
        )
        assert response.status_code == 201
        body = response.json()
        assert body["name"] == payload["name"]
        assert body["description"] == payload["description"]
        assert body["keywords"] == payload["keywords"]
        assert "id" in body

    async def test_create_merit_badge_duplicate_name(self, client: AsyncClient, auth_headers, db_session):
        # Seed one badge via factory
        await create_merit_badge(db_session, name="Swimming")
        payload = {"name": "Swimming", "description": "Duplicate", "keywords": ["water"]}
        response = await client.post(
            "/api/requirements/merit-badges", headers=auth_headers, json=payload
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    async def test_update_merit_badge(self, client: AsyncClient, auth_headers, db_session):
        badge = await create_merit_badge(db_session, name="Archery")
        update_payload = {"description": "Updated desc", "keywords": ["archery", "range"]}
        response = await client.put(
            f"/api/requirements/merit-badges/{badge.id}", headers=auth_headers, json=update_payload
        )
        assert response.status_code == 200
        body = response.json()
        assert body["description"] == update_payload["description"]
        assert body["keywords"] == update_payload["keywords"]

    async def test_update_merit_badge_not_found(self, client: AsyncClient, auth_headers):
        response = await client.put(
            f"/api/requirements/merit-badges/{uuid4()}", headers=auth_headers, json={"description": "X"}
        )
        assert response.status_code == 404

    async def test_delete_merit_badge(self, client: AsyncClient, auth_headers, db_session):
        badge = await create_merit_badge(db_session, name="Cycling")
        response = await client.delete(
            f"/api/requirements/merit-badges/{badge.id}", headers=auth_headers
        )
        assert response.status_code == 204
        # Subsequent get should 404
        get_resp = await client.get(
            f"/api/requirements/merit-badges/{badge.id}", headers=auth_headers
        )
        assert get_resp.status_code == 404
