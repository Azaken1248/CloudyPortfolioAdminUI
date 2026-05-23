import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DiffViewer } from '../../editors/DiffViewer'
import { useDraftStore } from '../../store/useDraftStore'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
  }
}))

describe('DiffViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
    })
  })

  it('TC-076: displays empty state when no changes exist', () => {
    render(<DiffViewer />)
    expect(screen.getByText(/No pending changes/i)).toBeInTheDocument()
    expect(screen.queryByText('Discard All')).not.toBeInTheDocument()
  })

  it('TC-077: correctly groups changes by section', () => {
    // Make a config change
    useDraftStore.getState().updateDraftConfig({ siteConfig: { ...DEFAULT_PORTFOLIO.siteConfig, siteName: 'New Site Name' } })
    // Make a gallery change
    useDraftStore.getState().updateDraftItem('artworks', DEFAULT_PORTFOLIO.artworks[0]._id, { title: 'New Art Title' } as any)
    
    render(<DiffViewer />)
    
    // Check section headers
    expect(screen.getByText('Branding')).toBeInTheDocument()
    expect(screen.getByText('Gallery Items')).toBeInTheDocument()
  })

  it('TC-078: text diffs accurately show oldValue vs newValue', () => {
    const oldName = DEFAULT_PORTFOLIO.siteConfig.siteName
    useDraftStore.getState().updateDraftConfig({ siteConfig: { ...DEFAULT_PORTFOLIO.siteConfig, siteName: 'New Site Name' } })
    
    render(<DiffViewer />)
    
    const diffCards = document.querySelectorAll('.diff-item')
    expect(diffCards.length).toBeGreaterThan(0)
    expect(diffCards[0].textContent).toContain(oldName)
    expect(diffCards[0].textContent).toContain('New Site Name')
  })

  it('TC-079: rollback icon on a config field reverts it to live state', () => {
    const oldName = DEFAULT_PORTFOLIO.siteConfig.siteName
    useDraftStore.getState().updateDraftConfig({ siteConfig: { ...DEFAULT_PORTFOLIO.siteConfig, siteName: 'New Site Name' } })
    
    render(<DiffViewer />)
    
    // Rollback button
    const rollbackBtn = screen.getByTitle('Rollback this change')
    fireEvent.click(rollbackBtn)
    
    const draft = useDraftStore.getState().draftState!
    expect(draft.siteConfig.siteName).toBe(oldName)
    // Should revert back to empty state since there are no more changes
    expect(screen.getByText(/No pending changes/i)).toBeInTheDocument()
  })

  it('TC-080: rollback on a "deleted" item restores it', () => {
    const id = DEFAULT_PORTFOLIO.artworks[0]._id
    useDraftStore.getState().removeDraftItem('artworks', id)
    
    render(<DiffViewer />)
    
    const rollbackBtn = screen.getByTitle('Rollback this change')
    fireEvent.click(rollbackBtn)
    
    const draft = useDraftStore.getState().draftState!
    expect(draft.artworks.find(a => a._id === id)).toBeDefined()
  })

  it('TC-081: rollback on an "added" item removes it', () => {
    useDraftStore.getState().addDraftItem('artworks', { _id: 'draft_123', title: 'Test Added' } as any)
    
    render(<DiffViewer />)
    
    const rollbackBtn = screen.getByTitle('Rollback this change')
    fireEvent.click(rollbackBtn)
    
    const draft = useDraftStore.getState().draftState!
    expect(draft.artworks.find(a => a._id === 'draft_123')).toBeUndefined()
  })

  it('TC-082: "Discard All" button triggers resetDraft and clears viewer', () => {
    useDraftStore.getState().updateDraftConfig({ siteConfig: { ...DEFAULT_PORTFOLIO.siteConfig, siteName: 'New Site Name' } })
    
    render(<DiffViewer />)
    
    const discardBtn = screen.getByText('Discard All')
    fireEvent.click(discardBtn)
    
    const draft = useDraftStore.getState().draftState!
    expect(draft.siteConfig.siteName).toBe(DEFAULT_PORTFOLIO.siteConfig.siteName)
    expect(screen.getByText(/No pending changes/i)).toBeInTheDocument()
  })
})
