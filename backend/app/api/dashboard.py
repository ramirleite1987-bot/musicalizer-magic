from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary():
    """Get dashboard summary with content counts by status. Stub endpoint."""
    return {"status": "not_implemented", "counts": {}}


@router.get("/recent")
async def get_recent_activity():
    """Get recent content activity. Stub endpoint."""
    return {"status": "not_implemented", "items": []}
