import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider } from '../../context/AuthContext'
import { useAuth } from '../../context/authContext'

const TestComponent = () => {
  const { user, logout, isLoading, isAuthenticated } = useAuth()
  if (isLoading) return <div data-testid="loading">Loading...</div>
  return (
    <div>
      <span data-testid="user">{user ? user.username : 'No User'}</span>
      <span data-testid="auth">{isAuthenticated ? 'Yes' : 'No'}</span>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  let originalFetch: typeof globalThis.fetch
  let originalLocation: typeof window.location

  beforeEach(() => {
    vi.clearAllMocks()
    originalFetch = globalThis.fetch
    
    originalLocation = window.location
    delete (window as any).location;
    (window as any).location = { ...originalLocation, href: '' } as any
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    window.location = originalLocation as any
  })

  it('TC-005: initializes with user session if valid token is found via /api/auth/me', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { username: 'TestUser', discordId: '123' } }),
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(screen.getByTestId('loading')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })
    
    expect(screen.getByTestId('user').textContent).toBe('TestUser')
    expect(screen.getByTestId('auth').textContent).toBe('Yes')
  })

  it('TC-004: checks the session with credentials and no Authorization header', async () => {

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { username: 'TokenUser', discordId: '456', avatar: null, role: 'admin' } }),
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })

    // Auth rides on the httpOnly cookie; there is no client-held token.
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({ credentials: 'include' })
    )
    const init = (globalThis.fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0][1]
    expect(JSON.stringify(init.headers ?? {})).not.toMatch(/authorization/i)
  })

  it('TC-006: automatically sets unauthenticated if /api/auth/me fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })
    
    expect(screen.getByTestId('user').textContent).toBe('No User')
    expect(screen.getByTestId('auth').textContent).toBe('No')
  })

  it('TC-008: logout hits /api/auth/logout and redirects to /login', async () => {

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('TestUser')
    })
    
    act(() => {
      screen.getByText('Logout').click()
    })
    
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.any(Object))
      expect(window.location.href).toBe('/login')
    })
  })
})
