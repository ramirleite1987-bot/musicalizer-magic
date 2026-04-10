from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.content import ContentStatus, ContentType


class ContentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    body: str = ""
    content_type: ContentType
    language: str = "pt"
    channels: list[str] = Field(default_factory=list)
    ai_model_used: Optional[str] = None


class ContentUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    body: Optional[str] = None
    channels: Optional[list[str]] = None
    ai_model_used: Optional[str] = None


class StatusTransition(BaseModel):
    new_status: ContentStatus


class ContentResponse(BaseModel):
    id: str
    title: str
    body: str
    content_type: ContentType
    status: ContentStatus
    language: str
    channels: list[str]
    ai_model_used: Optional[str]
    scheduled_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    version: int

    model_config = {"from_attributes": True}


class ContentListResponse(BaseModel):
    items: list[ContentResponse]
    total: int


class ContentVersionResponse(BaseModel):
    id: str
    content_id: str
    version_number: int
    title: str
    body: str
    ai_model_used: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ContentListParams(BaseModel):
    status: Optional[ContentStatus] = None
    content_type: Optional[ContentType] = None
    channel: Optional[str] = None
