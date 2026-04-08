from __future__ import annotations

import logging
from typing import AsyncIterator

from openai import APIError, AsyncOpenAI, RateLimitError

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Default model — can be overridden via OPENAI_MODEL env var or constructor
DEFAULT_MODEL = "gpt-4o"

# Content type system prompt templates
CONTENT_TEMPLATES: dict[str, str] = {
    "short_video": (
        "Você é um roteirista católico especializado em vídeos curtos para redes sociais. "
        "Escreva um roteiro de vídeo curto (1 minuto) em português brasileiro, com 150 a 200 palavras. "
        "O roteiro deve ser envolvente, direto e fiel à doutrina católica. "
        "Inclua uma abertura que capture a atenção, o conteúdo principal com uma mensagem clara, "
        "e um encerramento com chamada à ação. "
        "Use linguagem acessível e tom pastoral. "
        "Não invente citações bíblicas — use apenas referências reais. "
        "Formate o roteiro com indicações de cena quando apropriado."
    ),
    "long_video": (
        "Você é um roteirista católico especializado em vídeos longos para YouTube. "
        "Escreva um roteiro completo de vídeo longo (10 minutos) em português brasileiro, "
        "com 1500 a 2000 palavras. "
        "O roteiro deve ser bem estruturado com introdução, desenvolvimento e conclusão. "
        "Inclua: gancho inicial para reter o espectador, contextualização histórica ou teológica, "
        "desenvolvimento do tema com referências ao Catecismo da Igreja Católica, "
        "citações bíblicas reais e relevantes, exemplos práticos para a vida do fiel, "
        "e uma conclusão com reflexão e chamada à ação. "
        "Use linguagem acessível mas com profundidade teológica. "
        "Formate com seções claras e indicações de tempo aproximado para cada parte. "
        "Mantenha fidelidade absoluta à doutrina católica e ao Magistério da Igreja."
    ),
    "blog_post": (
        "Você é um redator católico especializado em artigos otimizados para SEO em português brasileiro. "
        "Escreva um artigo de blog completo, otimizado para mecanismos de busca, em português brasileiro. "
        "O artigo deve incluir: título SEO-friendly (até 60 caracteres), "
        "meta descrição (até 155 caracteres), "
        "estrutura com H2 e H3 para escaneabilidade, "
        "introdução com a palavra-chave principal no primeiro parágrafo, "
        "desenvolvimento com subtópicos relevantes e interligados, "
        "citações do Catecismo, documentos do Magistério e Sagrada Escritura, "
        "conclusão com resumo e chamada à ação. "
        "Use parágrafos curtos (3-4 frases), listas quando apropriado, "
        "e linguagem natural que incorpore variações da palavra-chave. "
        "Mantenha fidelidade absoluta à doutrina católica. "
        "O tom deve ser acolhedor, pastoral e acessível."
    ),
}


def get_system_prompt(content_type: str) -> str:
    """Return the system prompt template for a given content type."""
    return CONTENT_TEMPLATES.get(content_type, CONTENT_TEMPLATES["short_video"])


class OpenAIProvider:
    """OpenAI ChatGPT AI provider with streaming support."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
    ) -> None:
        settings = get_settings()
        resolved_key = api_key or settings.openai_api_key
        if not resolved_key:
            raise ValueError(
                "OpenAI API key is required. Set OPENAI_API_KEY in your environment."
            )
        self._client = AsyncOpenAI(api_key=resolved_key)
        self._model = model or DEFAULT_MODEL

    async def generate(
        self, prompt: str, system_prompt: str, max_tokens: int
    ) -> str:
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                max_tokens=max_tokens,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
            )
            return response.choices[0].message.content or ""
        except RateLimitError:
            logger.warning("OpenAI rate limit hit, raising to caller")
            raise
        except APIError as exc:
            logger.error("OpenAI API error: %s", exc)
            raise

    async def generate_stream(
        self, prompt: str, system_prompt: str, max_tokens: int
    ) -> AsyncIterator[str]:
        try:
            stream = await self._client.chat.completions.create(
                model=self._model,
                max_tokens=max_tokens,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except RateLimitError:
            logger.warning("OpenAI rate limit hit during stream, raising to caller")
            raise
        except APIError as exc:
            logger.error("OpenAI API error during stream: %s", exc)
            raise
