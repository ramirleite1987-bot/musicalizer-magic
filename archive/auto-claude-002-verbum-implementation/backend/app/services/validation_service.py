from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Protocol, runtime_checkable

logger = logging.getLogger(__name__)


@dataclass
class Citation:
    """A single citation from a validation source."""

    citation_number: int
    source_id: str
    cited_text: str


@dataclass
class ValidationResult:
    """Structured result from a validation provider."""

    score: float  # 0.0 to 1.0
    flags: list[str] = field(default_factory=list)
    citations: list[Citation] = field(default_factory=list)
    provider: str = ""  # "notebooklm" or "ai_fallback"
    raw_answer: str = ""


@runtime_checkable
class ValidationProvider(Protocol):
    """Protocol for theological validation providers."""

    async def validate(self, content: str, content_type: str) -> ValidationResult: ...

    async def is_available(self) -> bool: ...


class ValidationService:
    """Validation abstraction layer with primary→fallback failover logic."""

    def __init__(
        self, primary: ValidationProvider, fallback: ValidationProvider
    ) -> None:
        self._primary = primary
        self._fallback = fallback

    async def validate(
        self, content: str, content_type: str
    ) -> ValidationResult:
        if await self._primary.is_available():
            try:
                return await self._primary.validate(content, content_type)
            except Exception:
                logger.warning(
                    "Primary validation provider failed, falling back",
                    exc_info=True,
                )
        return await self._fallback.validate(content, content_type)
