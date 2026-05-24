import { describe, it, expect } from 'vitest'
import { buildPublishPlan } from '../../lib/publishEngine'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'
import type { PendingUpload } from '../../store/useDraftStore'

describe('publishEngine', () => {
  it('TC-083: sequences uploads first', () => {
    const live = structuredClone(DEFAULT_PORTFOLIO)
    const draft = structuredClone(DEFAULT_PORTFOLIO)
    draft.siteConfig.siteName = 'Changed Name'
    
    const pending = new Map<string, PendingUpload>()
    pending.set('blob:test', { localUrl: 'blob:test', file: new File([], 'test.png') })
    
    const plan = buildPublishPlan(live, draft, pending)
    
    expect(plan.ops.length).toBeGreaterThan(0)
    expect(plan.ops[0].type).toBe('upload')
  })

  it('TC-084: sequences deletes before creates', () => {
    const live = structuredClone(DEFAULT_PORTFOLIO)
    const draft = structuredClone(DEFAULT_PORTFOLIO)
    
    draft.artworks.shift()
    draft.artworks.push({
      _id: 'draft_123',
      title: 'New',
      description: 'Desc',
      image: 'test.webp',
      sortOrder: draft.artworks.length
    } as any)
    
    const plan = buildPublishPlan(live, draft, new Map())
    
    const deleteIdx = plan.ops.findIndex(op => op.type === 'delete')
    const createIdx = plan.ops.findIndex(op => op.type === 'create')
    
    expect(deleteIdx).not.toBe(-1)
    expect(createIdx).not.toBe(-1)
    expect(deleteIdx).toBeLessThan(createIdx)
  })

  it('TC-085: correctly builds nested patch for config', () => {
    const live = structuredClone(DEFAULT_PORTFOLIO)
    const draft = structuredClone(DEFAULT_PORTFOLIO)
    
    draft.siteConfig.siteName = 'New Name'
    draft.heroContent.headline = 'New Headline'
    
    const plan = buildPublishPlan(live, draft, new Map())
    const configOp = plan.ops.find(op => op.type === 'config') as any
    
    expect(configOp).toBeDefined()
    expect(configOp.payload.siteConfig.siteName).toBe('New Name')
    expect(configOp.payload.heroContent.headline).toBe('New Headline')
    expect(configOp.payload.footerContent).toBeUndefined()
  })

  it('TC-086: outputs sort operation if only sortOrder changes', () => {
    const live = structuredClone(DEFAULT_PORTFOLIO)
    const draft = structuredClone(DEFAULT_PORTFOLIO)
    
    draft.artworks[0].sortOrder = 1
    draft.artworks[1].sortOrder = 0
    
    const plan = buildPublishPlan(live, draft, new Map())
    
    const sortOp = plan.ops.find(op => op.type === 'sort') as any
    expect(sortOp).toBeDefined()
    expect(sortOp.items.length).toBeGreaterThan(0)
    expect(plan.ops.find(op => op.type === 'update')).toBeUndefined()
  })

  it('TC-089: ignores fields that have not meaningfully changed', () => {
    const live = structuredClone(DEFAULT_PORTFOLIO)
    const draft = structuredClone(DEFAULT_PORTFOLIO)
    
    const plan = buildPublishPlan(live, draft, new Map())
    expect(plan.ops).toHaveLength(0)
  })
})
