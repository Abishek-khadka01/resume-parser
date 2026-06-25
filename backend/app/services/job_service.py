import httpx
from time import time
from app.core.config import settings

_cache: dict[str, tuple[list, float]] = {}
CACHE_TTL = 900  # 15 minutes
LINKEDIN_JOBS_PATH = "/active-jb"


class JobSearchError(Exception):
    pass


def _clean_params(params: dict) -> dict:
    return {key: value for key, value in params.items() if value not in (None, "")}


def _normalize_job(job: dict) -> dict:
    if not isinstance(job, dict):
        return {"raw": job}

    normalized = dict(job)
    normalized.setdefault("job_title", job.get("title") or job.get("job_title"))
    normalized.setdefault("job_description", job.get("description") or job.get("job_description"))
    normalized.setdefault("employer_name", job.get("organization") or job.get("company") or job.get("company_name"))
    normalized.setdefault("job_location", job.get("location") or job.get("job_location"))
    normalized.setdefault("job_apply_link", job.get("url") or job.get("apply_url") or job.get("job_apply_link"))
    return normalized


async def search_jobs(
    query: str | None = None,
    location: str | None = None,
    *,
    time_frame: str = "24h",
    limit: int = 10,
    offset: int = 0,
    description_format: str = "text",
    title_advanced: str | None = None,
    description_advanced: str | None = None,
    location_advanced: str | None = None,
    organization_advanced: str | None = None,
    organization: str | None = None,
    organization_slug: str | None = None,
    seniority: str | None = None,
    ai_experience_level: str | None = None,
    ai_work_arrangement: str | None = None,
    ai_employment_type: str | None = None,
    has_salary: bool | None = None,
    organization_agency: str | None = None,
    direct_apply: str | None = None,
) -> list:
    rapidapi_key = settings.LINKED_IN_RAPID_API_KEY or settings.RAPIDAPI_KEY
    rapidapi_host = settings.LINKED_IN_RAPID_API_HOST or settings.LINKEDIN_JOBS_RAPIDAPI_HOST
    base_url = settings.BASE_RAPID_REQUEST_URL.rstrip("/")
    params = _clean_params(
        {
            "title": query,
            "location": location,
            "time_frame": time_frame,
            "limit": limit,
            "offset": offset,
            "description_format": description_format,
            "title_advanced": title_advanced,
            "description_advanced": description_advanced,
            "location_advanced": location_advanced,
            "organization_advanced": organization_advanced,
            "organization": organization,
            "organization_slug": organization_slug,
            "seniority": seniority,
            "ai_experience_level": ai_experience_level,
            "ai_work_arrangement": ai_work_arrangement,
            "ai_employment_type": ai_employment_type,
            "has_salary": str(has_salary).lower() if has_salary is not None else None,
            "organization_agency": organization_agency,
            "direct_apply": direct_apply,
        }
    )
    cache_key = repr(sorted(params.items()))
    if cache_key in _cache:
        jobs, ts = _cache[cache_key]
        if time() - ts < CACHE_TTL:
            return jobs

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(
                f"{base_url}{LINKEDIN_JOBS_PATH}",
                params=params,
                headers={
                    "Content-Type": "application/json",
                    "x-rapidapi-key": rapidapi_key,
                    "x-rapidapi-host": rapidapi_host,
                },
            )
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text[:500]
            raise JobSearchError(f"LinkedIn job search failed: {exc.response.status_code} {detail}") from exc
        except httpx.HTTPError as exc:
            raise JobSearchError(f"LinkedIn job search request failed: {exc}") from exc

    jobs = data.get("data", data) if isinstance(data, dict) else data
    if not isinstance(jobs, list):
        jobs = []
    jobs = [_normalize_job(job) for job in jobs]
    _cache[cache_key] = (jobs, time())
    return jobs
