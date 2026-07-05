import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBriefcase,
  faChevronDown,
  faTrashAlt,
  faBookmark,
  faPaperPlane,
  faUserTie,
  faFileContract,
  faBan,
} from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, getMatchColor } from '@/lib/utils'
import { getProfile, getApplications, updateApplicationStatus, deleteApplication } from '@/services/api'
import type { ApplicationStatus } from '@/types'

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; icon: typeof faBookmark }[] = [
  { value: 'saved', label: 'Saved', icon: faBookmark },
  { value: 'applied', label: 'Applied', icon: faPaperPlane },
  { value: 'interview', label: 'Interview', icon: faUserTie },
  { value: 'offer', label: 'Offer', icon: faFileContract },
  { value: 'rejected', label: 'Rejected', icon: faBan },
]

const COLORS: Record<ApplicationStatus, string> = {
  saved: 'text-slate-600 bg-slate-100',
  applied: 'text-sky-700 bg-sky-50',
  interview: 'text-amber-700 bg-amber-50',
  offer: 'text-emerald-700 bg-emerald-50',
  rejected: 'text-rose-700 bg-rose-50',
}

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: getApplications,
  })

  const isLoading = profileLoading || appsLoading

  const savedCount = applications?.filter((a) => a.status === 'saved').length ?? 0
  const appliedCount = applications?.filter((a) => a.status === 'applied').length ?? 0
  const interviewCount = applications?.filter((a) => a.status === 'interview').length ?? 0

  const stats = [
    { label: 'Saved', value: String(savedCount) },
    { label: 'Applied', value: String(appliedCount) },
    { label: 'Interviews', value: String(interviewCount) },
  ]

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      updateApplicationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      setOpenDropdown(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteApplication(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Profile completeness</h3>
          <span className="text-sm font-semibold text-primary">
            {isLoading ? '…' : `${profile?.completeness_pct ?? 0}%`}
          </span>
        </div>
        {isLoading ? (
          <Skeleton className="h-2 w-full rounded-full" />
        ) : (
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${profile?.completeness_pct ?? 0}%` }}
            />
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="text-2xl font-semibold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-base font-semibold text-foreground">Pipeline</h3>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && (!applications || applications.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 rounded-xl border border-dashed border-border bg-card"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faBriefcase} className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground/80">No applications yet</p>
            <p className="text-sm text-muted-foreground mt-1">Save jobs from the Job Board to start tracking</p>
          </motion.div>
        )}

        {applications?.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/25 transition-colors duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                {app.company_logo_url ? (
                  <img src={app.company_logo_url} alt={app.company_name} className="w-10 h-10 rounded-lg object-contain border border-border shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
                    {app.company_name?.charAt(0) ?? 'C'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground leading-tight line-clamp-1">{app.job_title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{app.company_name}</p>
                  {app.match_score != null && (
                    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold mt-1.5', getMatchColor(app.match_score))}>
                      {app.match_score}/10 match
                    </span>
                  )}
                </div>
              </div>

              <div className="relative shrink-0">
                <button
                  onClick={() => setOpenDropdown(openDropdown === app.id ? null : app.id)}
                  className={cn(
                    'inline-flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                    COLORS[app.status]
                  )}
                >
                  <FontAwesomeIcon icon={STATUS_OPTIONS.find((s) => s.value === app.status)?.icon ?? faBookmark} className="w-3 h-3" />
                  {STATUS_OPTIONS.find((s) => s.value === app.status)?.label ?? app.status}
                  <FontAwesomeIcon icon={faChevronDown} className={cn('w-2.5 h-2.5 transition-transform', openDropdown === app.id && 'rotate-180')} />
                </button>

                {openDropdown === app.id && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-popover rounded-xl shadow-lg ring-1 ring-foreground/10 py-2 z-50">
                    {STATUS_OPTIONS.filter((s) => s.value !== app.status).map((s) => (
                      <button
                        key={s.value}
                        onClick={() => statusMutation.mutate({ id: app.id, status: s.value })}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <FontAwesomeIcon icon={s.icon} className="w-3.5 h-3.5 text-muted-foreground" />
                        {s.label}
                      </button>
                    ))}
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={() => {
                          deleteMutation.mutate(app.id)
                          setOpenDropdown(null)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/8 transition-colors cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
