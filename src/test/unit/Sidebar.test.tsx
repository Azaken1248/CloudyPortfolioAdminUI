import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from '../../components/Sidebar'
import { useDraftStore } from '../../store/useDraftStore'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'

const logoutMock = vi.fn()

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

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
    })
  })

  it('TC-009: falls back to the first username letter when no avatar hash exists', () => {
    render(<Sidebar activeTab="config" onTabChange={() => {}} />)

    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('Astra')).toBeInTheDocument()
  })

  it('TC-041: shows the changes dot when the draft is dirty', () => {
    useDraftStore.getState().updateDraftConfig({
      siteConfig: {
        ...DEFAULT_PORTFOLIO.siteConfig,
        siteName: 'Changed Name',
      },
    })

    const { container } = render(<Sidebar activeTab="config" onTabChange={() => {}} />)

    expect(container.querySelector('.sidebar-changes-dot')).toBeInTheDocument()
  })

  it('TC-008: calls logout when the sidebar logout button is clicked', () => {
    render(<Sidebar activeTab="config" onTabChange={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }))

    expect(logoutMock).toHaveBeenCalledTimes(1)
  })
})