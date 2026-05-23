import { useEffect, useRef, useCallback } from 'react'
import { useDraftStore } from '../store/useDraftStore'

/**
 * Manages the postMessage bridge between the Admin UI and the preview iframe.
 *
 * The iframe's injected script queues fetch() calls until it receives
 * CLOUDY_PREVIEW_UPDATE via postMessage. This bridge ensures data is sent
 * as soon as possible via three mechanisms:
 *   1. On iframe load event (with retry)
 *   2. On incoming CLOUDY_PREVIEW_READY message from the iframe
 *   3. On Zustand draftState changes (debounced 120ms)
 */
export function usePreviewBridge(
  iframeRef: React.RefObject<HTMLIFrameElement | null>
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHashRef = useRef<string>('')
  const sentRef = useRef(false)

  const sendDraftToIframe = useCallback(() => {
    const draft = useDraftStore.getState().getFullDraftForPreview()
    if (!draft) return

    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return

    const hash = JSON.stringify(draft)
    if (hash === lastHashRef.current) return
    lastHashRef.current = hash
    sentRef.current = true

    iframe.contentWindow.postMessage(
      { type: 'CLOUDY_PREVIEW_UPDATE', payload: draft },
      '*'
    )
  }, [iframeRef])

  /* Subscribe to store changes */
  useEffect(() => {
    const unsubscribe = useDraftStore.subscribe((state, prevState) => {
      if (state.draftState === prevState.draftState) return

      /* Reset hash so the next send goes through */
      lastHashRef.current = ''

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(sendDraftToIframe, 120)
    })

    return () => {
      unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [sendDraftToIframe])

  /* Clear preview iframe when previewKey changes (after publish) */
  useEffect(() => {
    let prevKey = useDraftStore.getState().previewKey

    const unsubscribe = useDraftStore.subscribe((state) => {
      if (state.previewKey !== prevKey) {
        prevKey = state.previewKey
        lastHashRef.current = ''
        sentRef.current = false
        const iframe = iframeRef.current
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(
            { type: 'CLOUDY_PREVIEW_CLEAR' },
            '*'
          )
        }
      }
    })

    return () => unsubscribe()
  }, [iframeRef])

  /* Listen for CLOUDY_PREVIEW_READY from the iframe */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'CLOUDY_PREVIEW_READY') {
        lastHashRef.current = ''
        sendDraftToIframe()
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [sendDraftToIframe])

  /* Send draft data when iframe loads — aggressive retry to handle timing */
  const handleIframeLoad = useCallback(() => {
    sentRef.current = false
    lastHashRef.current = ''

    /* Try immediately, then retry a few times in case the iframe isn't ready */
    const attempts = [0, 100, 300, 600, 1200]
    for (const delay of attempts) {
      setTimeout(() => {
        if (!sentRef.current) sendDraftToIframe()
      }, delay)
    }
  }, [sendDraftToIframe])

  return { handleIframeLoad, sendDraftToIframe }
}
