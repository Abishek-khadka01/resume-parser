import { Search, MapPin, Briefcase, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ActivePill { label: string; clear: () => void }

interface JobSearchBarProps {
  draftTitle: string
  setDraftTitle: (v: string) => void
  draftLocation: string
  setDraftLocation: (v: string) => void
  draftOrg: string
  setDraftOrg: (v: string) => void
  showFilters: boolean
  setShowFilters: (fn: (v: boolean) => boolean) => void
  activePills: ActivePill[]
  onSubmit: (e: React.FormEvent) => void
}

export function ActivePillBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs px-2.5 py-0.5 font-medium">
      {label}
      <button onClick={onRemove} className="hover:opacity-70"><X className="h-3 w-3" /></button>
    </span>
  )
}

export function JobSearchBar({
  draftTitle, setDraftTitle,
  draftLocation, setDraftLocation,
  draftOrg, setDraftOrg,
  showFilters, setShowFilters,
  activePills, onSubmit,
}: JobSearchBarProps) {
  return (
    <div className="shrink-0 pb-3">
      <form onSubmit={onSubmit} className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input id="li-title" placeholder="Job title or skill…" value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)} className="pl-9" />
        </div>
        <div className="relative w-40">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input id="li-location" placeholder="Location" value={draftLocation}
            onChange={e => setDraftLocation(e.target.value)} className="pl-9" />
        </div>
        <div className="relative w-36">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input id="li-org" placeholder="Company" value={draftOrg}
            onChange={e => setDraftOrg(e.target.value)} className="pl-9" />
        </div>
        <Button type="submit">Search</Button>
        <Button type="button" variant="outline" size="icon" title="Filters"
          onClick={() => setShowFilters(v => !v)}
          className={cn('relative', showFilters && 'ring-2 ring-primary')}>
          <SlidersHorizontal className="h-4 w-4" />
          {activePills.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center font-bold">
              {activePills.length}
            </span>
          )}
        </Button>
      </form>

      {/* active pills (when panel is hidden) */}
      {activePills.length > 0 && !showFilters && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activePills.map(p => (
            <ActivePillBadge key={p.label} label={p.label} onRemove={p.clear} />
          ))}
        </div>
      )}
    </div>
  )
}
