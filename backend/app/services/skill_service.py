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
