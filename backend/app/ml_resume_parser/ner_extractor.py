"""Deep learning entity extraction via a pretrained BERT token-classifier.

Uses `dslim/bert-base-NER` — BERT-base fine-tuned on CoNLL-2003 — to
recognize PERSON, ORGANIZATION, and LOCATION spans (F1 ~91% on its
benchmark). This is the DL component of the pipeline: regex handles fully-
regular fields (email/phone/dates) and a gazetteer handles the closed-
vocabulary skill list; NER is reserved for genuinely ambiguous free-text
entities — names, companies, institutions — where no fixed pattern or
vocabulary can reliably capture every variant a candidate might write.

No fine-tuning was done here (no labeled resume-NER dataset was available
in this project) — this reuses the pretrained weights as-is. Fine-tuning on
a resume-specific dataset (e.g. Kaggle's "resume-entities-for-ner") would be
the natural next step to push accuracy further, at the cost of needing a
labeled corpus and a training run.
"""
from transformers import pipeline

_ner_pipeline = None


def _get_pipeline():
    global _ner_pipeline
    if _ner_pipeline is None:
        _ner_pipeline = pipeline(
            "ner",
            model="dslim/bert-base-NER",
            aggregation_strategy="simple",
        )
    return _ner_pipeline


def extract_entities(text: str) -> list[dict]:
    if not text.strip():
        return []
    pipe = _get_pipeline()
    # BERT's ~512-token context window; truncate defensively for long sections.
    return pipe(text[:3000])


def _by_group_sorted_by_confidence(text: str, group: str) -> list[str]:
    # Callers generally want "the most likely X", not "the first X token
    # position" — a low-confidence false positive (e.g. "Machine Learning"
    # tagged ORG) can appear earlier in the text than the correct, more
    # confident entity, so rank by score rather than trusting text order.
    entities = [e for e in extract_entities(text) if e["entity_group"] == group]
    entities.sort(key=lambda e: e["score"], reverse=True)
    return [e["word"] for e in entities]


def extract_person_names(text: str) -> list[str]:
    return _by_group_sorted_by_confidence(text, "PER")


def extract_organizations(text: str) -> list[str]:
    return _by_group_sorted_by_confidence(text, "ORG")


def extract_locations(text: str) -> list[str]:
    return _by_group_sorted_by_confidence(text, "LOC")
