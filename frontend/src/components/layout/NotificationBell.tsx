import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faCheckDouble, faBriefcase } from '@fortawesome/free-solid-svg-icons'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/api'
import type { AppNotification } from '@/types'

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const seenIdsRef = useRef<Set<string> | null>(null)

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (seenIdsRef.current === null) {
      // First load: just baseline the seen set, don't toast existing history.
      seenIdsRef.current = new Set(notifications.map((n) => n.id))
      return
    }
    const fresh = notifications.filter((n) => !seenIdsRef.current!.has(n.id))
    for (const n of fresh) {
      toast(n.title, { description: n.message, icon: '🔔' })
      seenIdsRef.current.add(n.id)
    }
  }, [notifications])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.is_read) readMutation.mutate(n.id)
    const applyLink = n.job_data?.job_apply_link
    if (applyLink) window.open(applyLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-9 h-9 rounded-lg bg-white/8 hover:bg-white/14 text-white flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 flex flex-col bg-popover rounded-xl shadow-lg ring-1 ring-foreground/10 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => readAllMutation.mutate()}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faCheckDouble} className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <FontAwesomeIcon icon={faBriefcase} className="w-5 h-5 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors cursor-pointer hover:bg-muted/60 ${
                    n.is_read ? '' : 'bg-primary/5'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <div className={`min-w-0 flex-1 ${n.is_read ? 'pl-3.5' : ''}`}>
                      <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
