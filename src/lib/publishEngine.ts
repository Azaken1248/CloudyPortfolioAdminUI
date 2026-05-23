import { apiFetch, apiUpload } from '../config/api'
import { useDraftStore, type CollectionKey } from '../store/useDraftStore'
import type {
  ApiPortfolioData,
  ApiGlobalConfig,
  SortItem,
} from '../types/api'

type MutationOp =
  | { type: 'upload'; localUrl: string; file: File }
  | { type: 'delete'; collection: CollectionKey; id: string }
  | { type: 'create'; collection: CollectionKey; payload: Record<string, unknown> }
  | { type: 'update'; collection: CollectionKey; id: string; payload: Record<string, unknown> }
  | { type: 'sort'; collection: CollectionKey; items: SortItem[] }
  | { type: 'config'; payload: Partial<ApiGlobalConfig> }

export type PublishPlan = {
  ops: MutationOp[]
  summary: {
    uploads: number
    creates: number
    updates: number
    deletes: number
    sorts: number
    configChanged: boolean
  }
}

const COLLECTION_ENDPOINTS: Record<CollectionKey, string> = {
  artworks: '/artworks',
  commissionTiers: '/commissions',
  faqItems: '/faqs',
  tosSections: '/tos',
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function stripMeta<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const { _id, createdAt, updatedAt, sortOrder, __v, ...rest } = obj as Record<string, unknown>
  void _id
  void createdAt
  void updatedAt
  void sortOrder
  void __v
  return rest
}

function replaceLocalUrlInValue<T>(value: T, localUrl: string, cdnUrl: string): T {
  if (typeof value === 'string') {
    return (value === localUrl ? cdnUrl : value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceLocalUrlInValue(item, localUrl, cdnUrl)) as T
  }

  if (value && typeof value === 'object') {
    const updated: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      updated[key] = replaceLocalUrlInValue(entry, localUrl, cdnUrl)
    }
    return updated as T
  }

  return value
}

function rewriteOperationUrls(op: MutationOp, localUrl: string, cdnUrl: string): MutationOp {
  switch (op.type) {
    case 'create':
      return { ...op, payload: replaceLocalUrlInValue(op.payload, localUrl, cdnUrl) }
    case 'update':
      return { ...op, payload: replaceLocalUrlInValue(op.payload, localUrl, cdnUrl) }
    case 'config':
      return { ...op, payload: replaceLocalUrlInValue(op.payload, localUrl, cdnUrl) }
    default:
      return op
  }
}

function isDraftId(id: string): boolean {
  return id.startsWith('draft_')
}

function diffConfig(
  live: ApiGlobalConfig,
  draft: ApiGlobalConfig
): Partial<ApiGlobalConfig> | null {
  const configKeys: (keyof ApiGlobalConfig)[] = [
    'siteConfig',
    'heroContent',
    'gallerySection',
    'commissions',
    'faqPage',
    'contactContent',
    'footerContent',
    'nav',
    'socials',
  ]

  const patch: Partial<ApiGlobalConfig> = {}
  let hasChanges = false

  for (const key of configKeys) {
    if (!deepEqual(live[key], draft[key])) {
      ; (patch as Record<string, unknown>)[key] = draft[key]
      hasChanges = true
    }
  }

  return hasChanges ? patch : null
}

type CollectionItem = { _id: string; sortOrder: number } & Record<string, unknown>

function diffCollection(
  collection: CollectionKey,
  liveItems: CollectionItem[],
  draftItems: CollectionItem[]
): MutationOp[] {
  const ops: MutationOp[] = []

  const liveById = new Map(liveItems.map((item) => [item._id, item]))
  const draftById = new Map(draftItems.map((item) => [item._id, item]))

  for (const [id] of liveById) {
    if (!draftById.has(id)) {
      ops.push({ type: 'delete', collection, id })
    }
  }

  for (const [id, item] of draftById) {
    if (isDraftId(id)) {
      const { _id, createdAt, updatedAt, __v, ...payload } = item as Record<string, unknown>
      void _id
      void createdAt
      void updatedAt
      void __v
      ops.push({
        type: 'create',
        collection,
        payload: payload as Record<string, unknown>,
      })
    }
  }

  for (const [id, draftItem] of draftById) {
    if (isDraftId(id)) continue
    const liveItem = liveById.get(id)
    if (!liveItem) continue

    const liveStripped = stripMeta(liveItem)
    const draftStripped = stripMeta(draftItem)

    if (!deepEqual(liveStripped, draftStripped)) {
      ops.push({
        type: 'update',
        collection,
        id,
        payload: draftStripped,
      })
    }
  }

  const liveSortMap = new Map(liveItems.map((item) => [item._id, item.sortOrder]))
  const sortItems: SortItem[] = []
  let sortChanged = false

  for (const item of draftItems) {
    if (isDraftId(item._id)) continue
    const liveSortOrder = liveSortMap.get(item._id)
    if (liveSortOrder !== undefined && liveSortOrder !== item.sortOrder) {
      sortChanged = true
    }
    sortItems.push({ id: item._id, sortOrder: item.sortOrder })
  }

  if (sortChanged && sortItems.length > 0) {
    ops.push({ type: 'sort', collection, items: sortItems })
  }

  return ops
}

