from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.services.validation_service import Citation, ValidationResult

logger = logging.getLogger(__name__)

_MAX_RETRIES = 3
_BACKOFF_BASE = 1.0  # seconds


class NotebookLMProvider:
    """NotebookLM validation provider with retry logic and citation parsing."""

    def __init__(self, notebook_id: str | None = None) -> None:
        self._notebook_id = notebook_id
        self._client: Any = None

    def _get_client(self) -> Any:
        """Lazily initialise the NotebookLM client."""
        if self._client is None:
            try:
                from notebooklm import NotebookLM  # type: ignore[import-untyped]

                self._client = NotebookLM()
            except Exception:
                logger.error("Failed to initialise NotebookLM client", exc_info=True)
                raise
        return self._client

    async def is_available(self) -> bool:
        """Check whether the NotebookLM service is reachable."""
        try:
            self._get_client()
            return True
        except Exception:
            return False

    async def validate(
        self, content: str, content_type: str
    ) -> ValidationResult:
        """Validate content via NotebookLM with retry + exponential backoff."""
        prompt = (
            f"Analise o seguinte conteúdo católico ({content_type}) quanto à "
            "precisão doutrinária. Identifique quaisquer problemas teológicos "
            "e forneça citações das fontes. Responda com uma pontuação de 0 a 100 "
            "indicando a precisão doutrinária.\n\n"
            f"{content}"
        )

        last_error: Exception | None = None
        for attempt in range(_MAX_RETRIES):
            try:
                result = await self._ask(prompt)
                return self._parse_result(result)
            except Exception as exc:
                last_error = exc
                if attempt < _MAX_RETRIES - 1:
                    delay = _BACKOFF_BASE * (2 ** attempt)
                    logger.warning(
                        "NotebookLM attempt %d failed, retrying in %.1fs: %s",
                        attempt + 1,
                        delay,
                        exc,
                    )
                    await asyncio.sleep(delay)

        logger.error("NotebookLM validation failed after %d retries", _MAX_RETRIES)
        raise RuntimeError(
            f"NotebookLM validation failed after {_MAX_RETRIES} retries"
        ) from last_error

    async def _ask(self, prompt: str) -> Any:
        """Send a question to NotebookLM and return the raw AskResult."""
        client = self._get_client()
        try:
            return await asyncio.to_thread(
                client.ask, prompt, notebook_id=self._notebook_id
            )
        except Exception as exc:
            # Catch RPCError and other transport errors
            raise RuntimeError(f"NotebookLM RPC error: {exc}") from exc

    def _parse_result(self, result: Any) -> ValidationResult:
        """Parse an AskResult into a structured ValidationResult."""
        raw_answer = getattr(result, "text", str(result))
        citations = self._parse_citations(result)
        score = self._extract_score(raw_answer)
        flags = self._extract_flags(raw_answer)

        return ValidationResult(
            score=score,
            flags=flags,
            citations=citations,
            provider="notebooklm",
            raw_answer=raw_answer,
        )

    def _parse_citations(self, result: Any) -> list[Citation]:
        """Extract citations from AskResult.references."""
        references = getattr(result, "references", None) or []
        citations: list[Citation] = []
        for idx, ref in enumerate(references, start=1):
            source_id = getattr(ref, "source_id", "") or str(idx)
            cited_text = getattr(ref, "text", "") or getattr(ref, "content", "") or ""
            citations.append(
                Citation(
                    citation_number=idx,
                    source_id=source_id,
                    cited_text=cited_text,
                )
            )
        return citations

    @staticmethod
    def _extract_score(raw_answer: str) -> float:
        """Attempt to extract a numeric score (0-100) from the answer text."""
        import re

        # Look for patterns like "score: 85", "pontuação: 90", "85/100", "85%"
        patterns = [
            r"(?:score|pontuação|precisão)[:\s]*(\d{1,3})",
            r"(\d{1,3})\s*/\s*100",
            r"(\d{1,3})\s*%",
        ]
        for pattern in patterns:
            match = re.search(pattern, raw_answer, re.IGNORECASE)
            if match:
                value = int(match.group(1))
                if 0 <= value <= 100:
                    return value / 100.0
        # Default to a moderate score if parsing fails
        return 0.5

    @staticmethod
    def _extract_flags(raw_answer: str) -> list[str]:
        """Extract doctrinal flags/issues from the answer text."""
        flags: list[str] = []
        lower = raw_answer.lower()
        flag_keywords = [
            ("heresia", "Possível heresia detectada"),
            ("erro doutrinário", "Erro doutrinário identificado"),
            ("imprecisão", "Imprecisão teológica"),
            ("contradição", "Contradição com fontes oficiais"),
            ("problema", "Problema teológico identificado"),
        ]
        for keyword, flag_text in flag_keywords:
            if keyword in lower:
                flags.append(flag_text)
        return flags
