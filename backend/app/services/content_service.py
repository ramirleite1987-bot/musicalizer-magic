from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.content import ContentItem, ContentStatus, ContentType, ContentVersion
from app.schemas.content import ContentCreate, ContentListParams, ContentUpdate


# Valid status transitions: draft→validated→scheduled→published
VALID_TRANSITIONS: dict[ContentStatus, list[ContentStatus]] = {
    ContentStatus.DRAFT: [ContentStatus.VALIDATED],
    ContentStatus.VALIDATED: [ContentStatus.SCHEDULED, ContentStatus.DRAFT],
    ContentStatus.SCHEDULED: [ContentStatus.PUBLISHED, ContentStatus.VALIDATED],
    ContentStatus.PUBLISHED: [],
}


class ContentService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: ContentCreate) -> ContentItem:
        item = ContentItem(
            title=data.title,
            body=data.body,
            content_type=data.content_type,
            language=data.language,
            channels=json.dumps(data.channels),
            ai_model_used=data.ai_model_used,
        )
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def get(self, content_id: str) -> Optional[ContentItem]:
        return await self.session.get(ContentItem, content_id)

    async def list(self, params: ContentListParams) -> tuple[list[ContentItem], int]:
        statement = select(ContentItem)

        if params.status is not None:
            statement = statement.where(ContentItem.status == params.status)
        if params.content_type is not None:
            statement = statement.where(ContentItem.content_type == params.content_type)
        if params.channel is not None:
            statement = statement.where(ContentItem.channels.contains(params.channel))

        statement = statement.order_by(ContentItem.updated_at.desc())

        result = await self.session.exec(statement)
        items = list(result.all())
        return items, len(items)

    async def update(self, content_id: str, data: ContentUpdate) -> Optional[ContentItem]:
        item = await self.get(content_id)
        if item is None:
            return None

        # Create version snapshot before updating
        await self._create_version_snapshot(item)

        if data.title is not None:
            item.title = data.title
        if data.body is not None:
            item.body = data.body
        if data.channels is not None:
            item.channels = json.dumps(data.channels)
        if data.ai_model_used is not None:
            item.ai_model_used = data.ai_model_used

        item.version += 1
        item.updated_at = datetime.now(timezone.utc)

        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def delete(self, content_id: str) -> bool:
        item = await self.get(content_id)
        if item is None:
            return False
        await self.session.delete(item)
        await self.session.commit()
        return True

    async def transition_status(
        self, content_id: str, new_status: ContentStatus
    ) -> ContentItem:
        item = await self.get(content_id)
        if item is None:
            raise ValueError(f"Content item '{content_id}' not found")

        allowed = VALID_TRANSITIONS.get(item.status, [])
        if new_status not in allowed:
            raise ValueError(
                f"Invalid status transition from '{item.status.value}' to '{new_status.value}'. "
                f"Allowed transitions: {[s.value for s in allowed]}"
            )

        item.status = new_status
        item.updated_at = datetime.now(timezone.utc)

        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def get_versions(self, content_id: str) -> list[ContentVersion]:
        statement = (
            select(ContentVersion)
            .where(ContentVersion.content_id == content_id)
            .order_by(ContentVersion.version_number.desc())
        )
        result = await self.session.exec(statement)
        return list(result.all())

    async def _create_version_snapshot(self, item: ContentItem) -> ContentVersion:
        version = ContentVersion(
            content_id=item.id,
            version_number=item.version,
            title=item.title,
            body=item.body,
            ai_model_used=item.ai_model_used,
        )
        self.session.add(version)
        return version
