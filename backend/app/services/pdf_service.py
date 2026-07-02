import io
from xml.sax.saxutils import escape

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

_styles = getSampleStyleSheet()
_HEADING = ParagraphStyle("SectionHeading", parent=_styles["Heading2"], spaceBefore=12, spaceAfter=4)
_NAME = ParagraphStyle("Name", parent=_styles["Title"], alignment=0)
_BODY = _styles["Normal"]
_SMALL_NOTE = ParagraphStyle("SmallNote", parent=_styles["Normal"], fontSize=8, textColor="#888888", spaceAfter=6)


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
            story.append(Paragraph(f"<b>{label}:</b> {', '.join(terms)}", _BODY))

    optimized_experience = optimization.get("optimized_experience") or []
    if optimized_experience:
        story.append(Paragraph("Work Experience", _HEADING))
        for exp in optimized_experience:
            dates = f"{exp.get('start_date') or ''} - {exp.get('end_date') or 'Present'}"
            story.append(Paragraph(f"<b>{exp['title']}</b>, {exp['company']} ({dates})", _BODY))
            if exp.get("description"):
                story.append(Paragraph(exp["description"], _BODY))
            story.append(Spacer(1, 6))

    if profile.education:
        story.append(Paragraph("Education", _HEADING))
        for edu in profile.education:
            line = ", ".join(
                b for b in (edu.degree, edu.field, edu.institution, str(edu.graduation_year or "")) if b
            )
            story.append(Paragraph(line, _BODY))

    # The sections above are built from structured fields the parser extracted
    # (name/contact/skills/experience/education) — sections it doesn't model,
    # like Projects or Certifications, would otherwise be silently dropped.
    # Appending the full original text guarantees nothing from the uploaded
    # resume is ever lost, even though it duplicates what's shown above.
    if profile.resume_raw_text:
        story.append(Paragraph("Original Resume (Full Text)", _HEADING))
        story.append(Paragraph(
            "Included in full below so no content from your uploaded resume is lost, "
            "even where it isn't reflected in the structured sections above.",
            _SMALL_NOTE,
        ))
        raw_html = escape(profile.resume_raw_text).replace("\n", "<br/>")
        story.append(Paragraph(raw_html, _BODY))

    doc.build(story)
    return buffer.getvalue()
