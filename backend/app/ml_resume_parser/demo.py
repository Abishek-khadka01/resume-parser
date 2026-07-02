"""Demo / smoke-test CLI for the non-prompting resume parser.

Usage (from backend/, with the venv active):
    python -m app.ml_resume_parser.demo path/to/resume.pdf
"""
import json
import sys
import time


def _extract_text(path: str) -> str:
    if path.lower().endswith(".pdf"):
        from pypdf import PdfReader
        reader = PdfReader(path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if path.lower().endswith(".docx"):
        from docx import Document
        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs)
    with open(path, encoding="utf-8") as f:
        return f.read()


def main():
    if len(sys.argv) != 2:
        print("Usage: python -m app.ml_resume_parser.demo <resume.pdf|.docx|.txt>")
        sys.exit(1)

    from app.ml_resume_parser.pipeline import parse_resume

    text = _extract_text(sys.argv[1])

    start = time.perf_counter()
    result = parse_resume(text)
    elapsed = time.perf_counter() - start

    print(json.dumps(result, indent=2, default=str))
    print(f"\n--- parsed in {elapsed:.2f}s, zero LLM API calls ---")


if __name__ == "__main__":
    main()
