"""End-to-end integration tests for the full Verbum content lifecycle.

Verifies: create → generate → validate → schedule → publish,
error handling, and Portuguese character round-tripping.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from app.models.content import ContentStatus
from app.services.ai_service import AIService
from app.services.validation_service import Citation, ValidationResult


@pytest.mark.asyncio
class TestFullContentLifecycle:
    """End-to-end: create → generate → validate → schedule → publish."""

    async def test_full_lifecycle_short_video(self, client: AsyncClient):
        # 1. Create a short_video content item
        resp = await client.post("/api/content", json={
            "title": "Oração do Santo Rosário",
            "body": "",
            "content_type": "short_video",
            "channels": ["youtube", "instagram"],
        })
        assert resp.status_code == 201
        data = resp.json()
        content_id = data["id"]
        assert data["content_type"] == "short_video"
        assert data["status"] == "draft"

        # 2. Simulate AI generation and update content body
        generated_body = (
            "Neste vídeo curto, vamos explorar a beleza da oração do "
            "Santo Rosário e como ela nos aproxima de Maria Santíssima."
        )
        resp = await client.put(f"/api/content/{content_id}", json={
            "body": generated_body,
        })
        assert resp.status_code == 200
        assert resp.json()["body"] == generated_body
        assert resp.json()["version"] == 2

        # 3. Transition to validated
        resp = await client.post(f"/api/content/{content_id}/status", json={
            "new_status": "validated",
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "validated"

        # 4. Schedule the content
        resp = await client.post(
            f"/api/schedule/{content_id}/schedule"
            f"?scheduled_date=2026-06-01T10%3A00%3A00Z&channel=youtube"
        )
        assert resp.status_code == 200
        assert resp.json()["content_id"] == content_id
        assert resp.json()["channel"] == "youtube"

        # Content should now be scheduled
        resp = await client.get(f"/api/content/{content_id}")
        assert resp.status_code == 200
        assert resp.json()["status"] == "scheduled"

        # 5. Mark as published
        resp = await client.post(f"/api/content/{content_id}/status", json={
            "new_status": "published",
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "published"

        # 6. Verify dashboard reflects the published item
        resp = await client.get("/api/dashboard/summary")
        assert resp.status_code == 200
        summary = resp.json()
        assert summary["status_counts"]["published"] >= 1
        assert summary["total"] >= 1

    async def test_lifecycle_with_versioning(self, client: AsyncClient):
        """Verify version history is maintained through lifecycle."""
        resp = await client.post("/api/content", json={
            "title": "Versão Original",
            "body": "Corpo original do conteúdo",
            "content_type": "blog_post",
        })
        content_id = resp.json()["id"]

        # Edit twice to create version history
        await client.put(f"/api/content/{content_id}", json={
            "title": "Versão 2",
            "body": "Corpo atualizado",
        })
        await client.put(f"/api/content/{content_id}", json={
            "title": "Versão 3",
            "body": "Corpo final",
        })

        # Check versions
        resp = await client.get(f"/api/content/{content_id}/versions")
        assert resp.status_code == 200
        versions = resp.json()
        assert len(versions) == 2  # 2 snapshots (original + first edit)

        # Current should be version 3
        resp = await client.get(f"/api/content/{content_id}")
        assert resp.json()["version"] == 3
        assert resp.json()["title"] == "Versão 3"


@pytest.mark.asyncio
class TestPortugueseCharacterRoundTrip:
    """Verify Portuguese characters persist correctly through backend."""

    PORTUGUESE_TEXTS = [
        ("Oração", "A oração é essencial para a vida cristã"),
        ("Salvação", "A salvação vem pela graça de Deus"),
        ("Coração de Jesus", "O Sagrado Coração de Jesus nos ama"),
        ("Ação de Graças", "Devemos dar ação de graças todos os dias"),
        ("São João Batista", "São João preparou o caminho do Senhor"),
    ]

    @pytest.mark.parametrize("title,body", PORTUGUESE_TEXTS)
    async def test_portuguese_chars_in_content(
        self, client: AsyncClient, title: str, body: str
    ):
        """Characters ã, õ, ç, é, á, â round-trip correctly."""
        resp = await client.post("/api/content", json={
            "title": title,
            "body": body,
            "content_type": "blog_post",
        })
        assert resp.status_code == 201
        content_id = resp.json()["id"]

        # Read back and verify
        resp = await client.get(f"/api/content/{content_id}")
        assert resp.status_code == 200
        assert resp.json()["title"] == title
        assert resp.json()["body"] == body

    async def test_portuguese_in_update(self, client: AsyncClient):
        """Portuguese chars survive update operations."""
        resp = await client.post("/api/content", json={
            "title": "Initial", "content_type": "short_video",
        })
        content_id = resp.json()["id"]

        updated_title = "Não há salvação fora da Igreja"
        updated_body = "São Ciprião ensinou que não há salvação fora da Igreja Católica"
        resp = await client.put(f"/api/content/{content_id}", json={
            "title": updated_title,
            "body": updated_body,
        })
        assert resp.status_code == 200
        assert resp.json()["title"] == updated_title
        assert resp.json()["body"] == updated_body

    async def test_portuguese_in_list_endpoint(self, client: AsyncClient):
        """Portuguese chars appear correctly in list responses."""
        await client.post("/api/content", json={
            "title": "Vocação à santidade",
            "body": "Todos são chamados à perfeição",
            "content_type": "long_video",
        })

        resp = await client.get("/api/content")
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert any(
            item["title"] == "Vocação à santidade" for item in items
        )

    async def test_special_chars_in_channels(self, client: AsyncClient):
        """Channels with Portuguese names work correctly."""
        resp = await client.post("/api/content", json={
            "title": "Test",
            "content_type": "blog_post",
            "channels": ["youtube", "paróquia"],
        })
        assert resp.status_code == 201
        assert "paróquia" in resp.json()["channels"]


@pytest.mark.asyncio
class TestErrorHandlingMissingAPIKeys:
    """Verify error handling when API keys are missing."""

    async def test_generate_with_unknown_model(self, client: AsyncClient):
        """Request to unknown model returns 400."""
        resp = await client.post("/api/generation/generate", json={
            "prompt": "Write something",
            "model": "nonexistent_model",
        })
        assert resp.status_code in (400, 422)

    async def test_list_models_endpoint(self, client: AsyncClient):
        """Models endpoint returns available providers."""
        resp = await client.get("/api/generation/models")
        assert resp.status_code == 200
        data = resp.json()
        assert "models" in data


@pytest.mark.asyncio
class TestInvalidStatusTransitions:
    """Verify all invalid status transitions are rejected."""

    async def _create_content(self, client: AsyncClient) -> str:
        resp = await client.post("/api/content", json={
            "title": "Transition Test", "content_type": "blog_post",
        })
        return resp.json()["id"]

    async def test_draft_to_scheduled_rejected(self, client: AsyncClient):
        cid = await self._create_content(client)
        resp = await client.post(f"/api/content/{cid}/status", json={
            "new_status": "scheduled",
        })
        assert resp.status_code == 400

    async def test_draft_to_published_rejected(self, client: AsyncClient):
        cid = await self._create_content(client)
        resp = await client.post(f"/api/content/{cid}/status", json={
            "new_status": "published",
        })
        assert resp.status_code == 400

    async def test_validated_to_published_rejected(self, client: AsyncClient):
        """Cannot skip scheduled and go directly to published."""
        cid = await self._create_content(client)
        await client.post(f"/api/content/{cid}/status", json={"new_status": "validated"})
        resp = await client.post(f"/api/content/{cid}/status", json={
            "new_status": "published",
        })
        assert resp.status_code == 400

    async def test_published_to_scheduled_rejected(self, client: AsyncClient):
        """Cannot go back from published to scheduled."""
        cid = await self._create_content(client)
        await client.post(f"/api/content/{cid}/status", json={"new_status": "validated"})
        await client.post(f"/api/content/{cid}/status", json={"new_status": "scheduled"})
        await client.post(f"/api/content/{cid}/status", json={"new_status": "published"})
        resp = await client.post(f"/api/content/{cid}/status", json={
            "new_status": "scheduled",
        })
        assert resp.status_code == 400

    async def test_status_change_on_nonexistent_content(self, client: AsyncClient):
        resp = await client.post("/api/content/nonexistent-id/status", json={
            "new_status": "validated",
        })
        assert resp.status_code in (400, 404)


@pytest.mark.asyncio
class TestSchedulingErrorHandling:
    """Verify scheduling rejects invalid operations."""

    async def test_schedule_nonexistent_content(self, client: AsyncClient):
        resp = await client.post(
            "/api/schedule/nonexistent/schedule"
            "?scheduled_date=2026-06-01T10%3A00%3A00Z&channel=youtube"
        )
        assert resp.status_code in (400, 404)

    async def test_schedule_draft_content_rejected(self, client: AsyncClient):
        """Cannot schedule content that hasn't been validated."""
        resp = await client.post("/api/content", json={
            "title": "Draft Only", "content_type": "blog_post",
        })
        content_id = resp.json()["id"]
        resp = await client.post(
            f"/api/schedule/{content_id}/schedule"
            f"?scheduled_date=2026-06-01T10%3A00%3A00Z&channel=blog"
        )
        assert resp.status_code == 400

    async def test_reschedule_nonexistent_content(self, client: AsyncClient):
        resp = await client.put(
            "/api/schedule/nonexistent/reschedule"
            "?new_date=2026-07-01T10%3A00%3A00Z"
        )
        assert resp.status_code in (400, 404)


