import json
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.core.deps import AIServiceDep
from app.schemas.generation import (
    GenerationRequest,
    GenerationResponse,
    ModelInfo,
    ModelsResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

DEFAULT_SYSTEM_PROMPT = (
    "Você é um assistente católico especializado em criar conteúdo "
    "fiel à doutrina da Igreja Católica, em português brasileiro."
)


@router.post("/generate", response_model=GenerationResponse)
async def generate_content(request: GenerationRequest, ai_service: AIServiceDep):
    """Generate content using AI (full response)."""
    system_prompt = request.system_prompt or DEFAULT_SYSTEM_PROMPT
    try:
        text = await ai_service.generate(
            model_key=request.model,
            prompt=request.prompt,
            system_prompt=system_prompt,
            max_tokens=request.max_tokens,
        )
        return GenerationResponse(text=text, model=request.model)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Generation failed: %s", exc)
        raise HTTPException(status_code=502, detail="AI generation failed")


@router.post("/stream")
async def generate_content_stream(
    request: GenerationRequest, ai_service: AIServiceDep
):
    """Generate content using AI with SSE streaming."""
    system_prompt = request.system_prompt or DEFAULT_SYSTEM_PROMPT

    try:
        ai_service.get_provider(request.model)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    async def event_generator():
        try:
            async for chunk in ai_service.generate_stream(
                model_key=request.model,
                prompt=request.prompt,
                system_prompt=system_prompt,
                max_tokens=request.max_tokens,
            ):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as exc:
            logger.error("Stream generation failed: %s", exc)
            yield f"data: {json.dumps({'error': str(exc), 'done': True})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/models", response_model=ModelsResponse)
async def list_models(ai_service: AIServiceDep):
    """List available AI models and their status."""
    model_names = {"claude": "Anthropic Claude", "openai": "OpenAI ChatGPT"}
    available = ai_service.available_models
    models = [
        ModelInfo(
            key=key,
            name=model_names.get(key, key),
            available=key in available,
        )
        for key in ["claude", "openai"]
    ]
    return ModelsResponse(models=models)
