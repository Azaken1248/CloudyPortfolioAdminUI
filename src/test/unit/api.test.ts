import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiFetch, apiUpload } from '../../config/api'

describe('api helpers', () => {
  let originalFetch: typeof globalThis.fetch
  let originalLocation: Location

  beforeEach(() => {
    originalFetch = globalThis.fetch
    originalLocation = window.location
    delete (window as unknown as { location?: Location }).location
    Object.defineProperty(window, 'location', { value: { href: 'http://localhost/admin' }, writable: true, configurable: true })
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
  })

  it.each([401, 403])('TC-014: apiUpload redirects to /login on %s responses', async (status) => {
    mockUnauthorizedResponse(status)

    await expect(apiUpload(new File(['x'], 'image.png', { type: 'image/png' }))).rejects.toThrow('Unauthorized')

    expect(window.location.href).toBe('/login')
  })

  // The session is an httpOnly cookie, so the only thing that carries it is
  // credentials: 'include'. Losing that would silently unauthenticate every call.
  it('TC-015: apiFetch sends credentials so the session cookie is included', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({ success: true, data: { ok: true } }),
    } as Response)

    await apiFetch('/portfolio')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/portfolio',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('TC-016: apiFetch sends no Authorization header', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200, ok: true,
      json: async () => ({ success: true, data: {} }),
    } as Response)

    await apiFetch('/portfolio')

    const init = (globalThis.fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0][1]
    expect(JSON.stringify(init.headers ?? {})).not.toMatch(/authorization/i)
  })
})