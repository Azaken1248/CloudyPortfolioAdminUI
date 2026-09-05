import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useDraftStore, type CollectionKey } from '../store/useDraftStore'
import {
  buildPublishPlan,
  executePublishPlan,
  validatePublishPlan,
  PartialPublishError,
  type PublishPlan,
} from '../lib/publishEngine'

export type PublishSection =
  | 'config'
  | 'hero'
  | 'contact'
  | 'gallery'
  | 'commissions'
  | 'faq'
  | 'tos'

/**
 * What each section owns.
 *
 * Hero, contact, gallery headings and so on all live inside the single
 * GlobalConfig document, so every "Publish X Only" button previously shipped
 * the entire config — including unrelated edits sitting in other tabs. The
 * config PATCH is keyed, so a section can be narrowed to just its own keys.
 */
const SECTION_SCOPE: Record<PublishSection, {
  configKeys: string[]
  collections: CollectionKey[]
}> = {
  config:      { configKeys: ['siteConfig', 'footerContent', 'nav', 'socials'], collections: [] },
  hero:        { configKeys: ['heroContent'],    collections: [] },
  contact:     { configKeys: ['contactContent'], collections: [] },
  gallery:     { configKeys: ['gallerySection'], collections: ['artworks'] },
  commissions: { configKeys: ['commissions'],    collections: ['commissionTiers'] },
  faq:         { configKeys: ['faqPage'],        collections: ['faqItems'] },
  tos:         { configKeys: [],                 collections: ['tosSections'] },
}

const SECTION_LABELS: Record<PublishSection, string> = {
  config: 'Site configuration',
  hero: 'Hero',
  contact: 'Contact',
  gallery: 'Gallery',
  commissions: 'Commissions',
  faq: 'FAQ',
  tos: 'Terms of Service',
}

type UsePublishReturn = {
  publish: () => Promise<void>
  publishSection: (section: PublishSection) => Promise<void>
  isPublishing: boolean
  publishProgress: { current: number; total: number; label: string } | null
  previewPlan: () => PublishPlan | null
}

/**
 * Refuse to publish unless liveState came from the API. Diffing against the
 * local baseline can emit deletes for records the editor never touched.
 */
function assertPublishable(): boolean {
  const { isLiveAuthoritative, liveError } = useDraftStore.getState()
  if (isLiveAuthoritative) return true

  toast.error(
    liveError
      ? 'Cannot publish: the live site could not be loaded, so there is nothing safe to compare against. Reload once the API is reachable.'
      : 'Cannot publish: live site state has not loaded yet.',
    { duration: 6000 },
  )
  return false
}


/** Block a plan that the API would reject part-way through. */
function planIsValid(plan: PublishPlan): boolean {
  const problems = validatePublishPlan(plan)
  if (problems.length === 0) return true

  toast.error(
    `Cannot publish — ${problems.length} item${problems.length > 1 ? 's need' : ' needs'} attention:\n` +
      problems.slice(0, 4).map((p) => `• ${p}`).join('\n') +
      (problems.length > 4 ? `\n• …and ${problems.length - 4} more` : ''),
    { duration: 8000 },
  )
  return false
}


/**
 * Report a failure in terms of what actually happened to the live site.
 *
 * There is no transaction across these REST calls, so a mid-plan failure leaves
 * earlier operations applied. "Publish failed" would imply nothing changed,
 * which is the one thing that is not true.
 */
function reportPublishFailure(err: unknown): void {
  if (err instanceof PartialPublishError) {
    if (err.completed === 0) {
      toast.error(`Nothing was published. Failed while ${err.failedOp}.`, { duration: 8000 })
      return
    }

    toast.error(
      `Partly published: ${err.completed} of ${err.total} changes are live. ` +
        `Stopped while ${err.failedOp}. Review the Changes tab and publish again.`,
      { duration: 10000 },
    )
    return
  }

  toast.error(err instanceof Error ? err.message : 'Publish failed')
}

