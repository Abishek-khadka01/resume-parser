# Non-Prompting Resume Parser

An alternative to `app/services/ai_service.py`'s LLM-prompting resume parser.
This package extracts the same structured fields (name, phone, LinkedIn URL,
location, skills, work experience, education) using classical NLP + ML + DL
algorithms instead of an LLM prompt — no external API call, deterministic
where the field allows it, and free to run at inference time.

It is **not** wired into the live `/api/resume/upload` endpoint — it's a
standalone, independently testable pipeline (see `demo.py`) kept alongside
the production prompting-based parser for comparison.

## Why not just use one algorithm for everything?

Resume parsing isn't one problem — it's several different problems bundled
together, and each has a different "right tool":

| Field type | Why | Algorithm used |
|---|---|---|
| Email, phone, LinkedIn/GitHub URL, date ranges | Highly regular string format | **Regex** — near-100% precision, zero training needed |
| Skills | Closed, curated vocabulary (already exists in this project) | **Gazetteer / PhraseMatcher** (`app/services/skill_service.py`, reused as-is) |
| Job titles, degree names | Semi-closed vocabulary (a few hundred common phrasings cover most resumes) | **Gazetteer lookup** (`title_gazetteer.py`) |
| Section headers ("Experience", "Skills", ...) | Mostly conventional, but candidates phrase them inconsistently | **TF-IDF + Logistic Regression** classifier, with a rule-based fuzzy-match pass first (`section_segmenter.py`) |
| Person names, company names, institution names | Genuinely open-vocabulary, free text | **Deep learning**: pretrained BERT NER (`ner_extractor.py`) |

Using an LLM (or a single large NER model) for *everything* — including the
fields regex already solves perfectly — is accuracy left on the table for no
reason: regex doesn't hallucinate an email address, an LLM occasionally
does.

## Pipeline stages

```
resume text
    │
    ├─► regex_extractor.py     ── email / phone / links / date ranges
    │
    ├─► section_segmenter.py   ── splits text into contact / summary / skills /
    │                              experience / education / projects / certifications
    │       │
    │       └─► section_classifier_train.py  (TF-IDF char-ngrams + LogisticRegression,
    │                                          trained from section_keywords.py's
    │                                          synonym list — see below)
    │
    ├─► ner_extractor.py       ── BERT (dslim/bert-base-NER) → PERSON / ORG / LOCATION
    │
    ├─► experience_parser.py   ── splits Experience section into per-role entries via
    │                              date-range boundaries, extracts company (NER) +
    │                              title (gazetteer) per entry
    │
    ├─► education_parser.py    ── splits Education section into per-degree entries via
    │                              degree-keyword boundaries, extracts institution (NER)
    │                              + degree/field/year (gazetteer + regex)
    │
    └─► skill_service.py       ── existing PhraseMatcher gazetteer (unchanged, reused)

    → pipeline.py assembles all of the above into the same JSON shape
      ai_service.parse_resume_text() returns.
```

## The ML/DL algorithms in more depth

**Section classifier (`section_classifier_train.py`)** — a genuine classical
ML component, not just regex. No labeled resume-section dataset was
available, so training data is bootstrapped ("weak supervision") from a
seed synonym list (`section_keywords.py`) plus generated negative examples
that are deliberately short and header-*shaped* (dates, job titles, contact
lines) so the model can't just learn "short line = header". Character
n-gram TF-IDF (not word n-gram) is used specifically so the model
generalizes to header phrasing it never saw verbatim — e.g. it correctly
classifies "Employment Background" as an EXPERIENCE header despite that
exact phrase never appearing in training, because it shares character
sub-sequences with "Employment History". Run
`python -m app.ml_resume_parser.section_classifier_train` directly to see a
sanity check against held-out phrasing and the model's confidence.

**NER (`ner_extractor.py`)** — the deep learning component. Uses
`dslim/bert-base-NER`, BERT-base fine-tuned on CoNLL-2003 (reported F1
~91% on that benchmark for PER/ORG/LOC/MISC). Used as-is, pretrained, no
fine-tuning — this project has no labeled resume-NER corpus to fine-tune
on. Fine-tuning on a resume-specific dataset (e.g. Kaggle's
"resume-entities-for-ner", which has ~10 entity types including Name,
Designation, Companies worked at, Degree, College Name) would be the
natural next step for a stronger version of this project, and is called
out explicitly as future work rather than silently skipped.

## Accuracy vs. speed tradeoffs

- Regex fields (email/phone/links/dates): effectively 100% precision on
  well-formed input, and this never changes regardless of model choice.
- Section segmentation: high precision for conventional headers via the
  rule-based pass; the ML fallback trades some precision for recall on
  unconventional phrasing.
- NER-based name/company/institution extraction: bounded by the pretrained
  model's accuracy on resume text, which differs from its CoNLL-2003
  training distribution (news text) — this is the weakest link, and the
  most honest place to say "fine-tuning on resume data would help."
- Speed: everything after the first pipeline run is CPU-only and doesn't
  make a network call, unlike the prompting-based parser which round-trips
  to OpenRouter/Groq. The BERT NER pass is the slowest single step
  (~1-2s per resume on CPU); the section classifier and gazetteers are
  effectively instant.

## Try it

```bash
cd backend
venv/Scripts/python.exe -m app.ml_resume_parser.demo path/to/resume.pdf
```

Prints the extracted JSON and the wall-clock parse time.
