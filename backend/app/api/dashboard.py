from datetime import datetime, timedelta

from fastapi import APIRouter
from sqlmodel import func, select

from app.core.deps import SessionDep
from app.models.content import ContentItem, ContentStatus, ContentType
from app.models.schedule import ScheduleEntry, ScheduleStatus

router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary(session: SessionDep):
    """Get dashboard summary with pipeline counts per status, recent items, and total counts by type."""
    # Counts per status
    status_counts: dict[str, int] = {}
    for status in ContentStatus:
        stmt = select(func.count()).where(ContentItem.status == status)
        result = await session.exec(stmt)
        status_counts[status.value] = result.one()

    # Total counts by content type
    type_counts: dict[str, int] = {}
    for content_type in ContentType:
        stmt = select(func.count()).where(ContentItem.content_type == content_type)
        result = await session.exec(stmt)
        type_counts[content_type.value] = result.one()

    # Recent items (last 10)
    stmt = select(ContentItem).order_by(ContentItem.updated_at.desc()).limit(10)
    result = await session.exec(stmt)
    recent_items = [
        {
            "id": item.id,
            "title": item.title,
            "content_type": item.content_type.value,
            "status": item.status.value,
            "updated_at": item.updated_at.isoformat(),
        }
        for item in result.all()
    ]

    return {
        "status_counts": status_counts,
        "type_counts": type_counts,
        "recent_items": recent_items,
        "total": sum(status_counts.values()),
    }


@router.get("/upcoming")
async def get_upcoming_content(session: SessionDep):
    """Get next 7 days of scheduled content."""
    now = datetime.utcnow()
    week_later = now + timedelta(days=7)

    stmt = (
        select(ScheduleEntry)
        .where(
            ScheduleEntry.scheduled_date >= now,
            ScheduleEntry.scheduled_date <= week_later,
            ScheduleEntry.status == ScheduleStatus.PENDING,
        )
        .order_by(ScheduleEntry.scheduled_date.asc())
    )
    result = await session.exec(stmt)
    entries = result.all()

    # Fetch associated content items
    items = []
    for entry in entries:
        content = await session.get(ContentItem, entry.content_id)
        items.append(
            {
                "schedule_id": entry.id,
                "content_id": entry.content_id,
                "title": content.title if content else "Unknown",
                "content_type": content.content_type.value if content else None,
                "channel": entry.channel,
                "scheduled_date": entry.scheduled_date.isoformat(),
            }
        )

    return {"upcoming": items, "count": len(items)}
