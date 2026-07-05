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
    // eslint-disable-next-line react-hooks/purity -- relative time display is inherently render-time dependent
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
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="rounded-xl border border-border bg-card p-5 hover:border-primary/25 transition-colors duration-200"
    >
      <div className="flex items-start gap-4">
        {job.employer_logo ? (
          <img
            src={job.employer_logo}
            alt={job.employer_name}
            className="w-11 h-11 rounded-lg object-contain border border-border shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-base font-semibold shrink-0">
            {job.employer_name?.charAt(0) ?? 'J'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground leading-tight line-clamp-2">
            {job.job_title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <FontAwesomeIcon icon={faBuilding} className="w-3 h-3 shrink-0" />
            <span className="truncate">{job.employer_name}</span>
          </div>
        </div>

        {job.match_score != null && (
          <div className="flex flex-col items-center shrink-0 ml-2">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none" stroke="var(--color-muted)" strokeWidth="3"
                />
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke={job.match_score >= 8 ? '#0d8f5f' : job.match_score >= 5 ? '#b5750f' : '#b3362a'}
                  strokeWidth="3"
                  strokeDasharray={`${(job.match_score / 10) * 97} 97`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-foreground">
                {job.match_score}/10
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-xs text-muted-foreground">
        {job.job_city && (
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
            {job.job_city}{job.job_country ? `, ${job.job_country}` : ''}
          </span>
        )}
        {job.job_is_remote && (
          <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium px-1.5 py-0.5">
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

      <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
        {job.job_description}
      </p>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
        <a
          href={job.job_apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-8 px-4 rounded-lg bg-primary hover:bg-primary-dark text-primary-foreground text-xs font-semibold transition-colors"
        >
          <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
          Apply
        </a>

        <button
          onClick={() => onSave?.(job)}
          className={cn(
            'inline-flex items-center gap-2 h-8 px-4 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
            saved
              ? 'bg-accent text-accent-foreground border-transparent'
              : 'bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-primary'
          )}
        >
          <FontAwesomeIcon icon={saved ? faCheckCircle : faBookmark} className="w-3 h-3" />
          {saved ? 'Saved' : 'Save'}
        </button>

        {job.match_score != null && (
          <button
            onClick={() => onViewDetails?.(job)}
            className="ml-auto inline-flex items-center gap-2 h-8 px-3.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-colors cursor-pointer"
            title="ATS Analysis"
          >
            <FontAwesomeIcon icon={faChartLine} className="w-3 h-3" />
            <span className={cn('font-semibold', getMatchColor(job.match_score))}>
              {job.match_score}/10 match
            </span>
          </button>
        )}
      </div>
    </motion.div>
  )
}
