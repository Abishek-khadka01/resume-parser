-- Manual migration log. No Alembic env is initialized in this repo (schema is
-- created via Base.metadata.create_all(), which only creates missing tables,
-- not columns on existing tables). Run these by hand against the dev DB
-- whenever a model gains a new column. Append-only, in chronological order.

-- 2026-07-01: add categorized-skills JSONB column to profiles (skill_service.py)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills_categorized JSONB;
