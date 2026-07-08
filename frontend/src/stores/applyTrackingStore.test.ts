import { describe, it, expect, beforeEach } from 'vitest'
import { useApplyTrackingStore } from './applyTrackingStore'

describe('applyTrackingStore', () => {
  beforeEach(() => {
    useApplyTrackingStore.setState({ pending: null })
  })

  it('starts with null pending', () => {
    expect(useApplyTrackingStore.getState().pending).toBeNull()
  })

  it('setPending stores the apply info', () => {
    useApplyTrackingStore.getState().setPending({
      applicationId: 'app-1',
      jobTitle: 'Engineer',
      companyName: 'Acme',
    })
    expect(useApplyTrackingStore.getState().pending).toEqual({
      applicationId: 'app-1',
      jobTitle: 'Engineer',
      companyName: 'Acme',
    })
  })

  it('clearPending resets to null', () => {
    useApplyTrackingStore.getState().setPending({
      applicationId: 'app-1',
      jobTitle: 'Engineer',
      companyName: 'Acme',
    })
    useApplyTrackingStore.getState().clearPending()
    expect(useApplyTrackingStore.getState().pending).toBeNull()
  })
})
