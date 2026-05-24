import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CommissionEditor } from '../../editors/CommissionEditor'
import { useDraftStore } from '../../store/useDraftStore'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'
import userEvent from '@testing-library/user-event'

const mockPublishSection = vi.fn()
const mockPublish = vi.fn()

vi.mock('../../hooks/usePublish', () => ({
  usePublish: () => ({
    publishSection: mockPublishSection,
    publish: mockPublish,
    isPublishing: false,
  })
}))

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as any,
    DndContext: ({ children }: any) => <div>{children}</div>,
  }
})

describe('CommissionsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
    })
  })

  it('TC-048: renders commission tiers list', () => {
    render(<CommissionEditor />)
    expect(screen.getByText(/Tiers \(\d+\)/i)).toBeInTheDocument()

    const editBtns = screen.getAllByRole('button', { name: /Edit/i })
    expect(editBtns.length).toBeGreaterThan(0)
  })

  it('TC-049: adding a new tier creates a draft tier', async () => {
    const user = userEvent.setup()
    render(<CommissionEditor />)

    const initialCount = useDraftStore.getState().draftState!.commissionTiers.length

    const addBtn = screen.getByRole('button', { name: /Add Tier/i })
    await user.click(addBtn)

    const nameInput = screen.getByLabelText(/^Name/i)
    await user.type(nameInput, 'New Tier')
    const priceInput = screen.getByLabelText(/Price Label/i)
    await user.type(priceInput, '100')

    const saveBtn = screen.getByRole('button', { name: /^Add$/i })
    await user.click(saveBtn)

    const draft = useDraftStore.getState().draftState!
    expect(draft.commissionTiers.length).toBe(initialCount + 1)
  })

  it('TC-050: deleting a tier removes it from draft', async () => {
    const user = userEvent.setup()
    render(<CommissionEditor />)

    const initialCount = useDraftStore.getState().draftState!.commissionTiers.length
    const deleteBtns = document.querySelectorAll('.list-item-btn-danger')

    expect(deleteBtns.length).toBeGreaterThan(0)
    await user.click(deleteBtns[0])

    const confirmBtn = screen.getByRole('button', { name: 'Delete' })
    await user.click(confirmBtn)

    const draft = useDraftStore.getState().draftState!
    expect(draft.commissionTiers.length).toBe(initialCount - 1)
  })

  it('TC-051: triggers publishSection("commissionTiers") on publish', async () => {
    const user = userEvent.setup()
    render(<CommissionEditor />)

    const editBtns = screen.getAllByRole('button', { name: /Edit/i })
    await user.click(editBtns[0])

    const nameInput = screen.getByLabelText(/^Name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Test Change Tier Name')

    const updateBtn = screen.getByRole('button', { name: /Update/i })
    await user.click(updateBtn)

    const publishBtn = screen.getByRole('button', { name: /Publish Commissions Only/i })
    await user.click(publishBtn)

    expect(mockPublishSection).toHaveBeenCalledWith('commissionTiers')
  })
})
