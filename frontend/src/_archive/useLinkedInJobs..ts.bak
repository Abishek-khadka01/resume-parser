import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { SECTIONS, SENIORITY_OPTS, TIME_OPTS, EMP_TYPE_OPTS } from '@/constants/linkedinJobs.constants'
import type { SectionKey } from '@/constants/linkedinJobs.constants'
import { DUMMY_LINKEDIN_JOBS } from '@/data/linkedinJobs.dummy'
import api from '@/lib/api'
import type { LinkedInJob } from '@/types'

// Toggle this to false once your real API is ready
const USE_DUMMY_DATA = true

function sp(params: URLSearchParams, key: string, fallback = '') {
  return params.get(key) ?? fallback
}

export function useLinkedInJobs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const qc = useQueryClient()

  // draft inputs (not committed until search is submitted)
  const [draftTitle,    setDraftTitle]    = useState(sp(searchParams, 'title'))
  const [draftLocation, setDraftLocation] = useState(sp(searchParams, 'location'))
  const [draftOrg,      setDraftOrg]      = useState(sp(searchParams, 'organization'))

  // committed search values
  const [title,    setTitle]    = useState(sp(searchParams, 'title'))
  const [location, setLocation] = useState(sp(searchParams, 'location'))
  const [org,      setOrg]      = useState(sp(searchParams, 'organization'))

  // filter params
  const [section,   setSection]   = useState<SectionKey>((sp(searchParams, 'section') as SectionKey) || 'jobs')
  const [seniority, setSeniority] = useState(sp(searchParams, 'seniority'))
  const [timeFrame, setTimeFrame] = useState(sp(searchParams, 'time_frame'))
  const [workArr,   setWorkArr]   = useState(sp(searchParams, 'ai_work_arrangement'))
  const [expLevel,  setExpLevel]  = useState(sp(searchParams, 'ai_experience_level'))
  const [empType,   setEmpType]   = useState(sp(searchParams, 'ai_employment_type'))
  const [limit,     setLimit]     = useState(sp(searchParams, 'limit', '25'))
  const [offset,    setOffset]    = useState(sp(searchParams, 'offset', '0'))
  const [hasSalary, setHasSalary] = useState(sp(searchParams, 'has_salary'))
  const [noAgency,  setNoAgency]  = useState(sp(searchParams, 'organization_agency'))
  const [orgSlug,   setOrgSlug]   = useState(sp(searchParams, 'organization_slug'))

  // advanced boolean params
  const [titleAdv, setTitleAdv] = useState(sp(searchParams, 'title_advanced'))
  const [descAdv,  setDescAdv]  = useState(sp(searchParams, 'description_advanced'))
  const [locAdv,   setLocAdv]   = useState(sp(searchParams, 'location_advanced'))
  const [orgAdv,   setOrgAdv]   = useState(sp(searchParams, 'organization_advanced'))

  // UI state
  const [showFilters,  setShowFilters]  = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedJob,  setSelectedJob]  = useState<LinkedInJob | null>(null)

  const currentSection = SECTIONS.find(s => s.key === section)!

  /* ── sync state → URL ── */
  useEffect(() => {
    const p: Record<string, string> = {}
    if (section !== 'jobs') p.section = section
    if (title)              p.title = title
    if (location)           p.location = location
    if (org)                p.organization = org
    if (orgSlug)            p.organization_slug = orgSlug
    if (seniority)          p.seniority = seniority
    if (timeFrame)          p.time_frame = timeFrame
    if (workArr)            p.ai_work_arrangement = workArr
    if (expLevel)           p.ai_experience_level = expLevel
    if (empType)            p.ai_employment_type = empType
    if (limit !== '25')     p.limit = limit
    if (offset !== '0')     p.offset = offset
    if (hasSalary)          p.has_salary = hasSalary
    if (noAgency)           p.organization_agency = noAgency
    if (titleAdv)           p.title_advanced = titleAdv
    if (descAdv)            p.description_advanced = descAdv
    if (locAdv)             p.location_advanced = locAdv
    if (orgAdv)             p.organization_advanced = orgAdv
    setSearchParams(p, { replace: true })
  }, [section, title, location, org, orgSlug, seniority, timeFrame, workArr, expLevel, empType,
      limit, offset, hasSalary, noAgency, titleAdv, descAdv, locAdv, orgAdv])

  /* ── jobs data (dummy or real) ── */
  const isLoading = false
  const isError   = false

  const jobs: LinkedInJob[] = USE_DUMMY_DATA
    ? filterDummy({ title, location, org, section, seniority, empType, workArr, hasSalary })
    : [] // replaced by real useQuery when USE_DUMMY_DATA = false

  /* ── auto-select first job ── */
  useEffect(() => {
    if (jobs.length && !selectedJob) setSelectedJob(jobs[0])
    if (jobs.length === 0)           setSelectedJob(null)
  }, [JSON.stringify(jobs.map(j => j.id))])

  /* ── save mutation ── */
  const saveMutation = useMutation({
    mutationFn: (job: LinkedInJob) =>
      api.post('/applications', {
        job_id: job.id, job_title: job.title,
        company_name: job.organization, company_logo_url: job.organization_logo,
        status: 'saved', job_data: job,
      }),
    onSuccess: () => { toast.success('Saved to ATS board!'); qc.invalidateQueries({ queryKey: ['applications'] }) },
    onError:   () => toast.error('Failed to save'),
  })

  /* ── handlers ── */
  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setTitle(draftTitle); setLocation(draftLocation); setOrg(draftOrg)
    setOffset('0'); setSelectedJob(null)
  }

  function clearAllFilters() {
    setSeniority(''); setTimeFrame(''); setWorkArr(''); setExpLevel('')
    setEmpType(''); setHasSalary(''); setNoAgency(''); setOrgSlug('')
    setTitleAdv(''); setDescAdv(''); setLocAdv(''); setOrgAdv('')
    setLimit('25'); setOffset('0')
  }

  function handleSectionChange(key: SectionKey) {
    setSection(key); setOffset('0'); setSelectedJob(null)
  }

  function handlePagePrev() {
    setOffset(String(Math.max(0, parseInt(offset) - parseInt(limit))))
    setSelectedJob(null)
  }

  function handlePageNext() {
    setOffset(String(parseInt(offset) + parseInt(limit)))
    setSelectedJob(null)
  }

  /* ── active filter pills ── */
  const activePills = [
    seniority && { label: SENIORITY_OPTS.find(o => o.v === seniority)?.l ?? seniority, clear: () => setSeniority('') },
    timeFrame  && { label: TIME_OPTS.find(o => o.v === timeFrame)?.l ?? timeFrame,      clear: () => setTimeFrame('') },
    workArr    && { label: workArr,  clear: () => setWorkArr('') },
    expLevel   && { label: expLevel, clear: () => setExpLevel('') },
    empType    && { label: EMP_TYPE_OPTS.find(o => o.v === empType)?.l ?? empType,      clear: () => setEmpType('') },
    hasSalary  && { label: '💰 Has Salary',  clear: () => setHasSalary('') },
    noAgency   && { label: 'No Agencies',    clear: () => setNoAgency('') },
    titleAdv   && { label: `title: ${titleAdv}`, clear: () => setTitleAdv('') },
    descAdv    && { label: `desc: ${descAdv}`,   clear: () => setDescAdv('') },
    locAdv     && { label: `loc: ${locAdv}`,     clear: () => setLocAdv('') },
    orgAdv     && { label: `org: ${orgAdv}`,     clear: () => setOrgAdv('') },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  const currentPage = Math.floor(parseInt(offset) / parseInt(limit)) + 1

  return {
    // draft inputs
    draftTitle, setDraftTitle,
    draftLocation, setDraftLocation,
    draftOrg, setDraftOrg,
    // filters
    section, seniority, setSeniority,
    timeFrame, setTimeFrame,
    workArr, setWorkArr,
    expLevel, setExpLevel,
    empType, setEmpType,
    limit, setLimit,
    offset,
    hasSalary, setHasSalary,
    noAgency, setNoAgency,
    orgSlug, setOrgSlug,
    // advanced
    titleAdv, setTitleAdv,
    descAdv, setDescAdv,
    locAdv, setLocAdv,
    orgAdv, setOrgAdv,
    // ui
    showFilters, setShowFilters,
    showAdvanced, setShowAdvanced,
    selectedJob, setSelectedJob,
    // data
    jobs, isLoading, isError,
    // helpers
    currentSection,
    activePills,
    currentPage,
    // handlers
    handleSearch,
    clearAllFilters,
    handleSectionChange,
    handlePagePrev,
    handlePageNext,
    saveMutation,
  }
}

