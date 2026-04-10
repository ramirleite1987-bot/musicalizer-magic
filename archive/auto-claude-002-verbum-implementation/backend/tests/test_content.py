import pytest
from httpx import AsyncClient

from app.models.content import ContentStatus, ContentType


@pytest.mark.asyncio
class TestContentCRUD:
    async def test_create_content(self, client: AsyncClient):
        resp = await client.post("/api/content", json={
            "title": "Test Post",
            "body": "Content body",
            "content_type": "blog_post",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Test Post"
        assert data["body"] == "Content body"
        assert data["content_type"] == "blog_post"
        assert data["status"] == "draft"
        assert data["language"] == "pt"
        assert data["version"] == 1

    async def test_create_content_with_channels(self, client: AsyncClient):
        resp = await client.post("/api/content", json={
            "title": "Video Script",
            "content_type": "short_video",
            "channels": ["youtube", "instagram"],
        })
        assert resp.status_code == 201
        assert resp.json()["channels"] == ["youtube", "instagram"]

    async def test_get_content(self, client: AsyncClient):
        create_resp = await client.post("/api/content", json={
            "title": "Fetch Me",
            "content_type": "long_video",
        })
        content_id = create_resp.json()["id"]

        resp = await client.get(f"/api/content/{content_id}")
        assert resp.status_code == 200
        assert resp.json()["title"] == "Fetch Me"

    async def test_get_content_not_found(self, client: AsyncClient):
        resp = await client.get("/api/content/nonexistent-id")
        assert resp.status_code == 404

    async def test_list_content(self, client: AsyncClient):
        await client.post("/api/content", json={
            "title": "Item 1", "content_type": "blog_post",
        })
        await client.post("/api/content", json={
            "title": "Item 2", "content_type": "short_video",
        })

        resp = await client.get("/api/content")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

    async def test_list_content_filter_by_type(self, client: AsyncClient):
        await client.post("/api/content", json={
            "title": "Blog", "content_type": "blog_post",
        })
        await client.post("/api/content", json={
            "title": "Video", "content_type": "short_video",
        })

        resp = await client.get("/api/content?content_type=blog_post")
        assert resp.status_code == 200
        assert resp.json()["total"] == 1
        assert resp.json()["items"][0]["title"] == "Blog"

    async def test_update_content(self, client: AsyncClient):
        create_resp = await client.post("/api/content", json={
            "title": "Original", "content_type": "blog_post",
        })
        content_id = create_resp.json()["id"]

        resp = await client.put(f"/api/content/{content_id}", json={
            "title": "Updated Title",
            "body": "Updated body",
        })
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"
        assert resp.json()["body"] == "Updated body"
        assert resp.json()["version"] == 2

    async def test_update_content_not_found(self, client: AsyncClient):
        resp = await client.put("/api/content/nonexistent", json={"title": "X"})
        assert resp.status_code == 404

    async def test_delete_content(self, client: AsyncClient):
        create_resp = await client.post("/api/content", json={
            "title": "Delete Me", "content_type": "blog_post",
        })
        content_id = create_resp.json()["id"]

        resp = await client.delete(f"/api/content/{content_id}")
        assert resp.status_code == 204

        resp = await client.get(f"/api/content/{content_id}")
        assert resp.status_code == 404

    async def test_delete_content_not_found(self, client: AsyncClient):
        resp = await client.delete("/api/content/nonexistent")
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestStatusTransitions:
    async def _create_draft(self, client: AsyncClient) -> str:
        resp = await client.post("/api/content", json={
            "title": "Status Test", "content_type": "blog_post",
        })
        return resp.json()["id"]

    async def test_draft_to_validated(self, client: AsyncClient):
        cid = await self._create_draft(client)
        resp = await client.post(f"/api/content/{cid}/status", json={
            "new_status": "validated",
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "validated"

    async def test_validated_to_scheduled(self, client: AsyncClient):
        cid = await self._create_draft(client)
        await client.post(f"/api/content/{cid}/status", json={"new_status": "validated"})
        resp = await client.post(f"/api/content/{cid}/status", json={"new_status": "scheduled"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "scheduled"

    async def test_scheduled_to_published(self, client: AsyncClient):
        cid = await self._create_draft(client)
        await client.post(f"/api/content/{cid}/status", json={"new_status": "validated"})
        await client.post(f"/api/content/{cid}/status", json={"new_status": "scheduled"})
        resp = await client.post(f"/api/content/{cid}/status", json={"new_status": "published"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "published"

    async def test_invalid_transition_draft_to_published(self, client: AsyncClient):
        cid = await self._create_draft(client)
        resp = await client.post(f"/api/content/{cid}/status", json={
            "new_status": "published",
        })
        assert resp.status_code == 400

    async def test_invalid_transition_published_to_draft(self, client: AsyncClient):
        cid = await self._create_draft(client)
        await client.post(f"/api/content/{cid}/status", json={"new_status": "validated"})
        await client.post(f"/api/content/{cid}/status", json={"new_status": "scheduled"})
        await client.post(f"/api/content/{cid}/status", json={"new_status": "published"})
        resp = await client.post(f"/api/content/{cid}/status", json={"new_status": "draft"})
        assert resp.status_code == 400

    async def test_validated_back_to_draft(self, client: AsyncClient):
        cid = await self._create_draft(client)
        await client.post(f"/api/content/{cid}/status", json={"new_status": "validated"})
        resp = await client.post(f"/api/content/{cid}/status", json={"new_status": "draft"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "draft"


@pytest.mark.asyncio
class TestVersioning:
    async def test_update_creates_version(self, client: AsyncClient):
        create_resp = await client.post("/api/content", json={
            "title": "V1 Title", "body": "V1 Body", "content_type": "blog_post",
        })
        content_id = create_resp.json()["id"]

        await client.put(f"/api/content/{content_id}", json={
            "title": "V2 Title", "body": "V2 Body",
        })

        resp = await client.get(f"/api/content/{content_id}/versions")
        assert resp.status_code == 200
        versions = resp.json()
        assert len(versions) == 1
        assert versions[0]["version_number"] == 1
        assert versions[0]["title"] == "V1 Title"
        assert versions[0]["body"] == "V1 Body"

    async def test_multiple_updates_create_versions(self, client: AsyncClient):
        create_resp = await client.post("/api/content", json={
            "title": "Original", "content_type": "blog_post",
        })
        content_id = create_resp.json()["id"]

        await client.put(f"/api/content/{content_id}", json={"title": "Edit 1"})
        await client.put(f"/api/content/{content_id}", json={"title": "Edit 2"})

        resp = await client.get(f"/api/content/{content_id}/versions")
        versions = resp.json()
        assert len(versions) == 2


@pytest.mark.asyncio
class TestFieldValidation:
    async def test_title_required(self, client: AsyncClient):
        resp = await client.post("/api/content", json={
            "content_type": "blog_post",
        })
        assert resp.status_code == 422

    async def test_content_type_required(self, client: AsyncClient):
        resp = await client.post("/api/content", json={
            "title": "Missing Type",
        })
        assert resp.status_code == 422

    async def test_invalid_content_type(self, client: AsyncClient):
        resp = await client.post("/api/content", json={
            "title": "Bad Type",
            "content_type": "invalid_type",
        })
        assert resp.status_code == 422

    async def test_empty_title_rejected(self, client: AsyncClient):
        resp = await client.post("/api/content", json={
            "title": "",
            "content_type": "blog_post",
        })
        assert resp.status_code == 422

    async def test_default_language_is_portuguese(self, client: AsyncClient):
        resp = await client.post("/api/content", json={
            "title": "Defaults", "content_type": "blog_post",
        })
        assert resp.status_code == 201
        assert resp.json()["language"] == "pt"
