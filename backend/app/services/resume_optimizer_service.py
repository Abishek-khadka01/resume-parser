import re

from sklearn.metrics.pairwise import cosine_similarity

from app.services import skill_service
from app.services.ats_service import (
    _blend,
    _job_text,
    _resume_text,
    _semantic_model,
    _semantic_similarity_batch,
    _skill_overlap,
    _text_similarity_batch,
)

MAX_INJECTIONS = 5
MAX_SKILL_ADDITIONS = 5
MAX_QUANTIFY_SUGGESTIONS = 3
INJECTION_SIMILARITY_THRESHOLD = 0.15


def _sentence_containing(text: str, keyword: str) -> str:
    if not text:
        return keyword
    sentences = re.split(r"(?<=[.!?])\s+", text)
    kw = keyword.lower()
    for sentence in sentences:
        if kw in sentence.lower():
            return sentence
    return keyword


def _has_number(text: str) -> bool:
    return bool(re.search(r"\d", text or ""))


def _canonical_map(terms_lower: set[str]) -> dict[str, tuple[str, str]]:
    categorized = skill_service.categorize_skills(list(terms_lower))
    mapping: dict[str, tuple[str, str]] = {}
    for category, terms in categorized.items():
        for term in terms:
            mapping[term.lower()] = (category, term)
    return mapping


def _rank_by_frequency(terms_lower: set[str], text: str) -> list[str]:
    text_lower = (text or "").lower()
    counts = {term: text_lower.count(term) for term in terms_lower}
    return sorted(terms_lower, key=lambda t: counts.get(t, 0), reverse=True)


def _best_bullet_for_skill(term: str, job_text: str, experiences: list, used_bullets: set[str]):
    candidates = [exp for exp in experiences if exp.description and exp.description.strip()]
    if not candidates:
        return None
    query = _sentence_containing(job_text, term.lower())
    texts = [query] + [exp.description for exp in candidates]
    embeddings = _semantic_model.encode(texts)
    sims = cosine_similarity(embeddings[0:1], embeddings[1:])[0]
    ranked = sorted(range(len(candidates)), key=lambda i: sims[i], reverse=True)
    for idx in ranked:
        exp = candidates[idx]
        if str(exp.id) in used_bullets:
            continue
        if sims[idx] < INJECTION_SIMILARITY_THRESHOLD:
            return None
        return exp
    return None


async def optimize_resume(job: dict, profile) -> dict:
    profile_skills_lower = {s.strip().lower() for s in (profile.skills or [])}
    skill_score, matched_lower, missing_lower = _skill_overlap(job, profile_skills_lower)
    job_text = _job_text(job)

    exp_text_lower = " ".join((exp.description or "") for exp in profile.work_experience).lower()
    underemphasized_lower = {s for s in matched_lower if s not in exp_text_lower}
    canon_map = _canonical_map(underemphasized_lower | missing_lower)

    experiences = list(profile.work_experience)
    optimized_descriptions = {str(exp.id): (exp.description or "") for exp in experiences}
    changes: list[dict] = []
    used_bullets: set[str] = set()

    # Signal 1: sentence-embedding similarity to place skills the user already
    # claims (profile.skills) but doesn't demonstrate anywhere in their bullets.
    for skill_lower in _rank_by_frequency(underemphasized_lower, job_text)[:MAX_INJECTIONS]:
        category, term = canon_map.get(skill_lower, ("uncategorized", skill_lower.title()))
        exp = _best_bullet_for_skill(term, job_text, experiences, used_bullets)
        if not exp:
            continue
        used_bullets.add(str(exp.id))
        before = optimized_descriptions[str(exp.id)]
        after = before.rstrip()
        if after and not after.endswith((".", "!", "?")):
            after += "."
        after = f"{after} Applied {term} in this role.".strip()
        optimized_descriptions[str(exp.id)] = after
        changes.append({
            "type": "skill_emphasized",
            "category": category,
            "keyword": term,
            "experience_id": str(exp.id),
            "experience_title": exp.title,
            "before": before,
            "after": after,
            "added_sentence": f"Applied {term} in this role.",
        })

    # Signal 2: raw term-frequency ranking of skills the job wants but the
    # profile never claims. Added to the Skills list only (never fabricated
    # into experience bullets), flagged for the user to confirm/remove.
    added_skills: list[str] = []
    for skill_lower in _rank_by_frequency(missing_lower, job_text)[:MAX_SKILL_ADDITIONS]:
        category, term = canon_map.get(skill_lower, ("uncategorized", skill_lower.title()))
        added_skills.append(term)
        changes.append({
            "type": "skill_added_to_skills_list",
            "category": category,
            "keyword": term,
            "message": (
                f"Added '{term}' to your Skills section — this job emphasizes it. "
                "Remove it if you're not comfortable claiming this skill."
            ),
        })

    # Signal 3: regex gap-detection for unquantified bullets. Flagged only —
    # never fabricates a number.
    quantify_count = 0
    for exp in experiences:
        if quantify_count >= MAX_QUANTIFY_SUGGESTIONS:
            break
        desc = optimized_descriptions[str(exp.id)]
        if desc.strip() and not _has_number(desc):
            changes.append({
                "type": "quantify_suggestion",
                "experience_id": str(exp.id),
                "experience_title": exp.title,
                "message": (
                    f"Your '{exp.title}' bullet has no measurable outcome — consider adding a number "
                    "(team size, % improvement, users served, requests/sec, etc.)."
                ),
            })
            quantify_count += 1

    optimized_skills = list(profile.skills or []) + added_skills
    optimized_skills_categorized = skill_service.categorize_skills(optimized_skills)
    job_skill_set = matched_lower | missing_lower
    for category, terms in optimized_skills_categorized.items():
        optimized_skills_categorized[category] = sorted(terms, key=lambda t: t.lower() not in job_skill_set)
    if added_skills or matched_lower:
        changes.append({
            "type": "skills_reordered",
            "message": "Skills reordered within each category so job-relevant keywords appear first.",
        })

    optimized_experience = [
        {
            "id": str(exp.id),
            "title": exp.title,
            "company": exp.company,
            "start_date": exp.start_date.isoformat() if exp.start_date else None,
            "end_date": exp.end_date.isoformat() if exp.end_date else None,
            "description": optimized_descriptions[str(exp.id)],
        }
        for exp in experiences
    ]

    resume_text_before = _resume_text(profile)
    resume_text_after = " ".join(
        optimized_skills
        + ([profile.desired_title] if profile.desired_title else [])
        + [d["description"] for d in optimized_experience if d["description"]]
        + [d["title"] for d in optimized_experience]
    )

    text_before = _text_similarity_batch(resume_text_before, [job_text])[0]
    text_after = _text_similarity_batch(resume_text_after, [job_text])[0]
    semantic_before = (await _semantic_similarity_batch(resume_text_before, [job_text]))[0]
    semantic_after = (await _semantic_similarity_batch(resume_text_after, [job_text]))[0]
    optimized_skill_score = (
        len(job_skill_set & {s.lower() for s in optimized_skills}) / len(job_skill_set) if job_skill_set else 0.0
    )

    return {
        "score_before": _blend(skill_score, text_before, semantic_before),
        "score_after": _blend(optimized_skill_score, text_after, semantic_after),
        "changes": changes,
        "optimized_skills_categorized": optimized_skills_categorized,
        "optimized_experience": optimized_experience,
    }
