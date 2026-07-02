import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBriefcase,
  faCheckCircle,
  faCalendarCheck,
  faChevronDown,
  faTrashAlt,
  faBookmark,
  faPaperPlane,
  faUserTie,
  faFileContract,
  faBan,
} from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
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
  saved: 'text-blue-600 bg-blue-50',
  applied: 'text-emerald-600 bg-emerald-50',
  interview: 'text-amber-600 bg-amber-50',
  offer: 'text-purple-600 bg-purple-50',
  rejected: 'text-red-600 bg-red-50',
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
    { label: 'Saved', icon: faBriefcase, value: String(savedCount), color: 'text-blue-600 bg-blue-50' },
    { label: 'Applied', icon: faCheckCircle, value: String(appliedCount), color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Interviews', icon: faCalendarCheck, value: String(interviewCount), color: 'text-amber-600 bg-amber-50' },
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
      <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-[#74007a]/10 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Profile Completeness</h3>
          <span className="text-xs font-bold text-[#74007a] bg-[#74007a]/8 px-2.5 py-1 rounded-full">
            {isLoading ? '...' : `${profile?.completeness_pct ?? 0}%`}
          </span>
        </div>
        {isLoading ? (
          <Skeleton className="h-3 w-full rounded-full" />
        ) : (
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4a0080] via-[#74007a] to-[#da70dc] transition-all duration-700"
              style={{ width: `${profile?.completeness_pct ?? 0}%` }}
            />
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, icon, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                <FontAwesomeIcon icon={icon} className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs font-medium text-slate-500">{label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-slate-900">Pipeline</h3>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!isLoading && (!applications || applications.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 rounded-2xl border border-dashed border-slate-200 bg-white"
          >
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faBriefcase} className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">No applications yet</p>
            <p className="text-xs text-slate-300 mt-1">Save jobs from the Job Board to start tracking</p>
          </motion.div>
        )}

        {applications?.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                {app.company_logo_url ? (
                  <img src={app.company_logo_url} alt={app.company_name} className="w-11 h-11 rounded-xl object-contain border border-slate-100 shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4a0080] to-[#74007a] flex items-center justify-center text-white text-base font-bold shrink-0">
                    {app.company_name?.charAt(0) ?? 'C'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-base font-bold text-slate-900 leading-tight line-clamp-1">{app.job_title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{app.company_name}</p>
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
                    'inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-bold border transition-all duration-200 cursor-pointer',
                    COLORS[app.status]
                  )}
                >
                  <FontAwesomeIcon icon={STATUS_OPTIONS.find((s) => s.value === app.status)?.icon ?? faBookmark} className="w-3 h-3" />
                  {STATUS_OPTIONS.find((s) => s.value === app.status)?.label ?? app.status}
                  <FontAwesomeIcon icon={faChevronDown} className={cn('w-2.5 h-2.5 transition-transform', openDropdown === app.id && 'rotate-180')} />
                </button>

                {openDropdown === app.id && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    {STATUS_OPTIONS.filter((s) => s.value !== app.status).map((s) => (
                      <button
                        key={s.value}
                        onClick={() => statusMutation.mutate({ id: app.id, status: s.value })}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <FontAwesomeIcon icon={s.icon} className="w-3.5 h-3.5 text-slate-400" />
                        {s.label}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          deleteMutation.mutate(app.id)
                          setOpenDropdown(null)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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

function getMatchColor(score: number) {
  if (score >= 75) return 'text-green-600 bg-green-50 border-green-200'
  if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-red-600 bg-red-50 border-red-200'
}
