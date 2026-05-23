import { useEffect, useRef } from 'react'
import { PORTFOLIO_URL } from '../config/api'

export function usePreviewEmitter(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  draftData: unknown
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!draftData) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      const iframe = iframeRef.current
      if (!iframe?.contentWindow) return

      iframe.contentWindow.postMessage(
        {
          type: 'CLOUDY_PREVIEW_UPDATE',
          payload: draftData,
        },
        PORTFOLIO_URL
      )
    }, 150)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [draftData, iframeRef])
}
