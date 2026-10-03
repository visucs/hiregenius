from typing import List, Optional
from pydantic import BaseModel, Field


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
