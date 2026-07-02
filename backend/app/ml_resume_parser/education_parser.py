"""Splits the Education section into per-degree entries and extracts fields.

Same entry-boundary idea as experience_parser.py, but keyed off degree-name
gazetteer matches instead of date ranges — education entries frequently list
only a single graduation year (not a range), so date-range detection isn't a
reliable boundary here.
"""
import re

from app.ml_resume_parser import ner_extractor, regex_extractor
from app.ml_resume_parser.title_gazetteer import DEGREE_KEYWORDS, find_longest_match

_FIELD_OF_STUDY_RE = re.compile(r"\bin\s+([A-Za-z][A-Za-z &,-]{2,40})", re.IGNORECASE)


def _split_entries(section_text: str) -> list[str]:
    lines = section_text.splitlines()
    start_indices = [i for i, line in enumerate(lines) if find_longest_match(line, DEGREE_KEYWORDS)]
    if not start_indices:
        return [section_text] if section_text.strip() else []
    blocks = []
    for idx, start in enumerate(start_indices):
        end = start_indices[idx + 1] if idx + 1 < len(start_indices) else len(lines)
        blocks.append("\n".join(lines[start:end]).strip())
    return blocks


def _extract_field(block: str) -> str | None:
    m = _FIELD_OF_STUDY_RE.search(block)
    if not m:
        return None
    field = m.group(1).strip(" .,")
    # avoid swallowing trailing institution/date text the regex over-matched
    return field.split(",")[0].strip() or None


def _parse_entry(block: str) -> dict:
    degree = find_longest_match(block, DEGREE_KEYWORDS)
    orgs = ner_extractor.extract_organizations(block)
    years = regex_extractor.extract_years(block)

    return {
        "institution": orgs[0] if orgs else "Unknown",
        "degree": degree,
        "field": _extract_field(block),
        "graduation_year": years[-1] if years else None,
    }


def parse(section_text: str) -> list[dict]:
    if not section_text.strip():
        return []
    return [_parse_entry(block) for block in _split_entries(section_text) if block.strip()]
