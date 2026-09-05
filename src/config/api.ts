const API_BASE = '/api'

/**
 * Authentication is entirely cookie-based: the API sets an httpOnly `token`
 * cookie and `requireAuth` reads only that. `credentials: 'include'` plus the
 * same-origin rewrite is what carries the session.
 *
 * A parallel localStorage/Bearer path used to live here — it never fired,
 * because the OAuth callback never returns a token in the URL and the API never
 * inspects the Authorization header. It was removed rather than left in place:
 * as written it was a ready-made route to putting a JWT in a URL (leaking via
 * history, Referer and logs) and into XSS-readable storage.
 */
function redirectToLogin() {
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
  options: RequestInit & { skipRedirectOn401?: boolean } = {}
): Promise<T> {
  const { skipRedirectOn401 = false, ...fetchOptions } = options
  const url = `${API_BASE}${endpoint}`

  const res = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    // This is an editing tool: it must read what is actually stored, never a
    // cached copy. Reading live state through a cache made a publish look like
    // it had done nothing.
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  })

  if (res.status === 401 || res.status === 403) {
    if (!skipRedirectOn401) {
      redirectToLogin()
    }
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
