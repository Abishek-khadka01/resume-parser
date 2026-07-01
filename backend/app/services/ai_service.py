import json
import httpx
from google import genai
from google.genai import errors as genai_errors
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

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
    try:
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
        raw = response.text
    except (genai_errors.APIError, httpx.HTTPError):
        raw = await _parse_with_openrouter(prompt)

    return json.loads(_strip_code_fence(raw))


async def _parse_with_openrouter(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=30) as http_client:
        resp = await http_client.post(
            OPENROUTER_URL,
            headers={"Authorization": f"Bearer {settings.OPENROUTER_API_KEY}"},
            json={
                "model": settings.OPENROUTER_MODEL,
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
