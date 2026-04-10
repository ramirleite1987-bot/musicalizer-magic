from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel


class ContentType(str, Enum):
    SHORT_VIDEO = "short_video"
    LONG_VIDEO = "long_video"
    BLOG_POST = "blog_post"


class ContentStatus(str, Enum):
    DRAFT = "draft"
    VALIDATED = "validated"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"


class ContentItem(SQLModel, table=True):
    __tablename__ = "content_items"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    title: str
    body: str = ""
    content_type: ContentType
    status: ContentStatus = ContentStatus.DRAFT
    language: str = "pt"
    channels: str = "[]"  # JSON list of channel strings, e.g. '["youtube", "blog"]'
    ai_model_used: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version: int = 1


class ContentVersion(SQLModel, table=True):
    __tablename__ = "content_versions"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    content_id: str = Field(foreign_key="content_items.id", index=True)
    version_number: int
    title: str
    body: str = ""
    ai_model_used: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SEOMetadata(SQLModel, table=True):
    __tablename__ = "seo_metadata"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    content_id: str = Field(foreign_key="content_items.id", unique=True, index=True)
    meta_title: str = ""
    meta_description: str = ""
    keywords: str = "[]"  # JSON list of keyword strings
    slug: str = ""
    readability_score: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
