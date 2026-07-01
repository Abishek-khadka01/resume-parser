import {
  Building2,
  Globe2,
  MapPin,
  Users,
  Award,
  ExternalLink,
  ChevronRight,
  Bookmark,
  Briefcase,
  GraduationCap,
  Clock,
  BarChart2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { LinkedInJob } from "@/types";

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function formatSalary(job: LinkedInJob): string | null {
  if (!job.salary_raw) return null;
  const { minValue, maxValue, unitText, currency } = {
    ...job.salary_raw.value,
    currency: job.salary_raw.currency,
  };
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  if (minValue && maxValue)
    return `${fmt(minValue)} – ${fmt(maxValue)} / ${unitText}`;
  if (maxValue) return `Up to ${fmt(maxValue)} / ${unitText}`;
  if (minValue) return `From ${fmt(minValue)} / ${unitText}`;
  return null;
}

/* ─── InfoRow ───────────────────────────────────────────────────────────────── */

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

/* ─── props ─────────────────────────────────────────────────────────────────── */

interface LinkedInJobDetailProps {
  job: LinkedInJob;
  onSave?: (job: LinkedInJob) => void;
  isSaving?: boolean;
}

/* ─── component ─────────────────────────────────────────────────────────────── */

export function LinkedInJobDetail({
  job,
  onSave,
  isSaving = false,
}: LinkedInJobDetailProps) {
  const salary = formatSalary(job);

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

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── hero ── */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-xl border border-border bg-muted overflow-hidden flex items-center justify-center shrink-0">
            {job.organization_logo ? (
              <img
                src={job.organization_logo}
                alt={job.organization}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {job.title}
            </h2>
            <a
              href={job.organization_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1 mt-0.5 w-fit"
            >
              {job.organization}
              <ChevronRight className="h-3 w-3" />
            </a>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {location}
            </p>
          </div>
        </div>

        {/* badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          {job.remote_derived && (
            <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 border">
              Remote
            </Badge>
          )}
          {job.employment_type?.map((t) => (
            <Badge key={t} variant="secondary" className="capitalize">
              {t.replace(/_/g, " ").toLowerCase()}
            </Badge>
          ))}
          {job.seniority && (
            <Badge
              variant="outline"
              className="capitalize text-primary border-primary/30"
            >
              {job.seniority}
            </Badge>
          )}
          {job.directapply && (
            <Badge className="bg-green-500/10 text-green-700 border-green-200 border">
              ⚡ Easy Apply
            </Badge>
          )}
        </div>

        {/* salary */}
        {salary && (
          <p className="mt-3 text-sm font-semibold text-green-700 dark:text-green-400">
            💰 {salary}
          </p>
        )}

        {/* meta */}
        <p className="mt-2 text-xs text-muted-foreground">
          Posted {timeAgo(job.date_posted)} · via{" "}
          <span className="capitalize">{job.source_domain}</span>
        </p>

        {/* CTA buttons */}
        <div className="mt-4 flex gap-2">
          <a
            href={job.external_apply_url ?? job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button className="w-full" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              {job.directapply ? "Easy Apply" : "Apply Now"}
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

      {/* ── about role ── */}
      <div className="p-6 border-b border-border">
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          About the Role
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 divide-y divide-border">
          <InfoRow
            icon={Briefcase}
            label="Employment Type"
            value={job.employment_type?.join(", ")}
          />
          <InfoRow icon={Award} label="Seniority Level" value={job.seniority} />
          <InfoRow
            icon={BarChart2}
            label="Location Type"
            value={job.location_type}
          />
          <InfoRow
            icon={Clock}
            label="Posted"
            value={timeAgo(job.date_posted)}
          />
        </div>
      </div>

      {/* ── job description ── */}
      <div className="p-6 border-b border-border">
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          Job Description
        </h3>
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto pr-2">
          {job.description_text ?? "No description provided."}
        </div>
      </div>

      {/* ── about company ── */}
      <div className="p-6">
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          About {job.organization}
        </h3>

        {job.linkedin_org_description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-4">
            {job.linkedin_org_description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 divide-y divide-border">
          <InfoRow
            icon={Building2}
            label="Industry"
            value={job.linkedin_org_industry}
          />
          <InfoRow
            icon={Users}
            label="Company Size"
            value={job.linkedin_org_size}
          />
          <InfoRow
            icon={MapPin}
            label="Headquarters"
            value={job.linkedin_org_headquarters}
          />
          <InfoRow icon={Globe2} label="Type" value={job.linkedin_org_type} />
          <InfoRow
            icon={Award}
            label="Founded"
            value={job.linkedin_org_foundeddate}
          />
          {job.linkedin_org_followers != null && (
            <InfoRow
              icon={Users}
              label="Followers"
              value={`${job.linkedin_org_followers.toLocaleString()} followers`}
            />
          )}
        </div>

        {job.linkedin_org_specialties?.length > 0 && (
          <>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
              Specialties
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.linkedin_org_specialties.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </>
        )}

        <Separator className="my-4" />

        <a
          href={job.linkedin_org_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <GraduationCap className="h-3.5 w-3.5" />
          View company on LinkedIn
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
