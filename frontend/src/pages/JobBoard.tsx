import { useState, useCallback, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch,
  faSlidersH,
  faTimes,
  faBriefcase,
  faTriangleExclamation,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '@/components/ui/skeleton'
import { getJobs, getProfile, createApplication } from '@/services/api'
import JobCard from '@/components/JobCard'
import JobSuggestionsPanel from '@/components/JobSuggestionsPanel'
import JobDetailModal from '@/components/JobDetailModal'
import type { Job, Profile } from '@/types'

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level / Fresher' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead / Manager' },
]

const SUGGESTIONS_PANEL_COUNT = 2

export default function JobBoard() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [experienceLevel, setExperienceLevel] = useState('')
  const [userSetExperienceLevel, setUserSetExperienceLevel] = useState(false)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: profile } = useQuery<Profile>({ queryKey: ['profile'], queryFn: getProfile })

  const noWorkExperience = !profile?.work_experience || profile.work_experience.length === 0
  const autoExperienceLevel =
    profile && (noWorkExperience || profile.experience_level === 'entry') ? 'entry' : ''
  const effectiveExperienceLevel = userSetExperienceLevel ? experienceLevel : autoExperienceLevel
  const filtersVisible = showFilters || (!userSetExperienceLevel && autoExperienceLevel === 'entry')

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['jobs', submittedSearch, effectiveExperienceLevel],
    queryFn: () => getJobs({
      ...(submittedSearch ? { q: submittedSearch } : {}),
      ...(effectiveExperienceLevel ? { experience_level: effectiveExperienceLevel } : {}),
    }),
    enabled: true,
    retry: 1,
  })
  const jobs = data?.jobs

  const saveMutation = useMutation({
    mutationFn: (job: Job) =>
      createApplication({
        job_id: job.job_id,
        job_title: job.job_title,
        company_name: job.employer_name,
        company_logo_url: job.employer_logo,
        match_score: job.match_score,
        job_data: job as unknown as Record<string, unknown>,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setSubmittedSearch(search.trim())
  }, [search])

  const handleSave = useCallback((job: Job) => {
    if (savedJobIds.has(job.job_id)) return
    saveMutation.mutate(job, {
      onSuccess: () => {
        setSavedJobIds((prev) => new Set(prev).add(job.job_id))
      },
    })
  }, [savedJobIds, saveMutation])

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Job Board</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-stretch">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative flex-1">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs by title, skill, or keyword..."
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setSubmittedSearch('') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-11 px-6 rounded-xl bg-linear-to-r from-[#4a0080] via-primary to-secondary hover:from-secondary hover:via-primary hover:to-[#4a0080] text-white text-sm font-bold tracking-wide shadow-sm transition-all duration-300 cursor-pointer"
            >
              <FontAwesomeIcon icon={faSearch} className="w-4 h-4 mr-2" />
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 px-4 rounded-xl border transition-all cursor-pointer ${
                filtersVisible || effectiveExperienceLevel
                  ? 'border-primary/30 text-primary bg-primary/5'
                  : 'border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30'
              }`}
            >
              <FontAwesomeIcon icon={faSlidersH} className="w-4 h-4" />
            </button>
          </form>

          {filtersVisible && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 mr-1">Experience level:</span>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  type="button"
                  onClick={() => {
                    setUserSetExperienceLevel(true)
                    setExperienceLevel(effectiveExperienceLevel === lvl.value ? '' : lvl.value)
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    effectiveExperienceLevel === lvl.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
              {!userSetExperienceLevel && effectiveExperienceLevel === 'entry' && (
                <span className="text-xs text-slate-400 italic">auto-applied based on your resume</span>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="xl:col-span-2 flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="xl:col-span-2 text-center py-20 rounded-2xl border border-dashed border-red-200 bg-red-50/30"
          >
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-sm font-semibold text-red-500">Couldn't load jobs</p>
            <p className="text-xs text-slate-400 mt-1">The job search provider didn't respond in time. Please try again.</p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="mt-4 inline-flex items-center gap-2 h-9 px-5 rounded-full bg-primary text-white text-xs font-bold tracking-wide transition-all disabled:opacity-60 cursor-pointer"
            >
              <FontAwesomeIcon icon={faRotateRight} className={isFetching ? 'w-3 h-3 animate-spin' : 'w-3 h-3'} />
              {isFetching ? 'Retrying...' : 'Retry'}
            </button>
          </motion.div>
        ) : !jobs || jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="xl:col-span-2 text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white"
          >
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faBriefcase} className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">No jobs found</p>
            <p className="text-xs text-slate-300 mt-1">Try adjusting your search criteria</p>
          </motion.div>
        ) : (
          <>
            <p className="xl:col-span-2 text-xs text-slate-400 font-medium">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
              {submittedSearch && <> for &ldquo;{submittedSearch}&rdquo;</>}
              {' · suggested improvements shown for the top ' + SUGGESTIONS_PANEL_COUNT}
            </p>
            {jobs.map((job, i) => (
              <Fragment key={job.job_id}>
                <div className={i >= SUGGESTIONS_PANEL_COUNT ? 'xl:col-span-2' : ''}>
                  <JobCard
                    job={job}
                    index={i}
                    onSave={handleSave}
                    onViewDetails={(j) => { setSelectedJob(j); setDetailOpen(true) }}
                    saved={savedJobIds.has(job.job_id)}
                  />
                </div>
                {i < SUGGESTIONS_PANEL_COUNT && <JobSuggestionsPanel job={job} />}
              </Fragment>
            ))}
          </>
        )}
      </div>

      <JobDetailModal job={selectedJob} open={detailOpen} onOpenChange={setDetailOpen} />
    </motion.div>
  )
}
