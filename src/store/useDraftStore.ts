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
  /**
   * False when liveState is the local baseline rather than data actually
   * fetched from the API. Publishing while false would diff the draft against
   * content the server has never confirmed, so it is blocked.
   */
  isLiveAuthoritative: boolean
  isPublishing: boolean
  publishProgress: { current: number; total: number; label: string } | null

  previewKey: number
  /**
   * Bumped whenever draftState is replaced from outside an editor — after a
   * publish, or on discard. Editors hydrate local form state once per revision,
   * so they pick up server data instead of silently keeping stale values.
   */
  draftRevision: number

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
  canPublish: () => boolean
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function mergeWithDefaults<T>(base: T, partial: Partial<T>): T {
  if (Array.isArray(base)) {
    return (Array.isArray(partial) ? partial : base) as T
  }

  if (isPlainObject(base) && isPlainObject(partial)) {
    const merged: Record<string, unknown> = { ...base }

    for (const [key, value] of Object.entries(partial)) {
      if (value === undefined) continue

      const baseValue = merged[key]
      if (isPlainObject(baseValue) && isPlainObject(value)) {
        merged[key] = mergeWithDefaults(baseValue, value)
      } else {
        merged[key] = value
      }
    }

    return merged as T
  }

  return (partial ?? base) as T
}

function normalizePortfolioData(data: Partial<ApiPortfolioData>): ApiPortfolioData {
  return mergeWithDefaults(structuredClone(DEFAULT_PORTFOLIO), data)
}

/**
 * Memo for isDirty. Holds references only — the objects it points at are
 * replaced on every edit, so nothing is retained beyond the current pair.
 */
let dirtyCache: {
  live: ApiPortfolioData | null
  draft: ApiPortfolioData | null
  result: boolean
} = { live: null, draft: null, result: false }

export const useDraftStore = create<DraftStore>()(
  devtools(
    (set, get) => ({
      liveState: null,
      draftState: null,
      pendingUploads: new Map(),
      isLiveLoading: false,
      liveError: null,
      isLiveAuthoritative: false,
      isPublishing: false,
      publishProgress: null,
      previewKey: 0,
      draftRevision: 0,

      fetchLiveState: async () => {
        const previousLive = get().liveState
        const currentDraft = get().draftState
        const shouldSyncDraft = !currentDraft || (
          previousLive && JSON.stringify(currentDraft) === JSON.stringify(previousLive)
        )

        set({ isLiveLoading: true })

        try {
          const data = normalizePortfolioData(
            await apiFetch<Partial<ApiPortfolioData>>('/portfolio')
          )
          set({ liveState: data, liveError: null, isLiveAuthoritative: true })
          if (shouldSyncDraft) {
            set((state) => ({
              draftState: structuredClone(data),
              draftRevision: state.draftRevision + 1,
            }))
          }
        } catch (err) {
          console.warn('[DraftStore] API refresh failed, using local baseline:', err)
          const fallback = structuredClone(DEFAULT_PORTFOLIO)
          set({
            liveState: fallback,
            liveError: err instanceof Error ? err : new Error(String(err)),
            // The baseline carries real ObjectIds but reflects no known server
            // state; diffing against it could delete records never touched here.
            isLiveAuthoritative: false,
          })
          if (shouldSyncDraft) {
            set((state) => ({
              draftState: structuredClone(DEFAULT_PORTFOLIO),
              draftRevision: state.draftRevision + 1,
            }))
          }
        } finally {
          set({ isLiveLoading: false })
        }
      },

      initDraftFromLive: () => {
        const live = get().liveState
        if (live) {
          set((state) => ({
            draftState: structuredClone(live),
            draftRevision: state.draftRevision + 1,
          }))
        }
      },

      resetDraft: () => {
        const live = get().liveState
        const pending = get().pendingUploads
        for (const [localUrl] of pending) {
          URL.revokeObjectURL(localUrl)
        }
        set((state) => ({
          draftState: live ? structuredClone(live) : null,
          pendingUploads: new Map(),
          draftRevision: state.draftRevision + 1,
        }))
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

      canPublish: () => {
        const { isLiveAuthoritative, isPublishing, liveState, draftState } = get()
        return isLiveAuthoritative && !isPublishing && !!liveState && !!draftState
      },

      /**
       * Dirty check, memoised on object identity.
       *
       * This serialises the entire portfolio twice, and images are held as
       * base64 data URLs in the draft, so a single 5 MB upload makes each call
       * stringify ~13 MB. `Sidebar` calls it from inside a Zustand selector,
       * which re-runs on every store change — i.e. on every keystroke.
       *
       * Both states are replaced immutably, so reference equality is a sound
       * cache key: if neither object identity changed, the answer cannot have.
       */
      isDirty: () => {
        const { liveState, draftState } = get()
        if (!liveState || !draftState) return false
        if (liveState === draftState) return false

        const cache = dirtyCache
        if (cache.live === liveState && cache.draft === draftState) {
          return cache.result
        }

        const result = JSON.stringify(liveState) !== JSON.stringify(draftState)
        dirtyCache = { live: liveState, draft: draftState, result }
        return result
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
export const selectLiveError = (s: DraftStore) => s.liveError
export const selectIsLiveAuthoritative = (s: DraftStore) => s.isLiveAuthoritative
export const selectDraftRevision = (s: DraftStore) => s.draftRevision

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
