import { describe, it, expect, beforeEach, vi } from 'vitest'
import { executePublishPlan, type PublishPlan } from '../../lib/publishEngine'

const { apiFetchMock, apiUploadMock, mockStore } = vi.hoisted(() => {
  const apiFetchMock = vi.fn()
  const apiUploadMock = vi.fn()
  const mockStore = {
    setPublishing: vi.fn(),
    replacePendingUrl: vi.fn(),
    fetchLiveState: vi.fn().mockResolvedValue(undefined),
    initDraftFromLive: vi.fn(),
    refreshPreview: vi.fn(),
  }

  return { apiFetchMock, apiUploadMock, mockStore }
})

vi.mock('../../config/api', () => ({
  apiFetch: apiFetchMock,
  apiUpload: apiUploadMock,
}))

vi.mock('../../store/useDraftStore', () => ({
  useDraftStore: {
    getState: () => mockStore,
  },
}))

describe('executePublishPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.fetchLiveState.mockResolvedValue(undefined)
  })

  function createPlan(): PublishPlan {
    const uploadFile = new File(['hero'], 'hero.png', { type: 'image/png' })

    return {
      ops: [
        { type: 'upload', localUrl: 'blob:hero', file: uploadFile },
        { type: 'delete', collection: 'artworks', id: 'artwork-1' },
        {
          type: 'create',
          collection: 'faqItems',
          payload: {
            question: 'New FAQ',
            answer: 'Answer',
            image: 'blob:hero',
          },
        },
        {
          type: 'update',
          collection: 'commissionTiers',
          id: 'tier-1',
          payload: {
            name: 'Tier One',
            imageUrl: 'blob:hero',
          },
        },
        {
          type: 'sort',
          collection: 'tosSections',
          items: [{ id: 'tos-1', sortOrder: 0 }],
        },
        {
          type: 'config',
          payload: {
            heroContent: {
              image: 'blob:hero',
            } as any,
          },
        },
      ],
      summary: {
        uploads: 1,
        creates: 1,
        updates: 1,
        deletes: 1,
        sorts: 1,
        configChanged: true,
      },
    }
  }

  it('TC-090-TC-098: executes the publish plan in order and refreshes the draft state afterward', async () => {
    apiUploadMock.mockResolvedValueOnce('https://cdn.example.com/hero.png')
    apiFetchMock.mockResolvedValue(undefined)

    await executePublishPlan(createPlan())

    expect(mockStore.setPublishing).toHaveBeenNthCalledWith(
      1,
      true,
      expect.objectContaining({ current: 1, total: 6, label: expect.stringContaining('Uploading') })
    )
    expect(apiUploadMock).toHaveBeenCalledWith(expect.any(File))
    expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/artworks/artwork-1', { method: 'DELETE' })

    const createCall = apiFetchMock.mock.calls.find(([endpoint]) => endpoint === '/faqs')
    const updateCall = apiFetchMock.mock.calls.find(([endpoint]) => endpoint === '/commissions/tier-1')
    const configCall = apiFetchMock.mock.calls.find(([endpoint]) => endpoint === '/config')
    const sortCall = apiFetchMock.mock.calls.find(([endpoint]) => endpoint === '/tos/sort')

    expect(createCall).toBeDefined()
    expect(updateCall).toBeDefined()
    expect(configCall).toBeDefined()
    expect(sortCall).toBeDefined()

    expect((createCall?.[1] as RequestInit).method).toBe('POST')
    expect((updateCall?.[1] as RequestInit).method).toBe('PATCH')
    expect((configCall?.[1] as RequestInit).method).toBe('PATCH')
    expect((sortCall?.[1] as RequestInit).method).toBe('PUT')

    expect(JSON.parse(String(createCall?.[1]?.body)).image).toBe('https://cdn.example.com/hero.png')
    expect(JSON.parse(String(updateCall?.[1]?.body)).imageUrl).toBe('https://cdn.example.com/hero.png')
    expect(JSON.parse(String(configCall?.[1]?.body)).heroContent.image).toBe('https://cdn.example.com/hero.png')

    expect(mockStore.fetchLiveState).toHaveBeenCalledTimes(1)
    expect(mockStore.initDraftFromLive).toHaveBeenCalledTimes(1)
    expect(mockStore.refreshPreview).toHaveBeenCalledTimes(1)
    expect(mockStore.setPublishing).toHaveBeenLastCalledWith(false)
  })

  it('TC-096: aborts publish execution if an upload fails', async () => {
    apiUploadMock.mockRejectedValueOnce(new Error('Upload failed'))

    await expect(executePublishPlan(createPlan())).rejects.toThrow('Upload failed')

    expect(apiFetchMock).not.toHaveBeenCalled()
    expect(mockStore.fetchLiveState).not.toHaveBeenCalled()
    expect(mockStore.refreshPreview).not.toHaveBeenCalled()
  })
})