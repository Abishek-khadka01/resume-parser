import {
  Building2,
  MapPin,
  ExternalLink,
  Bookmark,
  Briefcase,
  Clock,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Job } from "@/types";

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "Recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function formatSalary(job: Job): string | null {
  if (job.job_min_salary == null && job.job_max_salary == null) return null;
  const currency = job.job_salary_currency ?? "USD";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  if (job.job_min_salary != null && job.job_max_salary != null) {
    return `${fmt(job.job_min_salary)} – ${fmt(job.job_max_salary)} / year`;
  }
  if (job.job_min_salary != null) return `From ${fmt(job.job_min_salary)} / year`;
  return `Up to ${fmt(job.job_max_salary as number)} / year`;
}

function locationLabel(job: Job) {
  const parts = [job.job_city, job.job_country].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return job.job_location ?? "Location unknown";
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Briefcase className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

interface LinkedInJobDetailProps {
  job: Job;
  onSave?: (job: Job) => void;
  isSaving?: boolean;
}

export function LinkedInJobDetail({
  job,
  onSave,
  isSaving = false,
}: LinkedInJobDetailProps) {
  const salary = formatSalary(job);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-xl border border-border bg-muted overflow-hidden flex items-center justify-center shrink-0">
            {job.employer_logo ? (
              <img
                src={job.employer_logo}
                alt={job.employer_name}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {job.job_title}
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {locationLabel(job)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {job.job_is_remote && (
            <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 border">
              Remote
            </Badge>
          )}
          {job.job_employment_type && (
            <Badge variant="secondary" className="capitalize">
              {String(job.job_employment_type).replace(/_/g, " ").toLowerCase()}
            </Badge>
          )}
          {job.match_score != null && (
            <Badge variant="outline" className="border-primary/30 text-primary">
              {job.match_score}% match
            </Badge>
          )}
        </div>

        {salary && (
          <p className="mt-3 text-sm font-semibold text-green-700 dark:text-green-400">
            💰 {salary}
          </p>
        )}

        <p className="mt-2 text-xs text-muted-foreground">
          Posted {timeAgo(job.job_posted_at_datetime_utc)}
        </p>

        <div className="mt-4 flex gap-2">
          <a
            href={job.job_apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button className="w-full" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Apply Now
            </Button>
          </a>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSave?.(job)}
            disabled={isSaving}
            title="Save job"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 border-b border-border">
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          Job Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 divide-y divide-border">
          <InfoRow label="Employment Type" value={String(job.job_employment_type ?? "")} />
          <InfoRow label="Remote Friendly" value={job.job_is_remote ? "Yes" : "No"} />
          <InfoRow label="Posted" value={timeAgo(job.job_posted_at_datetime_utc)} />
          <InfoRow label="Location" value={locationLabel(job)} />
        </div>
      </div>

      <div className="p-6 border-b border-border">
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          Job Description
        </h3>
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto pr-2">
          {job.job_description ?? "No description provided."}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          Why This Listing Stands Out
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          This result comes directly from JSearch, which aggregates live public job postings across multiple job sites.
        </p>
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Open the application link to continue with the employer's process.
        </div>
        <Separator className="my-4" />
        <a
          href={job.job_apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          Open original job posting
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
