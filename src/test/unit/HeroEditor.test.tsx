import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroEditor } from '../../editors/HeroEditor'
import { useDraftStore } from '../../store/useDraftStore'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'
import userEvent from '@testing-library/user-event'

const mockPublishSection = vi.fn()

vi.mock('../../hooks/usePublish', () => ({
  usePublish: () => ({
    publishSection: mockPublishSection,
    isPublishing: false,
  })
}))

describe('HeroEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
    })
  })

  it('TC-041: renders hero texts and call-to-action buttons', () => {
    render(<HeroEditor />)
    expect(screen.getByLabelText(/Headline/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Body/i)).toBeInTheDocument()
  })

  it('TC-042: adding a call-to-action button updates draftState correctly', async () => {
    const user = userEvent.setup()
    render(<HeroEditor />)

    const initialButtonsCount = useDraftStore.getState().draftState!.heroContent.ctaButtons.length

    const addBtn = screen.getByRole('button', { name: /Add Button/i })
    await user.click(addBtn)

    const draft = useDraftStore.getState().draftState!
    expect(draft.heroContent.ctaButtons.length).toBe(initialButtonsCount + 1)
  })

  it('TC-043: triggers publishSection("heroContent") when published', async () => {
    const user = userEvent.setup()
    render(<HeroEditor />)

    const headlineInput = screen.getByLabelText(/Headline/i)
    await user.clear(headlineInput)
    await user.type(headlineInput, 'Trigger Publish')

    const publishBtn = screen.getByRole('button', { name: /Publish Hero Only/i })
    await user.click(publishBtn)

    expect(mockPublishSection).toHaveBeenCalledWith('config')
  })
})
