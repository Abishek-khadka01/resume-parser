"""Orchestrates the full non-prompting resume parsing pipeline.

Stage breakdown (see each module's docstring for the algorithm used):
  1. regex_extractor    - email, phone, links, date ranges (deterministic)
  2. section_segmenter   - splits the resume into named sections
                           (rule-based fuzzy match + TF-IDF/LogReg classifier)
  3. ner_extractor        - BERT-based NER for names/organizations/locations (DL)
  4. title_gazetteer      - closed-vocabulary lookup for job titles/degrees
  5. experience_parser    - per-role entries from the Experience section
  6. education_parser     - per-degree entries from the Education section
  7. skill_service         - PhraseMatcher gazetteer (existing project module,
                             reused as-is rather than duplicated)

Output shape matches app.services.ai_service.parse_resume_text() field-for-
field, so this is a drop-in alternative to the LLM-prompting based parser —
see the comparison note at the top of ai_service.py.
"""
import re

from app.ml_resume_parser import education_parser, experience_parser, ner_extractor, regex_extractor
from app.ml_resume_parser.section_segmenter import segment_resume
from app.services import skill_service

_CONTACT_LOCATION_RE = re.compile(r"\b([A-Z][a-zA-Z.]+(?:\s[A-Z][a-zA-Z.]+)?,\s*[A-Z]{2,})\b")


def _extract_full_name(contact_text: str, raw_text: str) -> str | None:
    names = ner_extractor.extract_person_names(contact_text)
    if names:
        return names[0]
    for line in raw_text.splitlines():
        if line.strip():
            return line.strip()
    return None


def _extract_skills(sections: dict[str, str], text: str) -> list[str]:
    skills_section = sections.get("skills", "")
    scan_text = skills_section or text
    gazetteer_hits = skill_service.extract_skills_from_text(scan_text)
    flat = {term for terms in gazetteer_hits.values() for term in terms}

    # The gazetteer alone only recognizes its fixed vocabulary. When there's
    # an actual Skills section, trust its own delimiter-separated structure
    # to catch everything else the author listed (see split_skill_list).
    if skills_section.strip():
        known_lower = {f.lower() for f in flat}
        for item in skill_service.split_skill_list(skills_section):
            if item.lower() not in known_lower:
                flat.add(item)
                known_lower.add(item.lower())

    return sorted(flat)


def _extract_location(contact_text: str) -> str | None:
    match = _CONTACT_LOCATION_RE.search(contact_text)
    if match:
        return match.group(1)
    locations = ner_extractor.extract_locations(contact_text)
    # A "City, ST" contact line is often split into two separate LOC
    # entities (e.g. "San Francisco" + "CA") rather than one — the regex
    # pass above already handles that common case, so this NER fallback
    # only fires when the regex didn't match at all; joining what NER found
    # is a reasonable best-effort rather than silently dropping the state.
    return ", ".join(locations[:2]) if locations else None


def parse_resume(text: str) -> dict:
    sections = segment_resume(text)
    contact_text = sections.get("contact", "")

    return {
        "full_name": _extract_full_name(contact_text, text),
        "phone": regex_extractor.extract_phone(contact_text) or regex_extractor.extract_phone(text),
        "linkedin_url": regex_extractor.extract_linkedin(text),
        "github_url": regex_extractor.extract_github(text),
        "location": _extract_location(contact_text),
        "summary": sections.get("summary") or None,
        "skills": _extract_skills(sections, text),
        "work_experience": experience_parser.parse(sections.get("experience", "")),
        "education": education_parser.parse(sections.get("education", "")),
    }
