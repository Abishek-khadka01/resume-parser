# System Sequence Diagram — Non-Prompting Algorithm Pipeline

This diagram covers all four core flows of the application — authentication,
resume parsing, job match scoring, and resume optimization — annotated with
the specific algorithm used at each step. No LLM prompting is involved in any
step shown below (the legacy prompting-based parser in `ai_service.py` is kept
in the codebase but is not on this path).

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant API as Backend API (FastAPI)
    participant Sec as Security Module<br/>(security.py)
    participant Google as Google OAuth
    participant Parser as ML Resume Parser<br/>(pipeline.py)
    participant Regex as Regex Extractor
    participant Seg as Section Segmenter
    participant NER as BERT NER<br/>(dslim/bert-base-NER)
    participant Gaz as Gazetteer<br/>(spaCy PhraseMatcher)
    participant DB as PostgreSQL
    participant JSearch as JSearch API
    participant ATS as ATS Scoring Service
    participant Opt as Resume Optimizer Service

    %% ===================== AUTHENTICATION =====================
    rect rgb(245, 240, 255)
    note over User,DB: Flow 0 — Registration & Login
    User->>FE: Fill registration form (email, password)
    FE->>API: POST /api/auth/register
    API->>Sec: hash_password(password)
    note right of Sec: Algorithm: Argon2 password hashing<br/>(pwdlib PasswordHash.recommended())
    Sec-->>API: password_hash
    API->>DB: create User + empty Profile
    DB-->>API: user created
    API-->>FE: user object (201 Created)

    User->>FE: Submit login form
    FE->>API: POST /api/auth/login
    API->>DB: fetch User by email
    DB-->>API: user row
    API->>Sec: verify_password(plain, hash)
    note right of Sec: Algorithm: Argon2 hash verification
    Sec-->>API: match / no match
    API->>Sec: create_access_token({sub, email})
    note right of Sec: Algorithm: JWT signing (HS256)<br/>7-day expiry
    Sec-->>API: signed JWT
    API-->>FE: {user, access_token}
    FE-->>User: redirect to Job Board (token stored)

    alt Google Sign-In (alternative path)
        User->>FE: Click "Continue with Google"
        FE->>API: GET /api/google/login
        API->>Google: OAuth 2.0 authorization request
        Google-->>User: consent screen
        User->>Google: approve
        Google-->>FE: redirect with auth code
        FE->>API: POST /api/google/callback {code}
        API->>Google: exchange code for access_token
        Google-->>API: access_token + user info (OIDC)
        API->>DB: find-or-create User by provider_id/email
        DB-->>API: user row
        API->>Sec: create_access_token({sub, email})
        Sec-->>API: signed JWT
        API-->>FE: {user, access_token}
    end

    note over API,Sec: All subsequent requests below carry the<br/>JWT in the Authorization header, verified via<br/>the get_current_user dependency (jwt.decode, HS256)
    end

    %% ===================== RESUME PARSING =====================
    rect rgb(235, 245, 255)
    note over User,DB: Flow 1 — Resume Upload & Parsing (non-prompting)
    User->>FE: Upload resume (PDF/DOCX)
    FE->>API: POST /api/resume/upload
    API->>Parser: parse_resume(text)

    Parser->>Regex: extract email / phone / links / dates
    note right of Regex: Algorithm: Regex pattern matching<br/>(deterministic, ~100% precision)
    Regex-->>Parser: structured contact fields

    Parser->>Seg: segment_resume(text)
    note right of Seg: Algorithm: Rule-based fuzzy string<br/>matching (difflib.SequenceMatcher)<br/>+ fallback: TF-IDF (char n-grams)<br/>+ Logistic Regression classifier
    Seg-->>Parser: sections {summary, skills, experience, education}

    Parser->>NER: extract_entities(contact / experience / education text)
    note right of NER: Algorithm: Pretrained BERT token<br/>classifier (dslim/bert-base-NER)<br/>Deep Learning — PERSON / ORG / LOC
    NER-->>Parser: names, companies, institutions, locations<br/>(ranked by confidence score)

    Parser->>Gaz: match skills / job titles / degrees
    note right of Gaz: Algorithm: Gazetteer lookup<br/>(spaCy PhraseMatcher, closed vocabulary)<br/>+ delimiter-based list tokenization<br/>(recall fallback for the Skills section)
    Gaz-->>Parser: canonical skills, titles, degrees

    Parser-->>API: parsed profile JSON
    API->>DB: persist Profile / WorkExperience / Education
    API-->>FE: profile (skills, experience, education, completeness %)
    FE-->>User: show parsed profile
    end

    %% ===================== JOB MATCH SCORING =====================
    rect rgb(235, 255, 240)
    note over User,ATS: Flow 2 — Job Search & ATS Match Scoring (non-prompting)
    User->>FE: Search jobs
    FE->>API: GET /api/jobs/search
    API->>JSearch: GET /search-v2 (query, location, filters)
    JSearch-->>API: job listings

    API->>ATS: score_jobs_batch(jobs, profile)
    ATS->>ATS: TF-IDF vectorization + cosine similarity
    note right of ATS: Algorithm: TF-IDF (unigrams+bigrams)<br/>+ cosine similarity — lexical match
    ATS->>ATS: Sentence embedding + cosine similarity
    note right of ATS: Algorithm: BERT sentence embeddings<br/>(all-MiniLM-L6-v2) — semantic match
    ATS->>Gaz: extract job-side skills
    Gaz-->>ATS: matched / missing skill sets
    ATS->>ATS: Weighted blend:<br/>0.5·skill + 0.25·TF-IDF + 0.25·semantic
    ATS-->>API: match_score (1–10) per job
    API-->>FE: ranked job list
    FE-->>User: display jobs with match scores
    end

    %% ===================== RESUME OPTIMIZATION =====================
    rect rgb(255, 245, 235)
    note over User,Opt: Flow 3 — Job-Specific Resume Optimization (non-prompting)
    User->>FE: Click "Optimize Resume" for a job
    FE->>API: POST /api/jobs/optimize-resume
    API->>Opt: optimize_resume(job, profile)

    Opt->>Opt: Sentence-embedding similarity per bullet
    note right of Opt: Algorithm: BERT sentence embeddings<br/>+ cosine similarity — places claimed-but-<br/>unmentioned skills into the best-matching bullet
    Opt->>Opt: Term-frequency ranking of missing skills
    note right of Opt: Algorithm: Frequency count over<br/>job description text
    Opt->>Opt: Regex quantification-gap detection
    note right of Opt: Algorithm: Regex digit-presence check<br/>(flags only, never fabricates numbers)

    Opt->>ATS: recompute blended score (before / after)
    ATS-->>Opt: score_before, score_after
    Opt-->>API: changes[] + score_before + score_after
    API-->>FE: optimization result
    FE-->>User: show suggested changes + projected score increase
    end
