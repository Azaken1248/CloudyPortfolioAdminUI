import { useMemo } from 'react'
import { useDraftStore } from '../store/useDraftStore'

type DiffStatus = 'modified' | 'added' | 'removed' | undefined

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

export function useDiff() {
  const liveState = useDraftStore((s) => s.liveState)

  return useMemo(() => {
    
    function field(path: string, currentValue: unknown): DiffStatus {
      if (!liveState) return undefined
      const liveValue = getNestedValue(liveState as unknown as Record<string, unknown>, path)
      if (liveValue === undefined && currentValue !== undefined && currentValue !== '') return 'added'
      if (JSON.stringify(liveValue) !== JSON.stringify(currentValue)) return 'modified'
      return undefined
    }

    function item(collection: string, id: string, currentItem?: Record<string, unknown>): DiffStatus {
      if (id.startsWith('draft_')) return 'added'
      if (!liveState) return undefined
      const liveItems = getNestedValue(liveState as unknown as Record<string, unknown>, collection) as
        | { _id: string }[]
        | undefined
      if (!liveItems) return 'added'
      const liveItem = liveItems.find((i) => i._id === id)
      if (!liveItem) return 'added'
      if (!currentItem) return undefined
      
      const { _id: _a, createdAt: _b, updatedAt: _c, __v: _d, sortOrder: _e, ...liveRest } = liveItem as Record<string, unknown>
      const { _id: _f, createdAt: _g, updatedAt: _h, __v: _i, sortOrder: _j, ...draftRest } = currentItem
      void _a; void _b; void _c; void _d; void _e; void _f; void _g; void _h; void _i; void _j
      if (JSON.stringify(liveRest) !== JSON.stringify(draftRest)) return 'modified'
      return undefined
    }

    function removedItems(collection: string, draftIds: string[]): string[] {
      if (!liveState) return []
      const liveItems = getNestedValue(liveState as unknown as Record<string, unknown>, collection) as
        | { _id: string }[]
        | undefined
      if (!liveItems) return []
      return liveItems.filter((i) => !draftIds.includes(i._id)).map((i) => i._id)
    }

    function sectionDirty(section: string): boolean {
      if (!liveState) return false
      const live = getNestedValue(liveState as unknown as Record<string, unknown>, section)
      const draft = getNestedValue(
        useDraftStore.getState().draftState as unknown as Record<string, unknown>,
        section
      )
      return JSON.stringify(live) !== JSON.stringify(draft)
    }

    return { field, item, removedItems, sectionDirty }
  }, [liveState])
}
