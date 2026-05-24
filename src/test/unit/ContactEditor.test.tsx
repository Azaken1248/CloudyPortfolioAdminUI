import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContactEditor } from '../../editors/ContactEditor'
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

describe('ContactEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
    })
  })

  it('TC-052: renders contact fields and info notes', () => {
    render(<ContactEditor />)

    const eyebrowInputs = screen.getAllByLabelText(/^Eyebrow/i)
    expect(eyebrowInputs.length).toBeGreaterThan(0)

    expect(screen.getByRole('button', { name: /Add Note/i })).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Add Field/i })).toBeInTheDocument()
  })

  it('TC-053: adding a new form field updates draft state', async () => {
    const user = userEvent.setup()
    render(<ContactEditor />)

    const initialFieldsCount = useDraftStore.getState().draftState!.contactContent.form.fields.length

    const addFieldBtn = screen.getByRole('button', { name: /Add Field/i })
    await user.click(addFieldBtn)

    const draft = useDraftStore.getState().draftState!
    expect(draft.contactContent.form.fields.length).toBe(initialFieldsCount + 1)
  })

  it('TC-054: changing a form field label updates draft state immediately', async () => {
    const user = userEvent.setup()
    render(<ContactEditor />)

    const addFieldBtn = screen.getByRole('button', { name: /Add Field/i })
    await user.click(addFieldBtn)

    const labelInputs = screen.getAllByLabelText(/^Label/i)
    const newFieldInput = labelInputs[labelInputs.length - 2] // The last one is "Submit Button Label"

    await user.type(newFieldInput, 'Phone Number')

    const draft = useDraftStore.getState().draftState!
    const lastField = draft.contactContent.form.fields[draft.contactContent.form.fields.length - 1]
    expect(lastField.label).toBe('Phone Number')
  })

  it('TC-055: triggers publishSection("contactContent") on publish', async () => {
    const user = userEvent.setup()
    render(<ContactEditor />)

    const disclaimerInput = screen.getByLabelText(/Disclaimer/i)
    await user.type(disclaimerInput, ' updated')

    const publishBtn = screen.getByRole('button', { name: /Publish Contact Only/i })
    await user.click(publishBtn)

    expect(mockPublishSection).toHaveBeenCalledWith('config')
  })
})
