-- Manual migration log. No Alembic env is initialized in this repo (schema is
-- created via Base.metadata.create_all(), which only creates missing tables,
-- not columns on existing tables). Run these by hand against the dev DB
-- whenever a model gains a new column. Append-only, in chronological order.

-- 2026-07-01: add categorized-skills JSONB column to profiles (skill_service.py)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills_categorized JSONB;

-- 2026-07-01: track whether a resume has been parsed, to lock resume-derived
-- fields (full_name, phone, linkedin_url, skills) from manual edits. `location`
-- is intentionally excluded: the form's "Preferred Location" is a job-search
-- preference, distinct from the resume's current-address concept, and stays editable.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_uploaded BOOLEAN NOT NULL DEFAULT FALSE;

-- 2026-07-01: per-field lock list (only fields the parser actually populated get
-- locked; anything the resume didn't mention stays editable so the user can fill it in)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_locked_fields VARCHAR[] NOT NULL DEFAULT '{}';

-- 2026-07-02: store the full original extracted resume text, so PDF regeneration
-- (optimized-pdf) can append it verbatim and never silently drop content the
-- structured parser doesn't model (Projects, Certifications, etc.)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_raw_text TEXT;

-- 2026-07-02: GitHub URL and professional summary, both parsed straight from the
-- resume (github via regex_extractor, summary via section_segmenter) but never
-- previously surfaced onto the Profile record.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url VARCHAR;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS summary TEXT;
