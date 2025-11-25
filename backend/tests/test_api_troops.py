"""API tests for Troops and Patrols endpoints"""
import pytest
from httpx import AsyncClient
from uuid import uuid4

from app.schemas.troop import TroopCreate, PatrolCreate


@pytest.mark.asyncio
class TestTroopsAPI:
    async def test_list_troops(self, client: AsyncClient, auth_headers, test_troop):
        response = await client.get("/api/troops", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "troops" in data
        assert data["total"] >= 1

    async def test_create_troop_admin(self, client: AsyncClient, auth_headers):
        payload = {
            "number": "789",
            "charter_org": "Another Org",
            "meeting_location": "School",
            "meeting_day": "Thursday"
        }
        response = await client.post("/api/troops", headers=auth_headers, json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["number"] == "789"

    async def test_create_troop_non_admin(self, client: AsyncClient, regular_user_headers):
        payload = {"number": "999"}
        response = await client.post("/api/troops", headers=regular_user_headers, json=payload)
        assert response.status_code == 403

    async def test_get_troop(self, client: AsyncClient, auth_headers, test_troop):
        response = await client.get(f"/api/troops/{test_troop.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_troop.id)
        assert data["number"] == test_troop.number

    async def test_update_troop(self, client: AsyncClient, auth_headers, test_troop):
        response = await client.put(f"/api/troops/{test_troop.id}", headers=auth_headers, json={"meeting_day": "Friday"})
        assert response.status_code == 200
        assert response.json()["meeting_day"] == "Friday"

    async def test_delete_troop(self, client: AsyncClient, auth_headers, test_troop):
        response = await client.delete(f"/api/troops/{test_troop.id}", headers=auth_headers)
        assert response.status_code == 204


@pytest.mark.asyncio
class TestPatrolsAPI:
    async def test_list_patrols(self, client: AsyncClient, auth_headers, test_troop, test_patrol):
        response = await client.get(f"/api/troops/{test_troop.id}/patrols", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "patrols" in data
        assert data["total"] >= 1

    async def test_create_patrol_admin(self, client: AsyncClient, auth_headers, test_troop):
        payload = {"troop_id": str(test_troop.id), "name": "Falcon Patrol"}
        response = await client.post("/api/patrols", headers=auth_headers, json=payload)
        assert response.status_code == 201
        assert response.json()["name"] == "Falcon Patrol"

    async def test_create_patrol_non_admin(self, client: AsyncClient, regular_user_headers, test_troop):
        payload = {"troop_id": str(test_troop.id), "name": "Hawk Patrol"}
        response = await client.post("/api/patrols", headers=regular_user_headers, json=payload)
        assert response.status_code == 403

    async def test_update_patrol(self, client: AsyncClient, auth_headers, test_patrol):
        response = await client.put(f"/api/patrols/{test_patrol.id}", headers=auth_headers, json={"name": "Lion Patrol"})
        assert response.status_code == 200
        assert response.json()["name"] == "Lion Patrol"

    async def test_delete_patrol(self, client: AsyncClient, auth_headers, test_patrol):
        response = await client.delete(f"/api/patrols/{test_patrol.id}", headers=auth_headers)
        assert response.status_code == 204
