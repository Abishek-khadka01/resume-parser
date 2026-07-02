export interface User {
  id: string;
  email: string;
  auth_provider: "local" | "google";
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  linkedin_url?: string;
  github_url?: string;
  location?: string;
  summary?: string;
  desired_title?: string;
  work_model?: "remote" | "hybrid" | "on-site";
  experience_level?: "entry" | "mid" | "senior" | "lead";
  work_authorization?: string;
  salary_min?: number;
  salary_max?: number;
  skills: string[];
  completeness_pct: number;
  resume_url?: string;
  resume_uploaded: boolean;
  resume_locked_fields: string[];
  work_experience: WorkExperience[];
  education: Education[];
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduation_year?: number;
}

export interface Job {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo?: string;
  job_city?: string;
  job_country?: string;
  job_employment_type?: string;
  job_is_remote?: boolean;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_posted_at_datetime_utc?: string;
  job_description: string;
  job_apply_link: string;
  match_score?: number;
  job_offer_expiration_datetime_utc?: string;
  job_start_date?: string;
  job_end_date?: string;
  job_highlights?: Record<string, string[]>;
}

export interface JobSearchResponse {
  jobs: Job[];
  cursor?: string | null;
}

export interface Suggestion {
  type: "missing_skill" | "underemphasized_skill";
  category: string;
  keyword: string;
  message: string;
}

export interface AtsAnalysis {
  score: number;
  skill_score: number;
  text_score: number;
  semantic_score: number;
  matched_skills: Record<string, string[]>;
  missing_skills: Record<string, string[]>;
  suggestions: Suggestion[];
}

export interface OptimizedExperience {
  id: string;
  title: string;
  company: string;
  start_date?: string;
  end_date?: string;
  description: string;
}

export interface ResumeChange {
  type: "skill_emphasized" | "skill_added_to_skills_list" | "quantify_suggestion" | "skills_reordered";
  category?: string;
  keyword?: string;
  experience_id?: string;
  experience_title?: string;
  before?: string;
  after?: string;
  added_sentence?: string;
  message?: string;
}

export interface ResumeOptimization {
  score_before: number;
  score_after: number;
  changes: ResumeChange[];
  optimized_skills_categorized: Record<string, string[]>;
  optimized_experience: OptimizedExperience[];
}

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  company_logo_url?: string;
  match_score?: number;
  status: ApplicationStatus;
  notes?: string;
  applied_at?: string;
  status_updated_at: string;
  created_at: string;
  job_data: Job;
}

export interface JobAlert {
  id: string;
  keywords: string[];
  location?: string;
  work_model?: string;
  min_match_pct: number;
  frequency: "instant" | "daily" | "weekly";
  is_active: boolean;
  last_sent_at?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}
