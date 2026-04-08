from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CitationResponse(BaseModel):
    citation_number: int
    source_id: str
    cited_text: str


class ValidationResponse(BaseModel):
    id: str
    content_id: str
    score: float = Field(..., ge=0.0, le=1.0)
    flags: list[str]
    citations: list[CitationResponse]
    provider: str
    raw_answer: str
    content_version: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ValidationHistoryResponse(BaseModel):
    items: list[ValidationResponse]
    total: int


class ValidationStatusResponse(BaseModel):
    primary_available: bool
    primary_provider: str
    fallback_provider: str