/* ── client-side dummy filter ── */
function filterDummy({
  title, location, org, section, seniority, empType, workArr, hasSalary,
}: {
  title: string; location: string; org: string; section: string
  seniority: string; empType: string; workArr: string; hasSalary: string
}): LinkedInJob[] {
  return DUMMY_LINKEDIN_JOBS.filter(job => {
    const q = title.toLowerCase()
    if (q && !job.title.toLowerCase().includes(q) && !job.organization.toLowerCase().includes(q)) return false
    if (location && !job.locations_derived.join(' ').toLowerCase().includes(location.toLowerCase())) return false
    if (org && !job.organization.toLowerCase().includes(org.toLowerCase())) return false
    if (seniority && job.seniority !== seniority) return false
    if (empType && !job.employment_type.includes(empType)) return false
    if (hasSalary && !job.salary_raw) return false

    if (section === 'internships' && !job.employment_type.includes('INTERNSHIP')) return false
    if (section === 'remote'      && !job.remote_derived) return false
    if (section === 'easy_apply'  && !job.directapply)   return false

    if (workArr === 'Remote Solely' && !job.remote_derived) return false
    if (workArr === 'Hybrid'        && job.location_type !== 'Hybrid') return false
    if (workArr === 'Onsite'        && job.remote_derived) return false

    return true
  })
}
