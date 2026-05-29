import httpx
from functools import lru_cache
from time import time
from app.core.config import settings

_cache: dict[str, tuple[list, float]] = {}
CACHE_TTL = 900  # 15 minutes


async def search_jobs(query: str, location: str | None = None) -> list:
    cache_key = f"{query}|{location or ''}"
    if cache_key in _cache:
        jobs, ts = _cache[cache_key]
        if time() - ts < CACHE_TTL:
            return jobs

    params = {"query": query, "num_pages": "1", "date_posted": "week"}
    if location:
        params["location"] = location

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            "https://jsearch.p.rapidapi.com/search",
            params=params,
            headers={
                "X-RapidAPI-Key": settings.RAPIDAPI_KEY,
                "X-RapidAPI-Host": settings.RAPIDAPI_HOST,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    jobs = data.get("data", [])
    _cache[cache_key] = (jobs, time())
    return jobs
