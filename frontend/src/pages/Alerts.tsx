import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import api from '@/lib/api'
import type { JobAlert } from '@/types'

const schema = z.object({
  keywords: z.string().min(1, 'Enter at least one keyword'),
  location: z.string().optional(),
  min_match_pct: z.coerce.number().min(0).max(100).default(60),
  frequency: z.enum(['instant', 'daily', 'weekly']),
})
type FormData = z.infer<typeof schema>

export default function Alerts() {
  const queryClient = useQueryClient()

  const { data: alerts, isLoading } = useQuery<JobAlert[]>({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts').then((r) => r.data),
  })

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { frequency: 'daily', min_match_pct: 60 },
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/alerts', { ...data, keywords: data.keywords.split(',').map((k) => k.trim()) }),
    onSuccess: () => {
      toast.success('Alert created')
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
    onError: () => toast.error('Failed to create alert'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/alerts/${id}`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h2 className="text-2xl font-semibold">Job Alerts</h2>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">New Alert</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Keywords <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
              <Input placeholder="React, TypeScript, Frontend" {...register('keywords')} />
              {errors.keywords && <p className="text-xs text-destructive">{errors.keywords.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Location</Label>
              <Input placeholder="New York, Remote…" {...register('location')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Min Match %</Label>
                <Input type="number" min={0} max={100} {...register('min_match_pct')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Frequency</Label>
                <Select defaultValue="daily" onValueChange={(v) => setValue('frequency', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>Create Alert</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {alerts?.map((alert) => (
          <Card key={alert.id} className={alert.is_active ? '' : 'opacity-60'}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {alert.keywords.map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {alert.location ?? 'Any location'} · Min {alert.min_match_pct}% · {alert.frequency}
                </p>
              </div>
              <Button
                size="sm"
                variant={alert.is_active ? 'outline' : 'default'}
                onClick={() => toggleMutation.mutate({ id: alert.id, is_active: !alert.is_active })}
              >
                {alert.is_active ? 'Pause' : 'Resume'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
