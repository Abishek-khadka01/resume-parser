from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.services.job_service import JobSearchError, get_job_details, search_jobs
from app.services import ats_service, resume_optimizer_service, suggestion_service

router = APIRouter()

_EXPERIENCE_LEVEL_KEYWORDS = {
    "entry": (
        "junior", "entry level", "entry-level", "associate", "new grad",
        "new graduate", "recent graduate", "graduate", "fresher",
        "intern", "internship", "no experience", "0-1 year", "0-2 years",
    ),
    "mid": ("mid level", "mid-level", "intermediate"),
    "senior": ("senior", "staff", "principal", "lead", "sr."),
    "lead": ("lead", "manager", "head of", "director"),
}

_SENIOR_TITLE_KEYWORDS = ("senior", "staff", "principal", "sr.", "lead ", "director", "manager", "architect", "head of")

_JOB_REQUIREMENTS_BY_LEVEL = {
    "entry": "no_experience,under_3_years_experience",
}

_QUERY_BOOST_BY_LEVEL = {
    "entry": "entry level",
}


def _matches_experience_level(job: dict, levels: list[str]) -> bool:
    title = (job.get("job_title") or "").lower()
    text = f"{title} {job.get('job_description', '')}".lower()
    for level in levels:
        level = level.strip().lower()
        keywords = _EXPERIENCE_LEVEL_KEYWORDS.get(level)
        if not keywords:
            continue
        if level == "entry" and any(kw in title for kw in _SENIOR_TITLE_KEYWORDS):
            continue
        if any(kw in text for kw in keywords):
            return True
    return False


@router.get("/search")
async def get_jobs(
    q: str = Query(default=""),
    location: str | None = Query(default=None),
    date_posted: str = Query(default="all"),
    remote_only: bool = Query(default=False),
    employment_types: str | None = Query(default=None),
    experience_level: str | None = Query(default=None),
    cursor: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    query = q or (profile.desired_title if profile else "") or "software engineer"
    search_location = location
    if profile and not location and not q:
        search_location = profile.location

    levels = [lvl.strip().lower() for lvl in experience_level.split(",")] if experience_level else []
    levels = [lvl for lvl in levels if lvl]
    job_requirements = ",".join(
        {req for lvl in levels for req in [_JOB_REQUIREMENTS_BY_LEVEL.get(lvl)] if req}
    ) or None
    query_boost = " ".join({_QUERY_BOOST_BY_LEVEL[lvl] for lvl in levels if lvl in _QUERY_BOOST_BY_LEVEL})
    boosted_query = f"{query} {query_boost}".strip() if query_boost else query
    num_pages = 5 if query_boost else 3

    try:
        jobs, next_cursor = await search_jobs(
            query=boosted_query,
            location=search_location,
            date_posted=date_posted,
            remote_jobs_only=remote_only or None,
            employment_types=employment_types,
            job_requirements=job_requirements,
            cursor=cursor,
            num_pages=num_pages,
        )
        # JSearch has sparse-to-no listings for many locations outside the US/UK; a
        # location-scoped query can legitimately zero out even when the title alone
        # has plenty of matches. Broaden by dropping location rather than showing nothing.
        if not jobs and search_location and not cursor:
            jobs, next_cursor = await search_jobs(
                query=boosted_query,
                location=None,
                date_posted=date_posted,
                remote_jobs_only=remote_only or None,
                employment_types=employment_types,
                job_requirements=job_requirements,
                cursor=cursor,
                num_pages=num_pages,
            )
    except JobSearchError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    if levels:
        jobs = [job for job in jobs if _matches_experience_level(job, levels)]

    if profile and profile.skills:
        jobs = await ats_service.score_jobs_batch(jobs, profile)

    return {"jobs": jobs, "cursor": next_cursor}


@router.post("/ats-analysis")
async def ats_analysis(
    job: dict = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    job_id = job.get("job_id")
    if job_id:
        details = await get_job_details(job_id)
        if details:
            job = {**job, **details}

    analysis = await ats_service.analyze_job(job, profile)
    suggestions = suggestion_service.generate_suggestions(job, profile, analysis)

    return {**analysis, "suggestions": suggestions}


@router.post("/optimize-resume")
async def optimize_resume(
    job: dict = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    job_id = job.get("job_id")
    if job_id:
        details = await get_job_details(job_id)
        if details:
            job = {**job, **details}

    return await resume_optimizer_service.optimize_resume(job, profile)
