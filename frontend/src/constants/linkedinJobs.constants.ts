import { Briefcase, GraduationCap, MapPin, LayoutList } from 'lucide-react'

export type SectionKey = 'jobs' | 'internships' | 'remote' | 'easy_apply'

export const SECTIONS = [
  { key: 'jobs'        as SectionKey, label: 'Jobs',       icon: Briefcase,     desc: 'Full-time, part-time & contract positions',    extra: {} },
  { key: 'internships' as SectionKey, label: 'Internships', icon: GraduationCap, desc: 'Internship programs for students & graduates', extra: { ai_employment_type: 'INTERNSHIP' } },
  { key: 'remote'      as SectionKey, label: 'Remote',      icon: MapPin,        desc: 'Work-from-anywhere positions worldwide',       extra: { ai_work_arrangement: 'Remote Solely' } },
  { key: 'easy_apply'  as SectionKey, label: 'Easy Apply',  icon: LayoutList,    desc: 'Apply instantly — direct apply jobs only',     extra: { direct_apply: 'only' } },
]

export const SENIORITY_OPTS = [
  { v: '',                  l: 'All Levels' },
  { v: 'Entry level',       l: 'Entry Level' },
  { v: 'Mid-Senior level',  l: 'Mid-Senior' },
  { v: 'Director',          l: 'Director' },
  { v: 'Executive',         l: 'Executive' },
]

export const TIME_OPTS = [
  { v: '',    l: 'Any Time' },
  { v: '24h', l: 'Past 24 hours' },
  { v: '7d',  l: 'Past week' },
  { v: '6m',  l: 'Past 6 months' },
]

export const WORK_ARR_OPTS = [
  { v: '',             l: 'Any' },
  { v: 'Remote Solely', l: 'Remote' },
  { v: 'Hybrid',       l: 'Hybrid' },
  { v: 'Onsite',       l: 'Onsite' },
]

export const EXP_OPTS = [
  { v: '',     l: 'Any' },
  { v: '0-2',  l: '0–2 years' },
  { v: '2-5',  l: '2–5 years' },
  { v: '5-10', l: '5–10 years' },
]

export const EMP_TYPE_OPTS = [
  { v: '',           l: 'Any' },
  { v: 'FULL_TIME',  l: 'Full-time' },
  { v: 'PART_TIME',  l: 'Part-time' },
  { v: 'CONTRACT',   l: 'Contract' },
  { v: 'TEMPORARY',  l: 'Temporary' },
  { v: 'INTERNSHIP', l: 'Internship' },
]

export const LIMIT_OPTS = [
  { v: '25',  l: '25 results' },
  { v: '50',  l: '50 results' },
  { v: '100', l: '100 results' },
]
