import io
import re

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem

_styles = getSampleStyleSheet()
_HEADING = ParagraphStyle("SectionHeading", parent=_styles["Heading2"], spaceBefore=12, spaceAfter=4)
_NAME = ParagraphStyle("Name", parent=_styles["Title"], alignment=0)
_BODY = _styles["Normal"]
_BULLET_TEXT = ParagraphStyle("BulletText", parent=_BODY, spaceAfter=2)


def _split_sentences(text: str) -> list[str]:
    if not text:
        return []
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s.strip()]


def _bullet_list(items: list[str]) -> ListFlowable:
    return ListFlowable(
        [ListItem(Paragraph(item, _BULLET_TEXT), spaceAfter=2) for item in items],
        bulletType="bullet",
        leftIndent=16,
        spaceBefore=2,
        spaceAfter=6,
    )


def build_optimized_resume_pdf(profile, optimization: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=LETTER,
        leftMargin=0.75 * inch, rightMargin=0.75 * inch,
        topMargin=0.75 * inch, bottomMargin=0.75 * inch,
    )
    story = []

    story.append(Paragraph(profile.full_name or "Resume", _NAME))
    contact_bits = [b for b in (profile.phone, profile.linkedin_url, profile.location) if b]
    if contact_bits:
        story.append(Paragraph(" | ".join(contact_bits), _BODY))

    if profile.desired_title:
        story.append(Paragraph("Summary", _HEADING))
        story.append(Paragraph(profile.desired_title, _BODY))

    skills_categorized = optimization.get("optimized_skills_categorized") or {}
    if skills_categorized:
        story.append(Paragraph("Skills", _HEADING))
        for category, terms in skills_categorized.items():
            if not terms:
                continue
            label = category.replace("_", " ").title()
            story.append(Paragraph(f"<b>{label}</b>", _BODY))
            story.append(_bullet_list(terms))

    optimized_experience = optimization.get("optimized_experience") or []
    if optimized_experience:
        story.append(Paragraph("Work Experience", _HEADING))
        for exp in optimized_experience:
            dates = f"{exp.get('start_date') or ''} - {exp.get('end_date') or 'Present'}"
            story.append(Paragraph(f"<b>{exp['title']}</b>, {exp['company']} ({dates})", _BODY))
            bullets = _split_sentences(exp.get("description") or "")
            if bullets:
                story.append(_bullet_list(bullets))
            story.append(Spacer(1, 6))

    if profile.education:
        story.append(Paragraph("Education", _HEADING))
        edu_lines = [
            ", ".join(b for b in (edu.degree, edu.field, edu.institution, str(edu.graduation_year or "")) if b)
            for edu in profile.education
        ]
        story.append(_bullet_list([line for line in edu_lines if line]))

    doc.build(story)
    return buffer.getvalue()
