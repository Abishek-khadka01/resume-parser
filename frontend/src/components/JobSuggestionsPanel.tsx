import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWandMagicSparkles, faSpinner, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '@/components/ui/skeleton'
import { getResumeOptimization, downloadOptimizedResume } from '@/services/api'
import { getMatchColor } from '@/lib/utils'
import type { Job, ResumeChange } from '@/types'

interface JobSuggestionsPanelProps {
  job: Job
  onScoreResolved?: (jobId: string, score: number) => void
}

function changeMessage(change: ResumeChange): string {
  if (change.type === 'skill_emphasized') {
    return `Emphasize '${change.keyword}' in your "${change.experience_title}" experience.`
  }
  return change.message ?? ''
}

export default function JobSuggestionsPanel({ job, onScoreResolved }: JobSuggestionsPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: optimization, isLoading } = useQuery({
    queryKey: ['resume-optimization', job.job_id],
    queryFn: () => getResumeOptimization(job),
  })

  // The list view's match_score is a cheaper text-only estimate (no JSearch
  // job-details enrichment, to avoid N extra API calls per search). This call
  // *does* enrich, so score_before is the more accurate number for this job —
  // propagate it up so the card badge doesn't show a different score than the
  // panel sitting right next to it.
  useEffect(() => {
    if (optimization) onScoreResolved?.(job.job_id, optimization.score_before)
  }, [optimization, job.job_id, onScoreResolved])

  const handleDownload = () => {
    setIsDownloading(true)
    toast.promise(
      downloadOptimizedResume(job)
        .then((blob) => {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `optimized_resume_${job.employer_name?.replace(/\s+/g, '_') ?? 'job'}.pdf`
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
        })
        .finally(() => setIsDownloading(false)),
      {
        loading: 'Generating optimized resume...',
        success: 'Optimized resume downloaded',
        error: 'Failed to generate resume',
      }
    )
  }

  return (
    <div className="h-67.5 flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-slate-900 mb-1">Suggested Improvements</p>
      <p className="text-xs text-slate-400 mb-3 truncate" title={`${job.job_title} at ${job.employer_name}`}>
        for &ldquo;{job.job_title}&rdquo; at {job.employer_name}
      </p>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : optimization ? (
        <>
          <div className="flex items-center gap-1.5 mb-3 shrink-0">
            <span className={`text-lg font-bold ${getMatchColor(optimization.score_before)}`}>
              {optimization.score_before}/10
            </span>
            {optimization.score_after > optimization.score_before && (
              <>
                <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 text-slate-400" />
                <span className={`text-lg font-bold ${getMatchColor(optimization.score_after)}`}>
                  {optimization.score_after}/10
                </span>
              </>
            )}
            <span className="text-[11px] text-slate-400 ml-0.5">
              {optimization.score_after > optimization.score_before ? 'if you apply suggestions' : 'match score'}
            </span>
          </div>

          {optimization.changes.length > 0 ? (
            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1 mb-3">
              {optimization.changes.map((c, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
                  {changeMessage(c)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 mb-3 flex-1">No suggestions — this resume already covers the job well.</p>
          )}

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full mt-auto shrink-0 inline-flex items-center justify-center gap-2 h-9 px-5 rounded-full bg-linear-to-r from-[#4a0080] via-primary to-secondary hover:from-secondary hover:via-primary hover:to-[#4a0080] text-white text-xs font-bold tracking-wide shadow-sm transition-all duration-300 disabled:opacity-60 cursor-pointer"
          >
            <FontAwesomeIcon
              icon={isDownloading ? faSpinner : faWandMagicSparkles}
              className={isDownloading ? 'w-3 h-3 animate-spin' : 'w-3 h-3'}
            />
            Download Optimized Resume
          </button>
        </>
      ) : (
        <p className="text-xs text-slate-400">Could not load suggestions.</p>
      )}
    </div>
  )
}