export function usePublish(): UsePublishReturn {
  const isPublishing = useDraftStore((s) => s.isPublishing)
  const publishProgress = useDraftStore((s) => s.publishProgress)
  const [, setForce] = useState(0)

  const previewPlan = useCallback((): PublishPlan | null => {
    const { liveState, draftState, pendingUploads } = useDraftStore.getState()
    if (!liveState || !draftState) return null
    return buildPublishPlan(liveState, draftState, pendingUploads)
  }, [])

  const publish = useCallback(async () => {
    if (!assertPublishable()) return

    const { liveState, draftState, pendingUploads } = useDraftStore.getState()

    if (!liveState || !draftState) {
      toast.error('Cannot publish: state not loaded')
      return
    }

    const plan = buildPublishPlan(liveState, draftState, pendingUploads)

    if (plan.ops.length === 0) {
      toast('No changes to publish', { icon: '📋' })
      return
    }

    if (!planIsValid(plan)) return

    const { summary } = plan
    const parts: string[] = []
    if (summary.uploads > 0) parts.push(`${summary.uploads} upload${summary.uploads > 1 ? 's' : ''}`)
    if (summary.creates > 0) parts.push(`${summary.creates} create${summary.creates > 1 ? 's' : ''}`)
    if (summary.updates > 0) parts.push(`${summary.updates} update${summary.updates > 1 ? 's' : ''}`)
    if (summary.deletes > 0) parts.push(`${summary.deletes} delete${summary.deletes > 1 ? 's' : ''}`)
    if (summary.sorts > 0) parts.push(`${summary.sorts} reorder${summary.sorts > 1 ? 's' : ''}`)
    if (summary.configChanged) parts.push('config update')

    try {
      await executePublishPlan(plan)
      toast.success(`Published: ${parts.join(', ')}`)
      setForce((n) => n + 1)
    } catch (err) {
      reportPublishFailure(err)
      useDraftStore.getState().setPublishing(false)
    }
  }, [])

  const publishSection = useCallback(async (section: PublishSection) => {
    if (!assertPublishable()) return

    const { liveState, draftState, pendingUploads } = useDraftStore.getState()

    if (!liveState || !draftState) {
      toast.error('Cannot publish: state not loaded')
      return
    }

    const fullPlan = buildPublishPlan(liveState, draftState, pendingUploads)
    const scope = SECTION_SCOPE[section]

    type Op = PublishPlan['ops'][number]

    let filteredOps: Op[] = fullPlan.ops.flatMap((op): Op[] => {
      if (op.type === 'upload') return [op]

      if (op.type === 'config') {
        // Narrow the config patch to this section's keys, so publishing one
        // section cannot carry another section's pending edits with it.
        const payload = Object.fromEntries(
          Object.entries(op.payload).filter(([key]) => scope.configKeys.includes(key)),
        )
        return Object.keys(payload).length > 0 ? [{ ...op, payload }] : []
      }

      if ('collection' in op) {
        return scope.collections.includes(op.collection) ? [op] : []
      }
      return []
    })

    // Keep only uploads whose image is actually referenced by what we're about
    // to publish; an upload for another section would otherwise ride along.
    const scopedData = JSON.stringify([
      ...scope.configKeys.map((k) => (draftState as unknown as Record<string, unknown>)[k]),
      ...scope.collections.map((c) => draftState[c]),
    ])
    filteredOps = filteredOps.filter((op) =>
      op.type === 'upload' ? scopedData.includes(op.localUrl) : true,
    )

    if (filteredOps.length === 0) {
      toast('No changes in this section', { icon: '📋' })
      return
    }

    const sectionLabel = SECTION_LABELS[section]

    const plan: PublishPlan = {
      ops: filteredOps,
      summary: {
        uploads: filteredOps.filter((o) => o.type === 'upload').length,
        creates: filteredOps.filter((o) => o.type === 'create').length,
        updates: filteredOps.filter((o) => o.type === 'update').length,
        deletes: filteredOps.filter((o) => o.type === 'delete').length,
        sorts: filteredOps.filter((o) => o.type === 'sort').length,
        configChanged: filteredOps.some((o) => o.type === 'config'),
      },
    }

    if (!planIsValid(plan)) return

    try {
      await executePublishPlan(plan)
      toast.success(`Published ${sectionLabel} (${filteredOps.length} operation${filteredOps.length > 1 ? 's' : ''})`)
      setForce((n) => n + 1)
    } catch (err) {
      reportPublishFailure(err)
      useDraftStore.getState().setPublishing(false)
    }
  }, [])

  return { publish, publishSection, isPublishing, publishProgress, previewPlan }
}
