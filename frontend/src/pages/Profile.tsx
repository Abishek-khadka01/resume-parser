import { useQuery } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GapQuestionnaire } from '@/components/profile/GapQuestionnaire'
import api from '@/lib/api'
import type { Profile as ProfileType } from '@/types'

export default function Profile() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const { data: profile, isLoading, refetch } = useQuery<ProfileType>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then((r) => r.data),
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post('/resume/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Resume uploaded and parsed successfully')
      refetch()
    } catch {
      toast.error('Failed to parse resume')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Profile</h2>
        <div>
          <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Parsing…' : 'Upload Resume'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Completeness</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={profile?.completeness_pct ?? 0} className="h-2" />
          <p className="mt-1 text-xs text-muted-foreground">{profile?.completeness_pct ?? 0}%</p>
        </CardContent>
      </Card>

      {profile && <GapQuestionnaire profile={profile} onComplete={() => refetch()} />}

      {profile && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Skills</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
            {!profile.skills.length && <p className="text-sm text-muted-foreground">No skills extracted yet</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
