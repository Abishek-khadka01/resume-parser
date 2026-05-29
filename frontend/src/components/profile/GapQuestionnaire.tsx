import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import api from '@/lib/api'
import type { Profile } from '@/types'

const schema = z.object({
  desired_title: z.string().min(1),
  work_model: z.enum(['remote', 'hybrid', 'on-site']),
  location: z.string().min(1),
  experience_level: z.enum(['entry', 'mid', 'senior', 'lead']),
  work_authorization: z.string().min(1),
})
type FormData = z.infer<typeof schema>

const REQUIRED_FIELDS: (keyof Profile)[] = ['desired_title', 'work_model', 'location', 'experience_level', 'work_authorization']

interface Props {
  profile: Profile
  onComplete: () => void
}

export function GapQuestionnaire({ profile, onComplete }: Props) {
  const missingFields = REQUIRED_FIELDS.filter((f) => !profile[f])
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (!missingFields.length) return null

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      await api.patch('/profile', data)
      toast.success('Profile updated')
      onComplete()
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-orange-800">
          Complete your profile ({missingFields.length} field{missingFields.length > 1 ? 's' : ''} missing)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {missingFields.includes('desired_title') && (
            <div className="flex flex-col gap-1.5">
              <Label>Desired Job Title</Label>
              <Input placeholder="e.g. Senior Frontend Engineer" {...register('desired_title')} />
              {errors.desired_title && <p className="text-xs text-destructive">Required</p>}
            </div>
          )}
          {missingFields.includes('work_model') && (
            <div className="flex flex-col gap-1.5">
              <Label>Preferred Work Model</Label>
              <Select onValueChange={(v) => setValue('work_model', v as any)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="on-site">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {missingFields.includes('location') && (
            <div className="flex flex-col gap-1.5">
              <Label>Preferred Location</Label>
              <Input placeholder="e.g. New York, NY" {...register('location')} />
              {errors.location && <p className="text-xs text-destructive">Required</p>}
            </div>
          )}
          {missingFields.includes('experience_level') && (
            <div className="flex flex-col gap-1.5">
              <Label>Experience Level</Label>
              <Select onValueChange={(v) => setValue('experience_level', v as any)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {missingFields.includes('work_authorization') && (
            <div className="flex flex-col gap-1.5">
              <Label>Work Authorization</Label>
              <Input placeholder="e.g. US Citizen, H1-B, Open to work" {...register('work_authorization')} />
              {errors.work_authorization && <p className="text-xs text-destructive">Required</p>}
            </div>
          )}
          <Button type="submit" disabled={submitting}>Save & Continue</Button>
        </form>
      </CardContent>
    </Card>
  )
}
