from __future__ import annotations

import json
import logging
import re

from anthropic import AsyncAnthropic

from app.core.config import get_settings
from app.services.validation_service import Citation, ValidationResult

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
Você é um teólogo católico especialista em doutrina e magistério da Igreja Católica. \
Sua tarefa é analisar conteúdo católico quanto à precisão doutrinária, identificando \
quaisquer erros, imprecisões ou afirmações que contradizem o ensinamento oficial da \
Igreja conforme expresso no Catecismo da Igreja Católica, documentos do Concílio \
Vaticano II, encíclicas papais e outros documentos do Magistério.

Responda SEMPRE em JSON válido com a seguinte estrutura:
{
  "score": <número de 0 a 100 indicando precisão doutrinária>,
  "flags": [<lista de strings descrevendo problemas encontrados, vazia se nenhum>],
  "citations": [
    {
      "source": "<documento de referência, ex: CIC 1234, Lumen Gentium 12>",
      "text": "<trecho relevante da fonte>"
    }
  ],
  "analysis": "<breve análise geral do conteúdo>"
}

Seja rigoroso mas justo. Conteúdo opinativo ou devocional que não contradiz a doutrina \
deve receber pontuação alta. Apenas sinalize erros claros ou imprecisões significativas.\
"""

_USER_PROMPT_TEMPLATE = (
    "Analise o seguinte conteúdo católico (tipo: {content_type}) quanto à "
    "precisão doutrinária. Responda em JSON conforme instruído.\n\n"
    "---\n{content}\n---"
)

_DEFAULT_MODEL = "claude-sonnet-4-20250514"


class FallbackValidationProvider:
    """AI-based fallback validation provider using Claude.

    Used when the primary NotebookLM provider is unavailable.
    Always returns ``provider='ai_fallback'`` to indicate the result
    is from a non-authoritative source.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
    ) -> None:
        settings = get_settings()
        self._api_key = api_key or settings.anthropic_api_key
        self._model = model or _DEFAULT_MODEL
        self._client: AsyncAnthropic | None = None

    def _get_client(self) -> AsyncAnthropic:
        if self._client is None:
            if not self._api_key:
                raise ValueError(
                    "Anthropic API key is required for fallback validation. "
                    "Set ANTHROPIC_API_KEY in your environment."
                )
            self._client = AsyncAnthropic(api_key=self._api_key)
        return self._client

    async def is_available(self) -> bool:
        """The fallback provider is available whenever an API key is configured."""
        return bool(self._api_key)

    async def validate(
        self, content: str, content_type: str
    ) -> ValidationResult:
        """Validate content using Claude as a theological expert."""
        client = self._get_client()

        user_prompt = _USER_PROMPT_TEMPLATE.format(
            content_type=content_type,
            content=content,
        )

        try:
            message = await client.messages.create(
                model=self._model,
                max_tokens=2048,
                system=_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
            raw_answer = message.content[0].text
        except Exception as exc:
            logger.error("Fallback validation AI call failed: %s", exc)
            raise

        return self._parse_response(raw_answer)

    def _parse_response(self, raw_answer: str) -> ValidationResult:
        """Parse the JSON response from Claude into a ValidationResult."""
        try:
            # Extract JSON from response (may be wrapped in markdown code block)
            json_match = re.search(r"\{[\s\S]*\}", raw_answer)
            if not json_match:
                raise ValueError("No JSON object found in response")
            data = json.loads(json_match.group())
        except (json.JSONDecodeError, ValueError):
            logger.warning("Failed to parse fallback validation JSON, using defaults")
            return ValidationResult(
                score=0.5,
                flags=["Não foi possível analisar a resposta da validação"],
                citations=[],
                provider="ai_fallback",
                raw_answer=raw_answer,
            )

        score_raw = data.get("score", 50)
        score = max(0.0, min(1.0, float(score_raw) / 100.0))

        flags = [str(f) for f in data.get("flags", [])]

        citations: list[Citation] = []
        for idx, cit in enumerate(data.get("citations", []), start=1):
            citations.append(
                Citation(
                    citation_number=idx,
                    source_id=str(cit.get("source", "")),
                    cited_text=str(cit.get("text", "")),
                )
            )

        return ValidationResult(
            score=score,
            flags=flags,
            citations=citations,
            provider="ai_fallback",
            raw_answer=raw_answer,
        )
