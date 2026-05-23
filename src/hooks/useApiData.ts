import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../config/api'

type ApiDataState<T> = {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useApiData<T>(endpoint: string): ApiDataState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [fetchKey, setFetchKey] = useState(0)

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    apiFetch<T>(endpoint)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setError(null)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [endpoint, fetchKey])

  return { data, isLoading, error, refetch }
}
