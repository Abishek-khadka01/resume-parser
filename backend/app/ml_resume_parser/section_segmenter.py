"""Splits raw resume text into canonical sections.

Two-stage header detection:
  1. Rule-based fuzzy string match against known header synonyms
     (section_keywords.py) — high precision, handles the vast majority of
     real resumes since section headers are conventional.
  2. TF-IDF + Logistic Regression classifier fallback (section_classifier_
     train.py) — only consulted for short lines the rule-based pass
     couldn't confidently place, to catch header phrasing outside the
     known synonym list without letting a low-confidence ML guess override
     a clear non-match.
"""
import difflib
import re

from app.ml_resume_parser.section_classifier_train import load_or_train
from app.ml_resume_parser.section_keywords import SECTION_KEYWORDS

_classifier = None

_RULE_MATCH_THRESHOLD = 0.82
_CLASSIFIER_CONFIDENCE_THRESHOLD = 0.55
_MAX_HEADER_WORDS = 5
_MAX_HEADER_CHARS = 60


def _get_classifier():
    global _classifier
    if _classifier is None:
        _classifier = load_or_train()
    return _classifier


def _normalize(line: str) -> str:
    return re.sub(r"[^a-z\s]", "", line.lower()).strip()


def _rule_based_match(line: str) -> str | None:
    norm = _normalize(line)
    if not norm or len(norm.split()) > _MAX_HEADER_WORDS:
        return None
    best_section, best_ratio = None, 0.0
    for section, phrases in SECTION_KEYWORDS.items():
        for phrase in phrases:
            ratio = difflib.SequenceMatcher(None, norm, phrase).ratio()
            if ratio > best_ratio:
                best_ratio, best_section = ratio, section
    return best_section if best_ratio >= _RULE_MATCH_THRESHOLD else None


def classify_line(line: str) -> str | None:
    """Returns the canonical section name if `line` looks like a section
    header, else None."""
    stripped = line.strip()
    if not stripped or len(stripped) > _MAX_HEADER_CHARS:
        return None

    rule_match = _rule_based_match(stripped)
    if rule_match:
        return rule_match

    if len(stripped.split()) > _MAX_HEADER_WORDS:
        return None

    clf = _get_classifier()
    pred = clf.predict([stripped])[0]
    if pred == "body":
        return None
    confidence = clf.predict_proba([stripped]).max()
    return pred if confidence >= _CLASSIFIER_CONFIDENCE_THRESHOLD else None


def segment_resume(text: str) -> dict[str, str]:
    """Splits raw resume text into named sections. 'contact' holds
    everything before the first detected header — resumes conventionally
    open with name/contact info before any section header appears."""
    sections: dict[str, list[str]] = {"contact": []}
    current = "contact"

    for line in text.splitlines():
        header = classify_line(line)
        if header:
            current = header
            sections.setdefault(current, [])
            continue
        sections.setdefault(current, []).append(line)

    return {section: "\n".join(chunk).strip() for section, chunk in sections.items()}
