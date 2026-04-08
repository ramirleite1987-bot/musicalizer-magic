from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.content import ContentItem, SEOMetadata
from app.services.ai_service import AIService


# Portuguese common/simple words (stop words + high-frequency words)
_PORTUGUESE_SIMPLE_WORDS = {
    "a", "o", "e", "de", "do", "da", "em", "um", "uma", "que", "é", "para",
    "com", "não", "se", "os", "as", "no", "na", "por", "mais", "dos", "das",
    "foi", "como", "mas", "ao", "ele", "ela", "seu", "sua", "ou", "ser",
    "quando", "muito", "há", "nos", "já", "está", "eu", "também", "só",
    "pelo", "pela", "até", "isso", "entre", "era", "depois", "sem", "mesmo",
    "aos", "ter", "seus", "quem", "nas", "me", "esse", "eles", "estão",
    "você", "tinha", "foram", "essa", "num", "nem", "suas", "meu", "às",
    "minha", "têm", "numa", "sobre", "tem", "nos", "às", "este", "esta",
}

# Average syllables threshold for "complex" Portuguese words
_COMPLEX_WORD_SYLLABLE_THRESHOLD = 4


def _count_syllables_pt(word: str) -> int:
    """Estimate syllable count for a Portuguese word using vowel groups."""
    word = word.lower().strip()
    # Count vowel groups (including accented vowels)
    vowel_groups = re.findall(r"[aeiouáéíóúâêôãõàü]+", word)
    return max(len(vowel_groups), 1)


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences."""
    sentences = re.split(r"[.!?]+", text)
    return [s.strip() for s in sentences if s.strip()]


def _extract_words(text: str) -> list[str]:
    """Extract words from text."""
    return re.findall(r"\b[a-záéíóúâêôãõàüç]+\b", text.lower())


def calculate_readability_score(text: str) -> float:
    """
    Calculate a Portuguese readability score (0-100).

    Based on sentence length and word complexity:
    - Shorter sentences score higher
    - Fewer complex words score higher
    - 100 = very easy to read, 0 = very difficult
    """
    if not text or not text.strip():
        return 0.0

    sentences = _split_sentences(text)
    if not sentences:
        return 0.0

    words = _extract_words(text)
    if not words:
        return 0.0

    # Average sentence length (words per sentence)
    avg_sentence_length = len(words) / len(sentences)

    # Percentage of complex words (>= 4 syllables, not in simple word list)
    complex_count = sum(
        1
        for w in words
        if w not in _PORTUGUESE_SIMPLE_WORDS
        and _count_syllables_pt(w) >= _COMPLEX_WORD_SYLLABLE_THRESHOLD
    )
    complex_pct = (complex_count / len(words)) * 100 if words else 0

    # Score formula (inspired by Flesch for Portuguese)
    # Ideal: avg_sentence_length ~15, complex_pct ~5%
    score = 100 - (avg_sentence_length * 1.5) - (complex_pct * 2.0)
    return round(max(0.0, min(100.0, score)), 1)


class SEOService:
    def __init__(self, session: AsyncSession, ai_service: Optional[AIService] = None):
        self.session = session
        self.ai_service = ai_service

    async def get_metadata(self, content_id: str) -> Optional[SEOMetadata]:
        """Get SEO metadata for a content item."""
        statement = select(SEOMetadata).where(SEOMetadata.content_id == content_id)
        result = await self.session.exec(statement)
        return result.first()

    async def upsert_metadata(
        self,
        content_id: str,
        meta_title: Optional[str] = None,
        meta_description: Optional[str] = None,
        keywords: Optional[list[str]] = None,
        slug: Optional[str] = None,
    ) -> SEOMetadata:
        """Create or update SEO metadata for a content item."""
        metadata = await self.get_metadata(content_id)

        if metadata is None:
            metadata = SEOMetadata(content_id=content_id)
            self.session.add(metadata)

        if meta_title is not None:
            metadata.meta_title = meta_title
        if meta_description is not None:
            metadata.meta_description = meta_description
        if keywords is not None:
            metadata.keywords = json.dumps(keywords)
        if slug is not None:
            metadata.slug = slug

        metadata.updated_at = datetime.now(timezone.utc)

        await self.session.commit()
        await self.session.refresh(metadata)
        return metadata

    async def analyze(self, content_id: str) -> dict:
        """Analyze content for SEO readability and update the score."""
        content = await self.session.get(ContentItem, content_id)
        if content is None:
            raise ValueError(f"Content item '{content_id}' not found")

        score = calculate_readability_score(content.body)

        # Ensure metadata record exists and update score
        metadata = await self.get_metadata(content_id)
        if metadata is None:
            metadata = SEOMetadata(content_id=content_id, readability_score=score)
            self.session.add(metadata)
        else:
            metadata.readability_score = score
            metadata.updated_at = datetime.now(timezone.utc)

        await self.session.commit()
        await self.session.refresh(metadata)

        sentences = _split_sentences(content.body)
        words = _extract_words(content.body)

        return {
            "content_id": content_id,
            "readability_score": score,
            "word_count": len(words),
            "sentence_count": len(sentences),
            "avg_sentence_length": round(len(words) / max(len(sentences), 1), 1),
        }

    async def suggest_keywords(self, content_id: str) -> list[str]:
        """Use AI to suggest SEO keywords for the content."""
        content = await self.session.get(ContentItem, content_id)
        if content is None:
            raise ValueError(f"Content item '{content_id}' not found")

        if self.ai_service is None or not self.ai_service.available_models:
            raise ValueError("No AI provider available for keyword suggestions")

        model_key = self.ai_service.available_models[0]

        prompt = (
            f"Analise o seguinte conteúdo em português e sugira de 5 a 10 palavras-chave "
            f"para SEO. Retorne APENAS as palavras-chave, uma por linha, sem numeração.\n\n"
            f"Título: {content.title}\n\n"
            f"Conteúdo: {content.body[:2000]}"
        )
        system_prompt = (
            "Você é um especialista em SEO para conteúdo católico em português brasileiro. "
            "Responda apenas com as palavras-chave, uma por linha."
        )

        response = await self.ai_service.generate(
            model_key=model_key,
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=256,
        )

        keywords = [
            line.strip()
            for line in response.strip().splitlines()
            if line.strip()
        ]
        return keywords
