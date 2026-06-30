import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faCircle,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, getMatchColor } from '@/lib/utils'
import api from '@/lib/api'
import type { Application, ApplicationStatus } from '@/types'

interface ColumnDef {
  id: ApplicationStatus
  label: string
  color: string
  bgLight: string
}

const COLUMNS: ColumnDef[] = [
  { id: 'saved', label: 'Saved Jobs', color: '#74007a', bgLight: 'bg-purple-50/50' },
  { id: 'applied', label: 'Applied Applications', color: '#2563eb', bgLight: 'bg-blue-50/50' },
  { id: 'interview', label: 'Interview', color: '#d97706', bgLight: 'bg-amber-50/50' },
  { id: 'offer', label: 'Offer', color: '#059669', bgLight: 'bg-emerald-50/50' },
  { id: 'rejected', label: 'Rejected', color: '#dc2626', bgLight: 'bg-red-50/50' },
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
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-slate-900">ATS Board</h2>

      <div className="flex gap-5 overflow-x-auto pb-4 min-h-[60vh]" style={{ scrollbarWidth: 'thin' }}>
        {COLUMNS.map(({ id, label, color, bgLight }) => {
          const items = byStatus(id)
          return (
            <div key={id} className="flex w-72 shrink-0 flex-col gap-3">
              <div
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm border border-slate-200"
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FontAwesomeIcon icon={faCircle} className="w-2.5 h-2.5 shrink-0" style={{ color }} />
                  <span className="text-sm font-bold text-slate-800 truncate">{label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {items.length}
                  </span>
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-[#74007a] hover:bg-[#74007a]/8 transition-all cursor-pointer"
                    aria-label="Add card"
                    title="Add manual entry"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div
                className={`flex flex-col gap-3 rounded-xl p-3 min-h-[300px] ${bgLight}`}
              >
                {isLoading && (
                  <>
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </>
                )}

                {!isLoading && items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-xs text-slate-400">No items</p>
                  </div>
                )}

                {items.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {app.company_logo_url ? (
                        <img
                          src={app.company_logo_url}
                          alt={app.company_name}
                          className="w-8 h-8 rounded-lg object-contain border border-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4a0080] to-[#74007a] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {app.company_name?.charAt(0) ?? 'C'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 leading-tight line-clamp-2">
                          {app.job_title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{app.company_name}</p>
                      </div>
                    </div>

                    {app.match_score != null && (
                      <div className="mt-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
                            getMatchColor(app.match_score)
                          )}
                        >
                          {app.match_score}% match
                        </span>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {COLUMNS.filter((c) => c.id !== id).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => moveMutation.mutate({ id: app.id, status: c.id })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-500 hover:text-white hover:bg-[#74007a] border border-slate-200 hover:border-[#74007a] transition-all cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5" />
                          {c.id === 'saved' ? 'Save' : c.id === 'applied' ? 'Apply' : c.id === 'interview' ? 'Interview' : c.id === 'offer' ? 'Offer' : c.id === 'rejected' ? 'Reject' : c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
