import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiFetch, apiUpload, AUTH_TOKEN_KEY } from '../../config/api'

describe('api helpers', () => {
  let originalFetch: typeof globalThis.fetch
  let originalLocation: Location

  beforeEach(() => {
    originalFetch = globalThis.fetch
    originalLocation = window.location
    delete (window as unknown as { location?: Location }).location
    Object.defineProperty(window, 'location', { value: { href: 'http://localhost/admin' }, writable: true, configurable: true })
    window.localStorage.clear()
    window.localStorage.setItem(AUTH_TOKEN_KEY, 'jwt-token')
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true })
    vi.restoreAllMocks()
  })

  function mockUnauthorizedResponse(status: number) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status,
      ok: false,
      json: async () => ({ success: false, error: { message: 'Unauthorized' } }),
    } as Response)
  }

  it.each([401, 403])('TC-014: apiFetch redirects to /login on %s responses', async (status) => {
    mockUnauthorizedResponse(status)

    await expect(apiFetch('/portfolio')).rejects.toThrow('Unauthorized')

    expect(window.location.href).toBe('/login')
    expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
  })

  it.each([401, 403])('TC-014: apiUpload redirects to /login on %s responses', async (status) => {
    mockUnauthorizedResponse(status)

    await expect(apiUpload(new File(['x'], 'image.png', { type: 'image/png' }))).rejects.toThrow('Unauthorized')

    expect(window.location.href).toBe('/login')
    expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
  })
})