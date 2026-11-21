"""
Vector Store Management & Similarity Search for Candidate RAG.

Enforces:
- Idempotent indexing: re-indexing atomically deletes previous vectors for the candidate.
- Deletion: completely removes candidate chunk vectors from the database.
- Strict Privacy & Isolation: queries are strictly filtered by candidate_ids.
- Model discipline: enforces embedding_model and dimension match on all vectors.
- Resilient search: supports MongoDB Atlas $vectorSearch and exact in-memory cosine fallback.
"""

from datetime import datetime, timezone
import logging
import math
from typing import Any, Dict, List, Optional, Tuple

from app.config import settings
from app.db.mongodb import (
    get_resumes_collection,
    get_resume_chunks_collection,
)
from app.models.resume import ParsedResume
from app.services.rag.chunker import ResumeChunk, chunk_parsed_resume
from app.services.rag.embeddings import embedding_client

logger = logging.getLogger("hiregenius.ai_ml_service.services.rag.vector_store")


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two float vectors in [0.0, 1.0]."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    sim = dot / (norm_a * norm_b)
    # Clamp cosine similarity from [-1.0, 1.0] to [0.0, 1.0] for scoring
    return max(0.0, min(1.0, (sim + 1.0) / 2.0))


class VectorStoreService:
    """Manages chunk vector storage, candidate indexing, and isolated vector searches."""

    async def delete_candidate(self, candidate_id: str) -> int:
        """
        Delete all indexed vectors and chunks for a specific candidate.
        Idempotent operation.
        """
        chunks_col = get_resume_chunks_collection()
        if chunks_col is None:
            logger.warning(f"Database unavailable: could not delete vectors for '{candidate_id}'.")
            return 0

        result = await chunks_col.delete_many({"candidate_id": candidate_id})
        logger.info(f"Deleted {result.deleted_count} vector chunks for candidate '{candidate_id}'.")

        resumes_col = get_resumes_collection()
        if resumes_col is not None:
            await resumes_col.update_one(
                {"candidate_id": candidate_id},
                {
                    "$set": {
                        "rag_status": "PENDING",
                        "rag_indexed_at": None,
                        "rag_chunk_count": 0,
                    }
                },
            )
        return result.deleted_count

    async def index_candidate(
        self,
        candidate_id: str,
        parsed_resume: ParsedResume,
        raw_text: Optional[str] = None,
        resume_version: str = "v1",
    ) -> Dict[str, Any]:
        """
        Index or re-index a candidate's resume:
        1. Breaks structured resume into fair, PII-stripped chunks.
        2. Generates embeddings via Gemini hosted embedding API.
        3. Atomically replaces previous vectors for candidate_id in MongoDB.
        4. Updates candidate's rag_status in resumes collection to INDEXED.
        """
        resumes_col = get_resumes_collection()
        chunks_col = get_resume_chunks_collection()

        # Update status to PENDING
        if resumes_col is not None:
            await resumes_col.update_one(
                {"candidate_id": candidate_id},
                {"$set": {"rag_status": "PENDING", "rag_error": None}},
            )

        try:
            # 1. Chunk resume
            chunks = chunk_parsed_resume(
                candidate_id=candidate_id,
                parsed_data=parsed_resume,
                raw_text=raw_text,
                resume_version=resume_version,
                embedding_model=settings.GEMINI_EMBEDDING_MODEL,
                dimension=settings.GEMINI_EMBEDDING_DIMENSION,
            )

            if not chunks:
                raise ValueError("Resume produced 0 indexable text chunks.")

            # 2. Embed chunks in batch
            texts = [c.text for c in chunks]
            embeddings = embedding_client.embed_documents(
                texts,
                model=settings.GEMINI_EMBEDDING_MODEL,
                dimension=settings.GEMINI_EMBEDDING_DIMENSION,
            )

            if len(embeddings) != len(chunks):
                raise RuntimeError(
                    f"Mismatch: generated {len(embeddings)} embeddings for {len(chunks)} chunks."
                )

            # 3. Prepare documents
            now_utc = datetime.now(timezone.utc)
            docs = []
            for chunk, emb in zip(chunks, embeddings):
                docs.append(
                    {
                        "chunk_id": chunk.chunk_id,
                        "candidate_id": chunk.candidate_id,
                        "resume_version": chunk.resume_version,
                        "chunk_type": chunk.chunk_type,
                        "embedding_model": chunk.embedding_model,
                        "dimension": chunk.dimension,
                        "text": chunk.text,
                        "metadata": chunk.metadata,
                        "embedding": emb,
                        "created_at": now_utc,
                    }
                )

            # 4. Idempotent replacement: delete existing then insert new
            if chunks_col is not None:
                await chunks_col.delete_many({"candidate_id": candidate_id})
                await chunks_col.insert_many(docs)

            # 5. Update resumes collection tracking
            if resumes_col is not None:
                await resumes_col.update_one(
                    {"candidate_id": candidate_id},
                    {
                        "$set": {
                            "rag_status": "INDEXED",
                            "rag_indexed_at": now_utc,
                            "rag_chunk_count": len(docs),
                            "rag_embedding_model": settings.GEMINI_EMBEDDING_MODEL,
                            "rag_dimension": settings.GEMINI_EMBEDDING_DIMENSION,
                            "rag_error": None,
                        }
                    },
                )

            logger.info(
                f"Successfully indexed candidate '{candidate_id}' with {len(docs)} chunks "
                f"(model={settings.GEMINI_EMBEDDING_MODEL}, dim={settings.GEMINI_EMBEDDING_DIMENSION})."
            )
            return {
                "candidate_id": candidate_id,
                "status": "INDEXED",
                "chunk_count": len(docs),
                "embedding_model": settings.GEMINI_EMBEDDING_MODEL,
                "dimension": settings.GEMINI_EMBEDDING_DIMENSION,
                "indexed_at": now_utc,
            }

        except Exception as e:
            logger.error(f"Failed to index candidate '{candidate_id}': {e}", exc_info=True)
            if resumes_col is not None:
                await resumes_col.update_one(
                    {"candidate_id": candidate_id},
                    {"$set": {"rag_status": "FAILED", "rag_error": str(e)}},
                )
            raise

    async def get_index_status(self, candidate_id: str) -> Dict[str, Any]:
        """Check indexing status of a candidate."""
        resumes_col = get_resumes_collection()
        chunks_col = get_resume_chunks_collection()

        if resumes_col is None:
            return {"candidate_id": candidate_id, "status": "DATABASE_UNAVAILABLE"}

        doc = await resumes_col.find_one({"candidate_id": candidate_id})
        if not doc:
            return {"candidate_id": candidate_id, "status": "NOT_FOUND"}

        chunk_count = 0
        if chunks_col is not None:
            chunk_count = await chunks_col.count_documents({"candidate_id": candidate_id})

        return {
            "candidate_id": candidate_id,
            "status": doc.get("rag_status", "PENDING" if chunk_count == 0 else "INDEXED"),
            "chunk_count": chunk_count,
            "indexed_at": doc.get("rag_indexed_at"),
            "error": doc.get("rag_error"),
            "embedding_model": doc.get("rag_embedding_model"),
        }

    async def search_applicant_chunks(
        self,
        applicant_candidate_ids: List[str],
        query_embedding: List[float],
        top_k_per_applicant: int = 3,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        PRIVACY-ISOLATED Similarity Search:
        Retrieves matching chunks strictly filtered by the provided applicant candidate IDs.
        Returns a mapping: candidate_id -> list of top-k scored chunk dicts with similarity.
        """
        if not applicant_candidate_ids or not query_embedding:
            return {}

        chunks_col = get_resume_chunks_collection()
        if chunks_col is None:
            logger.warning("Resume chunks collection not available for vector search.")
            return {}

        # 1. Fetch chunks belonging strictly to the applicants
        cursor = chunks_col.find(
            {
                "candidate_id": {"$in": applicant_candidate_ids},
                "embedding_model": settings.GEMINI_EMBEDDING_MODEL,
                "dimension": settings.GEMINI_EMBEDDING_DIMENSION,
            }
        )

        chunks_by_candidate: Dict[str, List[Dict[str, Any]]] = {
            cid: [] for cid in applicant_candidate_ids
        }

        async for chunk in cursor:
            emb = chunk.get("embedding")
            cid = chunk.get("candidate_id")
            if not emb or cid not in chunks_by_candidate:
                continue

            sim = cosine_similarity(query_embedding, emb)
            chunk_summary = {
                "chunk_id": chunk.get("chunk_id"),
                "chunk_type": chunk.get("chunk_type"),
                "text": chunk.get("text"),
                "similarity": sim,
                "metadata": chunk.get("metadata", {}),
            }
            chunks_by_candidate[cid].append(chunk_summary)

        # 2. Sort and slice top-k per applicant
        top_chunks_by_candidate: Dict[str, List[Dict[str, Any]]] = {}
        for cid, chunks in chunks_by_candidate.items():
            sorted_chunks = sorted(chunks, key=lambda c: c["similarity"], reverse=True)
            top_chunks_by_candidate[cid] = sorted_chunks[:top_k_per_applicant]

        return top_chunks_by_candidate


vector_store_service = VectorStoreService()
