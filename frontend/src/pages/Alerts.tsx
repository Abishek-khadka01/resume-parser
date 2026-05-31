import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBell,
  faTags,
  faMapMarkerAlt,
  faPercent,
  faClock,
  faPause,
  faPlay,
} from '@fortawesome/free-solid-svg-icons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import type { JobAlert } from '@/types'

const schema = z.object({
  keywords: z.string().min(1, 'Enter at least one keyword'),
  location: z.string().optional(),
  min_match_pct: z.number().min(0).max(100),
  frequency: z.enum(['instant', 'daily', 'weekly']),
})
type FormData = z.infer<typeof schema>

export default function Alerts() {
  const queryClient = useQueryClient()

  const { data: alerts, isLoading } = useQuery<JobAlert[]>({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts').then((r) => r.data),
  })

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { frequency: 'daily', min_match_pct: 60, keywords: '', location: '' },
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/alerts', { ...data, keywords: data.keywords.split(',').map((k) => k.trim()) }),
    onSuccess: () => {
      toast.success('Alert created')
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
    onError: () => toast.error('Failed to create alert'),
  })

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data)
  }

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/alerts/${id}`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h2 className="text-lg font-bold text-slate-900">Job Alerts</h2>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#74007a]/8 flex items-center justify-center">
            <FontAwesomeIcon icon={faBell} className="w-4 h-4 text-[#74007a]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">New Job Alert</h3>
            <p className="text-xs text-slate-400">Get notified when matching jobs are posted</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
              Keywords <span className="text-xs text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <div className="relative">
              <FontAwesomeIcon icon={faTags} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="React, TypeScript, Frontend"
                {...register('keywords')}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all"
              />
            </div>
            {errors.keywords && (
              <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.keywords.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Location</label>
            <div className="relative">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="New York, Remote..."
                {...register('location')}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Min Match %</label>
              <div className="relative">
                <FontAwesomeIcon icon={faPercent} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="60"
                  {...register('min_match_pct', { valueAsNumber: true })}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all"
                />
              </div>
              {errors.min_match_pct && (
                <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.min_match_pct.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Frequency</label>
              <div className="relative">
                <FontAwesomeIcon icon={faClock} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <Select
                  defaultValue="daily"
                  onValueChange={(v) => setValue('frequency', v as 'instant' | 'daily' | 'weekly')}
                >
                  <SelectTrigger className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="w-full h-11 rounded-full bg-gradient-to-r from-[#4a0080] via-[#74007a] to-[#da70dc] hover:from-[#da70dc] hover:via-[#74007a] hover:to-[#4a0080] text-white text-sm font-bold tracking-wide shadow-lg shadow-[#74007a]/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
            {createMutation.isPending ? 'Creating...' : 'Create Alert'}
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Your Alerts</h3>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
                <div className="h-5 w-40 bg-slate-100 rounded mb-3" />
                <div className="h-3 w-60 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!alerts || alerts.length === 0) && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">No alerts set up yet. Create your first alert above.</p>
          </div>
        )}

        {alerts?.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 ${
              alert.is_active ? '' : 'opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {alert.keywords.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center rounded-full bg-[#74007a]/10 text-[#74007a] text-xs font-semibold px-2.5 py-1"
                    >
                      <FontAwesomeIcon icon={faTags} className="w-2.5 h-2.5 mr-1.5" />
                      {k}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  {alert.location ?? 'Any location'}
                  <span className="text-slate-300 mx-1.5">·</span>
                  Min {alert.min_match_pct}% match
                  <span className="text-slate-300 mx-1.5">·</span>
                  {alert.frequency}
                </p>
              </div>
              <button
                onClick={() => toggleMutation.mutate({ id: alert.id, is_active: !alert.is_active })}
                className={`shrink-0 h-9 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  alert.is_active
                    ? 'border border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                    : 'bg-[#74007a] text-white hover:bg-[#5c00a0] shadow-sm'
                }`}
              >
                <FontAwesomeIcon icon={alert.is_active ? faPause : faPlay} className="w-3 h-3" />
                {alert.is_active ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
