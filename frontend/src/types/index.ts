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
  location?: string;
  desired_title?: string;
  work_model?: "remote" | "hybrid" | "on-site";
  experience_level?: "entry" | "mid" | "senior" | "lead";
  work_authorization?: string;
  salary_min?: number;
  salary_max?: number;
  skills: string[];
  completeness_pct: number;
  resume_url?: string;
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

export type LinkedInJob = {
  id: string;
  date_posted: string;
  date_created: string;
  title: string;
  organization: string;
  organization_url: string;
  date_validthrough: string | null;

  locations_raw: {
    "@type": string;
    address: {
      "@type": string;
      addressRegion: string | null;
      addressCountry: string | null;
      addressLocality: string | null;
      streetAddress?: string | null;
    };
    latitude?: number;
    longitude?: number;
  }[];

  location_type: string | null;
  location_requirements_raw: any[] | null;

  salary_raw: {
    "@type": string;
    currency: string;
    value: {
      "@type": string;
      minValue: number;
      maxValue: number;
      unitText: string;
    };
  } | null;

  employment_type: string[];

  url: string;
  source_type: string;
  source: string;
  source_domain: string;

  organization_logo: string;

  cities_derived: string[] | null;
  counties_derived: string[] | null;
  regions_derived: string[] | null;
  countries_derived: string[];
  locations_derived: string[];
  timezones_derived: string[];

  lats_derived: number[];
  lngs_derived: number[];

  remote_derived: boolean;

  linkedin_org_employees: number | null;
  linkedin_org_url: string;
  linkedin_org_size: string;
  linkedin_org_slogan: string | null;
  linkedin_org_industry: string;
  linkedin_org_followers: number | null;
  linkedin_org_headquarters: string;
  linkedin_org_type: string;
  linkedin_org_foundeddate: string;

  linkedin_org_specialties: string[];
  linkedin_org_locations: string[];
  linkedin_org_description: string;

  linkedin_org_recruitment_agency_derived: boolean;

  seniority: string;
  directapply: boolean;

  linkedin_org_slug: string;

  no_jb_schema: boolean | null;

  external_apply_url: string | null;
  ats_duplicate: boolean | null;

  description_text: string;
};
