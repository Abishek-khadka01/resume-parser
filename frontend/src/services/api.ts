import axios from 'axios'
import type { User, Profile, Job, Application, ApplicationStatus, JobAlert } from '@/types'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export async function login(email: string, password: string) {
  const res = await client.post('/auth/login', { email, password })
  return res.data as { user: User; access_token: string; token_type: string }
}

export async function register(fullName: string, email: string, password: string) {
  await client.post('/auth/register', { full_name: fullName, email, password })
}

export async function getProfile() {
  const res = await client.get('/profile')
  return res.data as Profile
}

export async function updateProfile(data: Record<string, unknown>) {
  const res = await client.patch('/profile', data)
  return res.data as Profile
}

export async function uploadResume(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await client.post('/resume/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data as Profile
}

export async function getLinkedInJobs(params?: Record<string, string>) {
  const res = await client.get('/jobs/linkedin', { params })
  return res.data as Job[]
}

export async function getApplications() {
  const res = await client.get('/applications')
  return res.data as Application[]
}

export async function createApplication(data: {
  job_id: string
  job_title: string
  company_name: string
  company_logo_url?: string
  match_score?: number
  job_data?: Record<string, unknown>
}) {
  const res = await client.post('/applications', data)
  return res.data as Application
}

export async function updateApplicationStatus(appId: string, status: ApplicationStatus) {
  const res = await client.patch(`/applications/${appId}`, { status })
  return res.data as Application
}

export async function deleteApplication(appId: string) {
  await client.delete(`/applications/${appId}`)
}

export async function getAlerts() {
  const res = await client.get('/alerts')
  return res.data as JobAlert[]
}

export async function createAlert(data: {
  keywords: string[]
  location?: string
  min_match_pct?: number
  frequency?: string
}) {
  const res = await client.post('/alerts', data)
  return res.data as JobAlert
}

export async function toggleAlert(alertId: string, isActive: boolean) {
  const res = await client.patch(`/alerts/${alertId}`, { is_active: isActive })
  return res.data as JobAlert
}

export async function googleLogin() {
  const res = await client.get('/google/login')
  return res.data as { url: string }
}

export async function googleCallback(code: string) {
  const res = await client.post('/google/callback', { code })
  return res.data as { access_token: string; user: User }
}

export default client
