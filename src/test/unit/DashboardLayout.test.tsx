import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { DashboardLayout } from '../../pages/DashboardLayout'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'
import { useDraftStore } from '../../store/useDraftStore'

const { apiFetchMock, logoutMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  logoutMock: vi.fn(),
}))

vi.mock('../../config/api', () => ({
  apiFetch: apiFetchMock,
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      discordId: '1234567890',
      username: 'Astra',
      avatar: null,
      role: 'admin',
    },
    logout: logoutMock,
    isLoading: false,
    isAuthenticated: true,
  }),
}))

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiFetchMock.mockResolvedValue(structuredClone(DEFAULT_PORTFOLIO))
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
      isLiveLoading: false,
      previewKey: 0,
      pendingUploads: new Map(),
    })
  })

  async function waitForLayoutReady() {
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Site Configuration/i })).toBeInTheDocument()
      expect(screen.getByTitle('Portfolio Preview')).toBeInTheDocument()
    })
  }

  it('TC-037: switches the active editor view when a sidebar item is clicked', async () => {
    render(<DashboardLayout />)

    await waitForLayoutReady()

    fireEvent.click(screen.getByRole('button', { name: /Hero Section/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hero Section/i })).toBeInTheDocument()
    })
  })

  it('TC-038: opens the sidebar overlay from the mobile hamburger button', async () => {
    const { container } = render(<DashboardLayout />)

    await waitForLayoutReady()

    fireEvent.click(screen.getByLabelText(/Open menu/i))

    await waitFor(() => {
      expect(container.querySelector('.sidebar-overlay')).toBeInTheDocument()
      expect(container.querySelector('.sidebar-wrapper')).toHaveClass('open')
    })
  })

  it('TC-039: closes the mobile sidebar when the overlay is clicked', async () => {
    const { container } = render(<DashboardLayout />)

    await waitForLayoutReady()

    fireEvent.click(screen.getByLabelText(/Open menu/i))

    const overlay = container.querySelector('.sidebar-overlay') as HTMLElement
    expect(overlay).toBeInTheDocument()

    fireEvent.click(overlay)

    await waitFor(() => {
      expect(container.querySelector('.sidebar-overlay')).not.toBeInTheDocument()
      expect(container.querySelector('.sidebar-wrapper')).not.toHaveClass('open')
    })
  })

  it('TC-040: toggles the preview pane visibility on mobile', async () => {
    const { container } = render(<DashboardLayout />)

    await waitForLayoutReady()

    fireEvent.click(screen.getByLabelText(/Toggle preview/i))

    expect(container.querySelector('.editor-pane')).toHaveClass('hidden-mobile')
    expect(container.querySelector('.preview-wrapper')).toHaveClass('visible-mobile')

    fireEvent.click(screen.getByLabelText(/Toggle preview/i))

    expect(container.querySelector('.editor-pane')).not.toHaveClass('hidden-mobile')
    expect(container.querySelector('.preview-wrapper')).not.toHaveClass('visible-mobile')
  })

  it('TC-041: shows the Changes indicator when the draft is dirty', async () => {
    useDraftStore.getState().updateDraftConfig({
      siteConfig: {
        ...DEFAULT_PORTFOLIO.siteConfig,
        siteName: 'Dirty Dashboard',
      },
    })

    const { container } = render(<DashboardLayout />)

    await waitForLayoutReady()

    expect(container.querySelector('.sidebar-changes-dot')).toBeInTheDocument()
  })

  it('TC-042: removes the Changes indicator once the draft is synced back to live', async () => {
    useDraftStore.getState().updateDraftConfig({
      siteConfig: {
        ...DEFAULT_PORTFOLIO.siteConfig,
        siteName: 'Dirty Dashboard',
      },
    })

    const { container } = render(<DashboardLayout />)

    await waitForLayoutReady()

    expect(container.querySelector('.sidebar-changes-dot')).toBeInTheDocument()

    await act(async () => {
      useDraftStore.getState().resetDraft()
    })

    await waitFor(() => {
      expect(container.querySelector('.sidebar-changes-dot')).not.toBeInTheDocument()
    })
  })
})