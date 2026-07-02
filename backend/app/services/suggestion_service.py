from app.services.ats_service import _job_text

MAX_SUGGESTIONS = 8

_MISSING_SKILL_MESSAGE = (
    "This job emphasizes '{keyword}' — consider adding it to your skills or work experience if applicable."
)
_UNDEREMPHASIZED_MESSAGE = (
    "This job cares about '{keyword}', which you list as a skill, but it doesn't appear in your work "
    "experience descriptions — consider adding a concrete example of using it."
)


def _work_experience_text(profile) -> str:
    return " ".join((exp.description or "") for exp in profile.work_experience).lower()


def generate_suggestions(job: dict, profile, analysis: dict) -> list[dict]:
    suggestions: list[dict] = []

    missing_skills: dict[str, list[str]] = analysis.get("missing_skills", {})
    for category, keywords in missing_skills.items():
        for keyword in keywords:
            suggestions.append(
                {
                    "type": "missing_skill",
                    "category": category,
                    "keyword": keyword,
                    "message": _MISSING_SKILL_MESSAGE.format(keyword=keyword),
                }
            )

    # Only suggest emphasizing skills the job actually asks for (matched_skills =
    # job requirements ∩ profile skills), ranked by how often the job text mentions
    # them — not every unmentioned skill in the profile, which ignored the job
    # entirely and produced the same suggestions regardless of which job was open.
    exp_text = _work_experience_text(profile)
    job_text_lower = _job_text(job).lower()
    matched_skills: dict[str, list[str]] = analysis.get("matched_skills", {})
    underemphasized = [
        (category, term)
        for category, terms in matched_skills.items()
        for term in terms
        if term.strip() and term.strip().lower() not in exp_text
    ]
    underemphasized.sort(key=lambda ct: job_text_lower.count(ct[1].lower()), reverse=True)
    for category, term in underemphasized:
        suggestions.append(
            {
                "type": "underemphasized_skill",
                "category": category,
                "keyword": term,
                "message": _UNDEREMPHASIZED_MESSAGE.format(keyword=term),
            }
        )

    return suggestions[:MAX_SUGGESTIONS]
