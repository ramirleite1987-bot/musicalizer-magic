from __future__ import annotations

from typing import AsyncIterator, Protocol, runtime_checkable


@runtime_checkable
class AIProvider(Protocol):
    """Protocol for AI content generation providers."""

    async def generate(
        self, prompt: str, system_prompt: str, max_tokens: int
    ) -> str: ...

    async def generate_stream(
        self, prompt: str, system_prompt: str, max_tokens: int
    ) -> AsyncIterator[str]: ...


class AIService:
    """Abstraction layer that routes generation requests to registered providers."""

    def __init__(self, providers: dict[str, AIProvider]) -> None:
        self._providers = providers

    @property
    def available_models(self) -> list[str]:
        return list(self._providers.keys())

    def get_provider(self, model_key: str) -> AIProvider:
        provider = self._providers.get(model_key)
        if provider is None:
            raise ValueError(
                f"Unknown model '{model_key}'. "
                f"Available models: {self.available_models}"
            )
        return provider

    async def generate(
        self,
        model_key: str,
        prompt: str,
        system_prompt: str,
        max_tokens: int = 2048,
    ) -> str:
        provider = self.get_provider(model_key)
        return await provider.generate(prompt, system_prompt, max_tokens)

    async def generate_stream(
        self,
        model_key: str,
        prompt: str,
        system_prompt: str,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        provider = self.get_provider(model_key)
        async for chunk in provider.generate_stream(prompt, system_prompt, max_tokens):
            yield chunk
