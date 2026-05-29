import json
from anthropic import AsyncAnthropic
from app.core.config import settings

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

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

SCORE_PROMPT = """Rate how well this candidate profile matches the job description.
Return only a JSON object: {{"score": <0-100>, "reasoning": "<one sentence>"}}

Candidate skills: {skills}
Candidate title: {title}
Experience level: {level}

Job title: {job_title}
Job description (first 800 chars): {job_desc}"""


async def parse_resume_text(text: str) -> dict:
    msg = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": PARSE_PROMPT.format(text=text[:6000])}],
    )
    raw = msg.content[0].text.strip()
    return json.loads(raw)


async def score_job(job: dict, profile) -> int:
    prompt = SCORE_PROMPT.format(
        skills=", ".join(profile.skills[:30]),
        title=profile.desired_title or "",
        level=profile.experience_level or "",
        job_title=job.get("job_title", ""),
        job_desc=job.get("job_description", "")[:800],
    )
    msg = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=128,
        messages=[{"role": "user", "content": prompt}],
    )
    data = json.loads(msg.content[0].text.strip())
    return data.get("score", 0)


async def score_jobs_batch(jobs: list, profile) -> list:
    import asyncio
    scores = await asyncio.gather(*[score_job(j, profile) for j in jobs], return_exceptions=True)
    for job, score in zip(jobs, scores):
        if isinstance(score, int):
            job["match_score"] = score
    jobs.sort(key=lambda j: j.get("match_score", 0), reverse=True)
    return jobs
