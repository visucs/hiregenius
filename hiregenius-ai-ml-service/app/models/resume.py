from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, computed_field


class EducationItem(BaseModel):
    degree: Optional[str] = Field(
        None, description="Degree or qualification title, e.g. B.S. in Computer Science"
    )
    institution: Optional[str] = Field(
        None, description="University, college, or educational institution"
    )
    year: Optional[str] = Field(
        None, description="Graduation year or attendance duration, e.g. 2018 or 2014-2018"
    )


class ExperienceItem(BaseModel):
    title: Optional[str] = Field(
        None, description="Job title or role designation, e.g. Senior Software Engineer"
    )
    company: Optional[str] = Field(
        None, description="Company, organization, or employer name"
    )
    duration: Optional[str] = Field(
        None, description="Period of employment, e.g. Jan 2021 - Present"
    )
    description: Optional[str] = Field(
        None, description="Summary of responsibilities, achievements, and impact"
    )


class ProjectItem(BaseModel):
    name: Optional[str] = Field(
        None, description="Title or name of the project"
    )
    description: Optional[str] = Field(
        None, description="Overview of the project goals and implementation"
    )
    technologies: List[str] = Field(
        default_factory=list, description="List of technologies, frameworks, or tools used"
    )


class ParsedResume(BaseModel):
    """Contract schema for structured resume data extracted via Gemini LLM."""

    full_name: Optional[str] = Field(
        None, description="Candidate's full name if explicitly stated"
    )
    email: Optional[str] = Field(
        None, description="Candidate's email address if found"
    )
    phone: Optional[str] = Field(
        None, description="Candidate's telephone/mobile number if found"
    )
    skills: List[str] = Field(
        default_factory=list,
        description="Technical, programming, domain, or soft skills explicitly mentioned",
    )
    education: List[EducationItem] = Field(
        default_factory=list,
        description="List of academic degrees, universities, and graduation dates",
    )
    experience: List[ExperienceItem] = Field(
        default_factory=list,
        description="Chronological or relevant professional work history entries",
    )
    certifications: List[str] = Field(
        default_factory=list,
        description="Professional certifications, licenses, or credentials",
    )
    projects: List[ProjectItem] = Field(
        default_factory=list,
        description="Notable personal, academic, or professional projects",
    )


class ResumeDocument(BaseModel):
    """Schema representing the persisted resume document in MongoDB resumes collection."""

    candidate_id: str = Field(..., description="Unique identifier of candidate from Core API")
    original_filename: str = Field(..., description="Original filename of the uploaded resume")
    raw_text: str = Field(..., description="Raw text extracted from the document")
    parsed_data: ParsedResume = Field(..., description="Structured parsed resume data")
    parsed_at: datetime = Field(..., description="Timestamp of when resume was parsed and stored")
    model_version: str = Field(..., description="Model identifier used during parsing")


class ParsedResumeResponse(BaseModel):
    """API response model for POST /api/resume/parse."""

    id: str = Field(..., description="MongoDB document ObjectId string")
    candidate_id: str = Field(..., description="Candidate ID associated with this resume")
    original_filename: str = Field(..., description="Original filename of the uploaded resume")
    parsed_data: ParsedResume = Field(..., description="Structured parsed resume data")
    parsed_at: datetime = Field(..., description="Timestamp of when resume was parsed")
    model_version: str = Field(..., description="Gemini model version used for parsing")

    @computed_field(alias="_id")
    @property
    def mongo_id(self) -> str:
        return self.id


class SavedResumeResponse(BaseModel):
    """API response model for GET /api/resume/{candidate_id}."""

    id: str = Field(..., description="MongoDB document ObjectId string")
    candidate_id: str = Field(..., description="Candidate ID associated with this resume")
    original_filename: str = Field(..., description="Original filename of the uploaded resume")
    raw_text: str = Field(..., description="Raw text extracted from the document")
    parsed_data: ParsedResume = Field(..., description="Structured parsed resume data")
    parsed_at: datetime = Field(..., description="Timestamp of when resume was parsed")
    model_version: str = Field(..., description="Gemini model version used for parsing")

    @computed_field(alias="_id")
    @property
    def mongo_id(self) -> str:
        return self.id

