import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDraftStore } from '../../store/useDraftStore'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'
import { apiFetch } from '../../config/api'

vi.mock('../../config/api', () => ({
  apiFetch: vi.fn(),
}))

const apiFetchMock = vi.mocked(apiFetch)

describe('useDraftStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store before each test
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
      pendingUploads: new Map(),
      isPublishing: false,
      publishProgress: null,
      previewKey: 0,
    })
  })

  it('TC-017: updateDraftConfig only updates top-level config values', () => {
    const store = useDraftStore.getState()
    store.updateDraftConfig({ siteConfig: { ...DEFAULT_PORTFOLIO.siteConfig, siteName: 'New Test Name' } })
    
    const draft = useDraftStore.getState().draftState!
    expect(draft.siteConfig.siteName).toBe('New Test Name')
    // Ensure others are intact
    expect(draft.siteConfig.siteSubtitle).toBe(DEFAULT_PORTFOLIO.siteConfig.siteSubtitle)
    expect(draft.artworks).toEqual(DEFAULT_PORTFOLIO.artworks)
  })

  it('TC-018: updateDraftSection fully replaces specified section data', () => {
    const store = useDraftStore.getState()
    const newHero = {
      eyebrow: 'New Eyebrow',
      headline: 'New Headline',
      body: 'New Body',
      accent: 'New Accent',
      pillIcon: 'Star' as const,
      pillLabel: 'New Pill',
      image: 'new.webp',
      imageAlt: 'new alt',
      statusPillLabel: 'New Status',
      ctaButtons: []
    }
    store.updateDraftSection('heroContent', newHero)

    const draft = useDraftStore.getState().draftState!
    expect(draft.heroContent).toEqual(newHero)
  })

  it('TC-019: addDraftItem appends new items with a temporary draft_ ID', () => {
    const store = useDraftStore.getState()
    const originalLength = store.draftState!.artworks.length
    
    const newArtwork = {
      _id: 'draft_123',
      title: 'New Art',
      description: 'Desc',
      image: 'test.webp',
      isNSFW: false,
      sortOrder: 0
    }
    
    store.addDraftItem('artworks', newArtwork)
    
    const draft = useDraftStore.getState().draftState!
    expect(draft.artworks.length).toBe(originalLength + 1)
    expect(draft.artworks[draft.artworks.length - 1]._id).toBe('draft_123')
  })

  it('TC-020: updateDraftItem correctly modifies a specific item', () => {
    const store = useDraftStore.getState()
    const targetId = '6a0edae66f9e29152f5ffab4'
    
    store.updateDraftItem('artworks', targetId, { title: 'Updated Title' } as any)
    
    const draft = useDraftStore.getState().draftState!
    const updatedItem = draft.artworks.find(a => a._id === targetId)
    expect(updatedItem?.title).toBe('Updated Title')
    // Original fields remain
    expect(updatedItem?.description).toBeTruthy()
  })

  it('TC-021: removeDraftItem correctly splices an item out of a collection', () => {
    const store = useDraftStore.getState()
    const targetId = '6a0edae66f9e29152f5ffab4'
    const originalLength = store.draftState!.artworks.length
    
    store.removeDraftItem('artworks', targetId)
    
    const draft = useDraftStore.getState().draftState!
    expect(draft.artworks.length).toBe(originalLength - 1)
    expect(draft.artworks.find(a => a._id === targetId)).toBeUndefined()
  })

  it('TC-022: reorderDraftItems sequentially assigns sortOrder from 0 to n-1', () => {
    const store = useDraftStore.getState()
    const items = [...store.draftState!.artworks].reverse() // Reverse the array
    
    store.reorderDraftItems('artworks', items)
    
    const draft = useDraftStore.getState().draftState!
    draft.artworks.forEach((art, index) => {
      expect(art.sortOrder).toBe(index)
    })
  })

  it('TC-023: isDirty returns true when liveState and draftState differ', () => {
    const store = useDraftStore.getState()
    expect(store.isDirty()).toBe(false)
    
    store.updateDraftConfig({ siteConfig: { ...DEFAULT_PORTFOLIO.siteConfig, siteName: 'Dirty Name' } })
    expect(useDraftStore.getState().isDirty()).toBe(true)
  })

  it('TC-024: isDirty returns false after calling resetDraft()', () => {
    const store = useDraftStore.getState()
    store.updateDraftConfig({ siteConfig: { ...DEFAULT_PORTFOLIO.siteConfig, siteName: 'Dirty Name' } })
    expect(useDraftStore.getState().isDirty()).toBe(true)
    
    useDraftStore.getState().resetDraft()
    expect(useDraftStore.getState().isDirty()).toBe(false)
  })

  it('TC-025: isDirty ignores referential changes if deep object structure is identical', () => {
    const store = useDraftStore.getState()
    expect(store.isDirty()).toBe(false)
    
    // Create a new reference but same content
    store.updateDraftSection('heroContent', structuredClone(DEFAULT_PORTFOLIO.heroContent))
    expect(useDraftStore.getState().isDirty()).toBe(false)
  })

  it('TC-011: fetchLiveState retrieves the live portfolio from the API', async () => {
    const remote = structuredClone(DEFAULT_PORTFOLIO)
    remote.siteConfig.siteName = 'Remote Portfolio'
    apiFetchMock.mockResolvedValueOnce(remote)

    await useDraftStore.getState().fetchLiveState()

    expect(apiFetchMock).toHaveBeenCalledWith('/portfolio')
    expect(useDraftStore.getState().liveState?.siteConfig.siteName).toBe('Remote Portfolio')
    expect(useDraftStore.getState().draftState?.siteConfig.siteName).toBe('Remote Portfolio')
  })

  it('TC-012: fetchLiveState falls back to DEFAULT_PORTFOLIO on failure', async () => {
    const previous = structuredClone(DEFAULT_PORTFOLIO)
    previous.siteConfig.siteName = 'Stale Live'
    useDraftStore.setState({
      liveState: previous,
      draftState: structuredClone(previous),
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    apiFetchMock.mockRejectedValueOnce(new Error('network failed'))

    await useDraftStore.getState().fetchLiveState()

    expect(useDraftStore.getState().liveState).toEqual(DEFAULT_PORTFOLIO)
    expect(useDraftStore.getState().draftState).toEqual(DEFAULT_PORTFOLIO)
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it('TC-013: fetchLiveState preserves unsaved draft changes', async () => {
    const previous = structuredClone(DEFAULT_PORTFOLIO)
    previous.siteConfig.siteName = 'Old Live'
    const dirtyDraft = structuredClone(DEFAULT_PORTFOLIO)
    dirtyDraft.siteConfig.siteName = 'Unsaved Draft'

    useDraftStore.setState({
      liveState: previous,
      draftState: dirtyDraft,
    })

    const remote = structuredClone(DEFAULT_PORTFOLIO)
    remote.siteConfig.siteName = 'Updated Live'
    apiFetchMock.mockResolvedValueOnce(remote)

    await useDraftStore.getState().fetchLiveState()

    expect(useDraftStore.getState().liveState?.siteConfig.siteName).toBe('Updated Live')
    expect(useDraftStore.getState().draftState?.siteConfig.siteName).toBe('Unsaved Draft')
  })

  it('TC-015: fetchLiveState logs CORS or network failures instead of crashing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    apiFetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await useDraftStore.getState().fetchLiveState()

    expect(warnSpy).toHaveBeenCalledWith(
      '[DraftStore] API refresh failed, using local baseline:',
      expect.any(TypeError)
    )
    expect(useDraftStore.getState().liveState).toEqual(DEFAULT_PORTFOLIO)

    warnSpy.mockRestore()
  })

  it('TC-016: partial API payloads are normalized with default portfolio fields', async () => {
    apiFetchMock.mockResolvedValueOnce({
      siteConfig: {
        ...DEFAULT_PORTFOLIO.siteConfig,
        siteName: 'Partial Portfolio',
      },
    } as Partial<typeof DEFAULT_PORTFOLIO>)

    await useDraftStore.getState().fetchLiveState()

    expect(useDraftStore.getState().liveState?.siteConfig.siteName).toBe('Partial Portfolio')
    expect(useDraftStore.getState().liveState?.heroContent).toEqual(DEFAULT_PORTFOLIO.heroContent)
    expect(useDraftStore.getState().liveState?.artworks).toEqual(DEFAULT_PORTFOLIO.artworks)
  })
})
