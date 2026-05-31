# Backend Handoff — Frontend Integration Requirements

## 1. Jobs Search API — Add Filter Query Parameters

**File:** `backend/app/routers/jobs.py` — `GET /api/jobs/search`

### Current signature
```python
@router.get("/search")
async def get_jobs(
    q: str = Query(default=""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
```

### Required changes
Add the following optional query parameters to support the new filter sidebar UI:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `employment_type` | `str` | `""` | Comma-separated filter: `full_time,remote,contract` |
| `experience_level` | `str` | `""` | Comma-separated filter: `entry,mid,senior,lead` |
| `remote_only` | `bool` | `False` | If `true`, only return remote jobs |

### Updated signature
```python
@router.get("/search")
async def get_jobs(
    q: str = Query(default=""),
    employment_type: str = Query(default=""),
    experience_level: str = Query(default=""),
    remote_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
```

### Frontend mapping
The Jobs page filter sidebar sends these params to the API:
```ts
// In src/pages/Jobs.tsx, the API call will become:
api.get('/jobs/search', {
  params: {
    q: query,
    employment_type: selectedTypes.join(','),   // e.g. "full_time,remote"
    experience_level: selectedLevels.join(','),  // e.g. "mid,senior"
    remote_only: selectedTypes.includes('remote') ? true : undefined,
  }
})
```

### Expected behavior
- `employment_type`: The `job_employment_type` field on results should be filtered to match any of the provided values.
- `experience_level`: Filter based on job description or title keywords (or a new DB field if available). If the backend doesn't have a dedicated experience level field, a simple keyword heuristic in `job_service.py` is acceptable.
- `remote_only`: When `true`, return only jobs where `job_is_remote === true`.

---

## 2. ATS Board API — No Changes Needed

The existing endpoints work correctly:

| Method | Endpoint | Usage |
|---|---|---|
| `GET` | `/api/applications` | Fetch all applications for columns |
| `PATCH` | `/api/applications/{id}` | Update status (move between columns) |
| `POST` | `/api/applications` | Save a new job (from Jobs page) |

The frontend sends `{ status: "applied" | "interview" | "offer" | "rejected" | "saved" }` in the PATCH body.

---

## 3. Job Alerts API — No Changes Needed

| Method | Endpoint | Usage |
|---|---|---|
| `GET` | `/api/alerts` | List all alerts |
| `POST` | `/api/alerts` | Create new alert |
| `PATCH` | `/api/alerts/{id}` | Toggle `is_active` |

The frontend sends:
```json
{
  "keywords": ["React", "TypeScript"],
  "location": "Remote",
  "min_match_pct": 60,
  "frequency": "daily"
}
```

---

## 4. Auth API — No Changes Needed

| Method | Endpoint | Usage |
|---|---|---|
| `POST` | `/api/auth/login` | Login (returns `access_token`) |
| `POST` | `/api/auth/register` | Registration |
| `POST` | `/api/auth/logout` | Logout |

The frontend stores the `access_token` in `localStorage` and decodes it via `jwt-decode` to extract `sub` (user ID) and `email`.
