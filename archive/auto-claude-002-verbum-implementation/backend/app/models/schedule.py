from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, SQLModel


class ScheduleStatus(str, Enum):
    PENDING = "pending"
    PUBLISHED = "published"
    CANCELLED = "cancelled"


class ScheduleEntry(SQLModel, table=True):
    __tablename__ = "schedule_entries"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    content_id: str = Field(foreign_key="content_items.id", index=True)
    scheduled_date: datetime
    channel: str  # e.g. "youtube", "blog"
    status: ScheduleStatus = ScheduleStatus.PENDING
    reminder_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
