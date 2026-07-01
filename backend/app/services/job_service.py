import httpx
from time import time
from app.core.config import settings

_cache: dict[str, tuple[list, str | None, float]] = {}
CACHE_TTL = 900  # 15 minutes
SEARCH_PATH = "/search-v2"
JOB_DETAILS_PATH = "/job-details"


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
    normalized.setdefault("job_apply_link", job.get("url") or job.get("apply_url") or job.get("job_apply_link"))
    return normalized


async def search_jobs(
    query: str | None = None,
    location: str | None = None,
    *,
    date_posted: str = "all",
    remote_jobs_only: bool | None = None,
    employment_types: str | None = None,
    job_requirements: str | None = None,
    radius: int | None = None,
    cursor: str | None = None,
) -> tuple[list, str | None]:
    params = _clean_params(
        {
            "query": f"{query} {location}".strip() if location else query,
            "date_posted": date_posted,
            "remote_jobs_only": str(remote_jobs_only).lower() if remote_jobs_only is not None else None,
            "employment_types": employment_types,
            "job_requirements": job_requirements,
            "radius": radius,
            "cursor": cursor,
        }
    )
    cache_key = repr(sorted(params.items()))
    if cache_key in _cache:
        jobs, next_cursor, ts = _cache[cache_key]
        if time() - ts < CACHE_TTL:
            return jobs, next_cursor

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(
                f"{settings.JSEARCH_BASE_URL.rstrip('/')}{SEARCH_PATH}",
                params=params,
                headers={
                    "x-rapidapi-key": settings.RAPIDAPI_KEY,
                    "x-rapidapi-host": settings.JSEARCH_RAPIDAPI_HOST,
                },
            )
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text[:500]
            raise JobSearchError(f"JSearch job search failed: {exc.response.status_code} {detail}") from exc
        except httpx.HTTPError as exc:
            raise JobSearchError(f"JSearch job search request failed: {exc}") from exc

    payload = data.get("data", {}) if isinstance(data, dict) else {}
    jobs = payload.get("jobs", []) if isinstance(payload, dict) else []
    if not isinstance(jobs, list):
        jobs = []
    jobs = [_normalize_job(job) for job in jobs]
    next_cursor = payload.get("cursor") if isinstance(payload, dict) else None
    _cache[cache_key] = (jobs, next_cursor, time())
    return jobs, next_cursor


async def get_job_details(job_id: str, country: str = "us") -> dict | None:
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(
                f"{settings.JSEARCH_BASE_URL.rstrip('/')}{JOB_DETAILS_PATH}",
                params={"job_id": job_id, "country": country},
                headers={
                    "x-rapidapi-key": settings.RAPIDAPI_KEY,
                    "x-rapidapi-host": settings.JSEARCH_RAPIDAPI_HOST,
                },
            )
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPError:
            return None

    jobs = data.get("data", []) if isinstance(data, dict) else []
    if isinstance(jobs, list) and jobs:
        return jobs[0]
    return None
