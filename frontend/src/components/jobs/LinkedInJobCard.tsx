import {
  Building2,
  MapPin,
  Clock,
  ExternalLink,
  Bookmark,
  CheckCircle,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Job } from "@/types";

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "Recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatSalary(job: Job): string | null {
  if (job.job_min_salary == null && job.job_max_salary == null) return null;
  const currency = job.job_salary_currency ?? "USD";
  const unit = "year";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  if (job.job_min_salary != null && job.job_max_salary != null) {
    return `${fmt(job.job_min_salary)} – ${fmt(job.job_max_salary)} / ${unit}`;
  }
  if (job.job_min_salary != null) return `From ${fmt(job.job_min_salary)} / ${unit}`;
  return `Up to ${fmt(job.job_max_salary as number)} / ${unit}`;
}

function locationLabel(job: Job) {
  const parts = [job.job_city, job.job_country].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return job.job_location ?? "Location unknown";
}

interface LinkedInJobCardProps {
  job: Job;
  isSelected?: boolean;
  onSelect?: (job: Job) => void;
  onSave?: (job: Job) => void;
  isSaving?: boolean;
}

export function LinkedInJobCard({
  job,
  isSelected = false,
  onSelect,
  onSave,
  isSaving = false,
}: LinkedInJobCardProps) {
  const salary = formatSalary(job);
  const isNew = job.job_posted_at_datetime_utc
    ? Date.now() - new Date(job.job_posted_at_datetime_utc).getTime() < 3 * 86400000
    : false;

  return (
    <button
      onClick={() => onSelect?.(job)}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all duration-200",
        "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-lg border bg-muted overflow-hidden flex items-center justify-center">
          {job.employer_logo ? (
            <img
              src={job.employer_logo}
              alt={job.employer_name}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
              {job.job_title}
            </h3>
            {isSelected && (
              <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {job.employer_name}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{locationLabel(job)}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.job_is_remote && <Badge variant="secondary">Remote</Badge>}
        {job.job_employment_type && (
          <Badge variant="outline" className="capitalize">
            {String(job.job_employment_type).replace(/_/g, " ").toLowerCase()}
          </Badge>
        )}
        {job.match_score != null && (
          <Badge variant="outline" className="border-primary/30 text-primary">
            {job.match_score}% match
          </Badge>
        )}
        {job.job_apply_link && (
          <Badge className="bg-green-500/10 text-green-700 border border-green-200">
            <Zap className="h-3 w-3 mr-1" />
            Apply
          </Badge>
        )}
        {isNew && (
          <Badge className="bg-blue-500/10 text-blue-700 border border-blue-200">
            New
          </Badge>
        )}
      </div>

      {salary && <p className="mt-2 text-sm font-medium text-green-600">{salary}</p>}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(job.job_posted_at_datetime_utc)}
          </span>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onSave?.(job);
            }}
            disabled={isSaving}
            title="Save job"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
          <a
            href={job.job_apply_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Button size="sm" variant="outline" className="h-7">
              <ExternalLink className="h-3 w-3 mr-1" />
              Apply
            </Button>
          </a>
        </div>
      </div>
    </button>
  );
}
