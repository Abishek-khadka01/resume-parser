import io

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

_styles = getSampleStyleSheet()
_HEADING = ParagraphStyle("SectionHeading", parent=_styles["Heading2"], spaceBefore=12, spaceAfter=4)
_NAME = ParagraphStyle("Name", parent=_styles["Title"], alignment=0)
_BODY = _styles["Normal"]


def _merge_accepted_skills(categorized: dict, accepted_suggestions: list[dict] | None) -> dict:
    merged = {cat: list(terms) for cat, terms in (categorized or {}).items()}
    for suggestion in accepted_suggestions or []:
        if suggestion.get("type") != "missing_skill":
            continue
        category = suggestion.get("category", "uncategorized")
        keyword = suggestion.get("keyword")
        if not keyword:
            continue
        merged.setdefault(category, [])
        if keyword not in merged[category]:
            merged[category].append(keyword)
    return merged


def build_enhanced_resume_pdf(profile, accepted_suggestions: list[dict] | None = None) -> bytes:
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

    skills_categorized = _merge_accepted_skills(
        getattr(profile, "skills_categorized", None) or {}, accepted_suggestions
    )
    if not skills_categorized and profile.skills:
        skills_categorized = {"skills": list(profile.skills)}
    if skills_categorized:
        story.append(Paragraph("Skills", _HEADING))
        for category, terms in skills_categorized.items():
            if not terms:
                continue
            label = category.replace("_", " ").title()
            story.append(Paragraph(f"<b>{label}:</b> {', '.join(terms)}", _BODY))

    if profile.work_experience:
        story.append(Paragraph("Work Experience", _HEADING))
        for exp in profile.work_experience:
            dates = f"{exp.start_date or ''} - {exp.end_date or 'Present'}"
            story.append(Paragraph(f"<b>{exp.title}</b>, {exp.company} ({dates})", _BODY))
            if exp.description:
                story.append(Paragraph(exp.description, _BODY))
            story.append(Spacer(1, 6))

    if profile.education:
        story.append(Paragraph("Education", _HEADING))
        for edu in profile.education:
            line = ", ".join(
                b for b in (edu.degree, edu.field, edu.institution, str(edu.graduation_year or "")) if b
            )
            story.append(Paragraph(line, _BODY))

    doc.build(story)
    return buffer.getvalue()
