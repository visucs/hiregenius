"""
Google Gemini Hosted Embeddings Client for Candidate RAG Indexing and Querying.

Features:
- Uses Google Gemini hosted embeddings (gemini-embedding-001 by default).
- Strict dimension control via output_dimensionality (768).
- Distinguishes task_type: 'retrieval_document' for resume chunks vs 'retrieval_query' for job requirements.
- Batched document embedding to respect API rate limits.
- In-memory cache for job query embeddings keyed by hash(query + model + dimension).
- Tracks call counts per ranking request.
- Raises typed GeminiEmbeddingError on API failure so ranking engine can fall back gracefully.
"""

import hashlib
import logging
from typing import Dict, List, Optional
import google.generativeai as genai

from app.config import settings

logger = logging.getLogger("hiregenius.ai_ml_service.services.rag.embeddings")


class GeminiEmbeddingError(Exception):
    """Raised when the Gemini embedding API call fails or is unconfigured."""
    pass


class EmbeddingClient:
    """Manages embedding generation, batching, caching, and call tracking."""

    def __init__(self):
        self._job_query_cache: Dict[str, List[float]] = {}
        self._call_counter: int = 0
        self._configured: bool = False

    def _ensure_configured(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise GeminiEmbeddingError("GEMINI_API_KEY is not configured.")
        if not self._configured:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._configured = True

    def reset_call_counter(self) -> None:
        """Reset the request-scoped call counter."""
        self._call_counter = 0

    @property
    def call_count(self) -> int:
        """Return the number of embedding API calls made in the current tracking window."""
        return self._call_counter

    def _format_model_name(self, model: str) -> str:
        clean = model.strip()
        if not clean.startswith("models/"):
            return f"models/{clean}"
        return clean

    def embed_documents(
        self,
        texts: List[str],
        model: Optional[str] = None,
        dimension: Optional[int] = None,
        batch_size: int = 20,
    ) -> List[List[float]]:
        """
        Embed a list of resume chunk texts in batches using task_type='retrieval_document'.
        """
        if not texts:
            return []

        self._ensure_configured()
        target_model = self._format_model_name(model or settings.GEMINI_EMBEDDING_MODEL)
        target_dim = dimension or settings.GEMINI_EMBEDDING_DIMENSION

        results: List[List[float]] = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            try:
                self._call_counter += 1
                response = genai.embed_content(
                    model=target_model,
                    content=batch,
                    task_type="retrieval_document",
                    output_dimensionality=target_dim,
                )
                embeddings = response.get("embedding", [])
                # If single item was sent, response['embedding'] may be a single vector
                if embeddings and isinstance(embeddings[0], (int, float)):
                    results.append(embeddings)
                else:
                    results.extend(embeddings)
            except Exception as e:
                logger.error(f"Gemini document embedding failed for batch {i}-{i+len(batch)}: {e}")
                raise GeminiEmbeddingError(f"Failed to generate embeddings: {e}") from e

        return results

    def embed_query(
        self,
        query_text: str,
        model: Optional[str] = None,
        dimension: Optional[int] = None,
    ) -> List[float]:
        """
        Embed a job description or query using task_type='retrieval_query'.
        Results are cached in-memory by hash(query + model + dimension).
        """
        clean_text = (query_text or "").strip()
        if not clean_text:
            raise GeminiEmbeddingError("Cannot embed empty query text.")

        self._ensure_configured()
        target_model = self._format_model_name(model or settings.GEMINI_EMBEDDING_MODEL)
        target_dim = dimension or settings.GEMINI_EMBEDDING_DIMENSION

        cache_key = hashlib.sha256(
            f"{clean_text}:{target_model}:{target_dim}".encode("utf-8")
        ).hexdigest()

        if cache_key in self._job_query_cache:
            logger.debug(f"Retrieved job query embedding from cache (hash: {cache_key[:8]})")
            return self._job_query_cache[cache_key]

        try:
            self._call_counter += 1
            response = genai.embed_content(
                model=target_model,
                content=clean_text,
                task_type="retrieval_query",
                output_dimensionality=target_dim,
            )
            embedding = response.get("embedding", [])
            if not embedding or not isinstance(embedding, list):
                raise GeminiEmbeddingError("Empty or malformed embedding vector received.")

            self._job_query_cache[cache_key] = embedding
            return embedding
        except Exception as e:
            logger.error(f"Gemini query embedding failed: {e}")
            raise GeminiEmbeddingError(f"Failed to embed query: {e}") from e


embedding_client = EmbeddingClient()
