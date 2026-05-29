import { useQuery } from '@tanstack/react-query'
import { Briefcase, Kanban, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import type { Profile } from '@/types'

export default function Dashboard() {
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then((r) => r.data),
  })

  const stats = [
    { label: 'Jobs Saved', icon: Briefcase, value: '—' },
    { label: 'Applied', icon: CheckCircle, value: '—' },
    { label: 'Interviews', icon: Kanban, value: '—' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      {/* Profile completeness */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Profile Completeness</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <>
              <Progress value={profile?.completeness_pct ?? 0} className="h-2" />
              <p className="mt-1 text-xs text-muted-foreground">{profile?.completeness_pct ?? 0}% complete</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, icon: Icon, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
