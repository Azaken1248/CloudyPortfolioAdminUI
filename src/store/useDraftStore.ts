import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { apiFetch } from '../config/api'
import { DEFAULT_PORTFOLIO } from '../data/defaultPortfolio'
import type {
  ApiPortfolioData,
  ApiGlobalConfig,
  ApiArtwork,
  ApiCommissionTier,
  ApiFaqItem,
  ApiTosSection,
} from '../types/api'

export type PendingUpload = {
  localUrl: string
  file: File
}

type DraftStore = {

  liveState: ApiPortfolioData | null
  draftState: ApiPortfolioData | null
  pendingUploads: Map<string, PendingUpload>

  isLiveLoading: boolean
  liveError: Error | null
  isPublishing: boolean
  publishProgress: { current: number; total: number; label: string } | null

  previewKey: number

  fetchLiveState: () => Promise<void>
  initDraftFromLive: () => void
  resetDraft: () => void

  updateDraftConfig: (patch: Partial<ApiGlobalConfig>) => void
  updateDraftSection: <K extends keyof ApiPortfolioData>(
    section: K,
    data: ApiPortfolioData[K]
  ) => void

  addDraftItem: <T extends { _id: string }>(
    collection: CollectionKey,
    item: T
  ) => void
  updateDraftItem: <T extends { _id: string }>(
    collection: CollectionKey,
    id: string,
    patch: Partial<T>
  ) => void
  removeDraftItem: (collection: CollectionKey, id: string) => void
  reorderDraftItems: <T extends { _id: string; sortOrder: number }>(
    collection: CollectionKey,
    items: T[]
  ) => void

  addPendingUpload: (localUrl: string, file: File) => void
  removePendingUpload: (localUrl: string) => void
  replacePendingUrl: (localUrl: string, cdnUrl: string) => void

  setPublishing: (
    isPublishing: boolean,
    progress?: { current: number; total: number; label: string } | null
  ) => void
  refreshPreview: () => void

  isDirty: () => boolean
  getFullDraftForPreview: () => ApiPortfolioData | null
}

export type CollectionKey =
  | 'artworks'
  | 'commissionTiers'
  | 'faqItems'
  | 'tosSections'

let draftIdCounter = 0
export function generateDraftId(): string {
  return `draft_${Date.now()}_${++draftIdCounter}`
}

export const useDraftStore = create<DraftStore>()(
  devtools(
    (set, get) => ({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
      pendingUploads: new Map(),
      isLiveLoading: false,
      liveError: null,
      isPublishing: false,
      publishProgress: null,
      previewKey: 0,

      fetchLiveState: async () => {
        try {
          const data = await apiFetch<ApiPortfolioData>('/portfolio')
          set({ liveState: data, liveError: null })
          const current = get().draftState
          if (current && JSON.stringify(current) === JSON.stringify(get().liveState)) {
            set({ draftState: structuredClone(data) })
          }
        } catch (err) {
          console.warn('[DraftStore] API refresh failed, using local baseline:', err)
        }
      },

      initDraftFromLive: () => {
        const live = get().liveState
        if (live) {
          set({ draftState: structuredClone(live) })
        }
      },

      resetDraft: () => {
        const live = get().liveState
        const pending = get().pendingUploads
        for (const [localUrl] of pending) {
          URL.revokeObjectURL(localUrl)
        }
        set({
          draftState: live ? structuredClone(live) : null,
          pendingUploads: new Map(),
        })
      },

      updateDraftConfig: (patch) => {
        const draft = get().draftState
        if (!draft) return
        set({
          draftState: {
            ...draft,
            ...patch,
          },
        })
      },

      updateDraftSection: (section, data) => {
        const draft = get().draftState
        if (!draft) return
        set({
          draftState: {
            ...draft,
            [section]: data,
          },
        })
      },

      addDraftItem: (collection, item) => {
        const draft = get().draftState
        if (!draft) return
        const list = [...(draft[collection] as unknown[])] as typeof item[]
        list.push(item)
        set({
          draftState: { ...draft, [collection]: list },
        })
      },

      updateDraftItem: (collection, id, patch) => {
        const draft = get().draftState
        if (!draft) return
        const list = (draft[collection] as { _id: string }[]).map((item) =>
          item._id === id ? { ...item, ...patch } : item
        )
        set({
          draftState: { ...draft, [collection]: list },
        })
      },

      removeDraftItem: (collection, id) => {
        const draft = get().draftState
        if (!draft) return
        const list = (draft[collection] as { _id: string }[]).filter(
          (item) => item._id !== id
        )
        set({
          draftState: { ...draft, [collection]: list },
        })
      },

      reorderDraftItems: (collection, items) => {
        const draft = get().draftState
        if (!draft) return
        const reordered = items.map((item, i) => ({
          ...item,
          sortOrder: i,
        }))
        set({
          draftState: { ...draft, [collection]: reordered },
        })
      },

      addPendingUpload: (localUrl, file) => {
        const pending = new Map(get().pendingUploads)
        pending.set(localUrl, { localUrl, file })
        set({ pendingUploads: pending })
      },

      removePendingUpload: (localUrl) => {
        const pending = new Map(get().pendingUploads)
        pending.delete(localUrl)
        URL.revokeObjectURL(localUrl)
        set({ pendingUploads: pending })
      },

      replacePendingUrl: (localUrl, cdnUrl) => {
        const draft = get().draftState
        if (!draft) return

        const json = JSON.stringify(draft)
        const replaced = json.replaceAll(localUrl, cdnUrl)
        const updated = JSON.parse(replaced) as ApiPortfolioData

        const pending = new Map(get().pendingUploads)
        pending.delete(localUrl)
        URL.revokeObjectURL(localUrl)

        set({ draftState: updated, pendingUploads: pending })
      },

      setPublishing: (isPublishing, progress = null) => {
        set({ isPublishing, publishProgress: progress })
      },

      refreshPreview: () => {
        set((state) => ({ previewKey: state.previewKey + 1 }))
      },

      isDirty: () => {
        const { liveState, draftState } = get()
        if (!liveState || !draftState) return false
        return JSON.stringify(liveState) !== JSON.stringify(draftState)
      },

      getFullDraftForPreview: () => {
        return get().draftState
      },
    }),
    { name: 'CloudyDraftStore' }
  )
)

export const selectLiveState = (s: DraftStore) => s.liveState
export const selectDraftState = (s: DraftStore) => s.draftState
export const selectIsPublishing = (s: DraftStore) => s.isPublishing
export const selectPublishProgress = (s: DraftStore) => s.publishProgress
export const selectPreviewKey = (s: DraftStore) => s.previewKey

const EMPTY_ARTWORKS: ApiArtwork[] = []
const EMPTY_TIERS: ApiCommissionTier[] = []
const EMPTY_FAQS: ApiFaqItem[] = []
const EMPTY_TOS: ApiTosSection[] = []

export const selectDraftArtworks = (s: DraftStore) =>
  s.draftState?.artworks ?? EMPTY_ARTWORKS
export const selectDraftCommissionTiers = (s: DraftStore) =>
  s.draftState?.commissionTiers ?? EMPTY_TIERS
export const selectDraftFaqItems = (s: DraftStore) =>
  s.draftState?.faqItems ?? EMPTY_FAQS
export const selectDraftTosSections = (s: DraftStore) =>
  s.draftState?.tosSections ?? EMPTY_TOS
