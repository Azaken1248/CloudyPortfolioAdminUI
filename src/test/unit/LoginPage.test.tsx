import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../../pages/LoginPage'
import { AUTH_TOKEN_KEY } from '../../config/api'

const { useAuthMock, toastErrorMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  toastErrorMock: vi.fn(),
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    error: toastErrorMock,
  },
}))

describe('LoginPage', () => {
  let originalLocation: Location
  let originalInnerWidth: number
  let originalInnerHeight: number

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    })

    originalLocation = window.location
    delete (window as unknown as { location?: Location }).location
    Object.defineProperty(window, 'location', { value: { href: 'http://localhost/login' }, writable: true, configurable: true })

    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerWidth', { value: 320, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 568, writable: true })
    window.localStorage.clear()
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true })
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true })
  })

  function renderLogin(initialEntry = '/login') {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<div>Admin page</div>} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('TC-001: renders the StarField and CloudLayer login backdrop', () => {
    const { container } = renderLogin()

    expect(container.querySelector('.star-canvas')).toBeInTheDocument()
    expect(container.querySelector('.cloud-layer')).toBeInTheDocument()
    expect(container.querySelectorAll('.floating-cloud')).toHaveLength(5)
  })

  it('TC-002: redirects to the Discord OAuth URL when the login button is clicked', () => {
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: /Continue with Discord/i }))

    expect(window.location.href).toBe('/api/auth/discord')
  })

  it('TC-003: shows an authentication failed toast for an invalid OAuth code', async () => {
    renderLogin('/login?code=bad-code')

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Authentication failed', { duration: 4000 })
    })
  })

  it('TC-004: stores the JWT token from the callback URL and routes to the admin area', async () => {
    renderLogin('/login?token=test-jwt-token')

    await waitFor(() => {
      expect(screen.getByText('Admin page')).toBeInTheDocument()
    })

    expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBe('test-jwt-token')
  })

  it('TC-010: keeps the login layout intact on a narrow mobile viewport', () => {
    const { container } = renderLogin()

    expect(container.querySelector('.login-card')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue with Discord/i })).toBeInTheDocument()
  })
})