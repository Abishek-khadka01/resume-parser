from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.services.job_service import JobSearchError, get_job_details, search_jobs
from app.services import ats_service, suggestion_service

router = APIRouter()

_EXPERIENCE_LEVEL_KEYWORDS = {
    "entry": ("junior", "entry level", "entry-level", "associate", "new grad", "graduate"),
    "mid": ("mid level", "mid-level", "intermediate"),
    "senior": ("senior", "staff", "principal", "lead", "sr."),
    "lead": ("lead", "manager", "head of", "director"),
}


def _matches_experience_level(job: dict, levels: list[str]) -> bool:
    text = f"{job.get('job_title', '')} {job.get('job_description', '')}".lower()
    for level in levels:
        keywords = _EXPERIENCE_LEVEL_KEYWORDS.get(level.strip().lower())
        if keywords and any(kw in text for kw in keywords):
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

    try:
        jobs, next_cursor = await search_jobs(
            query=query,
            location=search_location,
            date_posted=date_posted,
            remote_jobs_only=remote_only or None,
            employment_types=employment_types,
            cursor=cursor,
        )
    except JobSearchError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    if experience_level:
        levels = [lvl for lvl in experience_level.split(",") if lvl.strip()]
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

    analysis = ats_service.analyze_job(job, profile)
    suggestions = suggestion_service.generate_suggestions(job, profile, analysis)

    return {**analysis, "suggestions": suggestions}