```

## Algorithm Index (for quick reference in the report)

| # | Step | Algorithm | Type |
|---|------|-----------|------|
| 0a | Password storage | Argon2 hashing (`pwdlib PasswordHash.recommended()`) | Cryptographic |
| 0b | Session token | JWT signing/verification (HS256) | Cryptographic |
| 1 | Contact field extraction | Regex pattern matching | Deterministic |
| 2 | Section header detection | Fuzzy string matching (`difflib.SequenceMatcher`) | Rule-based |
| 3 | Section header detection (fallback) | TF-IDF (char n-grams) + Logistic Regression | Classical ML |
| 4 | Name / company / location extraction | Pretrained BERT NER (`dslim/bert-base-NER`) | Deep Learning |
| 5 | Skill / title / degree extraction | Gazetteer (spaCy `PhraseMatcher`) | Rule-based |
| 6 | Skills-section recall fallback | Delimiter-based list tokenization | Rule-based (structural heuristic) |
| 7 | Lexical job-resume match | TF-IDF + cosine similarity | Classical ML |
| 8 | Semantic job-resume match | Sentence embeddings (`all-MiniLM-L6-v2`) + cosine similarity | Deep Learning |
| 9 | Skill-overlap match | Set intersection over extracted skill sets | Deterministic |
| 10 | Bullet-injection targeting | Sentence embeddings + cosine similarity | Deep Learning |
| 11 | Missing-skill ranking | Term-frequency counting | Deterministic |
| 12 | Quantification-gap detection | Regex digit-presence check | Deterministic |

No step above uses LLM prompting. The prompting-based parser (`ai_service.py`,
OpenRouter/Groq) remains in the codebase as an alternative but is not on this
path — see its module docstring for the comparison note.
