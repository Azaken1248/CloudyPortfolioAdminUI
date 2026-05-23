import { useCallback, useRef, useState } from 'react'

export function useDraftState<T extends Record<string, unknown>>(
  initialData: T | null
) {
  const [draft, setDraft] = useState<T | null>(initialData)
  const initialRef = useRef<T | null>(initialData)

  const resetDraft = useCallback((newInitial: T) => {
    initialRef.current = newInitial
    setDraft({ ...newInitial })
  }, [])

  const updateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setDraft((prev) => {
        if (!prev) return prev
        return { ...prev, [field]: value }
      })
    },
    []
  )

  const updateNested = useCallback(
    (path: string, value: unknown) => {
      setDraft((prev) => {
        if (!prev) return prev
        const copy = JSON.parse(JSON.stringify(prev)) as Record<string, unknown>
        const keys = path.split('.')
        let current = copy as Record<string, unknown>
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i]
          if (typeof current[key] !== 'object' || current[key] === null) {
            current[key] = {}
          }
          current = current[key] as Record<string, unknown>
        }
        current[keys[keys.length - 1]] = value
        return copy as unknown as T
      })
    },
    []
  )

  const isDirty =
    draft !== null &&
    initialRef.current !== null &&
    JSON.stringify(draft) !== JSON.stringify(initialRef.current)

  return {
    draft,
    setDraft,
    updateField,
    updateNested,
    resetDraft,
    isDirty,
  }
}
