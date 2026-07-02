import json
import httpx
from app.core.config import settings

# This module parses resumes via LLM prompting (OpenRouter -> Groq fallback).
# It is kept as-is and importable, but the live /resume/upload endpoint
# currently calls the non-prompting alternative instead — regex + a
# TF-IDF/LogisticRegression section classifier + pretrained BERT NER + the
# existing skill_service gazetteer — at app/ml_resume_parser/pipeline.py
# (see its README.md for the algorithm rationale). Both return the same JSON
# shape, so routers/resume.py can swap between them by changing one import.

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

PARSE_PROMPT = """Extract the following structured data from this resume text.
Return a JSON object with these keys:
- full_name (string)
- phone (string or null)
- linkedin_url (string or null)
- location (string or null)
- skills (array of strings)
- work_experience (array of {company, title, start_date (YYYY-MM-DD or null), end_date (YYYY-MM-DD or null), description})
- education (array of {institution, degree, field, graduation_year (int or null)})

Only return valid JSON. No markdown, no explanation.

Resume:
{text}"""


async def parse_resume_text(text: str) -> dict:
    prompt = PARSE_PROMPT.replace("{text}", text[:6000])
    raw = None

    if settings.OPENROUTER_API_KEY:
        try:
            raw = await _chat_completion(OPENROUTER_URL, settings.OPENROUTER_API_KEY, settings.OPENROUTER_MODEL, prompt)
        except httpx.HTTPError:
            raw = None

    if raw is None and settings.GROQ_API_KEY:
        try:
            raw = await _chat_completion(GROQ_URL, settings.GROQ_API_KEY, settings.GROQ_MODEL, prompt)
        except httpx.HTTPError:
            raw = None

    if raw is None:
        raise RuntimeError("No AI provider succeeded in parsing the resume")

    return json.loads(_strip_code_fence(raw))


async def _chat_completion(url: str, api_key: str, model: str, prompt: str) -> str:
    async with httpx.AsyncClient(timeout=15) as http_client:
        resp = await http_client.post(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


def _strip_code_fence(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()
