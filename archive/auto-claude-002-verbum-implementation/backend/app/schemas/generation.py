from typing import Optional

from pydantic import BaseModel, Field

from app.models.content import ContentType


class GenerationRequest(BaseModel):
    model: str = Field(..., description="AI model key, e.g. 'claude' or 'openai'")
    prompt: str = Field(..., min_length=1)
    content_type: ContentType
    system_prompt: Optional[str] = None
    max_tokens: int = Field(default=2048, ge=1, le=16384)


class GenerationResponse(BaseModel):
    text: str
    model: str
    tokens_used: Optional[int] = None


class StreamChunk(BaseModel):
    text: Optional[str] = None
    done: bool = False


class ModelInfo(BaseModel):
    key: str
    name: str
    available: bool


class ModelsResponse(BaseModel):
    models: list[ModelInfo]
