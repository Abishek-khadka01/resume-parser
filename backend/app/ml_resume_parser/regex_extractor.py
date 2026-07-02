"""Deterministic field extraction via regular expressions.

Email addresses, phone numbers, LinkedIn/GitHub URLs, and date ranges are
highly regular in structure — regex extraction gets near-100% precision on
these, and there is no accuracy to be gained by routing them through a
statistical model. Reserve ML/DL for fields that are genuinely ambiguous
(names, organizations, job titles) — see ner_extractor.py.
"""
import re
from datetime import date

_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")

_PHONE_RE = re.compile(
    r"(?:\+\d{1,3}[\s.-]?)?"
    r"(?:\(\d{2,4}\)|\d{2,4})[\s.-]?"
    r"\d{3,4}[\s.-]?\d{3,4}"
)

_LINKEDIN_RE = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+/?", re.IGNORECASE)
_GITHUB_RE = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[\w-]+/?", re.IGNORECASE)

_MONTH = r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?"
_YEAR = r"(?:19|20)\d{2}"
_MONTH_YEAR = rf"(?:{_MONTH}\.?\s+{_YEAR}|{_YEAR})"
_PRESENT = r"(?:Present|Current|Now|Ongoing)"

_DATE_RANGE_RE = re.compile(
    rf"(?P<start>{_MONTH_YEAR})\s*(?:-|–|—|to)\s*(?P<end>{_MONTH_YEAR}|{_PRESENT})",
    re.IGNORECASE,
)

_MONTH_NUM = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def extract_email(text: str) -> str | None:
    m = _EMAIL_RE.search(text)
    return m.group(0) if m else None


def extract_phone(text: str) -> str | None:
    for m in _PHONE_RE.finditer(text):
        digits = re.sub(r"\D", "", m.group(0))
        if 7 <= len(digits) <= 15:
            return m.group(0).strip()
    return None


def extract_linkedin(text: str) -> str | None:
    m = _LINKEDIN_RE.search(text)
    return m.group(0) if m else None


def extract_github(text: str) -> str | None:
    m = _GITHUB_RE.search(text)
    return m.group(0) if m else None


def _parse_month_year(raw: str) -> date | None:
    raw = raw.strip().rstrip(".")
    if re.fullmatch(_YEAR, raw):
        return date(int(raw), 1, 1)
    parts = raw.split()
    if len(parts) == 2:
        month_key = parts[0][:3].lower()
        month = _MONTH_NUM.get(month_key)
        if month and re.fullmatch(_YEAR, parts[1]):
            return date(int(parts[1]), month, 1)
    return None


class DateRangeMatch:
    __slots__ = ("start_date", "end_date", "span_start", "span_end", "raw")

    def __init__(self, start_date: date | None, end_date: date | None, span_start: int, span_end: int, raw: str):
        self.start_date = start_date
        self.end_date = end_date
        self.span_start = span_start
        self.span_end = span_end
        self.raw = raw


def extract_date_ranges(text: str) -> list[DateRangeMatch]:
    """Finds every 'Month YYYY - Month YYYY' / 'YYYY - Present' style range.

    Positions (span_start/span_end) are returned alongside the parsed dates so
    experience_parser.py can use them as entry boundaries within a block of
    unstructured resume text.
    """
    matches = []
    for m in _DATE_RANGE_RE.finditer(text):
        start = _parse_month_year(m.group("start"))
        end_raw = m.group("end")
        end = None if re.match(_PRESENT, end_raw, re.IGNORECASE) else _parse_month_year(end_raw)
        matches.append(DateRangeMatch(start, end, m.start(), m.end(), m.group(0)))
    return matches


def extract_years(text: str) -> list[int]:
    return sorted({int(y) for y in re.findall(_YEAR, text)})
