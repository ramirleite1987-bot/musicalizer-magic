from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel


class ValidationRecord(SQLModel, table=True):
    __tablename__ = "validation_records"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    content_id: str = Field(foreign_key="content_items.id", index=True)
    score: float  # 0.0 to 1.0
    flags: str = "[]"  # JSON list of flag strings
    citations: str = "[]"  # JSON list of citation objects
    provider: str  # "notebooklm" or "ai_fallback"
    raw_answer: str = ""
    content_version: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
