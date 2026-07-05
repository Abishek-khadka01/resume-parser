import { create } from 'zustand'

interface PendingApply {
  applicationId: string
  jobTitle: string
  companyName: string
}

interface ApplyTrackingState {
  pending: PendingApply | null
  setPending: (p: PendingApply) => void
  clearPending: () => void
}

export const useApplyTrackingStore = create<ApplyTrackingState>()((set) => ({
  pending: null,
  setPending: (p) => set({ pending: p }),
  clearPending: () => set({ pending: null }),
}))
