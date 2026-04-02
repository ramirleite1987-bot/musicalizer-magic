from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import AsyncClient

from app.services.seo_service import (
    _count_syllables_pt,
    _extract_words,
    _split_sentences,
    calculate_readability_score,
)


class TestReadabilityHelpers:
    def test_count_syllables_simple(self):
        assert _count_syllables_pt("casa") == 2
        assert _count_syllables_pt("a") == 1

    def test_count_syllables_complex(self):
        assert _count_syllables_pt("desenvolvimento") >= 4

    def test_count_syllables_accented(self):
        assert _count_syllables_pt("coração") >= 3

    def test_split_sentences(self):
        text = "Frase um. Frase dois! Frase três?"
        assert len(_split_sentences(text)) == 3

    def test_split_sentences_empty(self):
        assert _split_sentences("") == []

    def test_extract_words(self):
        words = _extract_words("O gato sentou no tapete.")
        assert "gato" in words
        assert "sentou" in words


class TestReadabilityScore:
    def test_empty_text_returns_zero(self):
        assert calculate_readability_score("") == 0.0
        assert calculate_readability_score("   ") == 0.0

    def test_simple_text_scores_high(self):
        text = "A casa é bonita. O gato é grande. A vida é boa."
        score = calculate_readability_score(text)
        assert score > 70

    def test_complex_text_scores_lower(self):
        text = (
            "A complexidade epistemológica do desenvolvimento "
            "historiográfico contemporâneo demonstra a impossibilidade "
            "de compreensão fundamentalista das interpretações "
            "antropológicas do conhecimento institucionalizado."
        )
        score = calculate_readability_score(text)
        assert score < 70

    def test_score_bounded_zero_to_hundred(self):
        for text in ["Olá.", "x " * 500 + "."]:
            score = calculate_readability_score(text)
            assert 0.0 <= score <= 100.0


@pytest.mark.asyncio
class TestSEOAPI:
    async def _create_content(self, client: AsyncClient, body: str = "Conteúdo de teste.") -> str:
        resp = await client.post("/api/content", json={
            "title": "SEO Test Post",
            "body": body,
            "content_type": "blog_post",
        })
        return resp.json()["id"]

    async def test_upsert_seo_metadata(self, client: AsyncClient):
        content_id = await self._create_content(client)
        resp = await client.put(f"/api/seo/{content_id}", json={
            "meta_title": "Título SEO",
            "meta_description": "Descrição para buscadores",
            "keywords": ["católico", "fé", "oração"],
            "slug": "titulo-seo",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["meta_title"] == "Título SEO"

    async def test_get_seo_metadata(self, client: AsyncClient):
        content_id = await self._create_content(client)
        await client.put(f"/api/seo/{content_id}", json={
            "meta_title": "Test Title",
            "keywords": ["keyword1"],
        })
        resp = await client.get(f"/api/seo/{content_id}")
        assert resp.status_code == 200
        assert resp.json()["meta_title"] == "Test Title"

    async def test_get_seo_metadata_not_found(self, client: AsyncClient):
        resp = await client.get("/api/seo/nonexistent-id")
        assert resp.status_code == 404

    async def test_analyze_readability(self, client: AsyncClient):
        body = "A fé católica é bela. A oração é importante. Deus nos ama."
        content_id = await self._create_content(client, body=body)
        resp = await client.post(f"/api/seo/{content_id}/analyze")
        assert resp.status_code == 200
        data = resp.json()
        assert "readability_score" in data
        assert "word_count" in data
        assert data["readability_score"] > 0

    async def test_keywords_format(self, client: AsyncClient):
        content_id = await self._create_content(client)
        await client.put(f"/api/seo/{content_id}", json={
            "keywords": ["palavra1", "palavra2", "palavra3"],
        })
        resp = await client.get(f"/api/seo/{content_id}")
        assert resp.status_code == 200
        data = resp.json()
        # Keywords should be retrievable as a list
        keywords = data.get("keywords")
        assert keywords is not None
