"""
ATS Keywords Taxonomy, Aliases, and Strict Token Matching.

Provides:
- DOMAIN_KEYWORDS: 24 curated job category skill taxonomies.
- GENERIC_KEYWORDS: Common professional/soft skills.
- KEYWORD_ALIASES: Canonical skill normalization (e.g., RESTful APIs -> rest api).
- Strict word-boundary matching for technical tokens like C++, C#, .NET, Node.js.
- extract_jd_keywords(): Extracts verifiable skills from job descriptions.
"""

from functools import lru_cache
import re
from typing import Dict, List, Set, Tuple

JOB_CATEGORIES: List[str] = [
    "Advocate",
    "Arts",
    "Automation Testing",
    "Blockchain",
    "Business Analyst",
    "Civil Engineer",
    "Data Science",
    "Database",
    "DevOps Engineer",
    "DotNet Developer",
    "ETL Developer",
    "Electrical Engineering",
    "HR",
    "Hadoop",
    "Java Developer",
    "Mechanical Engineer",
    "Network Security Engineer",
    "Operations Manager",
    "PMO",
    "Python Developer",
    "SAP Developer",
    "Sales",
    "Testing",
    "Web Designing",
]

DOMAIN_KEYWORDS: Dict[str, List[str]] = {
    "Data Science": [
        "python", "machine learning", "deep learning", "tensorflow", "pytorch",
        "scikit-learn", "pandas", "numpy", "statistics", "data visualization",
        "sql", "r", "jupyter", "keras", "nlp", "data wrangling",
        "feature engineering", "regression", "classification", "clustering",
    ],
    "Python Developer": [
        "python", "django", "flask", "fastapi", "rest api", "postgresql",
        "mysql", "redis", "celery", "docker", "git", "pytest", "sqlalchemy",
        "asyncio", "pandas", "numpy", "pip", "virtualenv", "ci/cd",
    ],
    "Java Developer": [
        "java", "spring", "spring boot", "hibernate", "maven", "gradle",
        "microservices", "rest api", "junit", "docker", "kubernetes",
        "sql", "nosql", "git", "jenkins", "design patterns", "jvm", "kafka",
    ],
    "Web Designing": [
        "html", "css", "javascript", "react", "vue", "angular", "bootstrap",
        "figma", "photoshop", "responsive design", "ui/ux", "sass", "webpack",
        "typescript", "node.js", "graphic design", "wireframing", "tailwind",
    ],
    "DevOps Engineer": [
        "docker", "kubernetes", "jenkins", "ci/cd", "terraform", "ansible",
        "aws", "azure", "gcp", "linux", "bash", "git", "monitoring",
        "prometheus", "grafana", "helm", "nginx", "elk stack", "puppet",
    ],
    "Database": [
        "sql", "mysql", "postgresql", "oracle", "mongodb", "redis",
        "database design", "normalization", "indexing", "stored procedures",
        "query optimization", "backup", "replication", "nosql", "data modeling",
    ],
    "Blockchain": [
        "blockchain", "ethereum", "solidity", "smart contracts", "web3",
        "cryptocurrency", "bitcoin", "hyperledger", "defi", "nft",
        "cryptography", "consensus algorithms", "truffle", "metamask",
    ],
    "Hadoop": [
        "hadoop", "spark", "hive", "pig", "hdfs", "mapreduce", "kafka",
        "flume", "sqoop", "yarn", "hbase", "big data", "zookeeper",
        "data pipeline", "etl", "scala", "java",
    ],
    "ETL Developer": [
        "etl", "informatica", "talend", "ssis", "datastage", "pentaho",
        "data warehouse", "sql", "python", "spark", "data migration",
        "data modeling", "oracle", "postgresql", "business intelligence",
    ],
    "Automation Testing": [
        "selenium", "pytest", "junit", "testng", "cucumber", "appium",
        "cypress", "robot framework", "postman", "api testing", "qa",
        "test automation", "jenkins", "git", "performance testing", "jmeter",
    ],
    "Testing": [
        "manual testing", "test cases", "bug tracking", "jira", "selenium",
        "api testing", "regression testing", "functional testing",
        "test plan", "qa", "agile", "sdlc", "postman", "sql",
    ],
    "Network Security Engineer": [
        "network security", "firewall", "vpn", "intrusion detection",
        "penetration testing", "siem", "vulnerability assessment", "cisco",
        "linux", "tcp/ip", "ssl/tls", "soc", "incident response",
        "ethical hacking", "encryption",
    ],
    "Business Analyst": [
        "requirements gathering", "business analysis", "user stories",
        "sql", "excel", "power bi", "tableau", "jira", "stakeholder management",
        "process mapping", "agile", "scrum", "documentation", "gap analysis",
    ],
    "SAP Developer": [
        "sap", "abap", "sap hana", "sap fiori", "sap s/4hana", "idoc",
        "bapi", "bdc", "smartforms", "sap basis", "sap mm", "sap sd",
        "sap fico", "odata", "rfm",
    ],
    "DotNet Developer": [
        "c#", ".net", "asp.net", "mvc", "entity framework", "sql server",
        "visual studio", "azure", "rest api", "linq", "web api",
        "microservices", "docker", "git", "blazor",
    ],
    "HR": [
        "recruitment", "talent acquisition", "onboarding", "payroll",
        "performance management", "hris", "employee relations",
        "labor law", "excel", "hr policies", "succession planning", "training",
    ],
    "Sales": [
        "sales", "crm", "lead generation", "business development",
        "negotiation", "customer relationship", "salesforce", "revenue",
        "cold calling", "account management", "b2b", "b2c", "pipeline",
    ],
    "Operations Manager": [
        "operations management", "supply chain", "logistics", "kpi",
        "process improvement", "lean", "six sigma", "erp", "budgeting",
        "team leadership", "vendor management", "sla", "forecasting",
    ],
    "PMO": [
        "project management", "pmp", "agile", "scrum", "risk management",
        "ms project", "jira", "budget management", "stakeholder management",
        "gantt chart", "prince2", "resource planning", "kpi",
    ],
    "Civil Engineer": [
        "autocad", "structural analysis", "construction management",
        "project management", "staad pro", "revit", "site supervision",
        "estimation", "quality control", "building codes", "surveying",
    ],
    "Mechanical Engineer": [
        "autocad", "solidworks", "catia", "ansys", "manufacturing",
        "thermodynamics", "fluid mechanics", "cad", "product design",
        "quality control", "cnc", "maintenance", "fmea",
    ],
    "Electrical Engineering": [
        "electrical design", "matlab", "plc", "scada", "autocad electrical",
        "power systems", "circuit design", "pcb", "embedded systems",
        "microcontroller", "python", "labview",
    ],
    "Arts": [
        "graphic design", "adobe photoshop", "illustrator", "indesign",
        "video editing", "premiere pro", "after effects", "photography",
        "3d modeling", "blender", "portfolio", "creative",
    ],
    "Advocate": [
        "legal research", "litigation", "contract drafting", "legal writing",
        "court proceedings", "legal advice", "compliance", "law",
        "negotiation", "client counseling", "legal documentation",
    ],
}

