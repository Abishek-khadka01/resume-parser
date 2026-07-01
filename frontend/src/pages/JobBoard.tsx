import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch,
  faSlidersH,
  faTimes,
  faBriefcase,
} from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '@/components/ui/skeleton'
import { getLinkedInJobs, createApplication } from '@/services/api'
import JobCard from '@/components/JobCard'
import type { Job } from '@/types'

export default function JobBoard() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['linkedin-jobs', submittedSearch],
    queryFn: () => getLinkedInJobs(submittedSearch ? { q: submittedSearch } : undefined),
    enabled: true,
  })

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

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all"
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
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#4a0080] via-[#74007a] to-[#da70dc] hover:from-[#da70dc] hover:via-[#74007a] hover:to-[#4a0080] text-white text-sm font-bold tracking-wide shadow-sm transition-all duration-300 cursor-pointer"
          >
            <FontAwesomeIcon icon={faSearch} className="w-4 h-4 mr-2" />
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="h-11 px-4 rounded-xl border border-slate-200 text-slate-500 hover:text-[#74007a] hover:border-[#74007a]/30 transition-all cursor-pointer"
          >
            <FontAwesomeIcon icon={faSlidersH} className="w-4 h-4" />
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
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
      ) : !jobs || jobs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white"
        >
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faBriefcase} className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-400">No jobs found</p>
          <p className="text-xs text-slate-300 mt-1">Try adjusting your search criteria</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-400 font-medium">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
            {submittedSearch && <> for &ldquo;{submittedSearch}&rdquo;</>}
          </p>
          {jobs.map((job, i) => (
            <JobCard
              key={job.job_id}
              job={job}
              index={i}
              onSave={handleSave}
              saved={savedJobIds.has(job.job_id)}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
