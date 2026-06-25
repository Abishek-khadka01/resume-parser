import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Briefcase,
  GraduationCap,
  MapPin,
  SlidersHorizontal,
  X,
  LayoutList,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { LinkedInJobCard } from "@/components/jobs/LinkedInJobCard";
import { LinkedInJobDetail } from "@/components/jobs/LinkedInJobDetail";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { LinkedInJob } from "@/types";

/* ── sections ── */
type SectionKey = "jobs" | "internships" | "remote" | "easy_apply";

const SECTIONS: {
  key: SectionKey;
  label: string;
  icon: React.ElementType;
  desc: string;
  extra: Record<string, string>;
}[] = [
  {
    key: "jobs",
    label: "Jobs",
    icon: Briefcase,
    desc: "Full-time, part-time & contract positions",
    extra: {},
  },
  {
    key: "internships",
    label: "Internships",
    icon: GraduationCap,
    desc: "Internship programs for students & graduates",
    extra: { ai_employment_type: "INTERNSHIP" },
  },
  {
    key: "remote",
    label: "Remote",
    icon: MapPin,
    desc: "Work-from-anywhere positions worldwide",
    extra: { ai_work_arrangement: "Remote Solely" },
  },
  {
    key: "easy_apply",
    label: "Easy Apply",
    icon: LayoutList,
    desc: "Apply instantly — direct apply jobs only",
    extra: { direct_apply: "only" },
  },
];

/* ── static options ── */
const SENIORITY_OPTS = [
  { v: "", l: "All Levels" },
  { v: "Entry level", l: "Entry Level" },
  { v: "Mid-Senior level", l: "Mid-Senior" },
  { v: "Director", l: "Director" },
  { v: "Executive", l: "Executive" },
];
const TIME_OPTS = [
  { v: "", l: "Any Time" },
  { v: "24h", l: "Past 24 hours" },
  { v: "7d", l: "Past week" },
  { v: "6m", l: "Past 6 months" },
];
const WORK_ARR_OPTS = [
  { v: "", l: "Any" },
  { v: "Remote Solely", l: "Remote" },
  { v: "Hybrid", l: "Hybrid" },
  { v: "Onsite", l: "Onsite" },
];
const EXP_OPTS = [
  { v: "", l: "Any" },
  { v: "0-2", l: "0–2 years" },
  { v: "2-5", l: "2–5 years" },
  { v: "5-10", l: "5–10 years" },
];
const EMP_TYPE_OPTS = [
  { v: "", l: "Any" },
  { v: "FULL_TIME", l: "Full-time" },
  { v: "PART_TIME", l: "Part-time" },
  { v: "CONTRACT", l: "Contract" },
  { v: "TEMPORARY", l: "Temporary" },
  { v: "INTERNSHIP", l: "Internship" },
];
const LIMIT_OPTS = [
  { v: "25", l: "25 results" },
  { v: "50", l: "50 results" },
  { v: "100", l: "100 results" },
];

function sp(params: URLSearchParams, key: string, fallback = "") {
  return params.get(key) ?? fallback;
}

function ActivePill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs px-2.5 py-0.5 font-medium">
      {label}
      <button onClick={onRemove} className="hover:opacity-70">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── page ── */
