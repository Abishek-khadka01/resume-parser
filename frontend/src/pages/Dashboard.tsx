import { useQuery } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBriefcase, faCheckCircle, faCalendarCheck } from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import type { Profile } from '@/types'

export default function Dashboard() {
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then((r) => r.data),
  })

  const stats = [
    { label: 'Jobs Saved', icon: faBriefcase, value: '0', color: 'text-blue-600 bg-blue-50' },
    { label: 'Applied', icon: faCheckCircle, value: '0', color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Interviews', icon: faCalendarCheck, value: '0', color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>

      <div className="rounded-2xl border border-[#74007a]/10 bg-white p-6 shadow-sm">
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, icon, value, color }) => (
          <div
            key={label}
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
          </div>
        ))}
      </div>
    </div>
  )
}
