"""Trains a small classical ML classifier for section-header detection.

Algorithm: TF-IDF (character n-grams) + multinomial Logistic Regression.
Character n-grams (rather than word n-grams) are used because header phrases
are short (1-4 words) and this project has no labeled resume corpus to train
on — char n-grams let the model generalize to header phrasing that wasn't
in the seed list by sharing sub-word features (e.g., "Employment History"
and "Employment Background" share many 2-4 character n-grams even though
they don't share the final word).

This model is intentionally a *secondary* signal. section_segmenter.py tries
a high-precision fuzzy string match against known header synonyms first
(section_keywords.py); this classifier only gets consulted for short lines
the fuzzy matcher couldn't confidently place, and needs a high predicted
probability before it's trusted. That combination — deterministic rule
first, learned model as a generalization fallback — is a common, defensible
pattern for low-resource NLP problems.
"""
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from app.ml_resume_parser.section_keywords import SECTION_KEYWORDS, BODY_TEXT_SAMPLES

_MODEL_PATH = Path(__file__).resolve().parent / "section_classifier.joblib"

# Short phrases that are NOT headers, despite being brief like headers are —
# forces the classifier to learn actual header semantics rather than just
# "short line == header".
_SHORT_NON_HEADER_SAMPLES = [
    "Jan 2022 - Present", "2019 - 2021", "New York, NY", "San Francisco, CA",
    "Software Engineer", "Senior Data Scientist", "Google Inc.", "Microsoft Corporation",
    "Python, JavaScript, React", "AWS, Docker, Kubernetes", "555-0132",
    "jordan.rivera@example.com", "linkedin.com/in/jordanrivera", "B.S. Computer Science",
    "University of California, Berkeley", "GPA: 3.8/4.0", "Bachelor of Science",
    "Remote | Full-time", "github.com/jordanrivera", "Led a team of five engineers",
]


def _build_training_data() -> tuple[list[str], list[str]]:
    texts: list[str] = []
    labels: list[str] = []

    for section, phrases in SECTION_KEYWORDS.items():
        for phrase in phrases:
            for variant in (phrase, phrase.title(), phrase.upper(), phrase.capitalize()):
                texts.append(variant)
                labels.append(section)
                texts.append(variant + ":")
                labels.append(section)

    for sample in BODY_TEXT_SAMPLES + _SHORT_NON_HEADER_SAMPLES:
        texts.append(sample)
        labels.append("body")

    return texts, labels


def train_and_save() -> Pipeline:
    texts, labels = _build_training_data()
    model = Pipeline([
        ("tfidf", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4), min_df=1)),
        ("clf", LogisticRegression(max_iter=1000, C=5.0)),
    ])
    model.fit(texts, labels)
    joblib.dump(model, _MODEL_PATH)
    return model


def load_or_train() -> Pipeline:
    if _MODEL_PATH.exists():
        return joblib.load(_MODEL_PATH)
    return train_and_save()


if __name__ == "__main__":
    clf = train_and_save()
    print(f"Trained section classifier -> {_MODEL_PATH}")
    print("\nSanity check on held-out phrasing (not in the training set):")
    for probe in [
        "Work Experience", "EDUCATION", "Employment Background", "Career Highlights",
        "Technical Proficiency", "Python Developer", "2020-2022", "Northwind Technologies",
    ]:
        pred = clf.predict([probe])[0]
        conf = clf.predict_proba([probe]).max()
        print(f"  {probe!r:32s} -> {pred:15s} (confidence {conf:.2f})")
