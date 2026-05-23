import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { FaqEditor } from '../../editors/FaqEditor'
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

describe('FaqEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
    })
  })

  it('TC-056: renders FAQ question list and page config', () => {
    render(<FaqEditor />)
    expect(screen.getByText(/Questions \(\d+\)/i)).toBeInTheDocument()
    
    const editBtns = screen.getAllByRole('button', { name: /Edit/i })
    expect(editBtns.length).toBeGreaterThan(0)
    
    expect(screen.getByLabelText(/FAQ Heading/i)).toBeInTheDocument()
  })

  it('TC-057: adding a new FAQ creates a draft item', async () => {
    const user = userEvent.setup()
    render(<FaqEditor />)
    
    const initialCount = useDraftStore.getState().draftState!.faqItems.length
    
    const addBtn = screen.getByRole('button', { name: /Add FAQ/i })
    await user.click(addBtn)
    
    // Fill the form and save
    const questionInput = screen.getByLabelText(/^Question/i)
    await user.type(questionInput, 'New Question')
    const answerInput = screen.getByLabelText(/^Answer/i)
    await user.type(answerInput, 'New Answer')
    
    const saveBtn = screen.getByRole('button', { name: /^Add$/i })
    await user.click(saveBtn)
    
    const draft = useDraftStore.getState().draftState!
    expect(draft.faqItems.length).toBe(initialCount + 1)
  })

  it('TC-058: deleting an FAQ removes it from draft', async () => {
    const user = userEvent.setup()
    render(<FaqEditor />)
    
    const initialCount = useDraftStore.getState().draftState!.faqItems.length
    const deleteBtns = document.querySelectorAll('.list-item-btn-danger')
    
    expect(deleteBtns.length).toBeGreaterThan(0)
    await user.click(deleteBtns[0])
    
    // Confirm dialog
    const confirmBtn = screen.getByRole('button', { name: 'Delete' })
    await user.click(confirmBtn)
    
    const draft = useDraftStore.getState().draftState!
    expect(draft.faqItems.length).toBe(initialCount - 1)
  })

  it('TC-059: triggers publishSection("faqItems") on publish', async () => {
    const user = userEvent.setup()
    render(<FaqEditor />)
    
    const editBtns = screen.getAllByRole('button', { name: /Edit/i })
    await user.click(editBtns[0])
    
    const questionInput = screen.getByLabelText(/^Question/i)
    await user.clear(questionInput)
    await user.type(questionInput, 'Test Change Question')
    
    const updateBtn = screen.getByRole('button', { name: /Update/i })
    await user.click(updateBtn)
    
    const publishBtn = screen.getByRole('button', { name: /Publish FAQ Only/i })
    await user.click(publishBtn)
    
    expect(mockPublishSection).toHaveBeenCalledWith('faqItems')
  })
})
