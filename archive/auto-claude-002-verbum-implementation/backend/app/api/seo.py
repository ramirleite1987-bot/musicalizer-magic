import json
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.deps import AIServiceDep, SessionDep
from app.services.seo_service import SEOService

router = APIRouter()


class SEOMetadataResponse(BaseModel):
    id: str
    content_id: str
    meta_title: str
    meta_description: str
    keywords: list[str]
    slug: str
    readability_score: Optional[float]


class SEOMetadataUpdate(BaseModel):
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    keywords: Optional[list[str]] = None
    slug: Optional[str] = None


def _to_response(metadata) -> SEOMetadataResponse:
    return SEOMetadataResponse(
        id=metadata.id,
        content_id=metadata.content_id,
        meta_title=metadata.meta_title,
        meta_description=metadata.meta_description,
        keywords=json.loads(metadata.keywords),
        slug=metadata.slug,
        readability_score=metadata.readability_score,
    )


@router.get("/{content_id}", response_model=SEOMetadataResponse)
async def get_seo_metadata(content_id: str, session: SessionDep):
    """Get SEO metadata for content."""
    service = SEOService(session)
    metadata = await service.get_metadata(content_id)
    if metadata is None:
        raise HTTPException(status_code=404, detail="SEO metadata not found")
    return _to_response(metadata)


@router.put("/{content_id}", response_model=SEOMetadataResponse)
async def update_seo_metadata(
    content_id: str, data: SEOMetadataUpdate, session: SessionDep
):
    """Update SEO metadata for content."""
    service = SEOService(session)
    metadata = await service.upsert_metadata(
        content_id=content_id,
        meta_title=data.meta_title,
        meta_description=data.meta_description,
        keywords=data.keywords,
        slug=data.slug,
    )
    return _to_response(metadata)


@router.post("/{content_id}/analyze")
async def analyze_seo(content_id: str, session: SessionDep):
    """Analyze SEO readability for content."""
    service = SEOService(session)
    try:
        result = await service.analyze(content_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return result


@router.post("/{content_id}/keywords")
async def suggest_keywords(
    content_id: str, session: SessionDep, ai_service: AIServiceDep
):
    """Suggest SEO keywords for content using AI."""
    service = SEOService(session, ai_service=ai_service)
    try:
        keywords = await service.suggest_keywords(content_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"content_id": content_id, "keywords": keywords}
