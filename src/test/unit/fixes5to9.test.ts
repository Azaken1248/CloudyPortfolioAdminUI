
import { describe, it, expect } from 'vitest'
import {
  buildPublishPlan,
  validatePublishPlan,
  PUBLISHED_CONFIG_KEYS,
} from '../../lib/publishEngine'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'
import type { ApiPortfolioData } from '../../types/api'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const live = () => clone(DEFAULT_PORTFOLIO) as ApiPortfolioData

describe('#5 destructive ordering', () => {
  it('runs every delete after all creates and updates', () => {
    const draft = live()
    draft.artworks = [
      ...draft.artworks.slice(1),
      { ...draft.artworks[0], _id: 'draft_new_1', title: 'Brand New' },
    ] as typeof draft.artworks

    const plan = buildPublishPlan(live(), draft, new Map())
    const types = plan.ops.map((o) => o.type)
    const lastNonDelete = Math.max(...types.map((t, i) => (t === 'delete' ? -1 : i)))
    const firstDelete = types.indexOf('delete')

    expect(firstDelete).toBeGreaterThan(-1)
    expect(firstDelete).toBeGreaterThan(lastNonDelete)
  })
})

describe('#5 pre-flight validation', () => {
  it('rejects an artwork missing required fields before anything is sent', () => {
    const draft = live()
    draft.artworks = [
      ...draft.artworks,
      { _id: 'draft_bad', title: '', category: '', description: '', imageUrl: '', altText: '',
        sortOrder: 9, createdAt: '', updatedAt: '' },
    ] as typeof draft.artworks

    const problems = validatePublishPlan(buildPublishPlan(live(), draft, new Map()))
    expect(problems.length).toBeGreaterThan(0)
    expect(problems.join(' ')).toContain('missing title')
  })

  it('passes a complete artwork', () => {
    const draft = live()
    draft.artworks = [
      ...draft.artworks,
      { _id: 'draft_ok', title: 'T', category: 'C', description: 'D', imageUrl: 'https://x/y.webp',
        altText: 'A', sortOrder: 9, createdAt: '', updatedAt: '' },
    ] as typeof draft.artworks

    expect(validatePublishPlan(buildPublishPlan(live(), draft, new Map()))).toEqual([])
  })
})

describe('#7 review screen matches the publish engine', () => {
  it('every key the engine publishes is a real field on the data', () => {
    const data = live() as unknown as Record<string, unknown>
    for (const key of PUBLISHED_CONFIG_KEYS) {
      expect(data[key], `${key} missing from portfolio data`).toBeDefined()
    }
  })

  it('covers the sections the old hardcoded list silently dropped', () => {
    // These were published but never shown on the Changes screen.
    const data = live() as unknown as Record<string, Record<string, unknown>>
    expect(PUBLISHED_CONFIG_KEYS).toContain('faqPage')
    expect(PUBLISHED_CONFIG_KEYS).toContain('commissions')
    expect(data.faqPage.faqHeading).toBeDefined()
    expect(data.faqPage.tosHeading).toBeDefined()
    expect(data.faqPage.tosAcceptanceText).toBeDefined()
    expect(data.commissions.section).toBeDefined()
  })

  it('the stale path the old list used does not exist', () => {
    const data = live() as unknown as Record<string, Record<string, unknown>>
    expect(data.commissions.statusOpen).toBeUndefined()
  })
})
