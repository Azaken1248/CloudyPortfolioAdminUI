const API_BASE = '/api'
export const AUTH_TOKEN_KEY = 'cloudy_admin_token'

function getAuthHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  }
}

function redirectToLogin() {
  window.localStorage.clear()
  window.location.href = '/login'
}

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
      ...getAuthHeaders(options.headers),
    },
  })

  if (res.status === 401 || res.status === 403) {
    redirectToLogin()
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
    headers: getAuthHeaders(),
    body: formData,
  })

  if (res.status === 401 || res.status === 403) {
    redirectToLogin()
    throw new Error('Unauthorized')
  }

  const json = await res.json()

  if (!json.success) {
    throw new Error(json.error?.message ?? 'Upload failed')
  }

  return json.data.url
}
