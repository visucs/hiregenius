from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class QuestionType(str, Enum):
    TECHNICAL = "TECHNICAL"
    BEHAVIORAL = "BEHAVIORAL"
    RESUME_PROBE = "RESUME_PROBE"
    SCENARIO = "SCENARIO"


class Difficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class Recommendation(str, Enum):
    PROCEED = "PROCEED"
    CONSIDER = "CONSIDER"
    NOT_A_FIT = "NOT_A_FIT"


class JobContext(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(..., description="Job Title")
    description: str = Field(..., description="Full Job Description")
    required_skills: List[str] = Field(default_factory=list, alias="requiredSkills", description="Required skills list")
    experience_years: Optional[float] = Field(default=None, alias="experienceYears", description="Years of experience")
    seniority: Optional[str] = Field(default="MID", description="Seniority level: FRESHER, ENTRY, MID, SENIOR, LEAD")


class GenerateInterviewOptions(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question_count: int = Field(default=6, ge=4, le=10, alias="questionCount", description="Target number of questions (4-10)")


class GenerateInterviewRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    job: JobContext
    parsed_resume: Optional[Dict[str, Any]] = Field(default=None, alias="parsedResume", description="Parsed resume JSON")
    options: Optional[GenerateInterviewOptions] = Field(default_factory=GenerateInterviewOptions)


class GeneratedQuestion(BaseModel):
    id: str = Field(..., description="Unique question identifier within interview session (e.g. q_1)")
    type: QuestionType
    text: str = Field(..., description="Question prompt text")
    skill_tags: List[str] = Field(default_factory=list, description="Associated skill tags")
    difficulty: Difficulty
    expected_points: List[str] = Field(default_factory=list, description="Key criteria/points expected in good answers (NEVER leaked to candidate)")
    max_score: int = Field(default=10, description="Maximum score for this question")


class GenerateInterviewResponse(BaseModel):
    questions: List[GeneratedQuestion]
    provider: str = Field(default="gemini", description="AI provider used")
    model_version: str
    config_version: int = Field(default=1, description="AI configuration version")
    config_source: str = Field(default="db", description="Configuration source: db, lkg, or env")
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CandidateAnswerInput(BaseModel):
    question_id: str = Field(..., description="ID of question being answered")
    answer_text: str = Field(..., description="Candidate's raw text answer")


class EvaluateInterviewRequest(BaseModel):
    questions: List[GeneratedQuestion]
    answers: List[CandidateAnswerInput]
    job: JobContext


class PerAnswerEvaluation(BaseModel):
    question_id: str
    relevance: float = Field(..., ge=0.0, le=10.0, description="Relevance to question (0-10)")
    technical_accuracy: float = Field(..., ge=0.0, le=10.0, description="Factual and technical correctness (0-10)")
    depth: float = Field(..., ge=0.0, le=10.0, description="Completeness, nuance and practical depth (0-10)")
    clarity: float = Field(..., ge=0.0, le=10.0, description="Structure, clarity and coherence (0-10)")
    evidence_quotes: List[str] = Field(default_factory=list, description="Direct verbatim quotes from answer supporting evaluation")
    strengths: List[str] = Field(default_factory=list, description="Identified strengths")
    gaps: List[str] = Field(default_factory=list, description="Identified gaps or missing aspects")
    feedback: str = Field(..., description="Actionable advisory feedback for recruiter")
    is_empty_or_too_short: bool = Field(default=False, description="Whether answer was empty or failed minimum length check")


class AggregateEvaluation(BaseModel):
    technical: float = Field(..., ge=0.0, le=100.0, description="Technical score out of 100")
    communication: float = Field(..., ge=0.0, le=100.0, description="Communication score out of 100 (structure and clarity, not native fluency)")
    confidence_indicative: float = Field(..., ge=0.0, le=100.0, description="Indicative candidate confidence from textual signals (specificity, hedging, completeness)")
    overall: float = Field(..., ge=0.0, le=100.0, description="Overall weighted score out of 100 (UNTUNED)")
    recommendation: Recommendation = Field(..., description="Advisory hiring recommendation (PROCEED, CONSIDER, NOT_A_FIT)")
    rubric_version: str
    provider: str = Field(default="gemini", description="AI provider used")
    model_version: str
    config_version: int = Field(default=1, description="AI configuration version")
    config_source: str = Field(default="db", description="Configuration source: db, lkg, or env")
    disclaimer: str = Field(
        default="AI output is advisory and indicative. The recruiter makes the final hiring decision.",
        description="Mandatory advisory disclaimer"
    )


class EvaluateInterviewResponse(BaseModel):
    evaluations: List[PerAnswerEvaluation]
    aggregate: AggregateEvaluation
    evaluated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    cached: bool = Field(default=False, description="Whether evaluation was returned from cache")
