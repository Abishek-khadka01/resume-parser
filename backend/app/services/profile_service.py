from app.models.profile import Profile

REQUIRED_FIELDS = [
    "full_name", "location", "experience_level", "skills",
]


def calculate_completeness(profile: Profile) -> int:
    filled = sum(
        1 for f in REQUIRED_FIELDS
        if getattr(profile, f, None) not in (None, [], "")
    )
    has_exp = bool(profile.work_experience)
    has_edu = bool(profile.education)
    total = len(REQUIRED_FIELDS) + 2
    score = (filled + int(has_exp) + int(has_edu)) / total
    return round(score * 100)
