"""Canonical resume sections and their known header phrasings.

Used two ways: (1) directly, for high-precision fuzzy-match header detection
in section_segmenter.py, and (2) as the seed/bootstrap examples for training
the section_classifier (see section_classifier_train.py) — the classifier's
job is purely to generalize to header phrasings NOT in this list.
"""

SECTION_KEYWORDS: dict[str, list[str]] = {
    "summary": [
        "summary", "professional summary", "career summary", "objective",
        "career objective", "profile", "professional profile", "about me", "about",
    ],
    "skills": [
        "skills", "technical skills", "core skills", "core competencies",
        "key skills", "technologies", "technical proficiencies", "areas of expertise",
        "competencies", "skill set",
    ],
    "experience": [
        "experience", "work experience", "professional experience",
        "employment history", "career history", "work history", "relevant experience",
        "professional background",
    ],
    "education": [
        "education", "academic background", "academic qualifications",
        "educational background", "academic history",
    ],
    "projects": [
        "projects", "personal projects", "academic projects", "key projects",
        "selected projects", "notable projects",
    ],
    "certifications": [
        "certifications", "certificates", "licenses", "licenses and certifications",
        "professional certifications", "credentials",
    ],
}

BODY_TEXT_SAMPLES: list[str] = [
    "Led a team of five engineers to deliver a customer facing platform",
    "Developed and maintained scalable REST APIs using Python and FastAPI",
    "Collaborated with cross functional stakeholders to define requirements",
    "Improved page load performance by forty percent through caching",
    "Built automated test suites that reduced production incidents",
    "Designed relational and NoSQL schemas for high traffic services",
    "Mentored junior engineers and conducted code reviews",
    "Bachelor of Science in Computer Science, graduated with honors",
    "Proficient in Python, JavaScript, React, and cloud infrastructure",
    "Deployed containerized services on AWS using Docker and Kubernetes",
    "Reduced deployment time by sixty percent with CI/CD automation",
    "Presented findings to stakeholders and senior leadership",
    "Optimized database queries for a high traffic production service",
    "Implemented authentication using OAuth and JWT tokens",
    "Contributed to open source developer tooling on GitHub",
    "555-0132, jordan.rivera@example.com, San Francisco, CA",
    "Managed a portfolio of enterprise client relationships",
    "Automated data pipelines processing millions of records daily",
]
