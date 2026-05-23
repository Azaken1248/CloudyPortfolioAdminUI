import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePublish } from '../../hooks/usePublish'
import { useDraftStore } from '../../store/useDraftStore'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'

const { buildPublishPlanMock, executePublishPlanMock, toastMock } = vi.hoisted(() => {
  const buildPublishPlanMock = vi.fn()
  const executePublishPlanMock = vi.fn()
  const toastMock = Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  })

  return { buildPublishPlanMock, executePublishPlanMock, toastMock }
})

vi.mock('../../lib/publishEngine', () => ({
  buildPublishPlan: buildPublishPlanMock,
  executePublishPlan: executePublishPlanMock,
}))

vi.mock('react-hot-toast', () => ({
  default: toastMock,
}))

describe('usePublish', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
      pendingUploads: new Map(),
      isPublishing: false,
      publishProgress: null,
    })
  })

  it('TC-096: shows an error toast when publish execution fails', async () => {
    buildPublishPlanMock.mockReturnValue({
      ops: [
        { type: 'upload', localUrl: 'blob:hero', file: new File(['x'], 'hero.png', { type: 'image/png' }) },
      ],
      summary: {
        uploads: 1,
        creates: 0,
        updates: 0,
        deletes: 0,
        sorts: 0,
        configChanged: false,
      },
    })
    executePublishPlanMock.mockRejectedValueOnce(new Error('Upload failed'))

    const { result } = renderHook(() => usePublish())

    await act(async () => {
      await result.current.publish()
    })

    expect(executePublishPlanMock).toHaveBeenCalledTimes(1)
    expect(toastMock.error).toHaveBeenCalledWith('Upload failed')
  })
})