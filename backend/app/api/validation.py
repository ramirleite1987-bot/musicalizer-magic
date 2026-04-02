import json
import logging
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.core.deps import SessionDep, ValidationServiceDep
from app.models.content import ContentItem, ContentStatus, ContentVersion
from app.models.validation import ValidationRecord
from app.schemas.validation import (
    CitationResponse,
    ValidationHistoryResponse,
    ValidationResponse,
    ValidationStatusResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _record_to_response(record: ValidationRecord) -> ValidationResponse:
    """Convert a ValidationRecord to a ValidationResponse."""
    return ValidationResponse(
        id=record.id,
        content_id=record.content_id,
        score=record.score,
        flags=json.loads(record.flags),
        citations=[
            CitationResponse(**c) for c in json.loads(record.citations)
        ],
        provider=record.provider,
        raw_answer=record.raw_answer,
        content_version=record.content_version,
        created_at=record.created_at,
    )


@router.post("/validate/{content_id}", response_model=ValidationResponse)
async def validate_content(
    content_id: str,
    session: SessionDep,
    validation_service: ValidationServiceDep,
):
    """Trigger theological validation for content. Creates a version snapshot before validating."""
    item = await session.get(ContentItem, content_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")

    # Create version snapshot before validation
    snapshot = ContentVersion(
        id=str(uuid4()),
        content_id=item.id,
        version_number=item.version,
        title=item.title,
        body=item.body,
        ai_model_used=item.ai_model_used or "",
    )
    session.add(snapshot)

    # Run validation
    result = await validation_service.validate(item.body, item.content_type.value)

    # Persist validation record
    record = ValidationRecord(
        content_id=content_id,
        score=result.score,
        flags=json.dumps(result.flags),
        citations=json.dumps(
            [
                {
                    "citation_number": c.citation_number,
                    "source_id": c.source_id,
                    "cited_text": c.cited_text,
                }
                for c in result.citations
            ]
        ),
        provider=result.provider,
        raw_answer=result.raw_answer,
        content_version=item.version,
    )
    session.add(record)

    # Update content status to validated
    item.status = ContentStatus.VALIDATED
    session.add(item)

    await session.commit()
    await session.refresh(record)

    return _record_to_response(record)


@router.get("/history/{content_id}", response_model=ValidationHistoryResponse)
async def get_validation_history(content_id: str, session: SessionDep):
    """Get validation history for content."""
    item = await session.get(ContentItem, content_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")

    stmt = (
        select(ValidationRecord)
        .where(ValidationRecord.content_id == content_id)
        .order_by(ValidationRecord.created_at.desc())
    )
    results = await session.exec(stmt)
    records = results.all()

    return ValidationHistoryResponse(
        items=[_record_to_response(r) for r in records],
        total=len(records),
    )


@router.get("/status", response_model=ValidationStatusResponse)
async def get_validation_status(validation_service: ValidationServiceDep):
    """Check validation service availability."""
    primary_available = await validation_service._primary.is_available()
    return ValidationStatusResponse(
        primary_available=primary_available,
        primary_provider=type(validation_service._primary).__name__,
        fallback_provider=type(validation_service._fallback).__name__,
    )
