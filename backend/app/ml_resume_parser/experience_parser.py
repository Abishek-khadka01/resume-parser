"""Splits the Experience section into per-role entries and extracts fields.

Entry boundaries are found deterministically: a resume's work-experience
entries almost always put the date range on the same line as (or the line
directly following) the title/company header, so any line containing a date
range regex match marks the start of a new entry. Within each entry block,
company/title are extracted via NER + gazetteer, matching the same
resume-header line the date range was found on.
"""
import re

from app.ml_resume_parser import ner_extractor, regex_extractor
from app.ml_resume_parser.title_gazetteer import JOB_TITLE_KEYWORDS, find_longest_match


def _split_entries(section_text: str) -> list[str]:
    lines = section_text.splitlines()
    start_indices = [i for i, line in enumerate(lines) if regex_extractor.extract_date_ranges(line)]
    if not start_indices:
        return [section_text] if section_text.strip() else []
    blocks = []
    for idx, start in enumerate(start_indices):
        end = start_indices[idx + 1] if idx + 1 < len(start_indices) else len(lines)
        blocks.append("\n".join(lines[start:end]).strip())
    return blocks


def _header_line(block: str) -> str:
    for line in block.splitlines():
        if line.strip():
            return line.strip()
    return ""


def _fallback_company(header_line: str, title: str | None) -> str | None:
    text = re.sub(r"[()]", "", header_line)
    for match in regex_extractor.extract_date_ranges(header_line):
        text = text.replace(match.raw, "")
    if title:
        text = re.sub(re.escape(title), "", text, flags=re.IGNORECASE)
    parts = [p.strip(" .-") for p in re.split(r",| at |–|—| - ", text) if p.strip(" .-")]
    # Prefer the longest remaining fragment, not the first: once the title's
    # own text is stripped out, a stray leftover word (e.g. "Intern" left
    # over from "Software Engineer Intern, Acme Corp") can end up first but
    # the company name is reliably the longer fragment.
    return max(parts, key=len) if parts else None


def _extract_title(header: str) -> str | None:
    title = find_longest_match(header, JOB_TITLE_KEYWORDS)
    if title and re.search(r"\bintern\b", header, re.IGNORECASE) and "intern" not in title.lower():
        title = f"{title} Intern"
    return title


def _parse_entry(block: str) -> dict:
    header = _header_line(block)
    date_matches = regex_extractor.extract_date_ranges(block)
    start_date = date_matches[0].start_date if date_matches else None
    end_date = date_matches[0].end_date if date_matches else None

    title = _extract_title(header)

    # NER can mis-tag a capitalized non-org phrase (e.g. "Machine Learning")
    # as ORG with low confidence; discard a candidate that's just the title
    # text before trusting it, rather than only relying on score ranking.
    company = None
    for candidate in ner_extractor.extract_organizations(header):
        if not title or candidate.lower() not in title.lower():
            company = candidate
            break
    if not company:
        company = _fallback_company(header, title)

    body_lines = [ln for ln in block.splitlines()[1:] if ln.strip()]
    description = " ".join(body_lines).strip() or None

    return {
        "company": company or "Unknown",
        "title": title or "Unknown",
        "start_date": start_date,
        "end_date": end_date,
        "description": description,
    }


def parse(section_text: str) -> list[dict]:
    if not section_text.strip():
        return []
    return [_parse_entry(block) for block in _split_entries(section_text) if block.strip()]
