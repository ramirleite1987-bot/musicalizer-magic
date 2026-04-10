from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from app.core.deps import SessionDep
from app.services.schedule_service import ScheduleService

router = APIRouter()


@router.get("/calendar")
async def get_calendar(
    session: SessionDep,
    start: datetime = Query(..., description="Start date for calendar range"),
    end: datetime = Query(..., description="End date for calendar range"),
    channel: Optional[str] = Query(None, description="Filter by channel"),
):
    """Get scheduled items for a date range."""
    service = ScheduleService(session)
    entries = await service.get_calendar(start, end, channel)
    return {"items": [_entry_to_dict(e) for e in entries]}


@router.post("/{content_id}/schedule")
async def schedule_content(
    content_id: str,
    session: SessionDep,
    scheduled_date: datetime = Query(..., description="Date to schedule"),
    channel: str = Query(..., description="Publishing channel"),
):
    """Schedule a content item for publishing."""
    service = ScheduleService(session)
    try:
        entry = await service.schedule(content_id, scheduled_date, channel)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _entry_to_dict(entry)


@router.put("/{content_id}/reschedule")
async def reschedule_content(
    content_id: str,
    session: SessionDep,
    new_date: datetime = Query(..., description="New scheduled date"),
    channel: Optional[str] = Query(None, description="New channel (optional)"),
):
    """Reschedule a content item."""
    service = ScheduleService(session)
    try:
        entry = await service.reschedule(content_id, new_date, channel)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _entry_to_dict(entry)


@router.get("/export/ical")
async def export_ical(
    session: SessionDep,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
):
    """Export editorial calendar as iCal (.ics) file."""
    service = ScheduleService(session)
    ical_data = await service.export_ical(start, end)
    return Response(
        content=ical_data,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=verbum-calendar.ics"},
    )


def _entry_to_dict(entry) -> dict:
    return {
        "id": entry.id,
        "content_id": entry.content_id,
        "scheduled_date": entry.scheduled_date.isoformat(),
        "channel": entry.channel,
        "status": entry.status,
        "reminder_sent": entry.reminder_sent,
        "created_at": entry.created_at.isoformat(),
        "updated_at": entry.updated_at.isoformat(),
    }
