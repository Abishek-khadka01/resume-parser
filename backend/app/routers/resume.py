from fastapi import APIRouter, Body, Depends, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.profile import Profile, WorkExperience, Education
from app.schemas.profile import ProfileOut
# ai_service.parse_resume_text (LLM prompting) stays available and unchanged;
# the live endpoint below currently calls the non-prompting ML pipeline
# instead — see app/ml_resume_parser/README.md for the algorithm rationale.
from app.services.ai_service import parse_resume_text  # noqa: F401  (kept as the prompting-based alternative)
from app.ml_resume_parser.pipeline import parse_resume as parse_resume_ml
from app.services.job_service import get_job_details
from app.services.profile_service import calculate_completeness
from app.services import skill_service, pdf_service, resume_optimizer_service
import io

router = APIRouter()

LOCKABLE_FIELDS = ("full_name", "phone", "linkedin_url", "github_url", "location", "summary", "skills")


@router.post("/upload", response_model=ProfileOut)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ("application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted")

    content = await file.read()
    text = _extract_text(content, file.content_type)

    # Blocking (regex/sklearn/torch) work, so run off the event loop.
    parsed = await run_in_threadpool(parse_resume_ml, text)

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    profile.resume_raw_text = text

    for field in ("full_name", "phone", "linkedin_url", "github_url", "location", "summary", "skills"):
        val = parsed.get(field)
        if val:
            setattr(profile, field, val)

    if parsed.get("skills"):
        profile.skills_categorized = skill_service.categorize_skills(parsed["skills"])

    newly_locked = {f for f in LOCKABLE_FIELDS if parsed.get(f)}
    profile.resume_locked_fields = sorted(set(profile.resume_locked_fields or []) | newly_locked)
    profile.resume_uploaded = True

    # desired_title has no manual UI field anymore — derive it from the most
    # recent role so job search/ATS scoring (which read profile.desired_title)
    # keep working off the resume itself instead of a form nobody fills in.
    work_experience = parsed.get("work_experience", [])
    if not profile.desired_title and work_experience:
        profile.desired_title = work_experience[0].get("title") or profile.desired_title

    db.query(WorkExperience).filter(WorkExperience.profile_id == profile.id).delete()
    for exp in work_experience:
        db.add(WorkExperience(profile_id=profile.id, **exp))

    db.query(Education).filter(Education.profile_id == profile.id).delete()
    for edu in parsed.get("education", []):
        db.add(Education(profile_id=profile.id, **edu))

    # calculate_completeness reads profile.work_experience/education off the
    # ORM relationship — flush so it sees the rows just added above instead
    # of whatever was (or wasn't) loaded before this request's inserts.
    db.flush()
    profile.completeness_pct = calculate_completeness(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/optimized-pdf")
async def download_optimized_resume(
    job: dict = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi.responses import Response

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    job_id = job.get("job_id")
    if job_id:
        details = await get_job_details(job_id)
        if details:
            job = {**job, **details}

    optimization = await resume_optimizer_service.optimize_resume(job, profile)
    pdf_bytes = pdf_service.build_optimized_resume_pdf(profile, optimization)
    filename = f"{(profile.full_name or 'resume').replace(' ', '_')}_optimized_resume.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _extract_text(content: bytes, mime: str) -> str:
    if mime == "application/pdf":
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    from docx import Document
    doc = Document(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs)
