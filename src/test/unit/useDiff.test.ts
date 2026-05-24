import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDiff } from '../../hooks/useDiff'
import { useDraftStore } from '../../store/useDraftStore'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'

describe('useDiff hook', () => {
  beforeEach(() => {
    useDraftStore.setState({
      liveState: structuredClone(DEFAULT_PORTFOLIO),
      draftState: structuredClone(DEFAULT_PORTFOLIO),
    })
  })

  it('TC-026: field() returns "modified" when a nested config value changes', () => {
    const { result } = renderHook(() => useDiff())
    
    expect(result.current.field('siteConfig.siteName', DEFAULT_PORTFOLIO.siteConfig.siteName)).toBeUndefined()
    
    expect(result.current.field('siteConfig.siteName', 'Changed Name')).toBe('modified')
    expect(result.current.field('heroContent.eyebrow', 'Changed Eyebrow')).toBe('modified')
  })

  it('TC-027: field() returns undefined when value matches live state exactly', () => {
    const { result } = renderHook(() => useDiff())
    expect(result.current.field('siteConfig.siteName', DEFAULT_PORTFOLIO.siteConfig.siteName)).toBeUndefined()
  })

  it('TC-028: item() returns "added" for items with draft_ prefix IDs', () => {
    const { result } = renderHook(() => useDiff())
    expect(result.current.item('artworks', 'draft_123', { title: 'New' })).toBe('added')
  })

  it('TC-029: item() returns "modified" if a pre-existing item differs', () => {
    const { result } = renderHook(() => useDiff())
    const targetId = '6a0edae66f9e29152f5ffab4' // existing artwork
    const originalItem = DEFAULT_PORTFOLIO.artworks.find(a => a._id === targetId)
    
    expect(result.current.item('artworks', targetId, originalItem)).toBeUndefined()
    
    const modifiedItem = { ...originalItem, title: 'Changed Title' }
    expect(result.current.item('artworks', targetId, modifiedItem)).toBe('modified')
  })

  it('TC-030: removedItems() returns IDs missing from draft', () => {
    const { result } = renderHook(() => useDiff())
    const allIds = DEFAULT_PORTFOLIO.artworks.map(a => a._id)
    
    expect(result.current.removedItems('artworks', allIds)).toEqual([])
    
    const missingOne = allIds.slice(1)
    expect(result.current.removedItems('artworks', missingOne)).toEqual([allIds[0]])
  })

  it('TC-031: sectionDirty() accurately flags parent section', () => {
    const { result } = renderHook(() => useDiff())
    expect(result.current.sectionDirty('siteConfig')).toBe(false)
    
    useDraftStore.getState().updateDraftConfig({ siteConfig: { ...DEFAULT_PORTFOLIO.siteConfig, siteName: 'Modified Config' } })
    
    expect(result.current.sectionDirty('siteConfig')).toBe(true)
  })
})
