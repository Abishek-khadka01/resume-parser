import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faExternalLinkAlt, faWandMagicSparkles, faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getAtsAnalysis, downloadEnhancedResume, getResumeOptimization, downloadOptimizedResume } from '@/services/api'
import { getMatchColor, categoryLabel } from '@/lib/utils'
import type { Job } from '@/types'

interface JobDetailModalProps {
  job: Job | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function JobDetailModal({ job, open, onOpenChange }: JobDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isDownloadingOptimized, setIsDownloadingOptimized] = useState(false)

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['ats-analysis', job?.job_id],
    queryFn: () => getAtsAnalysis(job as Job),
    enabled: open && !!job,
  })

  const { data: optimization, isLoading: isOptimizing } = useQuery({
    queryKey: ['resume-optimization', job?.job_id],
    queryFn: () => getResumeOptimization(job as Job),
    enabled: open && !!job && activeTab === 'optimize',
  })

  const handleDownload = async () => {
    toast.promise(
      downloadEnhancedResume(analysis?.suggestions).then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'enhanced_resume.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }),
      {
        loading: 'Generating enhanced resume...',
        success: 'Resume downloaded',
        error: 'Failed to generate resume',
      }
    )
  }

  const handleDownloadOptimized = async () => {
    if (!job) return
    setIsDownloadingOptimized(true)
    toast.promise(
      downloadOptimizedResume(job)
        .then((blob) => {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'optimized_resume.pdf'
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
        })
        .finally(() => setIsDownloadingOptimized(false)),
      {
        loading: 'Generating optimized resume...',
        success: 'Optimized resume downloaded',
        error: 'Failed to generate resume',
      }
    )
  }

  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{job.job_title}</DialogTitle>
          <p className="text-sm text-slate-500">{job.employer_name}</p>
        </DialogHeader>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Match Analysis</TabsTrigger>
            <TabsTrigger value="optimize">Optimize Resume</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 pt-2">
            <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
              {job.job_description}
            </p>
            <a
              href={job.job_apply_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
              View original listing
            </a>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 pt-2">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : analysis ? (
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className={`text-3xl font-bold ${getMatchColor(analysis.score)}`}>
                      {analysis.score}/10
                    </span>
                    <span className="block text-xs text-slate-400">
                      skill match {Math.round(analysis.skill_score * 100)}% · keyword similarity{' '}
                      {Math.round(analysis.text_score * 100)}% · semantic similarity{' '}
                      {Math.round(analysis.semantic_score * 100)}%
                    </span>
                  </div>

                  {Object.keys(analysis.matched_skills).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Matched skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(analysis.matched_skills).map(([category, terms]) =>
                          terms.map((term) => (
                            <Badge key={`${category}-${term}`} variant="outline" className="border-emerald-200 text-emerald-700">
                              {term}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {Object.keys(analysis.missing_skills).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Missing skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(analysis.missing_skills).map(([category, terms]) =>
                          terms.map((term) => (
                            <Badge key={`${category}-${term}`} variant="outline" className="border-amber-200 text-amber-700">
                              {term}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-0">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Suggestions</p>
                  {analysis.suggestions.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1 mb-3">
                      {analysis.suggestions.map((s, i) => (
                        <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">{categoryLabel(s.category)}:</span> {s.message}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mb-3">No suggestions — this resume already covers the job well.</p>
                  )}
                  <button
                    onClick={handleDownloadOptimized}
                    disabled={isDownloadingOptimized}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold tracking-wide transition-all disabled:opacity-60 cursor-pointer"
                  >
                    <FontAwesomeIcon
                      icon={isDownloadingOptimized ? faSpinner : faWandMagicSparkles}
                      className={isDownloadingOptimized ? 'w-3 h-3 animate-spin' : 'w-3 h-3'}
                    />
                    Download with recommended changes
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Could not load match analysis.</p>
            )}
          </TabsContent>

          <TabsContent value="optimize" className="space-y-4 pt-2">
            {isOptimizing ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : optimization ? (
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className={`text-xl font-bold ${getMatchColor(optimization.score_before)}`}>
                    {optimization.score_before}/10
                  </span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5 text-slate-400" />
                  <span className={`text-xl font-bold ${getMatchColor(optimization.score_after)}`}>
                    {optimization.score_after}/10
                  </span>
                  <span className="text-xs text-slate-400 ml-1">projected score for this job</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-0 lg:row-span-2">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Suggested changes</p>
                  {optimization.changes.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1 mb-3">
                      {optimization.changes.map((change, i) => {
                        if (change.type === 'skill_emphasized') {
                          return (
                            <div key={i} className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs space-y-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant="outline" className="border-emerald-300 text-emerald-700">{change.keyword}</Badge>
                                <span className="text-slate-500">emphasized in &ldquo;{change.experience_title}&rdquo;</span>
                              </div>
                              <p className="text-slate-700">
                                &hellip;<mark className="bg-emerald-200/70 text-emerald-800 rounded px-1">{change.added_sentence}</mark>
                              </p>
                            </div>
                          )
                        }
                        if (change.type === 'skill_added_to_skills_list') {
                          return (
                            <div key={i} className="rounded-lg border border-sky-200 bg-sky-50/50 p-2.5 text-xs flex items-start gap-2">
                              <Badge variant="outline" className="border-sky-300 text-sky-700 shrink-0">{change.keyword}</Badge>
                              <span className="text-slate-600">{change.message}</span>
                            </div>
                          )
                        }
                        if (change.type === 'quantify_suggestion') {
                          return (
                            <div key={i} className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-xs text-slate-600">
                              {change.message}
                            </div>
                          )
                        }
                        return (
                          <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500 italic">
                            {change.message}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mb-3">
                      Your resume already covers this job well — no changes suggested.
                    </p>
                  )}
                  <button
                    onClick={handleDownloadOptimized}
                    className="w-full inline-flex items-center justify-center gap-2 h-9 px-5 rounded-full bg-linear-to-r from-[#4a0080] via-primary to-secondary hover:from-secondary hover:via-primary hover:to-[#4a0080] text-white text-xs font-bold tracking-wide shadow-sm transition-all duration-300 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3 h-3" />
                    Download Optimized Resume
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Could not generate resume optimization.</p>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-linear-to-r from-[#4a0080] via-primary to-secondary hover:from-secondary hover:via-primary hover:to-[#4a0080] text-white text-xs font-bold tracking-wide shadow-sm transition-all duration-300 cursor-pointer"
          >
            <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
            Download Enhanced Resume
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
