import json
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.core.deps import SessionDep
from app.models.content import ContentStatus, ContentType
from app.schemas.content import (
    ContentCreate,
    ContentListParams,
    ContentListResponse,
    ContentResponse,
    ContentUpdate,
    ContentVersionResponse,
    StatusTransition,
)
from app.services.content_service import ContentService

router = APIRouter()


def _to_response(item) -> ContentResponse:
    return ContentResponse(
        id=item.id,
        title=item.title,
        body=item.body,
        content_type=item.content_type,
        status=item.status,
        language=item.language,
        channels=json.loads(item.channels),
        ai_model_used=item.ai_model_used,
        scheduled_date=item.scheduled_date,
        created_at=item.created_at,
        updated_at=item.updated_at,
        version=item.version,
    )


@router.get("", response_model=ContentListResponse)
async def list_content(
    session: SessionDep,
    status: Optional[ContentStatus] = Query(None),
    content_type: Optional[ContentType] = Query(None),
    channel: Optional[str] = Query(None),
):
    service = ContentService(session)
    params = ContentListParams(status=status, content_type=content_type, channel=channel)
    items, total = await service.list(params)
    return ContentListResponse(
        items=[_to_response(item) for item in items],
        total=total,
    )


@router.post("", response_model=ContentResponse, status_code=201)
async def create_content(data: ContentCreate, session: SessionDep):
    service = ContentService(session)
    item = await service.create(data)
    return _to_response(item)


@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(content_id: str, session: SessionDep):
    service = ContentService(session)
    item = await service.get(content_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Content item not found")
    return _to_response(item)


@router.put("/{content_id}", response_model=ContentResponse)
async def update_content(content_id: str, data: ContentUpdate, session: SessionDep):
    service = ContentService(session)
    item = await service.update(content_id, data)
    if item is None:
        raise HTTPException(status_code=404, detail="Content item not found")
    return _to_response(item)


@router.delete("/{content_id}", status_code=204)
async def delete_content(content_id: str, session: SessionDep):
    service = ContentService(session)
    deleted = await service.delete(content_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Content item not found")


@router.get("/{content_id}/versions", response_model=list[ContentVersionResponse])
async def get_versions(content_id: str, session: SessionDep):
    service = ContentService(session)
    item = await service.get(content_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Content item not found")
    versions = await service.get_versions(content_id)
    return versions


@router.post("/{content_id}/status", response_model=ContentResponse)
async def transition_status(
    content_id: str, data: StatusTransition, session: SessionDep
):
    service = ContentService(session)
    try:
        item = await service.transition_status(content_id, data.new_status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _to_response(item)
