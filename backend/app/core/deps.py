import logging
from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_session
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

SessionDep = Annotated[AsyncSession, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


@lru_cache
def get_ai_service() -> AIService:
    """Create and cache the AIService with available providers."""
    settings = get_settings()
    providers: dict = {}

    if settings.anthropic_api_key:
        try:
            from app.services.claude_provider import ClaudeProvider

            providers["claude"] = ClaudeProvider(api_key=settings.anthropic_api_key)
            logger.info("Claude provider registered")
        except Exception as exc:
            logger.warning("Failed to initialize Claude provider: %s", exc)

    if settings.openai_api_key:
        try:
            from app.services.openai_provider import OpenAIProvider

            providers["openai"] = OpenAIProvider(api_key=settings.openai_api_key)
            logger.info("OpenAI provider registered")
        except Exception as exc:
            logger.warning("Failed to initialize OpenAI provider: %s", exc)

    return AIService(providers=providers)


AIServiceDep = Annotated[AIService, Depends(get_ai_service)]
