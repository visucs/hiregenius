"""
Candidate Ranking (RAG) Composite Scoring Engine.

Combines:
1. Semantic alignment via vector similarity over resume chunks (weight: 0.40)
2. Skills coverage via ATS v2 keyword logic (weight: 0.35)
3. Experience fit via ATS v2 experience evaluation (weight: 0.15)
4. Education fit via ATS v2 education evaluation (weight: 0.10)

Weights are explicitly marked UNTUNED heuristic estimates.
Explanations for top-N candidates are strictly grounded in cited chunk IDs.
Deterministic, stable sorting with documented tie-breaks.
Full privacy isolation: queries only over the recruiter's applicant set.
"""

from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.config import settings
from app.db.mongodb import get_resumes_collection
from app.models.resume import ParsedResume
from app.services.ats.jd_extractor import (
    JDExtractedRequirements,
    extract_job_requirements,
)
from app.services.ats.keywords import match_skill
from app.services.ats.scorer import (
    _evaluate_education_fit,
    _evaluate_experience_fit,
)
from app.services.ats.sections import strip_personal_demographics
from app.services.rag.embeddings import (
    GeminiEmbeddingError,
    embedding_client,
)
from app.services.rag.grounded_explainer import (
    GroundedExplanation,
    generate_grounded_explanation,
)
from app.services.rag.vector_store import vector_store_service

logger = logging.getLogger("hiregenius.ai_ml_service.services.rag.ranking_engine")


class RankingComponentScores(BaseModel):
    semantic_score: float = Field(..., description="Semantic alignment score (0-100) from top chunk similarities")
    skills_score: float = Field(..., description="Required & preferred skill coverage score (0-100)")
    experience_score: float = Field(..., description="Years of experience alignment score (0-100)")
    education_score: float = Field(..., description="Education & degree credentials score (0-100)")
    semantic_weight: float = Field(..., description="Configured weight for semantic component")
    skills_weight: float = Field(..., description="Configured weight for skills component")
    experience_weight: float = Field(..., description="Configured weight for experience component")
    education_weight: float = Field(..., description="Configured weight for education component")


class RankedCandidateItem(BaseModel):
    rank: int = Field(..., description="1-based stack rank position")
    candidate_id: str = Field(..., description="ID of the candidate")
    score: float = Field(..., description="Composite suitability score (0-100)")
    components: RankingComponentScores = Field(..., description="Individual component breakdown")
    matched_skills: List[str] = Field(default_factory=list, description="List of matched job skills")
    missing_skills: List[str] = Field(default_factory=list, description="List of missing required skills")
    candidate_years: float = Field(0.0, description="Estimated years of professional experience")
    required_years: Optional[float] = Field(None, description="Required years from JD")
    degree_matched: bool = Field(False, description="Whether candidate holds matching degree credentials")
    explanation: Optional[GroundedExplanation] = Field(None, description="Grounded explanation with chunk citations (top-N only)")
    chunk_ids_evaluated: List[str] = Field(default_factory=list, description="IDs of chunks evaluated for this candidate")


class UnrankableCandidateItem(BaseModel):
    candidate_id: str = Field(..., description="ID of the unrankable applicant")
    rankable: bool = Field(False, description="Always False")
    reason: str = Field(..., description="Specific explanation why candidate could not be ranked")


