import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ConfigEditor } from '../../editors/ConfigEditor'
import { useDraftStore } from '../../store/useDraftStore'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'
import userEvent from '@testing-library/user-event'

const mockPublishSection = vi.fn()

// Mock usePublish hook
vi.mock('../../hooks/usePublish', () => ({
  usePublish: () => ({
    publishSection: mockPublishSection,
    isPublishing: false,
  })
}))

describe('ConfigEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
    })
  })

  it('TC-037: renders branding configuration inputs', () => {
    render(<ConfigEditor />)
    expect(screen.getByLabelText(/Site Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Subtitle/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Page Title/i)).toBeInTheDocument()
  })

  it('TC-038: updates draftState immediately on input change', async () => {
    const user = userEvent.setup()
    render(<ConfigEditor />)

    const siteNameInput = screen.getByLabelText(/Site Name/i)
    await user.clear(siteNameInput)
    await user.type(siteNameInput, 'New Site Branding')

    // Check Zustand store
    const draft = useDraftStore.getState().draftState!
    expect(draft.siteConfig.siteName).toBe('New Site Branding')
  })

  it('TC-039: shows diff indicators on modified fields', async () => {
    const user = userEvent.setup()
    render(<ConfigEditor />)

    // Initial state: no modified badges
    expect(screen.queryByText('modified')).not.toBeInTheDocument()

    const siteNameInput = screen.getByLabelText(/Site Name/i)
    await user.clear(siteNameInput)
    await user.type(siteNameInput, 'Different Name')

    // Wait for the badge to appear
    await waitFor(() => {
      // The badge might say "modified"
      const badges = screen.queryAllByText('modified')
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  it('TC-040: triggers section publish when Publish Config Only is clicked', async () => {
    const user = userEvent.setup()

    render(<ConfigEditor />)

    // Make a change
    const siteNameInput = screen.getByLabelText(/Site Name/i)
    await user.clear(siteNameInput)
    await user.type(siteNameInput, 'Trigger Publish')

    // Click publish
    const publishBtn = screen.getByRole('button', { name: /Publish Config Only/i })
    await user.click(publishBtn)

    expect(mockPublishSection).toHaveBeenCalledWith('config')
  })
})
