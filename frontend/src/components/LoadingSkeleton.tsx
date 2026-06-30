import { cn } from '@/lib/utils'

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] motion-safe:animate-[pulse_1.5s_ease-in-out_infinite]',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-4">
        <SkeletonBlock className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-5 w-3/4" />
          <SkeletonBlock className="h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-5/6" />
      </div>
      <div className="flex gap-2 pt-2">
        <SkeletonBlock className="h-8 w-20 rounded-full" />
        <SkeletonBlock className="h-8 w-24 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-10 w-36 rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SkeletonBlock className="h-72 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="h-32 w-full rounded-2xl" />
          <SkeletonBlock className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
