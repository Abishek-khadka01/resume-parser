import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuilding,
  faMapMarkerAlt,
  faDollarSign,
  faClock,
  faChartLine,
  faBookmark,
  faCheckCircle,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons'
import { cn, getMatchColor } from '@/lib/utils'
import type { Job } from '@/types'

interface JobCardProps {
  job: Job
  onSave?: (job: Job) => void
  onViewDetails?: (job: Job) => void
  saved?: boolean
  index?: number
}

export default function JobCard({ job, onSave, onViewDetails, saved, index = 0 }: JobCardProps) {
  const formatSalary = (min?: number, max?: number, currency?: string) => {
    if (min == null && max == null) return null
    const fmt = (n: number) =>
      '$' + (n >= 1000 ? (n / 1000).toFixed(0) + 'k' : n.toLocaleString())
    const parts = []
    if (min != null) parts.push(fmt(min))
    if (max != null) parts.push(fmt(max))
    return (currency ? currency + ' ' : '') + parts.join(' - ')
  }

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return null
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const salaryText = formatSalary(job.job_min_salary, job.job_max_salary, job.job_salary_currency)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        {job.employer_logo ? (
          <img
            src={job.employer_logo}
            alt={job.employer_name}
            className="w-12 h-12 rounded-xl object-contain border border-slate-100 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4a0080] to-[#74007a] flex items-center justify-center text-white text-lg font-bold shrink-0">
            {job.employer_name?.charAt(0) ?? 'J'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 leading-tight line-clamp-2">
            {job.job_title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            <FontAwesomeIcon icon={faBuilding} className="w-3 h-3 shrink-0" />
            <span className="truncate">{job.employer_name}</span>
          </div>
        </div>

        {job.match_score != null && (
          <div className="flex flex-col items-center shrink-0 ml-2">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none" stroke="#e2e8f0" strokeWidth="3"
                />
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke={job.match_score >= 70 ? '#059669' : job.match_score >= 40 ? '#d97706' : '#dc2626'}
                  strokeWidth="3"
                  strokeDasharray={`${(job.match_score / 100) * 97} 97`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                style={{
                  color: job.match_score >= 70 ? '#059669' : job.match_score >= 40 ? '#d97706' : '#dc2626'
                }}
              >
                {job.match_score}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">Match</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-xs text-slate-500">
        {job.job_city && (
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
            {job.job_city}{job.job_country ? `, ${job.job_country}` : ''}
          </span>
        )}
        {job.job_is_remote && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 border border-emerald-200">
            Remote
          </span>
        )}
        {salaryText && (
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faDollarSign} className="w-3 h-3" />
            {salaryText}
          </span>
        )}
        {job.job_employment_type && (
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
            {job.job_employment_type}
          </span>
        )}
        {timeAgo(job.job_posted_at_datetime_utc) && (
          <span className="flex items-center gap-1.5 ml-auto">
            <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
            {timeAgo(job.job_posted_at_datetime_utc)}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-600 line-clamp-2 leading-relaxed">
        {job.job_description}
      </p>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
        <a
          href={job.job_apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-gradient-to-r from-[#4a0080] via-[#74007a] to-[#da70dc] hover:from-[#da70dc] hover:via-[#74007a] hover:to-[#4a0080] text-white text-xs font-bold tracking-wide shadow-sm transition-all duration-300"
        >
          <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
          Apply
        </a>

        <button
          onClick={() => onSave?.(job)}
          className={cn(
            'inline-flex items-center gap-2 h-9 px-5 rounded-full text-xs font-bold border transition-all duration-300 cursor-pointer',
            saved
              ? 'bg-[#74007a]/8 text-[#74007a] border-[#74007a]/20'
              : 'bg-white text-slate-600 border-slate-200 hover:border-[#74007a]/30 hover:text-[#74007a]'
          )}
        >
          <FontAwesomeIcon icon={saved ? faCheckCircle : faBookmark} className="w-3 h-3" />
          {saved ? 'Saved' : 'Save'}
        </button>

        {job.match_score != null && (
          <button
            onClick={() => onViewDetails?.(job)}
            className="ml-auto inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-semibold text-slate-500 hover:text-[#74007a] hover:bg-[#74007a]/8 border border-slate-200 hover:border-[#74007a]/20 transition-all duration-200 cursor-pointer"
            title="ATS Analysis"
          >
            <FontAwesomeIcon icon={faChartLine} className="w-3 h-3" />
            <span className={cn('font-bold', getMatchColor(job.match_score))}>
              {job.match_score}% match
            </span>
          </button>
        )}
      </div>
    </motion.div>
  )
}
