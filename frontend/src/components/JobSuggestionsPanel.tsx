import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWandMagicSparkles, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '@/components/ui/skeleton'
import { getAtsAnalysis, downloadOptimizedResume } from '@/services/api'
import { getMatchColor, categoryLabel } from '@/lib/utils'
import type { Job } from '@/types'

interface JobSuggestionsPanelProps {
  job: Job
}

export default function JobSuggestionsPanel({ job }: JobSuggestionsPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['ats-analysis', job.job_id],
    queryFn: () => getAtsAnalysis(job),
  })

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
      ) : analysis ? (
        <>
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <span className={`text-xl font-bold ${getMatchColor(analysis.score)}`}>{analysis.score}/10</span>
            <span className="text-[11px] text-slate-400">match score</span>
          </div>

          {analysis.suggestions.length > 0 ? (
            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1 mb-3">
              {analysis.suggestions.map((s, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">{categoryLabel(s.category)}:</span> {s.message}
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
