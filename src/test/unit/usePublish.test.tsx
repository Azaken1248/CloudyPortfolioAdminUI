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

// vi.mock is hoisted above the module body, so anything its factory closes over
// has to be hoisted too.
const { FakePartialPublishError } = vi.hoisted(() => ({
  FakePartialPublishError: class extends Error {
    completed: number
    total: number
    failedOp: string
    constructor(completed: number, total: number, failedOp: string) {
      super(`Publish stopped after ${completed} of ${total} operations`)
      this.name = 'PartialPublishError'
      this.completed = completed
      this.total = total
      this.failedOp = failedOp
    }
  },
}))

vi.mock('../../lib/publishEngine', () => ({
  buildPublishPlan: buildPublishPlanMock,
  executePublishPlan: executePublishPlanMock,
  // Pre-flight validation runs before execution; these plans are well-formed.
  validatePublishPlan: () => [],
  PartialPublishError: FakePartialPublishError,
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
      // Publishing now requires live state that genuinely came from the API.
      isLiveAuthoritative: true,
      liveError: null,
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

  it('TC-097: names how much landed when a publish fails part-way', async () => {
    executePublishPlanMock.mockRejectedValueOnce(
      new FakePartialPublishError(3, 7, 'deleting artwork'),
    )

    const { result } = renderHook(() => usePublish())
    await act(async () => {
      await result.current.publish()
    })

    // "Publish failed" would imply nothing changed, which is the one thing
    // that is not true after a partial commit.
    const message = toastMock.error.mock.calls.at(-1)?.[0] as string
    expect(message).toContain('3 of 7')
    expect(message).toContain('deleting artwork')
  })
})