from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.content import ContentItem, ContentStatus
from app.models.schedule import ScheduleEntry, ScheduleStatus


class ScheduleService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_calendar(
        self, start: datetime, end: datetime, channel: Optional[str] = None
    ) -> list[ScheduleEntry]:
        """Get scheduled items within a date range, optionally filtered by channel."""
        statement = select(ScheduleEntry).where(
            ScheduleEntry.scheduled_date >= start,
            ScheduleEntry.scheduled_date <= end,
            ScheduleEntry.status != ScheduleStatus.CANCELLED,
        )
        if channel:
            statement = statement.where(ScheduleEntry.channel == channel)
        statement = statement.order_by(ScheduleEntry.scheduled_date)
        result = await self.session.exec(statement)
        return list(result.all())

    async def schedule(
        self, content_id: str, scheduled_date: datetime, channel: str
    ) -> ScheduleEntry:
        """Schedule a content item for publishing on a given date and channel."""
        item = await self.session.get(ContentItem, content_id)
        if item is None:
            raise ValueError(f"Content item {content_id} not found")

        if item.status not in (ContentStatus.VALIDATED, ContentStatus.SCHEDULED):
            raise ValueError(
                f"Content must be validated before scheduling (current: {item.status})"
            )

        entry = ScheduleEntry(
            content_id=content_id,
            scheduled_date=scheduled_date,
            channel=channel,
        )
        self.session.add(entry)

        item.status = ContentStatus.SCHEDULED
        item.scheduled_date = scheduled_date
        item.updated_at = datetime.now(timezone.utc)
        self.session.add(item)

        await self.session.commit()
        await self.session.refresh(entry)
        return entry

    async def reschedule(
        self, content_id: str, new_date: datetime, channel: Optional[str] = None
    ) -> ScheduleEntry:
        """Reschedule a content item to a new date (and optionally new channel)."""
        statement = select(ScheduleEntry).where(
            ScheduleEntry.content_id == content_id,
            ScheduleEntry.status == ScheduleStatus.PENDING,
        )
        result = await self.session.exec(statement)
        entry = result.first()
        if entry is None:
            raise ValueError(
                f"No pending schedule entry found for content {content_id}"
            )

        entry.scheduled_date = new_date
        if channel:
            entry.channel = channel
        entry.updated_at = datetime.now(timezone.utc)
        self.session.add(entry)

        item = await self.session.get(ContentItem, content_id)
        if item:
            item.scheduled_date = new_date
            item.updated_at = datetime.now(timezone.utc)
            self.session.add(item)

        await self.session.commit()
        await self.session.refresh(entry)
        return entry

    async def export_ical(
        self, start: Optional[datetime] = None, end: Optional[datetime] = None
    ) -> str:
        """Export scheduled items as an iCal (.ics) string."""
        from icalendar import Calendar, Event

        statement = select(ScheduleEntry).where(
            ScheduleEntry.status != ScheduleStatus.CANCELLED
        )
        if start:
            statement = statement.where(ScheduleEntry.scheduled_date >= start)
        if end:
            statement = statement.where(ScheduleEntry.scheduled_date <= end)
        statement = statement.order_by(ScheduleEntry.scheduled_date)

        result = await self.session.exec(statement)
        entries = list(result.all())

        cal = Calendar()
        cal.add("prodid", "-//Verbum Content Calendar//EN")
        cal.add("version", "2.0")
        cal.add("calscale", "GREGORIAN")

        for entry in entries:
            item = await self.session.get(ContentItem, entry.content_id)
            title = item.title if item else f"Content {entry.content_id}"

            event = Event()
            event.add("uid", f"{entry.id}@verbum")
            event.add("dtstart", entry.scheduled_date)
            event.add("summary", f"[{entry.channel}] {title}")
            event.add("description", f"Channel: {entry.channel}\nStatus: {entry.status}")
            event.add("created", entry.created_at)
            cal.add_component(event)

        return cal.to_ical().decode("utf-8")
