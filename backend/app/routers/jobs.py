from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.services.job_service import search_jobs
from app.services.ai_service import score_jobs_batch

router = APIRouter()


@router.get("/search")
async def get_jobs(
    q: str = Query(default=""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()

    query = q or (profile.desired_title or "") if profile else q
    location = profile.location if profile and not q else None

    jobs = await search_jobs(query=query, location=location)

    if profile and profile.skills:
        jobs = await score_jobs_batch(jobs, profile)

    return jobs
