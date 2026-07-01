import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
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
import { getAtsAnalysis, downloadEnhancedResume } from '@/services/api'
import { getMatchColor } from '@/lib/utils'
import type { Job } from '@/types'

interface JobDetailModalProps {
  job: Job | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function categoryLabel(category: string) {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function JobDetailModal({ job, open, onOpenChange }: JobDetailModalProps) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['ats-analysis', job?.job_id],
    queryFn: () => getAtsAnalysis(job as Job),
    enabled: open && !!job,
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

  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{job.job_title}</DialogTitle>
          <p className="text-sm text-slate-500">{job.employer_name}</p>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex flex-col gap-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Match Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 pt-2">
            <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
              {job.job_description}
            </p>
            <a
              href={job.job_apply_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#74007a] hover:underline"
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
              <>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${getMatchColor(analysis.score)}`}>
                    {analysis.score}%
                  </span>
                  <span className="text-xs text-slate-400">
                    skill match {Math.round(analysis.skill_score * 100)}% · text similarity{' '}
                    {Math.round(analysis.text_score * 100)}%
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

                {analysis.suggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">Suggestions</p>
                    <div className="space-y-2">
                      {analysis.suggestions.map((s, i) => (
                        <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">{categoryLabel(s.category)}:</span> {s.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Could not load match analysis.</p>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-gradient-to-r from-[#4a0080] via-[#74007a] to-[#da70dc] hover:from-[#da70dc] hover:via-[#74007a] hover:to-[#4a0080] text-white text-xs font-bold tracking-wide shadow-sm transition-all duration-300 cursor-pointer"
          >
            <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
            Download Enhanced Resume
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
