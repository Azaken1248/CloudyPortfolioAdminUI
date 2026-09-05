
import { describe, it, expect, beforeEach, vi } from 'vitest'

// vi.mock is hoisted above imports, so the mock fn must be hoisted too.
const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }))
vi.mock('../../config/api', () => ({ apiFetch: apiFetchMock, apiUpload: vi.fn() }))

import { useDraftStore } from '../../store/useDraftStore'

describe('#6 live state must be authoritative before publishing', () => {
  beforeEach(() => {
    apiFetchMock.mockReset()
    useDraftStore.setState({
      liveState: null, draftState: null, liveError: null,
      isLiveAuthoritative: false, isPublishing: false,
    })
  })

  it('marks state authoritative after a successful fetch', async () => {
    apiFetchMock.mockResolvedValue({})
    await useDraftStore.getState().fetchLiveState()
    expect(useDraftStore.getState().isLiveAuthoritative).toBe(true)
    expect(useDraftStore.getState().canPublish()).toBe(true)
  })

  it('falls back to the baseline but refuses to publish when the API fails', async () => {
    apiFetchMock.mockRejectedValue(new Error('network down'))
    await useDraftStore.getState().fetchLiveState()

    const s = useDraftStore.getState()
    expect(s.liveState).not.toBeNull()          // baseline still populated for the editor
    expect(s.liveError).toBeInstanceOf(Error)   // and the error is now readable
    expect(s.isLiveAuthoritative).toBe(false)
    expect(s.canPublish()).toBe(false)          // ...but publishing is blocked
  })

  it('recovers once the API comes back', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('down'))
    await useDraftStore.getState().fetchLiveState()
    expect(useDraftStore.getState().canPublish()).toBe(false)

    apiFetchMock.mockResolvedValue({})
    await useDraftStore.getState().fetchLiveState()
    expect(useDraftStore.getState().canPublish()).toBe(true)
  })
})