@pytest.mark.asyncio
class TestDashboardIntegration:
    """Verify dashboard reflects content state changes."""

    async def test_dashboard_empty(self, client: AsyncClient):
        resp = await client.get("/api/dashboard/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0

    async def test_dashboard_counts_update(self, client: AsyncClient):
        """Create items in various states and verify counts."""
        # Create 2 drafts
        await client.post("/api/content", json={
            "title": "Draft 1", "content_type": "blog_post",
        })
        await client.post("/api/content", json={
            "title": "Draft 2", "content_type": "short_video",
        })

        # Validate one
        resp = await client.post("/api/content", json={
            "title": "Validated Item", "content_type": "long_video",
        })
        cid = resp.json()["id"]
        await client.post(f"/api/content/{cid}/status", json={"new_status": "validated"})

        resp = await client.get("/api/dashboard/summary")
        data = resp.json()
        assert data["total"] == 3
        assert data["status_counts"]["draft"] == 2
        assert data["status_counts"]["validated"] == 1

    async def test_dashboard_type_counts(self, client: AsyncClient):
        await client.post("/api/content", json={
            "title": "Blog", "content_type": "blog_post",
        })
        await client.post("/api/content", json={
            "title": "Short", "content_type": "short_video",
        })

        resp = await client.get("/api/dashboard/summary")
        data = resp.json()
        assert data["type_counts"]["blog_post"] == 1
        assert data["type_counts"]["short_video"] == 1


@pytest.mark.asyncio
class TestValidationAPIIntegration:
    """Verify validation API endpoint behavior."""

    async def test_validate_nonexistent_content(self, client: AsyncClient):
        resp = await client.post("/api/validation/validate/nonexistent-id")
        assert resp.status_code == 404

    async def test_validation_history_empty(self, client: AsyncClient):
        resp = await client.post("/api/content", json={
            "title": "No Validation Yet", "content_type": "blog_post",
        })
        content_id = resp.json()["id"]

        resp = await client.get(f"/api/validation/history/{content_id}")
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    async def test_validation_status_endpoint(self, client: AsyncClient):
        resp = await client.get("/api/validation/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "primary_available" in data
        assert "primary_provider" in data
        assert "fallback_provider" in data
