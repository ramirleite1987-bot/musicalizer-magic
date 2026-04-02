import logging
from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_session
from app.services.ai_service import AIService
from app.services.validation_service import ValidationService

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


@lru_cache
def get_validation_service() -> ValidationService:
    """Create and cache the ValidationService with primary and fallback providers."""
    settings = get_settings()

    # Primary provider: NotebookLM
    try:
        from app.services.notebooklm_provider import NotebookLMProvider

        primary = NotebookLMProvider(api_key=getattr(settings, "notebooklm_api_key", "") or "")
        logger.info("NotebookLM validation provider registered")
    except Exception as exc:
        logger.warning("Failed to initialize NotebookLM provider: %s", exc)
        primary = None

    # Fallback provider: AI-based validation
    try:
        from app.services.fallback_validation_provider import FallbackValidationProvider

        fallback = FallbackValidationProvider()
        logger.info("Fallback validation provider registered")
    except Exception as exc:
        logger.warning("Failed to initialize fallback validation provider: %s", exc)
        fallback = None

    if primary is None and fallback is None:
        raise RuntimeError("No validation providers available")

    # If primary is missing, use fallback as both
    if primary is None:
        primary = fallback
    if fallback is None:
        fallback = primary

    return ValidationService(primary=primary, fallback=fallback)


ValidationServiceDep = Annotated[ValidationService, Depends(get_validation_service)]
