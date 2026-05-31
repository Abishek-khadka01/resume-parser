import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch,
  faBriefcase,
  faHome,
  faFileContract,
  faBookmark,
  faExternalLinkAlt,
  faGraduationCap,
  faCheck,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, getMatchColor } from '@/lib/utils'
import api from '@/lib/api'
import type { Job } from '@/types'

const JOB_TYPES = [
  { value: 'full_time', label: 'Full-time', icon: faBriefcase },
  { value: 'remote', label: 'Remote', icon: faHome },
  { value: 'contract', label: 'Contract', icon: faFileContract },
]

const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead']

function formatSalary(min?: number, max?: number): string | null {
  if (min == null && max == null) return null
  const a = min != null ? `$${(min / 1000).toFixed(0)}k` : ''
  const b = max != null ? `$${(max / 1000).toFixed(0)}k` : ''
  if (a && b && a !== b) return `${a} - ${b}`
  return a || b
}

export default function Jobs() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['jobs', query],
    queryFn: () => api.get('/jobs/search', { params: { q: query } }).then((r) => r.data),
    enabled: true,
  })

  const saveMutation = useMutation({
    mutationFn: (job: Job) =>
      api.post('/applications', {
        job_id: job.job_id,
        job_title: job.job_title,
        company_name: job.employer_name,
        company_logo_url: job.employer_logo,
        match_score: job.match_score,
        status: 'saved',
        job_data: job,
      }),
    onSuccess: () => {
      toast.success('Job saved to ATS board')
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: () => toast.error('Failed to save job'),
  })

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const toggleLevel = (value: string) => {
    setSelectedLevels((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const clearFilters = () => {
    setSelectedTypes([])
    setSelectedLevels([])
    setSearch('')
    setQuery('')
  }

  const hasActiveFilters = selectedTypes.length > 0 || selectedLevels.length > 0 || query.length > 0

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="w-full lg:w-64 shrink-0">
        <div className="lg:sticky lg:top-4 rounded-2xl border border-[#74007a]/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faSearch} className="w-3.5 h-3.5 text-[#74007a]" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Filters</h3>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-400 hover:text-[#74007a] transition-colors cursor-pointer flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faTimes} className="w-2.5 h-2.5" />
                Clear
              </button>
            )}
          </div>

          <div className="flex gap-2 mb-5">
            <input
              placeholder="Title, skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setQuery(search)}
              className="flex-1 h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-1 focus:ring-[#74007a]/20 transition-all"
            />
            <button
              onClick={() => setQuery(search)}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-[#4a0080] hover:bg-[#5c00a0] text-white transition-colors cursor-pointer"
              aria-label="Search jobs"
            >
              <FontAwesomeIcon icon={faSearch} className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faBriefcase} className="w-3 h-3 text-[#74007a]" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Job Type</span>
            </div>
            <div className="flex flex-col gap-2">
              {JOB_TYPES.map(({ value, label, icon }) => {
                const active = selectedTypes.includes(value)
                return (
                  <button
                    key={value}
                    onClick={() => toggleType(value)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                      active
                        ? 'bg-[#74007a]/8 text-[#74007a] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        active ? 'border-[#74007a] bg-[#74007a]' : 'border-slate-300'
                      }`}
                    >
                      {active && <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <FontAwesomeIcon icon={icon} className="w-3.5 h-3.5 text-slate-400" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faGraduationCap} className="w-3 h-3 text-[#74007a]" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Experience</span>
            </div>
            <div className="flex flex-col gap-2">
              {EXPERIENCE_LEVELS.map((level) => {
                const active = selectedLevels.includes(level)
                return (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                      active
                        ? 'bg-[#74007a]/8 text-[#74007a] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        active ? 'border-[#74007a] bg-[#74007a]' : 'border-slate-300'
                      }`}
                    >
                      {active && <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 text-white" />}
                    </div>
                    {level}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Matched Jobs</h2>
          {jobs && jobs.length > 0 && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              {jobs.length} result{jobs.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!isLoading && (!jobs || jobs.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[#74007a]/8 flex items-center justify-center mb-5">
              <FontAwesomeIcon icon={faSearch} className="w-8 h-8 text-[#74007a]/40" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No jobs found</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Try adjusting your search terms or filters to discover matching opportunities.
            </p>
          </div>
        )}

        {!isLoading && jobs?.map((job) => {
          const salaryLabel = formatSalary(job.job_min_salary, job.job_max_salary)
          return (
            <div
              key={job.job_id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 mb-3"
            >
              <div className="flex items-start gap-4">
                {job.employer_logo ? (
                  <img
                    src={job.employer_logo}
                    alt={job.employer_name}
                    className="h-12 w-12 rounded-xl object-contain border border-slate-100 shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#4a0080] to-[#74007a] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {job.employer_name?.charAt(0) ?? 'J'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 leading-tight">{job.job_title}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {job.employer_name}
                        {(job.job_city || job.job_country) && (
                          <> <span className="text-slate-300 mx-1">|</span> {job.job_city ?? ''}{job.job_city && job.job_country ? ', ' : ''}{job.job_country ?? ''}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => saveMutation.mutate(job)}
                        disabled={saveMutation.isPending}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-[#74007a] hover:border-[#74007a]/30 transition-all cursor-pointer"
                        aria-label="Save job"
                      >
                        <FontAwesomeIcon icon={faBookmark} className="w-4 h-4" />
                      </button>
                      <a
                        href={job.job_apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-4 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4a0080] via-[#74007a] to-[#da70dc] hover:from-[#da70dc] hover:via-[#74007a] hover:to-[#4a0080] text-white text-xs font-bold transition-all duration-300"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
                        Apply
                      </a>
                      {job.match_score != null && (
                        <span className={cn('inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold', getMatchColor(job.match_score))}>
                          {job.match_score}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {job.job_employment_type && (
                      <span className="inline-flex items-center rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                        {job.job_employment_type.replace('_', ' ')}
                      </span>
                    )}
                    {job.job_is_remote && (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                        <FontAwesomeIcon icon={faHome} className="w-3 h-3" />
                        Remote
                      </span>
                    )}
                    {salaryLabel && (
                      <span className="inline-flex items-center rounded-lg border border-pink-200 bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700">
                        {salaryLabel}
                      </span>
                    )}
                    {!job.job_employment_type && !job.job_is_remote && !salaryLabel && job.job_description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{job.job_description.slice(0, 120)}...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
