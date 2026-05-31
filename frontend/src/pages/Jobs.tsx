import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Bookmark, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, getMatchColor } from '@/lib/utils'
import api from '@/lib/api'
import type { Job } from '@/types'

export default function Jobs() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
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

  return (
    <div className="flex h-full gap-6">
      {/* Left rail filters */}
      <aside className="w-52 shrink-0 flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Search</p>
          <div className="flex gap-2">
            <Input
              placeholder="Title, skill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setQuery(search)}
              className="h-8 text-sm"
            />
            <Button size="sm" variant="outline" onClick={() => setQuery(search)}>
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Job listings */}
      <div className="flex flex-1 flex-col gap-3">
        <h2 className="text-lg font-semibold">Matched Jobs</h2>

        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}

        {!isLoading && jobs?.map((job) => (
          <Card key={job.job_id} className="hover:shadow-sm transition-shadow">
            <CardContent className="flex items-center gap-4 py-4">
              {job.employer_logo && (
                <img src={job.employer_logo} alt={job.employer_name} className="h-10 w-10 rounded object-contain" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium leading-tight truncate">{job.job_title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {job.employer_name} · {job.job_city ?? job.job_country ?? '—'} · {job.job_is_remote ? 'Remote' : job.job_employment_type}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => saveMutation.mutate(job)}
                  disabled={saveMutation.isPending}
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
                <a href={job.job_apply_link} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Apply
                  </Button>
                </a>
                {job.match_score != null && (
                  <span className={cn('inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold', getMatchColor(job.match_score))}>
                    {job.match_score}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {!isLoading && !jobs?.length && (
          <p className="text-sm text-muted-foreground">No jobs found. Try a different search.</p>
        )}
      </div>
    </div>
  )
}
