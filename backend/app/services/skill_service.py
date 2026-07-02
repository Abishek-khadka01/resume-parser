import json
import re
from pathlib import Path

import spacy
from spacy.matcher import PhraseMatcher

_GAZETTEER_PATH = Path(__file__).resolve().parent.parent / "data" / "skills_gazetteer.json"

with open(_GAZETTEER_PATH, encoding="utf-8") as f:
    _GAZETTEER: dict[str, list[dict]] = json.load(f)

_nlp = spacy.load("en_core_web_sm", disable=["parser", "ner"])

_matcher = PhraseMatcher(_nlp.vocab, attr="LOWER")
_match_id_to_category: dict[int, str] = {}
_match_id_to_term: dict[int, str] = {}
_term_to_category_canonical: dict[str, tuple[str, str]] = {}

for category, entries in _GAZETTEER.items():
    for entry in entries:
        term = entry["term"]
        variants = [term, *entry.get("synonyms", [])]
        patterns = [_nlp.make_doc(v) for v in variants]
        match_id = _nlp.vocab.strings[f"{category}:{term}"]
        _matcher.add(f"{category}:{term}", patterns)
        for v in variants:
            _term_to_category_canonical[v.lower()] = (category, term)
        _match_id_to_category[match_id] = category
        _match_id_to_term[match_id] = term


def _categorize_one(skill: str) -> tuple[str, str] | None:
    key = skill.strip().lower()
    if not key:
        return None
    direct = _term_to_category_canonical.get(key)
    if direct:
        return direct

    doc = _nlp.make_doc(skill)
    matches = _matcher(doc)
    if matches:
        match_id, _, _ = matches[0]
        return _match_id_to_category[match_id], _match_id_to_term[match_id]
    return None


def categorize_skills(skills: list[str]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {cat: [] for cat in _GAZETTEER}
    result["uncategorized"] = []
    seen: set[tuple[str, str]] = set()

    for skill in skills:
        match = _categorize_one(skill)
        if match:
            category, canonical = match
            if (category, canonical) not in seen:
                result[category].append(canonical)
                seen.add((category, canonical))
        else:
            if skill.strip() and skill not in result["uncategorized"]:
                result["uncategorized"].append(skill.strip())

    return {cat: terms for cat, terms in result.items() if terms}


def extract_skills_from_text(text: str) -> dict[str, list[str]]:
    if not text:
        return {}
    doc = _nlp(text[:20000])
    matches = _matcher(doc)
    found: dict[str, set[str]] = {}
    for match_id, _, _ in matches:
        category = _match_id_to_category[match_id]
        term = _match_id_to_term[match_id]
        found.setdefault(category, set()).add(term)
    return {cat: sorted(terms) for cat, terms in found.items()}


def flatten(categorized: dict[str, list[str]]) -> set[str]:
    return {term.lower() for terms in categorized.values() for term in terms}


_LIST_DELIM_RE = re.compile(r"[•▪◦·∙‣⁃|,;\t]+|\s{2,}")
# Matches an inline category label a resume author put before a sub-list on
# the same line, e.g. "Cloud & DevOps: AWS, Azure, ..." or "Languages: Python,
# ..." — strip just the label, not the terms after the colon.
_CATEGORY_PREFIX_RE = re.compile(r"^[A-Za-z][A-Za-z &]{1,40}:\s*")
_SKILL_STOPWORDS = {
    "and", "or", "with", "in", "of", "the", "a", "an", "including", "such", "as",
    "skills", "technical", "technologies", "proficient", "familiar", "etc",
}


def split_skill_list(text: str) -> list[str]:
    """Tokenizes a Skills-section block into candidate skill strings.

    The gazetteer (PhraseMatcher) only recognizes a fixed vocabulary, so it
    silently drops any real skill outside that list. But a resume's own
    Skills section is almost always the author's own delimiter-separated
    list (bullets/commas/pipes) — trusting that structure, rather than only
    matching known terms, gets far higher recall without inventing a
    boundless keyword list. Categorization (known vs "uncategorized") still
    happens downstream via categorize_skills().

    Slashes are deliberately not treated as delimiters (unlike commas/pipes)
    since compound terms like "CI/CD" or "TCP/IP" would otherwise be split
    into meaningless halves.
    """
    items: list[str] = []
    for line in text.splitlines():
        line = _CATEGORY_PREFIX_RE.sub("", line.strip())
        for raw in _LIST_DELIM_RE.split(line):
            item = raw.strip(" :()-–—")
            if not item or len(item) < 2 or len(item) > 40:
                continue
            if item.lower() in _SKILL_STOPWORDS:
                continue
            if len(item.split()) > 4:
                continue
            items.append(item)
    return items
