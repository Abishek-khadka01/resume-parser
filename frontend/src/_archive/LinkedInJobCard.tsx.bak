import {
  Building2,
  MapPin,
  Clock,
  Users,
  ExternalLink,
  Bookmark,
  CheckCircle,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LinkedInJob } from "@/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatSalary(job: LinkedInJob): string | null {
  if (!job.salary_raw) return null;
  const { minValue, maxValue, unitText } = job.salary_raw.value;
  const currency = job.salary_raw.currency;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  if (minValue && maxValue)
    return `${fmt(minValue)} – ${fmt(maxValue)} / ${unitText}`;
  if (minValue) return `From ${fmt(minValue)} / ${unitText}`;
  if (maxValue) return `Up to ${fmt(maxValue)} / ${unitText}`;
  return null;
}

function orgSizeLabel(size?: string | null) {
  if (!size) return "";
  return (
    size.replace(/(\d+)/, (m) => Number(m).toLocaleString()) + " employees"
  );
}

interface LinkedInJobCardProps {
  job: LinkedInJob;
  isSelected?: boolean;
  onSelect?: (job: LinkedInJob) => void;
  onSave?: (job: LinkedInJob) => void;
  isSaving?: boolean;
}

export function LinkedInJobCard({
  job,
  isSelected = false,
  onSelect,
  onSave,
  isSaving = false,
}: LinkedInJobCardProps) {
  const location =
    job.locations_derived?.[0] ??
    [
      job.locations_raw?.[0]?.address?.addressLocality,
      job.locations_raw?.[0]?.address?.addressRegion,
      job.locations_raw?.[0]?.address?.addressCountry,
    ]
      .filter(Boolean)
      .join(", ") ??
    "Location unknown";

  const salary = formatSalary(job);
  const isNew = Date.now() - new Date(job.date_posted).getTime() < 3 * 86400000;

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
      {/* HEADER */}
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-lg border bg-muted overflow-hidden flex items-center justify-center">
          {job.organization_logo ? (
            <img
              src={job.organization_logo}
              alt={job.organization}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
              {job.title}
            </h3>
            {isSelected && (
              <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {job.organization}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        </div>
      </div>

      {/* BADGES */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.remote_derived && <Badge variant="secondary">Remote</Badge>}
        {job.employment_type?.map((type) => (
          <Badge key={type} variant="outline" className="capitalize">
            {type.replace(/_/g, " ").toLowerCase()}
          </Badge>
        ))}
        {job.seniority && (
          <Badge variant="outline" className="border-primary/30 text-primary">
            {job.seniority}
          </Badge>
        )}
        {job.directapply && (
          <Badge className="bg-green-500/10 text-green-700 border border-green-200">
            <Zap className="h-3 w-3 mr-1" />
            Easy Apply
          </Badge>
        )}
        {isNew && (
          <Badge className="bg-blue-500/10 text-blue-700 border border-blue-200">
            New
          </Badge>
        )}
      </div>

      {/* SALARY */}
      {salary && (
        <p className="mt-2 text-sm font-medium text-green-600">{salary}</p>
      )}

      {/* FOOTER */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(job.date_posted)}
          </span>
          {job.linkedin_org_size && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {orgSizeLabel(job.linkedin_org_size)}
            </span>
          )}
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
            href={job.external_apply_url ?? job.url}
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
