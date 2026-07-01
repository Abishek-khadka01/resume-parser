import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUpload,
  faUser,
  faPhone,
  faLink,
  faBriefcase,
  faMapMarkerAlt,
  faBuilding,
  faGraduationCap,
  faIdCard,
  faDollarSign,
  faCheck,
  faTags,
} from '@fortawesome/free-solid-svg-icons'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import type { Profile as ProfileType } from '@/types'

const schema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
  linkedin_url: z.string().optional(),
  desired_title: z.string().min(1, 'Desired job title is required'),
  location: z.string().min(1, 'Preferred location is required'),
  work_model: z.enum(['remote', 'hybrid', 'on-site']),
  experience_level: z.enum(['entry', 'mid', 'senior', 'lead']),
  work_authorization: z.string().min(1, 'Work authorization is required'),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
})
type FormFields = z.infer<typeof schema>

export default function Profile() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery<ProfileType>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then((r) => r.data),
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    values: profile
      ? ({
          full_name: profile.full_name ?? '',
          phone: profile.phone ?? '',
          linkedin_url: profile.linkedin_url ?? '',
          desired_title: profile.desired_title ?? '',
          location: profile.location ?? '',
          work_model: profile.work_model || 'remote',
          experience_level: profile.experience_level || 'entry',
          work_authorization: profile.work_authorization ?? '',
          salary_min: profile.salary_min ?? undefined,
          salary_max: profile.salary_max ?? undefined,
        } as FormFields)
      : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch('/profile', data),
    onSuccess: () => {
      toast.success('Profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const onSubmit = (data: FormFields) => {
    updateMutation.mutate(data as unknown as Record<string, unknown>)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post('/resume/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Resume uploaded and parsed successfully')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch {
      toast.error('Failed to parse resume')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-full max-w-lg rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  const completeness = profile?.completeness_pct ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2.5 h-10 px-6 rounded-full bg-gradient-to-r from-[#4a0080] via-[#74007a] to-[#da70dc] hover:from-[#da70dc] hover:via-[#74007a] hover:to-[#4a0080] text-white text-sm font-bold tracking-wide shadow-lg shadow-[#74007a]/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <FontAwesomeIcon icon={faUpload} className="w-3.5 h-3.5" />
            {uploading ? 'Parsing...' : 'Upload Resume'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-[#74007a]/8 flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-[#74007a]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faUser} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      placeholder="Your full name"
                      {...register('full_name')}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Phone</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faPhone} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      placeholder="+1 (555) 000-0000"
                      {...register('phone')}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">LinkedIn URL</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLink} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    placeholder="https://linkedin.com/in/yourprofile"
                    {...register('linkedin_url')}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-[#74007a]/8 flex items-center justify-center">
                    <FontAwesomeIcon icon={faBriefcase} className="w-4 h-4 text-[#74007a]" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Job Preferences</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Desired Job Title <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faBriefcase} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        placeholder="e.g. Senior Frontend Engineer"
                        {...register('desired_title')}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all"
                      />
                    </div>
                    {errors.desired_title && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.desired_title.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        Preferred Location <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          placeholder="e.g. New York, NY"
                          {...register('location')}
                          className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all"
                        />
                      </div>
                      {errors.location && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.location.message}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        Work Model <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faBuilding} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                        <Select
                          value={profile?.work_model ?? undefined}
                          onValueChange={(v) => setValue('work_model', v as 'remote' | 'hybrid' | 'on-site')}
                        >
                          <SelectTrigger className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="remote">Remote</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="on-site">On-site</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {errors.work_model && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.work_model.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        Experience Level <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faGraduationCap} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                        <Select
                          value={profile?.experience_level ?? undefined}
                          onValueChange={(v) => setValue('experience_level', v as 'entry' | 'mid' | 'senior' | 'lead')}
                        >
                          <SelectTrigger className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entry">Entry</SelectItem>
                            <SelectItem value="mid">Mid</SelectItem>
                            <SelectItem value="senior">Senior</SelectItem>
                            <SelectItem value="lead">Lead</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {errors.experience_level && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.experience_level.message}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                        Work Authorization <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faIdCard} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          placeholder="e.g. US Citizen, H1-B"
                          {...register('work_authorization')}
                          className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all"
                        />
                      </div>
                      {errors.work_authorization && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.work_authorization.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Salary Range</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <FontAwesomeIcon icon={faDollarSign} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          placeholder="Min"
                          {...register('salary_min', { valueAsNumber: true })}
                          className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all"
                        />
                      </div>
                      <div className="relative">
                        <FontAwesomeIcon icon={faDollarSign} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          placeholder="Max"
                          {...register('salary_max', { valueAsNumber: true })}
                          className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#74007a] focus:ring-2 focus:ring-[#74007a]/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending}
                className="w-full h-11 rounded-full bg-gradient-to-r from-[#4a0080] via-[#74007a] to-[#da70dc] hover:from-[#da70dc] hover:via-[#74007a] hover:to-[#4a0080] text-white text-sm font-bold tracking-wide shadow-lg shadow-[#74007a]/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save & Continue'}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Completeness</h3>
              <span className="text-xs font-bold text-[#74007a] bg-[#74007a]/8 px-2.5 py-1 rounded-full">
                {completeness}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4a0080] via-[#74007a] to-[#da70dc] transition-all duration-700"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {completeness < 100
                ? 'Fill in the required fields to reach 100%'
                : 'Your profile is complete'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#74007a]/8 flex items-center justify-center">
                <FontAwesomeIcon icon={faTags} className="w-4 h-4 text-[#74007a]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Skills</h3>
            </div>

            {profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-[#74007a]/8 text-[#74007a] text-xs font-semibold px-3 py-1.5 border border-[#74007a]/15"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <FontAwesomeIcon icon={faTags} className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">No skills extracted yet</p>
                <p className="text-xs text-slate-300 mt-1">Upload a resume to automatically extract your skills</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
