MAX_SUGGESTIONS = 8

_MISSING_SKILL_MESSAGE = (
    "This job emphasizes '{keyword}' — consider adding it to your skills or work experience if applicable."
)
_UNDEREMPHASIZED_MESSAGE = (
    "You list '{keyword}' as a skill, but it doesn't appear in your work experience descriptions "
    "— consider adding a concrete example of using it."
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

    exp_text = _work_experience_text(profile)
    for skill in profile.skills or []:
        if skill.strip() and skill.strip().lower() not in exp_text:
            suggestions.append(
                {
                    "type": "underemphasized_skill",
                    "category": "uncategorized",
                    "keyword": skill,
                    "message": _UNDEREMPHASIZED_MESSAGE.format(keyword=skill),
                }
            )

    return suggestions[:MAX_SUGGESTIONS]
