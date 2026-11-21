import json
import os
import sys
from pathlib import Path
from unittest.mock import patch

# Set path so hiregenius-ai-ml-service can be imported
sys.path.insert(0, str(Path("hiregenius-ai-ml-service").resolve()))

from app.services.text_extraction import extract_text
from app.services.ats.scorer import analyze_v2
from app.services.ats.parsability import analyze_parsability
from app.services.ats.jd_extractor import extract_job_requirements

fixtures_dir = Path("hiregenius-ai-ml-service/test/fixtures")

results = {}

# 1. Real Alex Smith resume
alex_path = fixtures_dir / "real_resume_alex_smith.docx"
alex_bytes = alex_path.read_bytes()
alex_text = extract_text(alex_bytes, "real_resume_alex_smith.docx")
alex_res = analyze_v2(text=alex_text, file_bytes=alex_bytes, filename="real_resume_alex_smith.docx", mode="GENERAL")
results["alex_smith_general"] = alex_res.model_dump()

# 2. Scanned image resume (unreadable)
scanned_path = fixtures_dir / "scanned_image_resume.pdf"
scanned_bytes = scanned_path.read_bytes()
scanned_res = analyze_v2(text="", file_bytes=scanned_bytes, filename="scanned_image_resume.pdf", is_unreadable=True, unreadable_reason="ATS cannot extract readable text from this file (scanned image or empty text layer).")
results["scanned_image_resume"] = scanned_res.model_dump()

# 3. Fresher resume (with projects/internship/education, no corporate experience)
fresher_text = """
Rahul Sharma
rahul.sharma@example.com | +91 9876543210 | Bangalore, India | linkedin.com/in/rahulsharma

OBJECTIVE
Motivated Computer Science graduate seeking an entry-level software engineering position to build scalable web applications.

EDUCATION
Bachelor of Technology (B.Tech) in Computer Science & Engineering
National Institute of Technology Karnataka (2020 - 2024)
CGPA: 8.8/10

INTERNSHIP
Software Developer Intern - TechCorp India (Jan 2024 - Jun 2024)
- Developed REST APIs using Python and FastAPI, improving data retrieval latency by 25%.
- Implemented Docker containerization and automated CI/CD workflows using GitHub Actions.

ACADEMIC PROJECTS
E-Commerce Microservices Engine (Python, FastAPI, Redis, PostgreSQL)
- Architected a distributed order-processing system handling 1,000 requests per minute with Redis caching.
- Designed schema migrations and implemented JWT-based authentication for secure customer sessions.

TECHNICAL SKILLS
Languages: Python, JavaScript, SQL, C++
Frameworks & Tools: FastAPI, Node.js, Docker, Git, PostgreSQL, Redis, Linux
"""
fresher_res = analyze_v2(text=fresher_text, mode="GENERAL")
results["fresher_resume"] = {
    "overallScore": fresher_res.overallScore,
    "grade": fresher_res.grade,
    "categoryScores": [c.model_dump() for c in fresher_res.categoryScores],
    "issues": [i.model_dump() for i in fresher_res.issues]
}

# 4. Personal fields invariance demonstration
fresher_with_personal_demographics = fresher_text + """
PERSONAL DETAILS
Date of Birth: 15 August 2001
Marital Status: Single
Gender: Male
Father's Name: R. K. Sharma
Nationality: Indian
Languages Known: English, Hindi
"""
fresher_with_demographics_res = analyze_v2(text=fresher_with_personal_demographics, mode="GENERAL")
results["personal_fields_invariance"] = {
    "score_without_demographics": fresher_res.overallScore,
    "score_with_demographics": fresher_with_demographics_res.overallScore,
    "is_exact_match": fresher_res.overallScore == fresher_with_demographics_res.overallScore,
    "demographic_issues": [i.model_dump() for i in fresher_with_demographics_res.issues if i.category == "Personal Details"]
}

# 5. Canva-like synthetic multi-column fixture
canva_path = fixtures_dir / "canva_like_synthetic.pdf"
if canva_path.exists():
    canva_bytes = canva_path.read_bytes()
    canva_text = extract_text(canva_bytes, "canva_like_synthetic.pdf")
    canva_res = analyze_v2(text=canva_text, file_bytes=canva_bytes, filename="canva_like_synthetic.pdf", mode="GENERAL")
    results["canva_synthetic"] = {
        "overallScore": canva_res.overallScore,
        "parsability_score": next((c.score for c in canva_res.categoryScores if "Parsability" in c.name), None),
        "issues": [i.model_dump() for i in canva_res.issues if i.category == "Parsability & Format"]
    }

out_path = Path("hiregenius-ai-ml-service/test/part1_verification_output.json")
out_path.write_text(json.dumps(results, indent=2))
print("Successfully generated verification output at:", out_path)
