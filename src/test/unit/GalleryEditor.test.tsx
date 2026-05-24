import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GalleryEditor } from '../../editors/GalleryEditor'
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

describe('GalleryEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
    })
  })

  it('TC-044: renders a list of artworks', () => {
    render(<GalleryEditor />)
    expect(screen.getByText(/Artworks \(\d+\)/i)).toBeInTheDocument()

    const editBtns = screen.getAllByRole('button', { name: /Edit/i })
    expect(editBtns.length).toBeGreaterThan(0)
  })

  it('TC-045: adding a new item creates a draft artwork', async () => {
    const user = userEvent.setup()
    render(<GalleryEditor />)

    const initialCount = useDraftStore.getState().draftState!.artworks.length

    const addBtn = screen.getByRole('button', { name: /Add Artwork/i })
    await user.click(addBtn)

    const titleInput = screen.getByLabelText(/^Title$/i)
    await user.type(titleInput, 'New Art')
    const categoryInput = screen.getByLabelText(/Category/i)
    await user.type(categoryInput, 'Concept Art')

    const saveBtn = screen.getByRole('button', { name: /^Add$/i })
    await user.click(saveBtn)

    const draft = useDraftStore.getState().draftState!
    expect(draft.artworks.length).toBe(initialCount + 1)
  })

  it('TC-046: deleting an item removes it from draft', async () => {
    const user = userEvent.setup()
    render(<GalleryEditor />)

    const initialCount = useDraftStore.getState().draftState!.artworks.length
    const deleteBtns = document.querySelectorAll('.list-item-btn-danger')

    expect(deleteBtns.length).toBeGreaterThan(0)
    await user.click(deleteBtns[0])

    const confirmBtn = screen.getByRole('button', { name: 'Delete' })
    await user.click(confirmBtn)

    const draft = useDraftStore.getState().draftState!
    expect(draft.artworks.length).toBe(initialCount - 1)
  })

  it('TC-047: triggers publishSection("artworks") on publish', async () => {
    const user = userEvent.setup()
    render(<GalleryEditor />)

    const editBtns = screen.getAllByRole('button', { name: /Edit/i })
    await user.click(editBtns[0])

    const titleInput = screen.getByLabelText(/^Title$/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Test Change Title')

    const updateBtn = screen.getByRole('button', { name: /Update/i })
    await user.click(updateBtn)

    const publishBtn = screen.getByRole('button', { name: /Publish Gallery Only/i })
    await user.click(publishBtn)

    expect(mockPublishSection).toHaveBeenCalledWith('artworks')
  })
})
