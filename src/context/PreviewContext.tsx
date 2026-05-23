import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ApiPortfolioData } from '../types/api'

type PreviewState = {
  draftData: Partial<ApiPortfolioData> | null
  updateSection: (section: string, data: unknown) => void
  getFullDraft: () => Partial<ApiPortfolioData> | null
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  refreshPreview: () => void
  previewKey: number
}

const PreviewContext = createContext<PreviewState>({
  draftData: null,
  updateSection: () => {},
  getFullDraft: () => null,
  iframeRef: { current: null },
  refreshPreview: () => {},
  previewKey: 0,
})

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [draftData, setDraftData] = useState<Partial<ApiPortfolioData> | null>(
    null
  )
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [previewKey, setPreviewKey] = useState(0)

  const updateSection = useCallback(
    (section: string, data: unknown) => {
      setDraftData((prev) => ({
        ...prev,
        [section]: data,
      }))
    },
    []
  )

  const getFullDraft = useCallback(() => draftData, [draftData])

  const refreshPreview = useCallback(() => {
    setPreviewKey((k) => k + 1)
  }, [])

  return (
    <PreviewContext
      value={{
        draftData,
        updateSection,
        getFullDraft,
        iframeRef,
        refreshPreview,
        previewKey,
      }}
    >
      {children}
    </PreviewContext>
  )
}

export function usePreview(): PreviewState {
  return useContext(PreviewContext)
}
