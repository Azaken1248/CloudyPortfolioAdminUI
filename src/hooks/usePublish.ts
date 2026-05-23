import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useDraftStore, type CollectionKey } from '../store/useDraftStore'
import {
  buildPublishPlan,
  executePublishPlan,
  type PublishPlan,
} from '../lib/publishEngine'

export type PublishSection =
  | 'config'     
  | 'artworks'
  | 'commissionTiers'
  | 'faqItems'
  | 'tosSections'

type UsePublishReturn = {
  publish: () => Promise<void>
  publishSection: (section: PublishSection) => Promise<void>
  isPublishing: boolean
  publishProgress: { current: number; total: number; label: string } | null
  previewPlan: () => PublishPlan | null
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
      const msg = err instanceof Error ? err.message : 'Publish failed'
      toast.error(msg)
      useDraftStore.getState().setPublishing(false)
    }
  }, [])

  const publishSection = useCallback(async (section: PublishSection) => {
    const { liveState, draftState, pendingUploads } = useDraftStore.getState()

    if (!liveState || !draftState) {
      toast.error('Cannot publish: state not loaded')
      return
    }

    const fullPlan = buildPublishPlan(liveState, draftState, pendingUploads)

    let filteredOps = fullPlan.ops.filter((op) => {
      if (section === 'config') {
        return op.type === 'config' || op.type === 'upload'
      }
      
      if (op.type === 'upload') return true 
      if ('collection' in op) return op.collection === (section as CollectionKey)
      return false
    })

    if (section !== 'config') {
      const collectionData = JSON.stringify(draftState[section as CollectionKey] ?? [])
      filteredOps = filteredOps.filter((op) => {
        if (op.type === 'upload') {
          return collectionData.includes(op.localUrl)
        }
        return true
      })
    }

    if (filteredOps.length === 0) {
      toast('No changes in this section', { icon: '📋' })
      return
    }

    const sectionLabel =
      section === 'config'
        ? 'Configuration'
        : section === 'artworks'
          ? 'Gallery'
          : section === 'commissionTiers'
            ? 'Commissions'
            : section === 'faqItems'
              ? 'FAQ'
              : 'TOS'

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

    try {
      await executePublishPlan(plan)
      toast.success(`Published ${sectionLabel} (${filteredOps.length} operation${filteredOps.length > 1 ? 's' : ''})`)
      setForce((n) => n + 1)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Publish failed'
      toast.error(msg)
      useDraftStore.getState().setPublishing(false)
    }
  }, [])

  return { publish, publishSection, isPublishing, publishProgress, previewPlan }
}
