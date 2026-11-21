"""
RAG Candidate Indexing and Composite Ranking Router.

Provides:
- POST /api/rag/index: Idempotent resume chunk indexing and vector generation.
- DELETE /api/rag/index/{candidate_id}: Removes candidate vectors and chunks.
- GET /api/rag/index/status/{candidate_id}: Retrieves candidate vector indexing state.
- POST /api/rag/index/backfill: Indexes any unindexed candidate resumes.
- POST /api/rag/rank: Privacy-isolated composite candidate stack-ranking with grounded explanations.

Guarded by internal-key authentication (X-Internal-Key).
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.auth import verify_internal_key
from app.db.mongodb import get_resumes_collection
from app.models.resume import ParsedResume
from app.services.rag.ranking_engine import RankingResponse, ranking_engine
from app.services.rag.vector_store import vector_store_service

logger = logging.getLogger("hiregenius.ai_ml_service.api.rag")

router = APIRouter(
    prefix="/api/rag",
    tags=["Candidate Ranking & RAG"],
    dependencies=[Depends(verify_internal_key)],
)


class IndexCandidateRequest(BaseModel):
    candidate_id: str = Field(..., description="ID of the candidate to index")


class IndexCandidateResponse(BaseModel):
    candidate_id: str
    status: str
    chunk_count: int
    embedding_model: str
    dimension: int
    indexed_at: Any


class IndexStatusResponse(BaseModel):
    candidate_id: str
    status: str
    chunk_count: int
    indexed_at: Optional[Any] = None
    error: Optional[str] = None
    embedding_model: Optional[str] = None


class DeleteIndexResponse(BaseModel):
    candidate_id: str
    deleted_chunks: int
    status: str


class BackfillResponse(BaseModel):
    scanned_resumes: int
    indexed_count: int
    failed_count: int
    errors: List[Dict[str, str]]


class RankCandidatesRequest(BaseModel):
    job_title: str = Field(..., description="Title of the job posting")
    job_description: str = Field(..., description="Full text description of the job")
    candidate_ids: List[str] = Field(..., description="Strict applicant candidate IDs to rank")
    job_id: Optional[str] = Field(None, description="Optional job ID for caching")
    top_n_explanations: Optional[int] = Field(10, description="Number of top candidates to generate explanations for")


@router.post(
    "/index",
    response_model=IndexCandidateResponse,
    summary="Index candidate resume chunks for RAG vector search (Idempotent)",
)
async def index_candidate_resume(body: IndexCandidateRequest):
    candidate_id = body.candidate_id.strip()
    if not candidate_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="candidate_id cannot be empty.",
        )

    resumes_col = get_resumes_collection()
    if resumes_col is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable.",
        )

    doc = await resumes_col.find_one({"candidate_id": candidate_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No parsed resume found for candidate_id '{candidate_id}'.",
        )

    parsed_dict = doc.get("parsed_data")
    if not parsed_dict:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Resume for candidate '{candidate_id}' has not been parsed into structured format.",
        )

    try:
        parsed_resume = ParsedResume(**parsed_dict)
        res = await vector_store_service.index_candidate(
            candidate_id=candidate_id,
            parsed_resume=parsed_resume,
            raw_text=doc.get("raw_text"),
        )
        return IndexCandidateResponse(**res)
    except Exception as e:
        logger.error(f"Indexing failed for candidate '{candidate_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate and store resume embeddings: {e}",
        )


@router.get(
    "/index/status/{candidate_id}",
    response_model=IndexStatusResponse,
    summary="Get candidate vector indexing status",
)
async def get_candidate_index_status(candidate_id: str):
    clean_id = candidate_id.strip()
    if not clean_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="candidate_id cannot be empty.",
        )

    status_data = await vector_store_service.get_index_status(clean_id)
    if status_data.get("status") == "NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate '{clean_id}' not found in resumes database.",
        )
    return IndexStatusResponse(**status_data)


@router.delete(
    "/index/{candidate_id}",
    response_model=DeleteIndexResponse,
    summary="Delete all vector chunks for a candidate",
)
async def delete_candidate_vectors(candidate_id: str):
    clean_id = candidate_id.strip()
    if not clean_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="candidate_id cannot be empty.",
        )

    deleted_count = await vector_store_service.delete_candidate(clean_id)
    return DeleteIndexResponse(
        candidate_id=clean_id,
        deleted_chunks=deleted_count,
        status="DELETED",
    )


@router.post(
    "/index/backfill",
    response_model=BackfillResponse,
    summary="Backfill vector embeddings for unindexed resumes",
)
async def backfill_unindexed_resumes():
    resumes_col = get_resumes_collection()
    if resumes_col is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable.",
        )

    cursor = resumes_col.find(
        {"$or": [{"rag_status": {"$ne": "INDEXED"}}, {"rag_status": {"$exists": False}}]}
    )

    scanned = 0
    indexed = 0
    failed = 0
    errors: List[Dict[str, str]] = []

    async for doc in cursor:
        scanned += 1
        cid = doc.get("candidate_id")
        parsed_dict = doc.get("parsed_data")
        if not cid or not parsed_dict:
            continue

        try:
            parsed_resume = ParsedResume(**parsed_dict)
            await vector_store_service.index_candidate(
                candidate_id=cid,
                parsed_resume=parsed_resume,
                raw_text=doc.get("raw_text"),
            )
            indexed += 1
        except Exception as e:
            failed += 1
            errors.append({"candidate_id": cid, "error": str(e)})

    return BackfillResponse(
        scanned_resumes=scanned,
        indexed_count=indexed,
        failed_count=failed,
        errors=errors,
    )


@router.post(
    "/rank",
    response_model=RankingResponse,
    summary="Rank applicants against job requirements with grounded explanations",
)
async def rank_job_applicants(body: RankCandidatesRequest):
    clean_title = body.job_title.strip()
    clean_desc = body.job_description.strip()
    applicant_ids = [cid.strip() for cid in body.candidate_ids if cid and cid.strip()]

    if not clean_title or not clean_desc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="job_title and job_description cannot be empty.",
        )

    if not applicant_ids:
        # Return clean empty ranking if job has 0 applicants
        return RankingResponse(
            job_id=body.job_id,
            job_title=clean_title,
            scoring_version="rag-ranking-v1-untuned",
            weights={},
            semantic_unavailable=False,
            total_applicants=0,
            ranked_count=0,
            unrankable_count=0,
            embedding_calls_count=0,
            rankings=[],
            not_rankable=[],
        )

    try:
        response = await ranking_engine.rank_candidates(
            job_title=clean_title,
            job_description=clean_desc,
            applicant_candidate_ids=applicant_ids,
            job_id=body.job_id,
            top_n_explanations=body.top_n_explanations,
        )
        return response
    except Exception as e:
        logger.error(f"Ranking failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rank applicants: {e}",
        )
