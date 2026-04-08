from __future__ import annotations

import logging
from typing import AsyncIterator

from anthropic import APIError, AsyncAnthropic, RateLimitError

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Default model — can be overridden via ANTHROPIC_MODEL env var or constructor
DEFAULT_MODEL = "claude-sonnet-4-20250514"


class ClaudeProvider:
    """Anthropic Claude AI provider with streaming support."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
    ) -> None:
        settings = get_settings()
        resolved_key = api_key or settings.anthropic_api_key
        if not resolved_key:
            raise ValueError(
                "Anthropic API key is required. Set ANTHROPIC_API_KEY in your environment."
            )
        self._client = AsyncAnthropic(api_key=resolved_key)
        self._model = model or DEFAULT_MODEL

    async def generate(
        self, prompt: str, system_prompt: str, max_tokens: int
    ) -> str:
        try:
            message = await self._client.messages.create(
                model=self._model,
                max_tokens=max_tokens,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}],
            )
            return message.content[0].text
        except RateLimitError:
            logger.warning("Claude rate limit hit, raising to caller")
            raise
        except APIError as exc:
            logger.error("Claude API error: %s", exc)
            raise

    async def generate_stream(
        self, prompt: str, system_prompt: str, max_tokens: int
    ) -> AsyncIterator[str]:
        try:
            async with self._client.messages.stream(
                model=self._model,
                max_tokens=max_tokens,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}],
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except RateLimitError:
            logger.warning("Claude rate limit hit during stream, raising to caller")
            raise
        except APIError as exc:
            logger.error("Claude API error during stream: %s", exc)
            raise
