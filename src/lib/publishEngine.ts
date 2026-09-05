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

/**
 * Every config key the publish pipeline sends. The Changes screen derives its
 * review list from this so the two can never disagree about what will ship.
 */
export const PUBLISHED_CONFIG_KEYS: (keyof ApiGlobalConfig)[] = [
  'siteConfig',
  'heroContent',
  'gallerySection',
  'commissions',
  'faqPage',
  'contactContent',
  'footerContent',
  'nav',
  'socials',
  'navLinks',
]

function diffConfig(
  live: ApiGlobalConfig,
  draft: ApiGlobalConfig
): Partial<ApiGlobalConfig> | null {
  const configKeys = PUBLISHED_CONFIG_KEYS

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

/**
 * Fields the API's schemas mark required. Checking them here turns a mid-plan
 * 400 — which leaves earlier operations committed — into a plan that never
 * starts.
 */
const REQUIRED_FIELDS: Record<CollectionKey, string[]> = {
  artworks: ['title', 'category', 'description', 'imageUrl', 'altText'],
  commissionTiers: ['name', 'priceLabel', 'detailTag', 'description'],
  faqItems: ['question', 'answer'],
  tosSections: ['heading'],
}

const SINGULAR: Record<CollectionKey, string> = {
  artworks: 'artwork',
  commissionTiers: 'commission tier',
  faqItems: 'FAQ',
  tosSections: 'TOS section',
}

/** Human-readable problems that would make this plan fail against the API. */
export function validatePublishPlan(plan: PublishPlan): string[] {
  const problems: string[] = []

  for (const op of plan.ops) {
    if (op.type !== 'create' && op.type !== 'update') continue

    const label = SINGULAR[op.collection]
    const name =
      (op.payload.title as string) ??
      (op.payload.name as string) ??
      (op.payload.question as string) ??
      (op.payload.heading as string) ??
      'untitled'

    for (const field of REQUIRED_FIELDS[op.collection]) {
      const value = op.payload[field]
      if (op.type === 'update' && !(field in op.payload)) continue
      if (typeof value !== 'string' || !value.trim()) {
        problems.push(`${label} "${name}" is missing ${field}`)
      }
    }

    if (op.collection === 'tosSections') {
      const points = op.payload.points
      if (!Array.isArray(points) || points.filter((p) => String(p).trim()).length === 0) {
        problems.push(`TOS section "${name}" needs at least one point`)
      }
    }
  }

  return problems
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

  /**
   * Deletes run LAST, deliberately.
   *
   * There is no transaction across these REST calls, so a failure part-way
   * leaves the earlier operations applied. Ordering the non-destructive work
   * first means an interruption leaves content duplicated or stale — annoying,
   * and fixable by publishing again. With deletes first, the same interruption
   * destroys records whose replacements were never created.
   */
  const ORDER: Record<MutationOp['type'], number> = {
    upload: 0,
    create: 1,
    update: 2,
    sort: 3,
    config: 4,
    delete: 5,
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

/**
 * Raised when a plan fails part-way. Carries what already committed so the UI
 * can tell the user precisely how far it got rather than implying nothing ran.
 */
export class PartialPublishError extends Error {
  readonly completed: number
  readonly total: number
  readonly failedOp: string
  readonly cause: unknown

  constructor(completed: number, total: number, failedOp: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause)
    super(
      `Publish stopped after ${completed} of ${total} operations. Failed while ${failedOp} — ${detail}`,
    )
    this.name = 'PartialPublishError'
    this.completed = completed
    this.total = total
    this.failedOp = failedOp
    this.cause = cause
  }
}

export async function executePublishPlan(plan: PublishPlan): Promise<void> {
  const store = useDraftStore.getState()
  const { ops } = plan
  const total = ops.length
  let completed = 0

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]
    store.setPublishing(true, { current: i + 1, total, label: describeOp(op) })

    try {
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
          method: 'PUT',
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
          method: 'PUT',
          body: JSON.stringify(op.payload),
        })
        break
      }
    }
    completed += 1
    } catch (err) {
      // Re-sync only when something committed, so the editor reflects what
      // actually landed. If the very first operation failed there is nothing
      // new to read back.
      if (completed > 0) {
        await store.fetchLiveState().catch(() => {})
      }
      store.setPublishing(false)
      throw new PartialPublishError(completed, total, describeOp(op).replace(/…$/, ''), err)
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
