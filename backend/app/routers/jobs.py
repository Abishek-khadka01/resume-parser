from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.services.job_service import JobSearchError, search_jobs
from app.services.ai_service import score_jobs_batch

router = APIRouter()


@router.get("/linkedin")
async def get_jobs(
    q: str = Query(default=""),
    title: str | None = Query(default=None),
    location: str | None = Query(default=None),
    time_frame: str = Query(default="24h"),
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    description_format: str = Query(default="text"),
    title_advanced: str | None = Query(default=None),
    description_advanced: str | None = Query(default=None),
    location_advanced: str | None = Query(default=None),
    organization_advanced: str | None = Query(default=None),
    organization: str | None = Query(default=None),
    organization_slug: str | None = Query(default=None),
    seniority: str | None = Query(default=None),
    ai_experience_level: str | None = Query(default=None),
    ai_work_arrangement: str | None = Query(default=None),
    ai_employment_type: str | None = Query(default=None),
    has_salary: bool | None = Query(default=None),
    organization_agency: str | None = Query(default=None),
    direct_apply: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    query = title or q or (profile.desired_title if profile else "") or ""
    search_location = location
    if profile and not location and not q and not title and not location_advanced:
        search_location = profile.location

    try:
        jobs = await search_jobs(
            query=query,
            location=search_location,
            time_frame=time_frame,
            limit=limit,
            offset=offset,
            description_format=description_format,
            title_advanced=title_advanced,
            description_advanced=description_advanced,
            location_advanced=location_advanced,
            organization_advanced=organization_advanced,
            organization=organization,
            organization_slug=organization_slug,
            seniority=seniority,
            ai_experience_level=ai_experience_level,
            ai_work_arrangement=ai_work_arrangement,
            ai_employment_type=ai_employment_type,
            has_salary=has_salary,
            organization_agency=organization_agency,
            direct_apply=direct_apply,
        )
    except JobSearchError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    if profile and profile.skills:
        jobs = await score_jobs_batch(jobs, profile)

    return jobs
