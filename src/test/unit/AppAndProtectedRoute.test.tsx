import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App'
import { ProtectedRoute } from '../../components/ProtectedRoute'

const useAuthMock = vi.fn()

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}))

describe('App routing and protected routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('TC-007: redirects unauthenticated users from / to /login', () => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /Continue with Discord/i })).toBeInTheDocument()
  })

  it('shows the protected-route loading screen while auth is resolving', () => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <ProtectedRoute>
          <div>Secret</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText(/Authenticating/i)).toBeInTheDocument()
  })
})