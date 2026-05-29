# Resume Analysis & Job Matching Platform — Project Scope

## Problem

Job seekers waste hours manually tailoring applications, searching irrelevant listings, and guessing how well their profile matches a role. There is no fast, personalized way to see which jobs actually fit their skills and experience.

## Solution

Build a resume-driven job matching platform where users upload their resume after login. The system extracts their profile data, fills any gaps through a guided questionnaire, then surfaces real-time job listings ranked by AI-computed match percentage — giving users instant, actionable job fit insights similar to Jobright.ai.

---

## Core User Flow

1. **Sign Up / Log In** — User authenticates via email/password or OAuth (Google).
2. **Resume Upload** — User uploads a PDF or DOCX resume.
3. **AI Extraction** — System parses the resume and populates a structured profile (name, contact, skills, experience, education, certifications, etc.).
4. **Gap Questionnaire** — Any required fields missing from the resume are collected through a short, step-by-step form (e.g., desired role, preferred location, work authorization, salary expectation).
5. **Profile Saved** — Completed profile is persisted to the database.
6. **Job Discovery** — System queries the RapidAPI Job Search API using the user's skills, title, and location.
7. **Match Scoring** — Each job listing is scored using a two-tiered system: a fast, local heuristic/keyword filter handles initial baseline sorting, while deep AI evaluation runs asynchronously or targets the top results to avoid page-load latency.
8. **Results View** — Jobs are displayed in a card list; the right side of each card shows the match percentage prominently.
9. **Application Tracking** — User tracks both bookmarked and active job applications through a unified Kanban-style ATS board (Saved → Applied → Interview → Offer → Rejected), eliminating split tracking.
10. **Job Alerts** — User sets up email alerts for new matching jobs; digest emails sent via free tier email service.

---

## Features

### Authentication
- Email/password registration and login
- OAuth sign-in (Google)
- JWT-based session management
- Tracking for auth provider type (local vs. Google OAuth) stored per user
- Password reset via email with secure tokens and expiration timestamps

### Resume Upload & Parsing
- Accepts PDF and DOCX formats (up to 5 MB)
- AI-powered extraction of:
  - Full name, email, phone, LinkedIn URL, location
  - Work experience (company, title, dates, description)
  - Education (institution, degree, field, graduation year)
  - Skills (hard skills, soft skills, tools, languages)
  - Certifications and awards
- Extraction progress indicator shown to user

### Profile & Gap Filling
- Structured profile page auto-populated from resume data
- Missing required fields flagged with inline prompts
- Step-by-step questionnaire for gaps:
  - Desired job title(s)
  - Preferred work model (remote / hybrid / on-site)
  - Preferred location(s)
  - Experience level
  - Work authorization status
  - Expected salary range
- Profile completeness progress bar (e.g., 75% complete)
- User can manually edit any extracted field at any time

### Job Search (RapidAPI Integration)
- Real-time job search powered by RapidAPI Job Search API
- Search parameters derived automatically from user profile
- Manual search bar override (title + location)
- Filters: work model, experience level, date posted, job type (full-time / contract / part-time)
- Pagination / infinite scroll

### Match Percentage & Ranking
- Each job card displays a match score (0–100%) on the right side
- Score computed by AI based on:
  - Skill keyword overlap with job description
  - Experience level alignment
  - Title similarity
  - Location / work model compatibility
  - Education requirements
- Color-coded indicator: green (≥75%), yellow (50–74%), red (<50%)
- Jobs sorted by match score descending by default
- Asynchronous/lazy scoring: page loads instantly with heuristic scores; deep LLM scores stream in as background evaluation completes
- Caching layer stores RapidAPI results by keyword + location key (15-min TTL) to minimize API quota consumption

### Job Cards
- Company logo, job title, company name, location, work model badge
- Salary range (if available)
- Date posted
- "Apply Now" button (opens original listing in new tab)
- "Save Job" toggle — creates an Application record at `status: saved`; no separate saved-jobs table

