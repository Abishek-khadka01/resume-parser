import httpx
from time import time
from app.core.config import settings

_cache: dict[str, tuple[list, float]] = {}
CACHE_TTL = 900  # 15 minutes
JSEARCH_PATH = "/search-v2"


class JobSearchError(Exception):
    pass


def _clean_params(params: dict) -> dict:
    return {key: value for key, value in params.items() if value not in (None, "")}


def _join_query_parts(*parts: str | None) -> str:
    return " ".join(part.strip() for part in parts if part and part.strip())


def _normalize_job(job: dict) -> dict:
    if not isinstance(job, dict):
        return {"raw": job}

    normalized = dict(job)
    normalized.setdefault("job_id", job.get("job_id") or job.get("id") or job.get("jobSlug") or job.get("job_slug"))
    normalized.setdefault("job_title", job.get("job_title") or job.get("title"))
    normalized.setdefault("job_description", job.get("job_description") or job.get("description"))
    normalized.setdefault("employer_name", job.get("employer_name") or job.get("company_name") or job.get("company") or job.get("organization"))
    normalized.setdefault("employer_logo", job.get("employer_logo") or job.get("company_logo") or job.get("logo") or job.get("company_logo_url"))
    normalized.setdefault("job_location", job.get("job_location") or job.get("location"))
    normalized.setdefault("job_apply_link", job.get("job_apply_link") or job.get("apply_url") or job.get("url"))
    normalized.setdefault("job_city", job.get("job_city") or job.get("city"))
    normalized.setdefault("job_country", job.get("job_country") or job.get("country"))
    normalized.setdefault("job_employment_type", job.get("job_employment_type") or job.get("employment_type"))
    normalized.setdefault("job_is_remote", job.get("job_is_remote") or job.get("remote"))
    normalized.setdefault("job_min_salary", job.get("job_min_salary") or job.get("salary_min"))
    normalized.setdefault("job_max_salary", job.get("job_max_salary") or job.get("salary_max"))
    normalized.setdefault("job_salary_currency", job.get("job_salary_currency") or job.get("salary_currency") or job.get("currency"))
    normalized.setdefault("job_posted_at_datetime_utc", job.get("job_posted_at_datetime_utc") or job.get("posted_at") or job.get("date_posted"))
    normalized.setdefault("job_offer_expiration_datetime_utc", job.get("job_offer_expiration_datetime_utc"))
    normalized.setdefault("job_start_date", job.get("job_start_date"))
    normalized.setdefault("job_end_date", job.get("job_end_date"))
    return normalized


def _build_query(
    query: str | None,
    location: str | None,
    organization: str | None,
    organization_slug: str | None,
    seniority: str | None,
    ai_work_arrangement: str | None,
    ai_employment_type: str | None,
    direct_apply: str | None,
    section_terms: list[str],
    title_advanced: str | None,
    description_advanced: str | None,
    location_advanced: str | None,
    organization_advanced: str | None,
) -> str:
    parts = [query, location, organization, organization_slug, seniority, title_advanced, description_advanced, location_advanced, organization_advanced]

    if ai_work_arrangement:
        parts.append(ai_work_arrangement)
    if ai_employment_type:
        parts.append(ai_employment_type.replace("_", " "))
    if direct_apply:
        parts.append("easy apply")

    parts.extend(section_terms)
    return _join_query_parts(*parts) or "jobs"


def _date_posted(time_frame: str | None) -> str:
    mapping = {
        "24h": "today",
        "7d": "week",
        "6m": "month",
        "all": "all",
        "": "all",
        None: "all",
    }
    return mapping.get(time_frame, time_frame or "all")


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _matches_filters(job: dict, *, location: str | None, organization: str | None, seniority: str | None, ai_work_arrangement: str | None, ai_employment_type: str | None, has_salary: bool | None, organization_agency: str | None, direct_apply: str | None, section: str | None) -> bool:
    location_text = str(job.get("job_location") or " ".join([str(job.get("job_city") or ""), str(job.get("job_country") or "")])).lower()
    employer_text = str(job.get("employer_name") or "").lower()
    title_text = str(job.get("job_title") or "").lower()
    description_text = str(job.get("job_description") or "").lower()

    if location and location.lower() not in location_text:
        return False
    if organization and organization.lower() not in employer_text:
        return False
    if has_salary and job.get("job_min_salary") is None and job.get("job_max_salary") is None:
        return False

    if ai_employment_type:
        requested_types = {item.replace("_", " ").lower() for item in _split_csv(ai_employment_type)}
        employment_type = str(job.get("job_employment_type") or "").replace("_", " ").lower()
        if requested_types and not any(value in employment_type for value in requested_types):
            return False

    if ai_work_arrangement:
        arrangement = ai_work_arrangement.lower()
        is_remote = bool(job.get("job_is_remote"))
        if arrangement.startswith("remote") and not is_remote:
            return False
        if arrangement == "onsite" and is_remote:
            return False

    if direct_apply:
        apply_link = str(job.get("job_apply_link") or "")
        if not apply_link:
            return False

    if organization_agency and str(job.get("employer_name") or "").lower().endswith("agency"):
        return False

    if seniority and seniority.lower() not in (title_text + " " + description_text):
        return True

    if section == "remote" and not bool(job.get("job_is_remote")):
        return False
    if section == "internships" and "intern" not in (title_text + " " + description_text + " " + str(job.get("job_employment_type") or "")).lower():
        return False
    if section == "easy_apply" and not job.get("job_apply_link"):
        return False

    return True


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
    rapidapi_host = settings.LINKED_IN_RAPID_API_HOST or settings.RAPIDAPI_HOST
    base_url = getattr(settings, "RAPIDAPI_BASE_URL", None) or settings.BASE_RAPID_REQUEST_URL
    section_terms: list[str] = []
    if ai_work_arrangement and ai_work_arrangement.lower().startswith("remote"):
        section_terms.append("remote")
    if ai_employment_type and "intern" in ai_employment_type.lower():
        section_terms.append("internship")
    if direct_apply:
        section_terms.append("easy apply")

    search_query = _build_query(
        query,
        location,
        organization,
        organization_slug,
        seniority,
        ai_work_arrangement,
        ai_employment_type,
        direct_apply,
        section_terms,
        title_advanced,
        description_advanced,
        location_advanced,
        organization_advanced,
    )
    params = _clean_params(
        {
            "query": search_query,
            "page": max(1, offset // max(limit, 1) + 1),
            "num_pages": 1,
            "date_posted": _date_posted(time_frame),
            "country": "us",
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
                f"{base_url}{JSEARCH_PATH}",
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
            raise JobSearchError(f"JSearch job search failed: {exc.response.status_code} {detail}") from exc
        except httpx.HTTPError as exc:
            raise JobSearchError(f"JSearch job search request failed: {exc}") from exc

    jobs = data.get("data", data) if isinstance(data, dict) else data
    if not isinstance(jobs, list):
        jobs = []
    jobs = [_normalize_job(job) for job in jobs]
    jobs = [
        job
        for job in jobs
        if _matches_filters(
            job,
            location=location,
            organization=organization,
            seniority=seniority,
            ai_work_arrangement=ai_work_arrangement,
            ai_employment_type=ai_employment_type,
            has_salary=has_salary,
            organization_agency=organization_agency,
            direct_apply=direct_apply,
            section=("remote" if ai_work_arrangement and ai_work_arrangement.lower().startswith("remote") else None),
        )
    ]
    jobs = jobs[:limit]
    _cache[cache_key] = (jobs, time())
    return jobs
