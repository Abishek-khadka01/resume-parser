import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, getMatchColor } from '@/lib/utils'
import api from '@/lib/api'
import type { Application, ApplicationStatus } from '@/types'

const COLUMNS: { id: ApplicationStatus; label: string }[] = [
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Rejected' },
]

export default function ATS() {
  const queryClient = useQueryClient()

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => api.get('/applications').then((r) => r.data),
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      api.patch(`/applications/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
    onError: () => toast.error('Failed to update status'),
  })

  const byStatus = (status: ApplicationStatus) =>
    applications?.filter((a) => a.status === status) ?? []

  return (
    <div className="flex h-full flex-col gap-4">
      <h2 className="text-lg font-semibold">ATS Board</h2>
      <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
        {COLUMNS.map(({ id, label }) => (
          <div key={id} className="flex w-60 shrink-0 flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
              <Badge variant="secondary" className="text-xs">{byStatus(id).length}</Badge>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-lg bg-muted/40 p-2 min-h-32">
              {isLoading && <Skeleton className="h-16 w-full rounded" />}
              {byStatus(id).map((app) => (
                <Card key={app.id} className="cursor-pointer hover:shadow-sm">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium leading-tight">{app.job_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{app.company_name}</p>
                    {app.match_score != null && (
                      <span className={cn('mt-2 inline-flex rounded border px-1.5 py-0.5 text-xs font-semibold', getMatchColor(app.match_score))}>
                        {app.match_score}%
                      </span>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {COLUMNS.filter((c) => c.id !== id).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => moveMutation.mutate({ id: app.id, status: c.id })}
                          className="text-xs text-primary underline-offset-2 hover:underline"
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
