# System Class Diagram

Two parts: the **domain model** (SQLAlchemy ORM entities and their
relationships) and the **algorithmic service layer** (the non-prompting
parsing/scoring/optimization modules), with each service annotated by the
algorithm it implements — consistent with [SEQUENCE_DIAGRAM.md](SEQUENCE_DIAGRAM.md).

```mermaid
classDiagram
    direction LR

    %% ===================== DOMAIN MODEL =====================
    class User {
        +UUID id
        +string email
        +string password_hash
        +string auth_provider
        +string provider_id
        +datetime created_at
    }

    class Profile {
        +UUID id
        +UUID user_id
        +string full_name
        +string phone
        +string linkedin_url
        +string github_url
        +string location
        +string summary
        +string desired_title
        +string experience_level
        +string[] skills
        +JSON skills_categorized
        +int completeness_pct
        +bool resume_uploaded
        +string[] resume_locked_fields
        +text resume_raw_text
    }

    class WorkExperience {
        +UUID id
        +UUID profile_id
        +string company
        +string title
        +date start_date
        +date end_date
        +text description
    }

    class Education {
        +UUID id
        +UUID profile_id
        +string institution
        +string degree
        +string field
        +int graduation_year
    }

    class Application {
        +UUID id
        +UUID user_id
        +string job_id
        +string job_title
        +string company_name
        +int match_score
        +string status
        +JSON job_data
    }

    class JobAlert {
        +UUID id
        +UUID user_id
        +string[] keywords
        +string location
        +int min_match_pct
        +string frequency
        +bool is_active
    }

    User "1" --> "1" Profile : owns
    User "1" --> "*" Application : tracks
    User "1" --> "*" JobAlert : subscribes to
    Profile "1" --> "*" WorkExperience : lists
    Profile "1" --> "*" Education : lists

    %% ===================== ALGORITHMIC SERVICE LAYER =====================
    class MLResumeParser {
        <<orchestrator>>
        +parse_resume(text) dict
    }

    class RegexExtractor {
        <<regex, deterministic>>
        +extract_email(text)
        +extract_phone(text)
        +extract_linkedin(text)
        +extract_github(text)
        +extract_date_ranges(text)
    }

    class SectionSegmenter {
        <<fuzzy match + ML fallback>>
        +segment_resume(text) dict
        +classify_line(line) string
    }

    class SectionClassifier {
        <<TF-IDF char n-grams + LogisticRegression>>
        +load_or_train() Pipeline
    }

    class NERExtractor {
        <<pretrained BERT: dslim/bert-base-NER>>
        +extract_person_names(text)
        +extract_organizations(text)
        +extract_locations(text)
    }

    class SkillService {
        <<spaCy PhraseMatcher gazetteer>>
        +categorize_skills(skills) dict
        +extract_skills_from_text(text) dict
        +split_skill_list(text) list
    }

    class TitleGazetteer {
        <<gazetteer lookup>>
        +find_longest_match(line, vocabulary) string
    }

    class ExperienceParser {
        <<regex boundaries + NER + gazetteer>>
        +parse(section_text) list
    }

    class EducationParser {
        <<gazetteer boundaries + NER + regex>>
        +parse(section_text) list
    }

    class ATSService {
        <<TF-IDF + BERT semantic + skill overlap>>
        +score_jobs_batch(jobs, profile) list
        +analyze_job(job, profile) dict
    }

    class ResumeOptimizerService {
        <<sentence embeddings + term frequency + regex>>
        +optimize_resume(job, profile) dict
    }

    class SuggestionService {
        <<term-frequency ranking>>
        +generate_suggestions(job, profile, analysis) list
    }

    class PdfService {
        <<reportlab>>
        +build_optimized_resume_pdf(profile, optimization) bytes
    }

    MLResumeParser --> RegexExtractor : uses
    MLResumeParser --> SectionSegmenter : uses
    SectionSegmenter --> SectionClassifier : falls back to
    MLResumeParser --> NERExtractor : uses
    MLResumeParser --> SkillService : uses
    MLResumeParser --> ExperienceParser : uses
    MLResumeParser --> EducationParser : uses
    ExperienceParser --> NERExtractor : uses
    ExperienceParser --> TitleGazetteer : uses
    ExperienceParser --> RegexExtractor : uses
    EducationParser --> NERExtractor : uses
    EducationParser --> TitleGazetteer : uses
    EducationParser --> RegexExtractor : uses
    MLResumeParser ..> Profile : populates

    ATSService --> SkillService : uses
    ResumeOptimizerService --> ATSService : reuses scoring
    ResumeOptimizerService --> SkillService : uses
    SuggestionService --> ATSService : reads analysis
    ATSService ..> Profile : scores against
    PdfService ..> Profile : reads
```

## Notes for the report

- **Domain model** classes map 1:1 to PostgreSQL tables (SQLAlchemy `Base`
  subclasses). Relationships shown are foreign-key backed (`ForeignKey` +
  `relationship(...)`), with `Profile → WorkExperience/Education` cascading on
  delete.
- **Service layer** classes are Python modules exposed as static-style
  function collections (not instantiated objects) — represented here as
  classes per UML convention, with each stereotype (`<<...>>`) naming the
  algorithm it implements, matching the Algorithm Index in
  [SEQUENCE_DIAGRAM.md](SEQUENCE_DIAGRAM.md).
- `MLResumeParser` is the only class that writes into the domain model
  (`Profile`); the scoring/optimization classes read `Profile` but never
  mutate it directly — mutation happens explicitly in the router layer after
  the user reviews suggested changes.
