import asyncio
import os

from app.core.config import settings

if settings.HF_TOKEN:
    os.environ.setdefault("HF_TOKEN", settings.HF_TOKEN)

from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.services import skill_service

SKILL_WEIGHT = 0.5
TEXT_WEIGHT = 0.25
SEMANTIC_WEIGHT = 0.25

_semantic_model = SentenceTransformer("all-MiniLM-L6-v2")


def _resume_text(profile) -> str:
    parts = list(profile.skills or [])
    if profile.desired_title:
        parts.append(profile.desired_title)
    for exp in profile.work_experience:
        if exp.description:
            parts.append(exp.description)
        parts.append(exp.title)
    return " ".join(parts)


def _job_text(job: dict) -> str:
    parts = [job.get("job_description") or ""]
    highlights = job.get("job_highlights") or {}
    if isinstance(highlights, dict):
        for values in highlights.values():
            if isinstance(values, list):
                parts.extend(str(v) for v in values)
    for field in ("required_technologies", "preferred_technologies", "soft_skills"):
        values = job.get(field)
        if isinstance(values, list):
            parts.extend(str(v) for v in values)
    return " ".join(p for p in parts if p)


def _job_structured_skills(job: dict) -> set[str] | None:
    """Skills from /job-details enrichment, if present. Returns None when unavailable."""
    fields = ("required_technologies", "preferred_technologies", "soft_skills")
    values: list[str] = []
    has_field = False
    for field in fields:
        v = job.get(field)
        if isinstance(v, list):
            has_field = True
            values.extend(str(x) for x in v)
    if not has_field:
        return None
    return {v.strip().lower() for v in values if v.strip()}


def _skill_overlap(job: dict, profile_skills_lower: set[str]) -> tuple[float, set[str], set[str]]:
    structured = _job_structured_skills(job)
    if structured is not None and structured:
        job_skills = structured
    else:
        extracted = skill_service.extract_skills_from_text(_job_text(job))
        job_skills = skill_service.flatten(extracted)

    if not job_skills:
        return 0.0, set(), set()

    matched = job_skills & profile_skills_lower
    missing = job_skills - profile_skills_lower
    score = len(matched) / max(len(job_skills), 1)
    return score, matched, missing


def _text_similarity_batch(resume_text: str, job_texts: list[str]) -> list[float]:
    documents = [resume_text] + job_texts
    if not resume_text.strip() or not any(t.strip() for t in job_texts):
        return [0.0] * len(job_texts)
    try:
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        matrix = vectorizer.fit_transform(documents)
    except ValueError:
        return [0.0] * len(job_texts)
    resume_vec = matrix[0]
    job_vecs = matrix[1:]
    sims = cosine_similarity(resume_vec, job_vecs)[0]
    return [float(s) for s in sims]


def _semantic_similarity_batch_sync(resume_text: str, job_texts: list[str]) -> list[float]:
    if not resume_text.strip() or not any(t.strip() for t in job_texts):
        return [0.0] * len(job_texts)
    embeddings = _semantic_model.encode([resume_text] + job_texts)
    resume_vec = embeddings[0:1]
    job_vecs = embeddings[1:]
    sims = cosine_similarity(resume_vec, job_vecs)[0]
    return [float(max(0.0, s)) for s in sims]


async def _semantic_similarity_batch(resume_text: str, job_texts: list[str]) -> list[float]:
    # sentence-transformers encoding is CPU-bound; offload so it doesn't block the event loop
    return await asyncio.to_thread(_semantic_similarity_batch_sync, resume_text, job_texts)


def _blend(skill_score: float, text_score: float, semantic_score: float) -> int:
    combined = SKILL_WEIGHT * skill_score + TEXT_WEIGHT * text_score + SEMANTIC_WEIGHT * semantic_score
    combined = max(0.0, min(1.0, combined))
    return round(1 + 9 * combined)


async def score_jobs_batch(jobs: list[dict], profile) -> list[dict]:
    if not jobs:
        return jobs

    resume_text = _resume_text(profile)
    profile_skills_lower = {s.strip().lower() for s in (profile.skills or [])}
    job_texts = [_job_text(job) for job in jobs]
    text_scores = _text_similarity_batch(resume_text, job_texts)
    semantic_scores = await _semantic_similarity_batch(resume_text, job_texts)

    for job, text_score, semantic_score in zip(jobs, text_scores, semantic_scores):
        skill_score, _, _ = _skill_overlap(job, profile_skills_lower)
        job["match_score"] = _blend(skill_score, text_score, semantic_score)

    jobs.sort(key=lambda j: j.get("match_score", 0), reverse=True)
    return jobs


async def analyze_job(job: dict, profile) -> dict:
    resume_text = _resume_text(profile)
    profile_skills_lower = {s.strip().lower() for s in (profile.skills or [])}
    job_text = _job_text(job)

    text_scores = _text_similarity_batch(resume_text, [job_text])
    text_score = text_scores[0] if text_scores else 0.0
    semantic_scores = await _semantic_similarity_batch(resume_text, [job_text])
    semantic_score = semantic_scores[0] if semantic_scores else 0.0
    skill_score, matched_lower, missing_lower = _skill_overlap(job, profile_skills_lower)

    matched_categorized = skill_service.categorize_skills(list(matched_lower))
    missing_categorized = skill_service.categorize_skills(list(missing_lower))

    return {
        "score": _blend(skill_score, text_score, semantic_score),
        "skill_score": round(skill_score, 4),
        "text_score": round(text_score, 4),
        "semantic_score": round(semantic_score, 4),
        "matched_skills": matched_categorized,
        "missing_skills": missing_categorized,
    }
