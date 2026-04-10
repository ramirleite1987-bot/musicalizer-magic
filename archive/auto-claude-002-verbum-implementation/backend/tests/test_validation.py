from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.fallback_validation_provider import FallbackValidationProvider
from app.services.validation_service import (
    Citation,
    ValidationResult,
    ValidationService,
)


class TestValidationService:
    def _make_provider(self, available: bool, result: ValidationResult | None = None):
        provider = MagicMock()
        provider.is_available = AsyncMock(return_value=available)
        provider.validate = AsyncMock(return_value=result)
        return provider

    @pytest.mark.asyncio
    async def test_uses_primary_when_available(self):
        primary_result = ValidationResult(score=0.95, provider="primary")
        primary = self._make_provider(True, primary_result)
        fallback = self._make_provider(True)

        service = ValidationService(primary, fallback)
        result = await service.validate("content", "blog_post")

        assert result.score == 0.95
        assert result.provider == "primary"
        primary.validate.assert_awaited_once()
        fallback.validate.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_falls_back_when_primary_unavailable(self):
        fallback_result = ValidationResult(score=0.8, provider="ai_fallback")
        primary = self._make_provider(False)
        fallback = self._make_provider(True, fallback_result)

        service = ValidationService(primary, fallback)
        result = await service.validate("content", "blog_post")

        assert result.provider == "ai_fallback"
        fallback.validate.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_falls_back_when_primary_raises(self):
        primary = MagicMock()
        primary.is_available = AsyncMock(return_value=True)
        primary.validate = AsyncMock(side_effect=RuntimeError("boom"))

        fallback_result = ValidationResult(score=0.7, provider="ai_fallback")
        fallback = self._make_provider(True, fallback_result)

        service = ValidationService(primary, fallback)
        result = await service.validate("content", "short_video")

        assert result.provider == "ai_fallback"
        assert result.score == 0.7

    @pytest.mark.asyncio
    async def test_passes_content_and_type(self):
        primary_result = ValidationResult(score=0.9, provider="primary")
        primary = self._make_provider(True, primary_result)
        fallback = self._make_provider(True)

        service = ValidationService(primary, fallback)
        await service.validate("my content", "long_video")

        primary.validate.assert_awaited_once_with("my content", "long_video")


class TestFallbackValidationProvider:
    @patch("app.services.fallback_validation_provider.get_settings")
    @pytest.mark.asyncio
    async def test_is_available_with_key(self, mock_settings):
        mock_settings.return_value = MagicMock(anthropic_api_key="key")
        provider = FallbackValidationProvider(api_key="key")
        assert await provider.is_available() is True

    @patch("app.services.fallback_validation_provider.get_settings")
    @pytest.mark.asyncio
    async def test_is_available_without_key(self, mock_settings):
        mock_settings.return_value = MagicMock(anthropic_api_key="")
        provider = FallbackValidationProvider(api_key="")
        assert await provider.is_available() is False

    def test_parse_response_valid_json(self):
        raw = '{"score": 85, "flags": ["Minor issue"], "citations": [{"source": "CIC 123", "text": "some text"}], "analysis": "Good"}'

        with patch("app.services.fallback_validation_provider.get_settings") as m:
            m.return_value = MagicMock(anthropic_api_key="key")
            provider = FallbackValidationProvider(api_key="key")

        result = provider._parse_response(raw)
        assert result.score == 0.85
        assert result.flags == ["Minor issue"]
        assert len(result.citations) == 1
        assert result.citations[0].source_id == "CIC 123"
        assert result.citations[0].cited_text == "some text"
        assert result.provider == "ai_fallback"

    def test_parse_response_json_in_code_block(self):
        raw = '```json\n{"score": 90, "flags": [], "citations": [], "analysis": "ok"}\n```'

        with patch("app.services.fallback_validation_provider.get_settings") as m:
            m.return_value = MagicMock(anthropic_api_key="key")
            provider = FallbackValidationProvider(api_key="key")

        result = provider._parse_response(raw)
        assert result.score == 0.9
        assert result.flags == []

    def test_parse_response_invalid_json(self):
        raw = "This is not JSON at all"

        with patch("app.services.fallback_validation_provider.get_settings") as m:
            m.return_value = MagicMock(anthropic_api_key="key")
            provider = FallbackValidationProvider(api_key="key")

        result = provider._parse_response(raw)
        assert result.score == 0.5
        assert result.provider == "ai_fallback"
        assert len(result.flags) == 1

    def test_parse_response_score_clamped(self):
        raw = '{"score": 150, "flags": [], "citations": [], "analysis": "ok"}'

        with patch("app.services.fallback_validation_provider.get_settings") as m:
            m.return_value = MagicMock(anthropic_api_key="key")
            provider = FallbackValidationProvider(api_key="key")

        result = provider._parse_response(raw)
        assert result.score == 1.0

    def test_parse_response_multiple_citations(self):
        raw = '{"score": 75, "flags": [], "citations": [{"source": "A", "text": "x"}, {"source": "B", "text": "y"}], "analysis": ""}'

        with patch("app.services.fallback_validation_provider.get_settings") as m:
            m.return_value = MagicMock(anthropic_api_key="key")
            provider = FallbackValidationProvider(api_key="key")

        result = provider._parse_response(raw)
        assert len(result.citations) == 2
        assert result.citations[0].citation_number == 1
        assert result.citations[1].citation_number == 2