GENERIC_KEYWORDS: List[str] = [
    "communication",
    "teamwork",
    "problem solving",
    "leadership",
    "time management",
    "adaptability",
    "analytical",
    "detail oriented",
    "collaboration",
    "critical thinking",
]

# Canonical skill -> Set of recognized alias forms
KEYWORD_ALIASES: Dict[str, str] = {
    # ── REST API Variants ──
    "rest": "rest api",
    "restful": "rest api",
    "rest api": "rest api",
    "rest apis": "rest api",
    "restful api": "rest api",
    "restful apis": "rest api",

    # ── CI/CD Variants ──
    "ci cd": "ci/cd",
    "ci-cd": "ci/cd",
    "cicd": "ci/cd",
    "ci/cd": "ci/cd",
    "continuous integration": "ci/cd",
    "continuous deployment": "ci/cd",
    "continuous delivery": "ci/cd",

    # ── Unit Testing / Test Automation / Pytest ──
    "unit testing": "pytest",
    "unit test": "pytest",
    "unit tests": "pytest",
    "automated testing": "test automation",
    "automation testing": "test automation",
    "test automation": "test automation",

    # ── ML / Deep Learning Variants ──
    "ml": "machine learning",
    "machine-learning": "machine learning",
    "deep-learning": "deep learning",
    "dl": "deep learning",
    "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "tf": "tensorflow",

    # ── JS / TS / Web Frameworks ──
    "js": "javascript",
    "javascript": "javascript",
    "ts": "typescript",
    "typescript": "typescript",
    "reactjs": "react",
    "react.js": "react",
    "nodejs": "node.js",
    "node": "node.js",
    "angularjs": "angular",
    "angular.js": "angular",
    "vuejs": "vue",
    "vue.js": "vue",
    "html5": "html",
    "css3": "css",
    "tailwindcss": "tailwind",

    # ── Cloud Platforms ──
    "aws": "aws",
    "amazon web services": "aws",
    "gcp": "gcp",
    "google cloud": "gcp",
    "google cloud platform": "gcp",
    "azure": "azure",
    "microsoft azure": "azure",
    "k8s": "kubernetes",

    # ── Databases & Languages ──
    "postgres": "postgresql",
    "mongo": "mongodb",
    "golang": "go",
    "dotnet": ".net",
    "dot net": ".net",
    ".net core": ".net",
    "csharp": "c#",
    "c sharp": "c#",
    "cpp": "c++",
    "c plus plus": "c++",
}

STOP_WORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "almost", "also",
    "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because",
    "been", "before", "being", "below", "between", "both", "but", "by", "can",
    "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
    "doing", "don't", "down", "during", "each", "few", "for", "from", "further",
    "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "her",
    "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in",
    "into", "is", "isn't", "it", "its", "itself", "let's", "me", "more", "most",
    "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once",
    "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over",
    "own", "same", "shan't", "she", "should", "shouldn't", "so", "some", "such",
    "than", "that", "the", "their", "theirs", "them", "themselves", "then",
    "there", "these", "they", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "wasn't", "we", "were", "weren't", "what",
    "when", "where", "which", "while", "who", "whom", "why", "with", "won't",
    "would", "wouldn't", "you", "your", "yours", "yourself", "yourselves",
    "experience", "years", "role", "work", "job", "candidate", "responsibilities",
    "required", "preferred", "qualifications", "company", "team", "skills",
}


