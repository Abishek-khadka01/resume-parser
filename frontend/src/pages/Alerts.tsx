import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
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
  faTrash,
  faEnvelopeCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAlerts, createAlert, toggleAlert, deleteAlert } from '@/services/api'
import type { JobAlert } from '@/types'

const FREQUENCY_LABELS: Record<string, string> = {
  instant: 'As soon as found',
  daily: 'Daily digest',
  weekly: 'Weekly digest',
}

export default function Alerts() {
  const queryClient = useQueryClient()
  const [keywords, setKeywords] = useState('')
  const [location, setLocation] = useState('')
  const [minMatchPct, setMinMatchPct] = useState(60)
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly'>('daily')

  const { data: alerts, isLoading } = useQuery<JobAlert[]>({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  })

  const createMutation = useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      toast.success('Alert created — we\'ll email you and notify you here when matching jobs show up')
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      setKeywords('')
      setLocation('')
      setMinMatchPct(60)
      setFrequency('daily')
    },
    onError: () => toast.error('Failed to create alert'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleAlert(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      toast.success('Alert deleted')
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const parsedKeywords = keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
      if (parsedKeywords.length === 0) {
        toast.error('Enter at least one keyword')
        return
      }
      createMutation.mutate({
        keywords: parsedKeywords,
        location: location.trim() || undefined,
        min_match_pct: minMatchPct,
        frequency,
      })
    },
    [keywords, location, minMatchPct, frequency, createMutation]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 max-w-2xl"
    >
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Job Alerts</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We'll check for new matching jobs in the background and notify you by email and here in the app —
          even while you're away.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FontAwesomeIcon icon={faBell} className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">New Job Alert</h3>
            <p className="text-xs text-muted-foreground">Get notified when matching jobs are posted</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Keywords <span className="text-xs text-muted-foreground font-normal">(comma-separated)</span>
            </label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faTags}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              />
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="React, TypeScript, Frontend"
                className="w-full h-11 rounded-lg border border-border bg-muted/50 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Remote, New York..."
                className="w-full h-11 rounded-lg border border-border bg-muted/50 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Minimum match %</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faPercent}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={minMatchPct}
                  onChange={(e) => setMinMatchPct(Number(e.target.value))}
                  className="w-full h-11 rounded-lg border border-border bg-muted/50 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Check frequency</label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faClock}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10"
                />
                <Select value={frequency} onValueChange={(v) => setFrequency(v as 'instant' | 'daily' | 'weekly')}>
                  <SelectTrigger className="w-full h-11 rounded-lg border border-border bg-muted/50 pl-11 pr-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">As soon as found</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                    <SelectItem value="weekly">Weekly digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full h-11 rounded-lg bg-primary hover:bg-primary-dark text-primary-foreground text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
            {createMutation.isPending ? 'Creating...' : 'Create Alert'}
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Alerts</h3>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
                <div className="h-5 w-40 bg-muted rounded mb-3" />
                <div className="h-3 w-60 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!alerts || alerts.length === 0) && (
          <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card">
            <FontAwesomeIcon icon={faEnvelopeCircleCheck} className="w-5 h-5 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No alerts set up yet. Create your first alert above.</p>
          </div>
        )}

        {alerts?.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-xl border border-border bg-card p-5 transition-opacity ${
              alert.is_active ? '' : 'opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {alert.keywords.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1"
                    >
                      <FontAwesomeIcon icon={faTags} className="w-2.5 h-2.5 mr-1.5" />
                      {k}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {alert.location ?? 'Any location'}
                  <span className="text-border mx-1.5">·</span>
                  Min {alert.min_match_pct}% match
                  <span className="text-border mx-1.5">·</span>
                  {FREQUENCY_LABELS[alert.frequency] ?? alert.frequency}
                  {alert.last_sent_at && (
                    <>
                      <span className="text-border mx-1.5">·</span>
                      last checked {new Date(alert.last_sent_at).toLocaleString()}
                    </>
                  )}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => toggleMutation.mutate({ id: alert.id, isActive: !alert.is_active })}
                  className={`h-9 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    alert.is_active
                      ? 'border border-border text-muted-foreground hover:border-primary/30 hover:text-primary bg-transparent'
                      : 'bg-primary text-primary-foreground hover:bg-primary-dark'
                  }`}
                >
                  <FontAwesomeIcon icon={alert.is_active ? faPause : faPlay} className="w-3 h-3" />
                  {alert.is_active ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(alert.id)}
                  className="w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="Delete alert"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
