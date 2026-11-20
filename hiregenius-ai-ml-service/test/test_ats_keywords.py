"""
Unit Tests for ATS Keyword Matching, Aliases, and JD Keyword Extraction.
"""

import unittest
from app.services.ats.keywords import (
    DOMAIN_KEYWORDS,
    JOB_CATEGORIES,
    extract_jd_keywords,
    match_skill,
    match_token,
)


class TestAtsKeywords(unittest.TestCase):
    """Test suite for ATS keyword tokenization, aliases, and taxonomy."""

    def test_strict_word_boundaries_positive(self):
        """Verify standard and symbol-containing technical keywords match correctly."""
        self.assertTrue(match_skill("python", "Strong experience in Python and cloud services."))
        self.assertTrue(match_skill("java", "Core Java development for high-throughput backends."))
        self.assertTrue(match_skill("c++", "Low latency trading systems built with C++ and Linux."))
        self.assertTrue(match_skill("c#", "Senior backend developer proficient in C# and ASP.NET."))
        self.assertTrue(match_skill(".net", "Modern enterprise architecture on .NET Core."))
        self.assertTrue(match_skill("node.js", "Fullstack engineering using Node.js and TypeScript."))
        self.assertTrue(match_skill("sql", "Complex SQL query optimization and schema design."))
        self.assertTrue(match_skill("go", "Microservices written in Go and deployed on Kubernetes."))

    def test_strict_word_boundaries_negative(self):
        """
        CRITICAL REQUIREMENT:
        'java' must not match 'javascript'
        'go' must not match 'google'
        'sql' must not match 'mysql'
        """
        # 1. java must not match javascript
        self.assertFalse(match_token("java", "Frontend interactive features built with javascript."))
        self.assertFalse(match_skill("java", "Frontend interactive features built with javascript."))

        # 2. go must not match google
        self.assertFalse(match_token("go", "Certified Google Cloud Professional Data Engineer."))
        self.assertFalse(match_skill("go", "Certified Google Cloud Professional Data Engineer."))

        # 3. sql must not match mysql or postgresql
        self.assertFalse(match_token("sql", "Database administration for mysql cluster."))
        self.assertFalse(match_token("sql", "Relational backend powered by postgresql."))

    def test_keyword_aliases_resolution(self):
        """Verify canonical skills match through real-world aliases."""
        # 1. REST variants -> 'rest api'
        for variant in ["REST", "RESTful", "REST API", "REST APIs", "RESTful API", "RESTful APIs"]:
            self.assertTrue(
                match_skill("rest api", f"Designed {variant} for fintech platform."),
                f"Failed to match variant: {variant}",
            )

        # 2. CI/CD variants -> 'ci/cd'
        for variant in ["CI/CD", "CI CD", "CI-CD", "cicd", "continuous integration", "continuous deployment"]:
            self.assertTrue(
                match_skill("ci/cd", f"Automated deployment using {variant} pipelines."),
                f"Failed to match CI/CD variant: {variant}",
            )

        # 3. Unit testing / pytest
        for variant in ["unit testing", "unit test", "unit tests", "pytest"]:
            self.assertTrue(
                match_skill("pytest", f"High code coverage via {variant}."),
                f"Failed to match unit testing variant: {variant}",
            )

        # 4. ML / Machine Learning
        for variant in ["ML", "machine learning", "machine-learning"]:
            self.assertTrue(
                match_skill("machine learning", f"Predictive models using {variant}."),
                f"Failed to match ML variant: {variant}",
            )

        # 5. JS / TS / Web Frameworks
        self.assertTrue(match_skill("javascript", "Frontend scripts written in JS."))
        self.assertTrue(match_skill("typescript", "Strict typing with TS and React."))
        self.assertTrue(match_skill("react", "Built single-page applications with ReactJS."))
        self.assertTrue(match_skill("react", "Component architecture designed in React.js."))
        self.assertTrue(match_skill("node.js", "Backend REST APIs implemented with NodeJS."))
        self.assertTrue(match_skill("node.js", "Server-side event loop in Node runtime."))

        # 6. Cloud Platforms
        self.assertTrue(match_skill("aws", "Hosted on Amazon Web Services."))
        self.assertTrue(match_skill("gcp", "Data pipelines running on Google Cloud Platform."))
        self.assertTrue(match_skill("azure", "Active Directory integrated with Microsoft Azure."))
        self.assertTrue(match_skill("kubernetes", "Container orchestration using k8s and Helm."))

        # 7. Databases & Languages
        self.assertTrue(match_skill("postgresql", "Relational persistence with Postgres 15."))
        self.assertTrue(match_skill("go", "Concurrent worker pool written in golang."))

    def test_extract_jd_keywords(self):
        """Verify that JD keyword extraction filters noise and extracts taxonomy skills in order."""
        jd = """
        We are seeking a Senior Python Developer with deep experience in FastAPI, Docker, and REST APIs.
        The candidate should be familiar with Redis caching, Celery task queues, and Kubernetes.
        Experience with CI/CD and automated testing with pytest is highly preferred.
        Join our dynamic company team to deliver high-quality solutions.
        """
        keywords = extract_jd_keywords(jd, max_keywords=15)

        # All extracted tokens must be valid skills
        self.assertIn("python", keywords)
        self.assertIn("fastapi", keywords)
        self.assertIn("rest api", keywords)
        self.assertIn("docker", keywords)
        self.assertIn("redis", keywords)
        self.assertIn("celery", keywords)
        self.assertIn("kubernetes", keywords)
        self.assertIn("ci/cd", keywords)
        self.assertIn("pytest", keywords)
        self.assertIn("test automation", keywords)

        # Standalone 'testing' must be suppressed by 'test automation' from 'automated testing'
        self.assertNotIn("testing", keywords)

        # English prose/noise words must be excluded
        self.assertNotIn("company", keywords)
        self.assertNotIn("team", keywords)
        self.assertNotIn("seeking", keywords)
        self.assertNotIn("candidate", keywords)
        self.assertNotIn("solutions", keywords)

    def test_all_categories_defined(self):
        """Ensure all 24 categories exist and contain non-empty curated taxonomies."""
        self.assertEqual(len(JOB_CATEGORIES), 24)
        for cat in JOB_CATEGORIES:
            self.assertIn(cat, DOMAIN_KEYWORDS)
            self.assertGreaterEqual(len(DOMAIN_KEYWORDS[cat]), 10)
