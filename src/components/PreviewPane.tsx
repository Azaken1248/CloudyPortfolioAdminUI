import { useState, useCallback, useRef } from 'react'
import {
  MonitorIcon,
  DeviceTabletSpeakerIcon,
  DeviceMobileIcon,
  ArrowClockwiseIcon,
} from '@phosphor-icons/react'
import { usePreviewBridge } from '../lib/previewBridge'
import { useDraftStore } from '../store/useDraftStore'
import './PreviewPane.css'

const PREVIEW_URL =
  import.meta.env.MODE === 'production'
    ? '/api/preview'
    : 'http://localhost:5176/'

const VIEWPORTS = [
  { id: 'desktop', icon: MonitorIcon, label: 'Desktop', width: '100%' },
  { id: 'tablet', icon: DeviceTabletSpeakerIcon, label: 'Tablet', width: '768px' },
  { id: 'mobile', icon: DeviceMobileIcon, label: 'Mobile', width: '375px' },
] as const

export function PreviewPane() {
  const [viewport, setViewport] = useState<string>('desktop')
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const { handleIframeLoad } = usePreviewBridge(iframeRef)
  const previewKey = useDraftStore((s) => s.previewKey)
  const isLiveLoading = useDraftStore((s) => s.isLiveLoading)

  const currentViewport = VIEWPORTS.find((v) => v.id === viewport) ?? VIEWPORTS[0]

  const handleRefresh = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'CLOUDY_PREVIEW_CLEAR' },
      '*'
    )
  }, [])

  return (
    <div className="preview-pane">
      <div className="preview-toolbar">
        <span className="preview-title">Live Preview</span>
        <div className="preview-viewport-controls">
          {VIEWPORTS.map((v) => {
            const Icon = v.icon
            return (
              <button
                key={v.id}
                className={`preview-viewport-btn ${viewport === v.id ? 'active' : ''}`}
                onClick={() => setViewport(v.id)}
                title={v.label}
                type="button"
              >
                <Icon size={16} weight={viewport === v.id ? 'fill' : 'regular'} />
              </button>
            )
          })}
        </div>
        <button
          className="preview-refresh-btn"
          onClick={handleRefresh}
          title="Refresh preview"
          type="button"
        >
          <ArrowClockwiseIcon size={15} />
          <span className="preview-refresh-label">Refresh</span>
        </button>
      </div>

      <div className="preview-hint">
        Edits preview <strong>live</strong> as you type — nothing is saved until you publish.
      </div>

      <div className="preview-viewport-wrapper">
        <div
          className="preview-iframe-container"
          style={{ width: currentViewport.width, maxWidth: '100%' }}
        >
          {isLiveLoading ? (
            <div className="preview-skeleton" aria-busy="true">
              Loading preview...
            </div>
          ) : (
            <iframe
              key={previewKey}
              ref={iframeRef}
              src={PREVIEW_URL}
              className="preview-iframe"
              title="Portfolio Preview"
              onLoad={handleIframeLoad}
            />
          )}
        </div>
      </div>
    </div>
  )
}
