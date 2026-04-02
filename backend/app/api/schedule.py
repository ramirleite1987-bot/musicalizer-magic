from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_scheduled():
    """List scheduled content items. Stub endpoint."""
    return {"status": "not_implemented", "items": []}


@router.post("/{content_id}")
async def schedule_content(content_id: str):
    """Schedule a content item for publishing. Stub endpoint."""
    return {"status": "not_implemented", "content_id": content_id}


@router.get("/calendar/export")
async def export_calendar():
    """Export editorial calendar as iCal. Stub endpoint."""
    return {"status": "not_implemented", "message": "iCal export endpoint"}
