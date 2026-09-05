
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }))
vi.mock('../../config/api', () => ({ apiFetch: apiFetchMock, apiUpload: vi.fn() }))

import { useDraftStore } from '../../store/useDraftStore'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'
import type { ApiPortfolioData } from '../../types/api'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

describe('#15 editors re-hydrate when the draft is replaced', () => {
  beforeEach(() => {
    apiFetchMock.mockReset()
    useDraftStore.setState({
      liveState: clone(DEFAULT_PORTFOLIO) as ApiPortfolioData,
      draftState: clone(DEFAULT_PORTFOLIO) as ApiPortfolioData,
      draftRevision: 0, isLiveAuthoritative: true,
    })
  })

  it('bumps draftRevision when the draft is re-initialised from live', () => {
    const before = useDraftStore.getState().draftRevision
    useDraftStore.getState().initDraftFromLive()
    expect(useDraftStore.getState().draftRevision).toBe(before + 1)
  })

  it('bumps draftRevision on discard', () => {
    const before = useDraftStore.getState().draftRevision
    useDraftStore.getState().resetDraft()
    expect(useDraftStore.getState().draftRevision).toBe(before + 1)
  })

  it('does not bump on ordinary edits, so editors are not reset mid-typing', () => {
    const before = useDraftStore.getState().draftRevision
    useDraftStore.getState().updateDraftConfig({
      siteConfig: { ...(useDraftStore.getState().draftState!.siteConfig), siteName: 'Edited' },
    })
    expect(useDraftStore.getState().draftRevision).toBe(before)
    expect(useDraftStore.getState().draftState!.siteConfig.siteName).toBe('Edited')
  })
})
