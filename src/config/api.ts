const API_BASE = '/api'

export const PORTFOLIO_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_PORTFOLIO_URL ??
  'https://cloudy.azaken.com'

type ApiEnvelope<T> = {
  success: boolean
  data: T
  error?: { code: string; message: string }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const json: ApiEnvelope<T> = await res.json()

  if (!json.success) {
    throw new Error(json.error?.message ?? `API error: ${res.status}`)
  }

  return json.data
}

export async function apiUpload(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const json = await res.json()

  if (!json.success) {
    throw new Error(json.error?.message ?? 'Upload failed')
  }

  return json.data.url
}
