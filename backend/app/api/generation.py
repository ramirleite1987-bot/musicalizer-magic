from fastapi import APIRouter

router = APIRouter()


@router.post("/generate")
async def generate_content():
    """Generate content using AI. Stub endpoint."""
    return {"status": "not_implemented", "message": "AI generation endpoint"}


@router.post("/generate/stream")
async def generate_content_stream():
    """Generate content using AI with SSE streaming. Stub endpoint."""
    return {"status": "not_implemented", "message": "AI streaming generation endpoint"}