class RankingResponse(BaseModel):
    job_id: Optional[str] = Field(None, description="Job identifier")
    job_title: str = Field(..., description="Target job title")
    scoring_version: str = Field(settings.RAG_SCORING_VERSION, description="Scoring engine version identifier")
    weights: Dict[str, float] = Field(..., description="Component weights applied to calculate composite score")
    semantic_unavailable: bool = Field(False, description="True if semantic vector search was unavailable and fallback weights were used")
    total_applicants: int = Field(..., description="Total applicants submitted for ranking")
    ranked_count: int = Field(..., description="Number of successfully ranked candidates")
    unrankable_count: int = Field(..., description="Number of unrankable candidates")
    embedding_calls_count: int = Field(0, description="Number of embedding API calls made during this ranking request")
    rankings: List[RankedCandidateItem] = Field(default_factory=list, description="Ranked list of applicants in descending order")
    not_rankable: List[UnrankableCandidateItem] = Field(default_factory=list, description="Applicants that could not be ranked")
    disclaimer: str = Field(settings.RAG_DISCLAIMER, description="Advisory ranking fairness disclaimer")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CandidateRankingEngine:
    """Orchestrates candidate ranking across semantic, skills, experience, and education components."""

    async def rank_candidates(
        self,
        job_title: str,
        job_description: str,
        applicant_candidate_ids: List[str],
        job_id: Optional[str] = None,
        top_n_explanations: Optional[int] = None,
        custom_llm: Optional[object] = None,
    ) -> RankingResponse:
        """
        Rank a strictly defined set of job applicants.
        """
        top_n = top_n_explanations or settings.RAG_TOP_N_EXPLANATIONS
        embedding_client.reset_call_counter()

        # Step 1: Extract structured job requirements (cached via jd_keyword_cache)
        job_reqs, is_jd_fallback = await extract_job_requirements(
            job_description=job_description,
            job_title=job_title,
            job_id=job_id,
            custom_llm=custom_llm,
        )

        req_skills = job_reqs.required_skills or []
        pref_skills = job_reqs.preferred_skills or []
        all_jd_skills = req_skills + pref_skills

        # Step 2: Fetch applicant resumes from MongoDB
        resumes_col = get_resumes_collection()
        candidate_docs: Dict[str, Dict[str, Any]] = {}
        if resumes_col is not None:
            cursor = resumes_col.find({"candidate_id": {"$in": applicant_candidate_ids}})
            async for doc in cursor:
                candidate_docs[doc["candidate_id"]] = doc

        # Separate rankable candidates from unrankable
        rankable_ids: List[str] = []
        not_rankable: List[UnrankableCandidateItem] = []

        for cid in applicant_candidate_ids:
            doc = candidate_docs.get(cid)
            if not doc:
                not_rankable.append(
                    UnrankableCandidateItem(
                        candidate_id=cid,
                        reason="No resume has been uploaded or processed for this applicant.",
                    )
                )
                continue

            raw_text = doc.get("raw_text", "")
            parsed_data = doc.get("parsed_data")
            if not raw_text or len(raw_text.strip()) < 50:
                not_rankable.append(
                    UnrankableCandidateItem(
                        candidate_id=cid,
                        reason="Resume document has empty text or appears to be an unreadable scanned image.",
                    )
                )
                continue

            if not parsed_data or not isinstance(parsed_data, dict):
                not_rankable.append(
                    UnrankableCandidateItem(
                        candidate_id=cid,
                        reason="Resume structured parsing data is missing or incomplete.",
                    )
                )
                continue

            rankable_ids.append(cid)

        # Step 3: Ensure rankable candidates have indexed vectors
        for cid in rankable_ids:
            doc = candidate_docs[cid]
            if doc.get("rag_status") != "INDEXED":
                try:
                    parsed_model = ParsedResume(**doc["parsed_data"])
                    await vector_store_service.index_candidate(
                        candidate_id=cid,
                        parsed_resume=parsed_model,
                        raw_text=doc.get("raw_text"),
                    )
                except Exception as idx_err:
                    logger.warning(f"Could not auto-index candidate '{cid}': {idx_err}")

        # Step 4: Semantic scoring via Vector Similarity
        semantic_unavailable = False
        chunks_by_applicant: Dict[str, List[Dict[str, Any]]] = {}
        semantic_scores: Dict[str, float] = {cid: 0.0 for cid in rankable_ids}

        query_text = (
            f"Job Title: {job_title}\n"
            f"Requirements:\n{job_description}\n"
            f"Key Skills: {', '.join(all_jd_skills)}"
        )

        try:
            query_embedding = embedding_client.embed_query(query_text)
            chunks_by_applicant = await vector_store_service.search_applicant_chunks(
                applicant_candidate_ids=rankable_ids,
                query_embedding=query_embedding,
                top_k_per_applicant=3,
            )

            for cid in rankable_ids:
                applicant_chunks = chunks_by_applicant.get(cid, [])
                if applicant_chunks:
                    avg_sim = sum(c["similarity"] for c in applicant_chunks) / len(applicant_chunks)
                    semantic_scores[cid] = round(avg_sim * 100.0, 1)
                else:
                    semantic_scores[cid] = 30.0  # Baseline neutral if no chunks retrieved

        except (GeminiEmbeddingError, Exception) as emb_err:
            logger.warning(f"Vector semantic search unavailable: {emb_err}. Falling back to deterministic scoring.")
            semantic_unavailable = True
            for cid in rankable_ids:
                semantic_scores[cid] = 0.0

        # Step 5: Evaluate Skills, Experience, and Education Fit per applicant
        candidate_evaluations: List[Dict[str, Any]] = []

        for cid in rankable_ids:
            doc = candidate_docs[cid]
            raw_text = doc.get("raw_text", "")
            clean_text, _ = strip_personal_demographics(raw_text)
            parsed_resume = ParsedResume(**doc["parsed_data"])

            # 5a. Skills Match (ATS Keyword Logic)
            matched_req = [s for s in req_skills if match_skill(s, clean_text)]
            missing_req = [s for s in req_skills if not match_skill(s, clean_text)]
            matched_pref = [s for s in pref_skills if match_skill(s, clean_text)]
            missing_pref = [s for s in pref_skills if not match_skill(s, clean_text)]

            all_matched = matched_req + matched_pref
            req_ratio = len(matched_req) / max(len(req_skills), 1) if req_skills else 1.0
            pref_ratio = len(matched_pref) / max(len(pref_skills), 1) if pref_skills else 1.0
            skills_score = round(((req_ratio * 0.75) + (pref_ratio * 0.25)) * 100.0, 1)

            # 5b. Experience Fit
            exp_pts, _, exp_details = _evaluate_experience_fit(
                text=clean_text,
                jd_requirements=job_reqs,
                parsed_resume=parsed_resume,
            )
            experience_score = round((exp_pts / 15.0) * 100.0, 1)
            cand_years = float(exp_details.get("candidate_years", 0.0))

            # 5c. Education Fit
            edu_pts, _, edu_details = _evaluate_education_fit(
                text=clean_text,
                parsed_resume=parsed_resume,
            )
            education_score = round((edu_pts / 10.0) * 100.0, 1)
            degree_matched = bool(edu_details.get("degree_found", False))

            # 5d. Semantic Score
            sem_score = semantic_scores.get(cid, 0.0)

            # 5e. Composite Score Calculation
            if not semantic_unavailable:
                weights = settings.RAG_WEIGHTS
                comp_score = (
                    weights["semantic"] * sem_score
                    + weights["skills"] * skills_score
                    + weights["experience"] * experience_score
                    + weights["education"] * education_score
                )
            else:
                weights = settings.RAG_FALLBACK_WEIGHTS
                comp_score = (
                    weights["skills"] * skills_score
                    + weights["experience"] * experience_score
                    + weights["education"] * education_score
                )

            final_score = round(comp_score, 1)

            candidate_evaluations.append(
                {
                    "candidate_id": cid,
                    "score": final_score,
                    "semantic_score": sem_score,
                    "skills_score": skills_score,
                    "experience_score": experience_score,
                    "education_score": education_score,
                    "matched_skills": all_matched,
                    "missing_skills": missing_req,
                    "candidate_years": cand_years,
                    "required_years": job_reqs.experience_years,
                    "degree_matched": degree_matched,
                    "chunks": chunks_by_applicant.get(cid, []),
                }
            )

        # Step 6: Deterministic and Stable Ordering with Documented Tie-Breaks
        # Sort Key: (-composite_score, -skills_score, -experience_score, -education_score, candidate_id)
        sorted_evaluations = sorted(
            candidate_evaluations,
            key=lambda x: (
                -x["score"],
                -x["skills_score"],
                -x["experience_score"],
                -x["education_score"],
                x["candidate_id"],
            ),
        )

        # Step 7: Generate Grounded Explanations for Top N
        active_weights = settings.RAG_FALLBACK_WEIGHTS if semantic_unavailable else settings.RAG_WEIGHTS
        ranked_items: List[RankedCandidateItem] = []

        for idx, item in enumerate(sorted_evaluations, start=1):
            cid = item["candidate_id"]
            explanation = None

            # Only top-N get an explanation
            if idx <= top_n:
                explanation = await generate_grounded_explanation(
                    candidate_id=cid,
                    job_title=job_title,
                    required_skills=req_skills,
                    preferred_skills=pref_skills,
                    experience_years=job_reqs.experience_years,
                    role_level=job_reqs.role_level,
                    candidate_years=item["candidate_years"],
                    matched_skills=item["matched_skills"],
                    missing_skills=item["missing_skills"],
                    candidate_chunks=item["chunks"],
                    composite_score=item["score"],
                    custom_llm=custom_llm,
                )

            components = RankingComponentScores(
                semantic_score=item["semantic_score"],
                skills_score=item["skills_score"],
                experience_score=item["experience_score"],
                education_score=item["education_score"],
                semantic_weight=0.0 if semantic_unavailable else active_weights["semantic"],
                skills_weight=active_weights["skills"],
                experience_weight=active_weights["experience"],
                education_weight=active_weights["education"],
            )

            chunk_ids = [c["chunk_id"] for c in item["chunks"]]

            ranked_items.append(
                RankedCandidateItem(
                    rank=idx,
                    candidate_id=cid,
                    score=item["score"],
                    components=components,
                    matched_skills=item["matched_skills"],
                    missing_skills=item["missing_skills"],
                    candidate_years=item["candidate_years"],
                    required_years=item["required_years"],
                    degree_matched=item["degree_matched"],
                    explanation=explanation,
                    chunk_ids_evaluated=chunk_ids,
                )
            )

        return RankingResponse(
            job_id=job_id,
            job_title=job_title,
            scoring_version=settings.RAG_SCORING_VERSION,
            weights=active_weights,
            semantic_unavailable=semantic_unavailable,
            total_applicants=len(applicant_candidate_ids),
            ranked_count=len(ranked_items),
            unrankable_count=len(not_rankable),
            embedding_calls_count=embedding_client.call_count,
            rankings=ranked_items,
            not_rankable=not_rankable,
            disclaimer=settings.RAG_DISCLAIMER,
        )


ranking_engine = CandidateRankingEngine()
