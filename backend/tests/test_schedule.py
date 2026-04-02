from datetime import datetime, timezone

import pytest
from httpx import AsyncClient

from app.models.content import ContentStatus, ContentType
from app.models.schedule import ScheduleEntry, ScheduleStatus


@pytest.mark.asyncio
class TestScheduleAPI:
    async def _create_validated_content(self, client: AsyncClient) -> str:
        resp = await client.post("/api/content", json={
            "title": "Schedulable Post",
            "body": "Some body content",
            "content_type": "blog_post",
        })
        content_id = resp.json()["id"]
        await client.post(f"/api/content/{content_id}/status", json={
            "new_status": "validated",
        })
        return content_id

    async def test_schedule_content(self, client: AsyncClient):
        content_id = await self._create_validated_content(client)
        resp = await client.post(
            f"/api/schedule/{content_id}/schedule"
            f"?scheduled_date=2026-05-01T10%3A00%3A00Z&channel=youtube"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["content_id"] == content_id
        assert data["channel"] == "youtube"

    async def test_schedule_unvalidated_content_fails(self, client: AsyncClient):
        resp = await client.post("/api/content", json={
            "title": "Draft Only",
            "content_type": "blog_post",
        })
        content_id = resp.json()["id"]
        resp = await client.post(
            f"/api/schedule/{content_id}/schedule"
            f"?scheduled_date=2026-05-01T10%3A00%3A00Z&channel=blog"
        )
        assert resp.status_code == 400

    async def test_reschedule_content(self, client: AsyncClient):
        content_id = await self._create_validated_content(client)
        await client.post(
            f"/api/schedule/{content_id}/schedule"
            f"?scheduled_date=2026-05-01T10%3A00%3A00Z&channel=youtube"
        )
        resp = await client.put(
            f"/api/schedule/{content_id}/reschedule"
            f"?new_date=2026-06-01T10%3A00%3A00Z"
        )
        assert resp.status_code == 200

    async def test_get_calendar(self, client: AsyncClient):
        content_id = await self._create_validated_content(client)
        await client.post(
            f"/api/schedule/{content_id}/schedule"
            f"?scheduled_date=2026-05-15T10%3A00%3A00Z&channel=blog"
        )
        resp = await client.get(
            "/api/schedule/calendar?start=2026-05-01T00:00:00Z&end=2026-05-31T23:59:59Z"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert len(data["items"]) >= 1

    async def test_get_calendar_empty_range(self, client: AsyncClient):
        resp = await client.get(
            "/api/schedule/calendar?start=2030-01-01T00:00:00Z&end=2030-01-31T23:59:59Z"
        )
        assert resp.status_code == 200
        assert resp.json()["items"] == []

    async def test_export_ical(self, client: AsyncClient):
        content_id = await self._create_validated_content(client)
        await client.post(
            f"/api/schedule/{content_id}/schedule"
            f"?scheduled_date=2026-05-15T10%3A00%3A00Z&channel=youtube"
        )
        resp = await client.get("/api/schedule/export/ical")
        assert resp.status_code == 200
        body = resp.text
        assert "BEGIN:VCALENDAR" in body
        assert "BEGIN:VEVENT" in body
        assert "Verbum" in body

    async def test_export_ical_with_date_range(self, client: AsyncClient):
        resp = await client.get(
            "/api/schedule/export/ical?start=2030-01-01T00:00:00Z&end=2030-12-31T23:59:59Z"
        )
        assert resp.status_code == 200
        body = resp.text
        assert "BEGIN:VCALENDAR" in body