export default function LinkedInJobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();

  // draft inputs (not submitted yet)
  const [draftTitle, setDraftTitle] = useState(sp(searchParams, "title"));
  const [draftLocation, setDraftLocation] = useState(
    sp(searchParams, "location"),
  );
  const [draftOrg, setDraftOrg] = useState(sp(searchParams, "organization"));

  // submitted values (trigger query)
  const [title, setTitle] = useState(sp(searchParams, "title"));
  const [location, setLocation] = useState(sp(searchParams, "location"));
  const [org, setOrg] = useState(sp(searchParams, "organization"));

  // filters
  const [section, setSection] = useState<SectionKey>(
    (sp(searchParams, "section") as SectionKey) || "jobs",
  );
  const [seniority, setSeniority] = useState(sp(searchParams, "seniority"));
  const [timeFrame, setTimeFrame] = useState(sp(searchParams, "time_frame"));
  const [workArr, setWorkArr] = useState(
    sp(searchParams, "ai_work_arrangement"),
  );
  const [expLevel, setExpLevel] = useState(
    sp(searchParams, "ai_experience_level"),
  );
  const [empType, setEmpType] = useState(
    sp(searchParams, "ai_employment_type"),
  );
  const [limit, setLimit] = useState(sp(searchParams, "limit", "25"));
  const [offset, setOffset] = useState(sp(searchParams, "offset", "0"));
  const [hasSalary, setHasSalary] = useState(sp(searchParams, "has_salary"));
  const [noAgency, setNoAgency] = useState(
    sp(searchParams, "organization_agency"),
  );
  const [orgSlug, setOrgSlug] = useState(sp(searchParams, "organization_slug"));

  // advanced
  const [titleAdv, setTitleAdv] = useState(sp(searchParams, "title_advanced"));
  const [descAdv, setDescAdv] = useState(
    sp(searchParams, "description_advanced"),
  );
  const [locAdv, setLocAdv] = useState(sp(searchParams, "location_advanced"));
  const [orgAdv, setOrgAdv] = useState(
    sp(searchParams, "organization_advanced"),
  );

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── KEY FIX: selectedJob drives the detail panel ──
  const [selectedJob, setSelectedJob] = useState<LinkedInJob | null>(null);

  const currentSection = SECTIONS.find((s) => s.key === section)!;

  /* ── sync → URL ── */
  useEffect(() => {
    const p: Record<string, string> = {};
    if (section !== "jobs") p.section = section;
    if (title) p.title = title;
    if (location) p.location = location;
    if (org) p.organization = org;
    if (orgSlug) p.organization_slug = orgSlug;
    if (seniority) p.seniority = seniority;
    if (timeFrame) p.time_frame = timeFrame;
    if (workArr) p.ai_work_arrangement = workArr;
    if (expLevel) p.ai_experience_level = expLevel;
    if (empType) p.ai_employment_type = empType;
    if (limit !== "25") p.limit = limit;
    if (offset !== "0") p.offset = offset;
    if (hasSalary) p.has_salary = hasSalary;
    if (noAgency) p.organization_agency = noAgency;
    if (titleAdv) p.title_advanced = titleAdv;
    if (descAdv) p.description_advanced = descAdv;
    if (locAdv) p.location_advanced = locAdv;
    if (orgAdv) p.organization_advanced = orgAdv;
    setSearchParams(p, { replace: true });
  }, [
    section,
    title,
    location,
    org,
    orgSlug,
    seniority,
    timeFrame,
    workArr,
    expLevel,
    empType,
    limit,
    offset,
    hasSalary,
    noAgency,
    titleAdv,
    descAdv,
    locAdv,
    orgAdv,
  ]);

  /* ── query ── */
  const queryParams = {
    title: title || undefined,
    location: location || undefined,
    organization: org || undefined,
    organization_slug: orgSlug || undefined,
    seniority: seniority || undefined,
    time_frame: timeFrame || undefined,
    ai_work_arrangement: workArr || undefined,
    ai_experience_level: expLevel || undefined,
    ai_employment_type: empType || undefined,
    limit,
    offset,
    has_salary: hasSalary || undefined,
    organization_agency: noAgency || undefined,
    description_format: "text",
    title_advanced: titleAdv || undefined,
    description_advanced: descAdv || undefined,
    location_advanced: locAdv || undefined,
    organization_advanced: orgAdv || undefined,
    ...currentSection.extra,
  };

  const {
    data: jobs,
    isLoading,
    isError,
  } = useQuery<LinkedInJob[]>({
    queryKey: ["linkedin-jobs", queryParams],
    queryFn: () =>
      api.get("/jobs/linkedin", { params: queryParams }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  // Auto-select first job when results load; clear when empty
  useEffect(() => {
    if (jobs?.length && !selectedJob) setSelectedJob(jobs[0]);
    if (jobs?.length === 0) setSelectedJob(null);
  }, [jobs]);

  const saveMutation = useMutation({
    mutationFn: (job: LinkedInJob) =>
      api.post("/applications", {
        job_id: job.id,
        job_title: job.title,
        company_name: job.organization,
        company_logo_url: job.organization_logo,
        status: "saved",
        job_data: job,
      }),
    onSuccess: () => {
      toast.success("Saved to ATS board!");
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: () => toast.error("Failed to save"),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setTitle(draftTitle);
    setLocation(draftLocation);
    setOrg(draftOrg);
    setOffset("0");
    setSelectedJob(null);
  }

  function clearAllFilters() {
    setSeniority("");
    setTimeFrame("");
    setWorkArr("");
    setExpLevel("");
    setEmpType("");
    setHasSalary("");
    setNoAgency("");
    setOrgSlug("");
    setTitleAdv("");
    setDescAdv("");
    setLocAdv("");
    setOrgAdv("");
    setLimit("25");
    setOffset("0");
  }

  const activePills = [
    seniority && {
      label: SENIORITY_OPTS.find((o) => o.v === seniority)?.l ?? seniority,
      clear: () => setSeniority(""),
    },
    timeFrame && {
      label: TIME_OPTS.find((o) => o.v === timeFrame)?.l ?? timeFrame,
      clear: () => setTimeFrame(""),
    },
    workArr && { label: workArr, clear: () => setWorkArr("") },
    expLevel && { label: expLevel, clear: () => setExpLevel("") },
    empType && {
      label: EMP_TYPE_OPTS.find((o) => o.v === empType)?.l ?? empType,
      clear: () => setEmpType(""),
    },
    hasSalary && { label: "💰 Has Salary", clear: () => setHasSalary("") },
    noAgency && { label: "No Agencies", clear: () => setNoAgency("") },
    titleAdv && { label: `title: ${titleAdv}`, clear: () => setTitleAdv("") },
    descAdv && { label: `desc: ${descAdv}`, clear: () => setDescAdv("") },
    locAdv && { label: `loc: ${locAdv}`, clear: () => setLocAdv("") },
    orgAdv && { label: `org: ${orgAdv}`, clear: () => setOrgAdv("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const currentPage = Math.floor(parseInt(offset) / parseInt(limit)) + 1;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── search bar ── */}
      <div className="shrink-0 pb-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Job title or skill…"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative w-40">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Location"
              value={draftLocation}
              onChange={(e) => setDraftLocation(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative w-36">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Company"
              value={draftOrg}
              onChange={(e) => setDraftOrg(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Filters"
            onClick={() => setShowFilters((v) => !v)}
            className={cn("relative", showFilters && "ring-2 ring-primary")}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activePills.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center font-bold">
                {activePills.length}
              </span>
            )}
          </Button>
        </form>

        {/* ── filter panel ── */}
        {showFilters && (
          <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex flex-wrap gap-3">
              <FilterRow label="Seniority">
                <Select
                  value={seniority || "all"}
                  onValueChange={(v) => setSeniority(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SENIORITY_OPTS.map((o) => (
                      <SelectItem
                        key={o.v}
                        value={o.v || "all"}
                        className="text-xs"
                      >
                        {o.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterRow>
              <FilterRow label="Date Posted">
                <Select
                  value={timeFrame || "all"}
                  onValueChange={(v) => setTimeFrame(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTS.map((o) => (
                      <SelectItem
                        key={o.v}
                        value={o.v || "all"}
                        className="text-xs"
                      >
                        {o.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterRow>
              <FilterRow label="Work Mode">
                <Select
                  value={workArr || "all"}
                  onValueChange={(v) => setWorkArr(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_ARR_OPTS.map((o) => (
                      <SelectItem
                        key={o.v}
                        value={o.v || "all"}
                        className="text-xs"
                      >
                        {o.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterRow>
              <FilterRow label="Experience">
                <Select
                  value={expLevel || "all"}
                  onValueChange={(v) => setExpLevel(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXP_OPTS.map((o) => (
                      <SelectItem
                        key={o.v}
                        value={o.v || "all"}
                        className="text-xs"
                      >
                        {o.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterRow>
              <FilterRow label="Employment Type">
                <Select
                  value={empType || "all"}
                  onValueChange={(v) => setEmpType(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMP_TYPE_OPTS.map((o) => (
                      <SelectItem
                        key={o.v}
                        value={o.v || "all"}
                        className="text-xs"
                      >
                        {o.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterRow>
              <FilterRow label="Results">
                <Select
                  value={limit}
                  onValueChange={(v) => {
                    setLimit(v);
                    setOffset("0");
                  }}
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LIMIT_OPTS.map((o) => (
                      <SelectItem key={o.v} value={o.v} className="text-xs">
                        {o.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterRow>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setHasSalary((v) => (v ? "" : "true"))}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                  hasSalary
                    ? "bg-green-500/10 border-green-300 text-green-700"
                    : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                <DollarSign className="h-3 w-3" /> Has Salary
              </button>
              <button
                onClick={() => setNoAgency((v) => (v ? "" : "exclude"))}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                  noAgency
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                <X className="h-3 w-3" /> Exclude Agencies
              </button>
              <div className="relative flex-1 min-w-[160px] max-w-[220px]">
                <Input
                  className="h-8 text-xs"
                  placeholder="Company slug (e.g. google)"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                {showAdvanced ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                Advanced Boolean Search
              </button>
              {showAdvanced && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FilterRow label="Title Advanced (e.g. '(data & engineer) & !senior')">
                    <Input
                      className="h-8 text-xs font-mono"
                      placeholder="(data & engineer) & !senior"
                      value={titleAdv}
                      onChange={(e) => setTitleAdv(e.target.value)}
                    />
                  </FilterRow>
                  <FilterRow label='Description Advanced (e.g. "python & (aws | azure)")'>
                    <Input
                      className="h-8 text-xs font-mono"
                      placeholder="python & (aws | azure)"
                      value={descAdv}
                      onChange={(e) => setDescAdv(e.target.value)}
                    />
                  </FilterRow>
                  <FilterRow label="Location Advanced">
                    <Input
                      className="h-8 text-xs font-mono"
                      placeholder="United States"
                      value={locAdv}
                      onChange={(e) => setLocAdv(e.target.value)}
                    />
                  </FilterRow>
                  <FilterRow label='Organization Advanced (e.g. "(Google | Microsoft)")'>
                    <Input
                      className="h-8 text-xs font-mono"
                      placeholder="(Google | Microsoft)"
                      value={orgAdv}
                      onChange={(e) => setOrgAdv(e.target.value)}
                    />
                  </FilterRow>
                  <p className="col-span-full text-[11px] text-muted-foreground">
                    Operators: <code>&amp;</code> (AND) · <code>|</code> (OR) ·{" "}
                    <code>!</code> (NOT) · use <code>'quotes'</code> for phrases
                  </p>
                </div>
              )}
            </div>

            {activePills.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive h-7"
                onClick={clearAllFilters}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Clear all filters
              </Button>
            )}
          </div>
        )}

        {activePills.length > 0 && !showFilters && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activePills.map((p) => (
              <ActivePill key={p.label} label={p.label} onRemove={p.clear} />
            ))}
          </div>
        )}
      </div>

      {/* ── section tabs ── */}
      <div className="shrink-0 mb-3">
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => {
                  setSection(s.key);
                  setOffset("0");
                  setSelectedJob(null);
                }}
                className={cn(
                  "flex items-center gap-2 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  section === s.key
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:block">{s.label}</span>
                {section === s.key && jobs != null && (
                  <Badge
                    variant="secondary"
                    className="ml-auto text-xs font-semibold h-5 px-1.5"
                  >
                    {jobs.length}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 ml-1">
          {currentSection.desc}
        </p>
      </div>

      <Separator className="mb-3" />

      {/* ── two-column body ── */}
      <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
        {/* job list — fixed width when detail panel is open */}
        <div
          className={cn(
            "flex flex-col gap-2 overflow-y-auto pr-1 shrink-0 transition-all",
            selectedJob ? "w-[340px]" : "flex-1",
          )}
        >
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-xl bg-muted animate-pulse"
                style={{ animationDelay: `${i * 70}ms` }}
              />
            ))}

          {isError && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive/60" />
              <p className="text-sm font-medium">Failed to load jobs</p>
              <p className="text-xs text-muted-foreground">
                Check your connection or try again.
              </p>
            </div>
          )}

          {!isLoading && !isError && jobs?.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">No jobs found</p>
              <p className="text-xs text-muted-foreground">
                Adjust search or filters and try again.
              </p>
            </div>
          )}

          {/* ── job cards — clicking any card sets selectedJob and opens the detail panel ── */}
          {!isLoading &&
            jobs?.map((job) => (
              <LinkedInJobCard
                key={job.id}
                job={job}
                isSelected={selectedJob?.id === job.id}
                onSelect={(j) => setSelectedJob(j)} // ← opens detail
                onSave={(j) => saveMutation.mutate(j)}
                isSaving={saveMutation.isPending}
              />
            ))}

          {/* pagination */}
          {!isLoading && jobs && jobs.length >= parseInt(limit) && (
            <div className="flex items-center justify-center gap-3 pt-2 pb-4">
              <Button
                size="sm"
                variant="outline"
                disabled={offset === "0"}
                onClick={() => {
                  setOffset(
                    String(Math.max(0, parseInt(offset) - parseInt(limit))),
                  );
                  setSelectedJob(null);
                }}
              >
                ← Prev
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setOffset(String(parseInt(offset) + parseInt(limit)));
                  setSelectedJob(null);
                }}
              >
                Next →
              </Button>
            </div>
          )}
        </div>

        {/* ── detail panel — renders when a job is selected ── */}
        {selectedJob && (
          <div className="flex-1 min-w-0 rounded-xl border border-border bg-card overflow-hidden relative">
            {/* close button */}
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
              title="Close"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            <LinkedInJobDetail
              job={selectedJob}
              onSave={(j) => saveMutation.mutate(j)}
              isSaving={saveMutation.isPending}
            />
          </div>
        )}
      </div>
    </div>
  );
}