@lru_cache(maxsize=1024)
def build_token_regex(token: str) -> re.Pattern:
    """
    Build a strict word-boundary regex pattern that safely matches tokens
    containing symbols (e.g. 'c++', 'c#', '.net', 'node.js') without
    leaking into longer words (e.g. 'java' matching 'javascript',
    'go' matching 'google', 'sql' matching 'mysql').

    Uses negative lookbehind and lookahead against alphanumeric, '#', and '+'
    characters to enforce true token isolation.
    """
    escaped = re.escape(token.strip().lower())
    pattern = rf"(?<![a-zA-Z0-9+#]){escaped}(?![a-zA-Z0-9+#])"
    return re.compile(pattern, re.IGNORECASE)


def match_token(token: str, text: str) -> bool:
    """Test whether a specific token or phrase exists in text with word boundaries."""
    if not token or not text:
        return False
    regex = build_token_regex(token)
    return bool(regex.search(text))


# Cache map of canonical_skill -> list of (canonical + aliases)
def _build_skill_forms_map() -> Dict[str, List[str]]:
    mapping: Dict[str, List[str]] = {}
    all_canonicals: Set[str] = set()
    for cat_skills in DOMAIN_KEYWORDS.values():
        all_canonicals.update(cat_skills)
    all_canonicals.update(GENERIC_KEYWORDS)

    for skill in all_canonicals:
        mapping[skill] = [skill]

    # Add aliases
    for alias, canonical in KEYWORD_ALIASES.items():
        if canonical not in mapping:
            mapping[canonical] = [canonical]
        if alias not in mapping[canonical]:
            mapping[canonical].append(alias)

    return mapping


SKILL_FORMS: Dict[str, List[str]] = _build_skill_forms_map()


def match_skill(canonical_skill: str, text: str) -> bool:
    """
    Check if a canonical skill (or any of its known aliases) is present in text
    using strict word boundaries.
    """
    forms = SKILL_FORMS.get(canonical_skill.lower(), [canonical_skill.lower()])
    return any(match_token(form, text) for form in forms)


def get_all_taxonomy_skills() -> List[str]:
    """Return all unique canonical skills across DOMAIN_KEYWORDS and GENERIC_KEYWORDS."""
    seen = set()
    skills: List[str] = []
    for cat_skills in DOMAIN_KEYWORDS.values():
        for s in cat_skills:
            if s not in seen:
                seen.add(s)
                skills.append(s)
    for g in GENERIC_KEYWORDS:
        if g not in seen:
            seen.add(g)
            skills.append(g)
    return skills


def extract_jd_keywords(job_description: str, max_keywords: int = 40) -> List[str]:
    """
    Extract relevant skills mentioned in the job description.

    RULES:
    1. Tests JD text against our curated skills taxonomy and all alias forms.
    2. Uses strict word boundaries for all matches.
    3. Resolves aliases to their canonical skill name.
    4. Sub-phrase containment suppression: if a longer skill match (e.g. 'test automation'
       from 'automated testing') covers a span, shorter overlapping sub-phrases (e.g. 'testing')
       are suppressed to prevent redundant duplicate keywords.
    5. Deduplicated in order of occurrence and capped at max_keywords.
    """
    if not job_description:
        return []

    jd_lower = job_description.lower()
    taxonomy = get_all_taxonomy_skills()

    # Find all matches with their character spans: (start, end, canonical_skill, matched_form)
    raw_matches: List[Tuple[int, int, str, str]] = []

    for canonical in taxonomy:
        forms = SKILL_FORMS.get(canonical, [canonical])
        for form in forms:
            regex = build_token_regex(form)
            for m in regex.finditer(jd_lower):
                raw_matches.append((m.start(), m.end(), canonical, form))

    if not raw_matches:
        return []

    # Sort matches by span length descending (longer phrase takes priority), then start pos
    raw_matches.sort(key=lambda x: (-(x[1] - x[0]), x[0]))

    # Filter out shorter matches whose spans are completely inside longer spans
    accepted_spans: List[Tuple[int, int, str]] = []
    for start, end, canonical, form in raw_matches:
        is_subsumed = False
        for a_start, a_end, _ in accepted_spans:
            # If current span is within an already accepted longer span
            if start >= a_start and end <= a_end:
                is_subsumed = True
                break
        if not is_subsumed:
            accepted_spans.append((start, end, canonical))

    # Re-sort accepted spans by appearance order in the JD text
    accepted_spans.sort(key=lambda x: x[0])

    unique_skills: List[str] = []
    seen = set()
    for _, _, canonical in accepted_spans:
        if canonical not in seen:
            seen.add(canonical)
            unique_skills.append(canonical)
            if len(unique_skills) >= max_keywords:
                break

    return unique_skills