export function buildPublishPlan(
  live: ApiPortfolioData,
  draft: ApiPortfolioData,
  pendingUploads: Map<string, { localUrl: string; file: File }>
): PublishPlan {
  const ops: MutationOp[] = []

  for (const [localUrl, upload] of pendingUploads) {
    ops.push({ type: 'upload', localUrl, file: upload.file })
  }

  const collections: CollectionKey[] = [
    'artworks',
    'commissionTiers',
    'faqItems',
    'tosSections',
  ]

  for (const key of collections) {
    const liveItems = (live[key] as CollectionItem[]) ?? []
    const draftItems = (draft[key] as CollectionItem[]) ?? []
    ops.push(...diffCollection(key, liveItems, draftItems))
  }

  const liveConfig = extractConfig(live)
  const draftConfig = extractConfig(draft)
  const configPatch = diffConfig(liveConfig, draftConfig)
  if (configPatch) {
    ops.push({ type: 'config', payload: configPatch })
  }

  const ORDER: Record<MutationOp['type'], number> = {
    upload: 0,
    delete: 1,
    create: 2,
    update: 3,
    sort: 4,
    config: 5,
  }
  ops.sort((a, b) => ORDER[a.type] - ORDER[b.type])

  return {
    ops,
    summary: {
      uploads: ops.filter((o) => o.type === 'upload').length,
      creates: ops.filter((o) => o.type === 'create').length,
      updates: ops.filter((o) => o.type === 'update').length,
      deletes: ops.filter((o) => o.type === 'delete').length,
      sorts: ops.filter((o) => o.type === 'sort').length,
      configChanged: configPatch !== null,
    },
  }
}

export async function executePublishPlan(plan: PublishPlan): Promise<void> {
  const store = useDraftStore.getState()
  const { ops } = plan
  const total = ops.length

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]
    store.setPublishing(true, { current: i + 1, total, label: describeOp(op) })

    switch (op.type) {
      case 'upload': {
        const cdnUrl = await apiUpload(op.file)
        store.replacePendingUrl(op.localUrl, cdnUrl)

        for (let j = i + 1; j < ops.length; j++) {
          ops[j] = rewriteOperationUrls(ops[j], op.localUrl, cdnUrl)
        }
        break
      }

      case 'delete': {
        const endpoint = COLLECTION_ENDPOINTS[op.collection]
        await apiFetch(`${endpoint}/${op.id}`, { method: 'DELETE' })
        break
      }

      case 'create': {
        const endpoint = COLLECTION_ENDPOINTS[op.collection]
        await apiFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(op.payload),
        })
        break
      }

      case 'update': {
        const endpoint = COLLECTION_ENDPOINTS[op.collection]
        await apiFetch(`${endpoint}/${op.id}`, {
          method: 'PATCH',
          body: JSON.stringify(op.payload),
        })
        break
      }

      case 'sort': {
        const endpoint = COLLECTION_ENDPOINTS[op.collection]
        await apiFetch(`${endpoint}/sort`, {
          method: 'PUT',
          body: JSON.stringify({ items: op.items }),
        })
        break
      }

      case 'config': {
        await apiFetch('/config', {
          method: 'PATCH',
          body: JSON.stringify(op.payload),
        })
        break
      }
    }
  }

  await store.fetchLiveState()
  store.initDraftFromLive()
  store.setPublishing(false)
  store.refreshPreview()
}

function extractConfig(data: ApiPortfolioData): ApiGlobalConfig {
  const { artworks, commissionTiers, faqItems, tosSections, ...config } = data
  void artworks
  void commissionTiers
  void faqItems
  void tosSections
  return config as ApiGlobalConfig
}

function describeOp(op: MutationOp): string {
  switch (op.type) {
    case 'upload':
      return 'Uploading image…'
    case 'delete':
      return `Deleting ${singularName(op.collection)}…`
    case 'create':
      return `Creating ${singularName(op.collection)}…`
    case 'update':
      return `Updating ${singularName(op.collection)}…`
    case 'sort':
      return `Sorting ${op.collection}…`
    case 'config':
      return 'Saving configuration…'
  }
}

function singularName(collection: CollectionKey): string {
  const map: Record<CollectionKey, string> = {
    artworks: 'artwork',
    commissionTiers: 'commission tier',
    faqItems: 'FAQ',
    tosSections: 'TOS section',
  }
  return map[collection]
}
