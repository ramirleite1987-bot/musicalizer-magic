from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.ai_service import AIService
from app.services.claude_provider import ClaudeProvider
from app.services.openai_provider import OpenAIProvider


class TestAIService:
    def test_available_models(self):
        providers = {"claude": MagicMock(), "openai": MagicMock()}
        service = AIService(providers)
        assert service.available_models == ["claude", "openai"]

    def test_get_provider_unknown_raises(self):
        service = AIService({})
        with pytest.raises(ValueError, match="Unknown model"):
            service.get_provider("nonexistent")

    def test_get_provider_returns_correct(self):
        mock = MagicMock()
        service = AIService({"claude": mock})
        assert service.get_provider("claude") is mock

    @pytest.mark.asyncio
    async def test_generate_delegates_to_provider(self):
        provider = MagicMock()
        provider.generate = AsyncMock(return_value="Hello world")
        service = AIService({"claude": provider})

        result = await service.generate("claude", "prompt", "system", 1024)
        assert result == "Hello world"
        provider.generate.assert_awaited_once_with("prompt", "system", 1024)

    @pytest.mark.asyncio
    async def test_generate_default_max_tokens(self):
        provider = MagicMock()
        provider.generate = AsyncMock(return_value="text")
        service = AIService({"claude": provider})

        await service.generate("claude", "p", "s")
        provider.generate.assert_awaited_once_with("p", "s", 2048)

    @pytest.mark.asyncio
    async def test_generate_stream_yields_chunks(self):
        async def mock_stream(prompt, system_prompt, max_tokens):
            for chunk in ["Hello", " ", "world"]:
                yield chunk

        provider = MagicMock()
        provider.generate_stream = mock_stream
        service = AIService({"openai": provider})

        chunks = []
        async for chunk in service.generate_stream("openai", "p", "s"):
            chunks.append(chunk)
        assert chunks == ["Hello", " ", "world"]


class TestClaudeProvider:
    @patch("app.services.claude_provider.get_settings")
    def test_init_requires_api_key(self, mock_settings):
        mock_settings.return_value = MagicMock(anthropic_api_key="")
        with pytest.raises(ValueError, match="API key is required"):
            ClaudeProvider(api_key="")

    @patch("app.services.claude_provider.get_settings")
    @patch("app.services.claude_provider.AsyncAnthropic")
    @pytest.mark.asyncio
    async def test_generate_calls_api(self, MockClient, mock_settings):
        mock_settings.return_value = MagicMock(anthropic_api_key="test-key")

        mock_message = MagicMock()
        mock_message.content = [MagicMock(text="Generated text")]
        mock_client = MockClient.return_value
        mock_client.messages.create = AsyncMock(return_value=mock_message)

        provider = ClaudeProvider(api_key="test-key")
        result = await provider.generate("prompt", "system", 512)

        assert result == "Generated text"
        mock_client.messages.create.assert_awaited_once_with(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            system="system",
            messages=[{"role": "user", "content": "prompt"}],
        )

    @patch("app.services.claude_provider.get_settings")
    @patch("app.services.claude_provider.AsyncAnthropic")
    @pytest.mark.asyncio
    async def test_generate_rate_limit_raises(self, MockClient, mock_settings):
        from anthropic import RateLimitError

        mock_settings.return_value = MagicMock(anthropic_api_key="test-key")
        mock_client = MockClient.return_value
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.headers = {}
        mock_client.messages.create = AsyncMock(
            side_effect=RateLimitError(
                message="rate limited",
                response=mock_response,
                body=None,
            )
        )

        provider = ClaudeProvider(api_key="test-key")
        with pytest.raises(RateLimitError):
            await provider.generate("p", "s", 100)


class TestOpenAIProvider:
    @patch("app.services.openai_provider.get_settings")
    def test_init_requires_api_key(self, mock_settings):
        mock_settings.return_value = MagicMock(openai_api_key="")
        with pytest.raises(ValueError, match="API key is required"):
            OpenAIProvider(api_key="")

    @patch("app.services.openai_provider.get_settings")
    @patch("app.services.openai_provider.AsyncOpenAI")
    @pytest.mark.asyncio
    async def test_generate_calls_api(self, MockClient, mock_settings):
        mock_settings.return_value = MagicMock(openai_api_key="test-key")

        mock_choice = MagicMock()
        mock_choice.message.content = "OpenAI response"
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        mock_client = MockClient.return_value
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        provider = OpenAIProvider(api_key="test-key")
        result = await provider.generate("prompt", "system", 512)

        assert result == "OpenAI response"
        mock_client.chat.completions.create.assert_awaited_once_with(
            model="gpt-4o",
            max_tokens=512,
            messages=[
                {"role": "system", "content": "system"},
                {"role": "user", "content": "prompt"},
            ],
        )

    @patch("app.services.openai_provider.get_settings")
    @patch("app.services.openai_provider.AsyncOpenAI")
    @pytest.mark.asyncio
    async def test_generate_rate_limit_raises(self, MockClient, mock_settings):
        from openai import RateLimitError

        mock_settings.return_value = MagicMock(openai_api_key="test-key")
        mock_client = MockClient.return_value
        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.headers = {}
        mock_response.json.return_value = {"error": {"message": "rate limited"}}
        mock_client.chat.completions.create = AsyncMock(
            side_effect=RateLimitError(
                message="rate limited",
                response=mock_response,
                body=None,
            )
        )

        provider = OpenAIProvider(api_key="test-key")
        with pytest.raises(RateLimitError):
            await provider.generate("p", "s", 100)
