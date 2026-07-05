import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { updateApplicationStatus } from '@/services/api'
import { useApplyTrackingStore } from '@/stores/applyTrackingStore'

export function ApplyConfirmDialog() {
  const queryClient = useQueryClient()
  const { pending, clearPending } = useApplyTrackingStore()
  const [open, setOpen] = useState(false)
  const wasHiddenRef = useRef(false)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHiddenRef.current = true
        return
      }
      if (wasHiddenRef.current && useApplyTrackingStore.getState().pending) {
        setOpen(true)
      }
      wasHiddenRef.current = false
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const confirmMutation = useMutation({
    mutationFn: (applicationId: string) => updateApplicationStatus(applicationId, 'applied'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      setOpen(false)
      clearPending()
    },
  })

  const handleNotYet = () => {
    setOpen(false)
    clearPending()
  }

  if (!pending) return null

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleNotYet() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Did you apply?</DialogTitle>
          <DialogDescription>
            You were redirected to apply for <span className="font-medium text-foreground">{pending.jobTitle}</span> at{' '}
            <span className="font-medium text-foreground">{pending.companyName}</span>. Did you finish submitting your application?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleNotYet} disabled={confirmMutation.isPending}>
            Not yet
          </Button>
          <Button
            onClick={() => confirmMutation.mutate(pending.applicationId)}
            disabled={confirmMutation.isPending}
          >
            <FontAwesomeIcon
              icon={confirmMutation.isPending ? faSpinner : faPaperPlane}
              className={confirmMutation.isPending ? 'w-3 h-3 animate-spin' : 'w-3 h-3'}
            />
            Yes, mark as applied
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
