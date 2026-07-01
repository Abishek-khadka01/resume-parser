from fastapi import APIRouter, Body, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.profile import Profile, WorkExperience, Education
from app.schemas.profile import ProfileOut
from app.services.ai_service import parse_resume_text
from app.services.profile_service import calculate_completeness
from app.services import skill_service, pdf_service
import io

router = APIRouter()


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

    parsed = await parse_resume_text(text)

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    for field in ("full_name", "phone", "linkedin_url", "location", "skills"):
        val = parsed.get(field)
        if val:
            setattr(profile, field, val)

    if parsed.get("skills"):
        profile.skills_categorized = skill_service.categorize_skills(parsed["skills"])

    db.query(WorkExperience).filter(WorkExperience.profile_id == profile.id).delete()
    for exp in parsed.get("work_experience", []):
        db.add(WorkExperience(profile_id=profile.id, **exp))

    db.query(Education).filter(Education.profile_id == profile.id).delete()
    for edu in parsed.get("education", []):
        db.add(Education(profile_id=profile.id, **edu))

    profile.completeness_pct = calculate_completeness(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/enhanced-pdf")
def download_enhanced_resume(
    accepted_suggestions: list[dict] | None = Body(default=None, embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi.responses import Response

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    pdf_bytes = pdf_service.build_enhanced_resume_pdf(profile, accepted_suggestions)
    filename = f"{(profile.full_name or 'resume').replace(' ', '_')}_resume.pdf"
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