### Application Tracking (ATS Board)
- Kanban board with columns: **Saved → Applied → Interview → Offer → Rejected**
- The **Saved** column serves as the unified bookmarking view — no separate saved-jobs section
- Drag-and-drop cards between columns
- Each card shows: job title, company, match score, date applied
- Notes field per application (interview notes, recruiter contact, etc.)
- Status timestamps (when moved to each stage)
- Quick stats strip above board: total applied, in-interview, offers received

### Email Job Alerts
- User configures alert preferences: keywords, location, work model, minimum match %
- Daily or weekly digest email of new matching jobs
- Immediate alert option for high-match jobs (≥85%)
- One-click unsubscribe link in every email
- **Free tier email provider: [Resend](https://resend.com) — 3,000 emails/month free, no credit card required**
  - Fallback option: Brevo (formerly Sendinblue) — 300 emails/day free
- Alert emails include: job title, company, match %, apply link, and a "View All Matches" CTA

### Dashboard / Home
- Welcome banner with profile completeness nudge
- Top matched jobs section (top 5 picks)
- Quick stats: jobs viewed, jobs saved, profile completeness %
- Recent search history

---

## Data Models

### User
| Field               | Type                  | Note                                   |
| ------------------- | --------------------- | -------------------------------------- |
| id                  | UUID                  | Primary Key                            |
| email               | string                | Unique                                 |
| password_hash       | string                | Nullable — null for Google OAuth users |
| auth_provider       | enum (local / google) | Tracks login channel                   |
| provider_id         | string                | Nullable — stores Google User ID       |
| reset_token         | string                | Nullable — for password resets         |
| reset_token_expires | timestamp             | Nullable                               |
| created_at          | timestamp             |                                        |

### Profile
| Field              | Type                               | Note                                      |
| ------------------ | ---------------------------------- | ----------------------------------------- |
| id                 | UUID                               | Primary Key                               |
| user_id            | UUID (FK)                          | Unique — enforces strict 1:1 relationship |
| full_name          | string                             |                                           |
| phone              | string                             |                                           |
| linkedin_url       | string                             |                                           |
| location           | string                             |                                           |
| desired_title      | string                             |                                           |
| work_model         | enum (remote / hybrid / on-site)   |                                           |
| experience_level   | enum (entry / mid / senior / lead) |                                           |
| work_authorization | string                             |                                           |
| salary_min         | integer                            |                                           |
| salary_max         | integer                            |                                           |
| skills             | string[]                           | Stored as text array for fast DB matching |
| completeness_pct   | integer                            |                                           |
| resume_url         | string                             |                                           |
| updated_at         | timestamp                          |                                           |

### WorkExperience
| Field       | Type            |
| ----------- | --------------- |
| id          | UUID            |
| profile_id  | UUID (FK)       |
| company     | string          |
| title       | string          |
| start_date  | date            |
| end_date    | date (nullable) |
| description | text            |

### Education
| Field           | Type      |
| --------------- | --------- |
| id              | UUID      |
| profile_id      | UUID (FK) |
| institution     | string    |
| degree          | string    |
| field           | string    |
| graduation_year | integer   |

### Application (ATS) — replaces SavedJob
| Field             | Type                                                  | Note                                               |
| ----------------- | ----------------------------------------------------- | -------------------------------------------------- |
| id                | UUID                                                  | Primary Key                                        |
| user_id           | UUID (FK)                                             |                                                    |
| job_id            | string                                                | External API unique ID                             |
| job_title         | string                                                | Promoted out of JSON for fast UI rendering/sorting |
| company_name      | string                                                | Promoted out of JSON for fast filtering            |
| company_logo_url  | string                                                | Promoted out of JSON                               |
| match_score       | integer                                               |                                                    |
| status            | enum (saved / applied / interview / offer / rejected) | Starts at `saved` for basic bookmarks              |
| notes             | text                                                  | Nullable                                           |
| applied_at        | timestamp                                             | Nullable — populated when moved to `applied`       |
| status_updated_at | timestamp                                             |                                                    |
| created_at        | timestamp                                             |                                                    |
| job_data          | JSONB                                                 | Raw snapshot backup of the external API response   |

### JobAlert
| Field         | Type                            | Note                                                   |
| ------------- | ------------------------------- | ------------------------------------------------------ |
| id            | UUID                            | Primary Key                                            |
| user_id       | UUID (FK)                       |                                                        |
| keywords      | string[]                        |                                                        |
| location      | string                          | Nullable                                               |
| work_model    | enum                            | Nullable                                               |
| min_match_pct | integer                         | Default: 60                                            |
| frequency     | enum (instant / daily / weekly) |                                                        |
| is_active     | boolean                         |                                                        |
| last_sent_at  | timestamp                       | Nullable — crucial tracker for background cron workers |
| created_at    | timestamp                       |                                                        |

---

## UI Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Logo          Search: [Job Title] [Location]  [Filters ▼]       [Avatar] │
├───────────────┬──────────────────────────────────────────────────────────┤
│               │                                                           │
│  LEFT RAIL    │  JOB LISTINGS                                             │
│               │  ┌────────────────────────────────────────────────────┐  │
│  Profile      │  │  Senior React Developer          [Save] [Apply] [85%]│ │
│  Completeness │  │  Acme Corp · Remote · $120–150K · Posted 2 days ago │  │
│  [====75%]    │  └────────────────────────────────────────────────────┘  │
│               │  ┌────────────────────────────────────────────────────┐  │
│  Filters      │  │  Frontend Engineer               [Save] [Apply] [72%]│ │
│  Work Model   │  │  Beta Inc · Hybrid · $100–130K · Posted 1 week ago  │  │
│  Experience   │  └────────────────────────────────────────────────────┘  │
│  Date Posted  │                                                           │
│  Job Type     │  ATS BOARD (tab)                                          │
│               │  [Saved] → [Applied] → [Interview] → [Offer] → [Rejected]│
└───────────────┴──────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer         | Technology                                                                              |
| ------------- | --------------------------------------------------------------------------------------- |
| Frontend      | React 19 + TypeScript + Vite 8                                                          |
| Styling       | Tailwind CSS v4                                                                         |
| UI Components | shadcn/ui (Radix UI primitives)                                                         |
| Routing       | React Router v7                                                                         |
| Data Fetching | TanStack Query v5                                                                       |
| Forms         | React Hook Form + Zod                                                                   |
| Backend       | FastAPI (Python 3.13) + Uvicorn                                                         |
| Database      | PostgreSQL + SQLAlchemy v2 + Alembic                                                    |
| Auth          | JWT (python-jose) + bcrypt (passlib)                                                    |
| AI            | Anthropic Python SDK — `claude-sonnet-4-6` for parsing, `claude-haiku-4-5` for scoring |
| Job Search    | RapidAPI JSearch API (httpx, 15-min in-memory cache)                                    |
| File Storage  | Cloudflare R2                                                                           |
| Email Alerts  | Resend Python SDK (free tier — 3,000 emails/month)                                      |
| Deployment    | Railway                                                                                 |

---

## API Integrations

### RapidAPI Job Search
- Endpoint: JSearch or similar job search API on RapidAPI
- Query params: `query` (title + skills), `location`, `remote_jobs_only`, `employment_type`, `date_posted`
- Rate limit handling with caching (Redis or in-memory, 15-min TTL per query)

### Anthropic SDK — Resume Parsing (`POST /api/resume/upload`)
- FastAPI receives the PDF/DOCX, extracts raw text, sends to `claude-sonnet-4-6` with a structured extraction prompt
- Claude returns JSON matching Profile + WorkExperience + Education schemas
- Missing required fields detected server-side and exposed via profile `completeness_pct`; frontend renders the gap questionnaire

### Anthropic SDK — Match Scoring (`GET /api/jobs/search`)
- After RapidAPI jobs are fetched, `claude-haiku-4-5` scores each job against the user profile (`asyncio.gather` for concurrency)
- Returns `{ score: 0-100, reasoning: string }` per job; jobs sorted by score before returning to client
- Haiku used for scoring (fast + cheap); Sonnet used for resume parsing (accuracy)

---

## File Structure

```
resume-analysis/
├── project-scope.md
├── frontend/                               # React 19 + Vite + TypeScript
│   ├── .env.example
│   ├── components.json                     # shadcn/ui config
│   ├── vite.config.ts                      # Tailwind v4 plugin + @/ alias + /api proxy
│   ├── tsconfig.app.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                         # router + QueryClient + Toaster
│       ├── index.css                       # @import "tailwindcss"
│       ├── components/
│       │   ├── ui/                         # shadcn/ui (do not hand-edit)
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── progress.tsx
│       │   │   ├── skeleton.tsx
│       │   │   └── ...
│       │   ├── auth/
│       │   │   └── ProtectedRoute.tsx
│       │   ├── layout/
│       │   │   ├── DashboardLayout.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── Topnav.tsx
│       │   └── profile/
│       │       └── GapQuestionnaire.tsx    # renders only for missing required fields
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Jobs.tsx                    # search + match score on right of each card
│       │   ├── ATS.tsx                     # kanban board (status columns)
│       │   ├── Profile.tsx                 # upload + gap questionnaire
│       │   └── Alerts.tsx
│       ├── hooks/
│       │   └── useAuth.ts                  # JWT decode + logout
│       ├── lib/
│       │   ├── api.ts                      # axios instance with JWT interceptor
│       │   └── utils.ts                    # cn(), getMatchColor(), formatDate()
│       └── types/
│           └── index.ts                    # User, Profile, Job, Application, JobAlert
│
└── backend/                                # FastAPI + Python 3.13
    ├── .env.example
    ├── requirements.txt
    ├── main.py                             # FastAPI app, CORS, router mounting
    └── app/
        ├── core/
        │   ├── config.py                   # pydantic-settings (reads .env)
        │   ├── database.py                 # SQLAlchemy engine + get_db()
        │   └── security.py                 # JWT encode/decode, bcrypt
        ├── models/
        │   ├── user.py
        │   ├── profile.py                  # Profile + WorkExperience + Education
        │   ├── application.py              # ATS row (replaces SavedJob)
        │   └── job_alert.py
        ├── schemas/
        │   ├── user.py
        │   ├── profile.py
        │   ├── application.py
        │   └── job_alert.py
        ├── routers/
        │   ├── auth.py                     # POST /register, POST /login
        │   ├── profile.py                  # GET/PATCH /profile
        │   ├── resume.py                   # POST /resume/upload → parse → save
        │   ├── jobs.py                     # GET /jobs/search → RapidAPI + score
        │   ├── applications.py             # CRUD /applications
        │   └── alerts.py                   # CRUD /alerts
        ├── services/
        │   ├── ai_service.py               # Anthropic SDK (Sonnet for parse, Haiku for score)
        │   ├── job_service.py              # httpx RapidAPI + 15-min in-memory cache
        │   ├── profile_service.py          # completeness_pct calculation
        │   └── email_service.py            # Resend SDK
        └── dependencies.py                 # get_current_user (JWT → User)
```

---

## Required Fields (Gap Questionnaire Triggers)

The following fields are mandatory for job matching. If absent after resume parsing, the user is prompted:

1. Desired job title
2. Preferred work model
3. Preferred location
4. Experience level
5. At least 3 skills
6. Work authorization

---

## Out of Scope (v1)

- Resume builder / editor
- Cover letter generation
- Employer-facing portal
- Mobile app
