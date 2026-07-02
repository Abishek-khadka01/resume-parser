"""Closed-vocabulary lookup lists for entity types CoNLL-trained NER doesn't
cover (job titles, degree names) — same rule-based-gazetteer idea as
app/services/skill_service.py's skill matcher, applied to two more fields.
"""

JOB_TITLE_KEYWORDS = [
    "senior software engineer", "staff software engineer", "principal engineer",
    "software engineer", "software developer", "full stack developer",
    "backend developer", "frontend developer", "backend engineer", "frontend engineer",
    "data scientist", "data analyst", "data engineer",
    "machine learning engineer", "ml engineer", "ai engineer",
    "devops engineer", "site reliability engineer", "platform engineer",
    "product manager", "project manager", "program manager",
    "engineering manager", "technical lead", "tech lead", "team lead",
    "software engineering intern", "engineering intern", "research assistant", "intern",
    "business analyst", "qa engineer", "test engineer", "systems engineer",
    "cloud engineer", "security engineer", "network engineer",
    "mobile developer", "ios developer", "android developer",
    "ui/ux designer", "ux designer", "ui designer", "graphic designer",
    "technical consultant", "consultant", "solutions architect", "architect",
]

DEGREE_KEYWORDS = [
    "bachelor of science", "bachelor of arts", "bachelor of technology",
    "bachelor of engineering", "bachelor's degree", "bachelors",
    "b.s.", "b.a.", "b.tech", "b.e.", "bsc", "bs",
    "master of science", "master of arts", "master of technology",
    "master of business administration", "master's degree", "masters",
    "m.s.", "m.a.", "m.tech", "mba", "msc", "ms",
    "phd", "ph.d.", "doctorate", "doctor of philosophy",
    "associate degree", "associate of science", "associate of arts",
]


def find_longest_match(line: str, vocabulary: list[str]) -> str | None:
    lower = line.lower()
    matches = [kw for kw in vocabulary if kw in lower]
    if not matches:
        return None
    return max(matches, key=len).title()
