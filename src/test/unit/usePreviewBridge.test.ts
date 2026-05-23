import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePreviewBridge } from '../../lib/previewBridge'
import { useDraftStore } from '../../store/useDraftStore'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'

describe('usePreviewBridge', () => {
  let iframeRef: { current: HTMLIFrameElement }
  let contentWindow: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    contentWindow = {
      postMessage: vi.fn(),
    }

    iframeRef = {
      current: {
        contentWindow,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as any
    }

    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
      previewKey: 0,
      isPublishing: false,
      publishProgress: null,
      pendingUploads: new Map()
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('TC-033: sends CLOUDY_PREVIEW_UPDATE upon receiving CLOUDY_PREVIEW_READY', () => {
    renderHook(() => usePreviewBridge(iframeRef))
    
    // Simulate iframe sending ready message
    const messageEvent = new MessageEvent('message', {
      data: { type: 'CLOUDY_PREVIEW_READY' }
    })
    window.dispatchEvent(messageEvent)
    
    expect(contentWindow.postMessage).toHaveBeenCalledWith({
      type: 'CLOUDY_PREVIEW_UPDATE',
      payload: expect.any(Object)
    }, '*')
  })

  it('TC-034: debounces aggressive draft updates (120ms)', () => {
    renderHook(() => usePreviewBridge(iframeRef))
    
    // Reset from initial sends
    contentWindow.postMessage.mockClear()
    
    // Simulate rapid draft changes
    useDraftStore.getState().updateDraftConfig({ siteConfig: { ...DEFAULT_PORTFOLIO.siteConfig, siteName: 'Name 1' } })
    useDraftStore.getState().updateDraftConfig({ siteConfig: { ...DEFAULT_PORTFOLIO.siteConfig, siteName: 'Name 2' } })
    useDraftStore.getState().updateDraftConfig({ siteConfig: { ...DEFAULT_PORTFOLIO.siteConfig, siteName: 'Name 3' } })
    
    // Should not have sent immediately
    expect(contentWindow.postMessage).not.toHaveBeenCalled()
    
    // Fast forward time
    vi.advanceTimersByTime(150)
    
    // Should have sent exactly once after debounce
    expect(contentWindow.postMessage).toHaveBeenCalledTimes(1)
  })

  it('TC-036: handles deep object serialization via postMessage', () => {
    renderHook(() => usePreviewBridge(iframeRef))
    
    // Mock the window event
    const messageEvent = new MessageEvent('message', {
      data: { type: 'CLOUDY_PREVIEW_READY' }
    })
    window.dispatchEvent(messageEvent)
    
    const payloadSent = contentWindow.postMessage.mock.calls[0][0].payload
    expect(payloadSent.siteConfig.siteName).toBe(DEFAULT_PORTFOLIO.siteConfig.siteName)
    // Arrays should be serialized correctly
    expect(Array.isArray(payloadSent.artworks)).toBe(true)
  })
})
