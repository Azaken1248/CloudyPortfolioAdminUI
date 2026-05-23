import { useEffect, useRef, useCallback } from 'react'
import { useDraftStore } from '../store/useDraftStore'

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

  useEffect(() => {
    const unsubscribe = useDraftStore.subscribe((state, prevState) => {
      if (state.draftState === prevState.draftState) return

      lastHashRef.current = ''

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(sendDraftToIframe, 120)
    })

    return () => {
      unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [sendDraftToIframe])

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

  const handleIframeLoad = useCallback(() => {
    sentRef.current = false
    lastHashRef.current = ''

    const attempts = [0, 100, 300, 600, 1200]
    for (const delay of attempts) {
      setTimeout(() => {
        if (!sentRef.current) sendDraftToIframe()
      }, delay)
    }
  }, [sendDraftToIframe])

  return { handleIframeLoad, sendDraftToIframe }
}
