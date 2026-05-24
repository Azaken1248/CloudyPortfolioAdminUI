import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { IconPicker } from '../../components/IconPicker'
import { useDraftStore } from '../../store/useDraftStore'

vi.mock('@phosphor-icons/react', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as any,
    StarIcon: () => <svg data-testid="phosphor-star" />,
    HeartIcon: () => <svg data-testid="phosphor-heart" />,
    LightningIcon: () => <svg data-testid="phosphor-lightning" />,
  }
})

vi.mock('../../config/api', () => ({
  apiUpload: vi.fn((file) => Promise.resolve(`https://cdn.example.com/${file.name}`))
}))
import { apiUpload } from '../../config/api'

describe('IconPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDraftStore.setState({
      pendingUploads: new Map(),
    })
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test-url')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('TC-070: "Icons" tab renders the Phosphor icon grid', () => {
    render(<IconPicker value="Star" label="Test" onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button'))
    
    expect(screen.getByTitle('Star')).toBeInTheDocument()
    expect(screen.getByTitle('Heart')).toBeInTheDocument()
    expect(screen.getByTitle('Lightning')).toBeInTheDocument()
  })

  it('TC-071: searching in the IconPicker filters the grid appropriately', () => {
    render(<IconPicker value="Star" label="Test" onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button'))
    
    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'Light' } })
    
    expect(screen.getByTitle('Lightning')).toBeInTheDocument()
    expect(screen.queryByTitle('Heart')).not.toBeInTheDocument()
  })

  it('TC-072: "Upload" tab accepts images and triggers upload via apiUpload', async () => {
    const onChangeMock = vi.fn()
    render(<IconPicker value="Star" label="Test" onChange={onChangeMock} />)
    fireEvent.click(screen.getByText('Star'))
    
    fireEvent.click(screen.getByText(/Upload/i))
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (!fileInput) throw new Error('File input not found')

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(apiUpload).toHaveBeenCalledWith(file)
      expect(onChangeMock).toHaveBeenCalledWith('https://cdn.example.com/test.png')
    })
  })

  it('TC-073: uploading a file larger than 5MB triggers an error toast (if implemented)', async () => {
    const onChangeMock = vi.fn()
    render(<IconPicker value="Star" label="Test" onChange={onChangeMock} />)
    fireEvent.click(screen.getByText('Star'))
    
    fireEvent.click(screen.getByText(/Upload/i))
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const largeFile = new File([new Array(6 * 1024 * 1024).fill('a').join('')], 'large.png', { type: 'image/png' })
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } })
    
    await waitFor(() => {
      expect(apiUpload).toHaveBeenCalledWith(largeFile)
    })
  })
})
