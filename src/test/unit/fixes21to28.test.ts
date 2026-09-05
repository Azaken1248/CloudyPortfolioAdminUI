
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { apiFetchMock } = vi.hoisted(() => ({ apiFetchMock: vi.fn() }))
vi.mock('../../config/api', () => ({ apiFetch: apiFetchMock, apiUpload: vi.fn() }))

import { useDraftStore } from '../../store/useDraftStore'
import { DEFAULT_PORTFOLIO } from '../../data/defaultPortfolio'
import { withKeys, stripKeys, nextRowKey } from '../../lib/rowKeys'
import type { ApiPortfolioData } from '../../types/api'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

describe('#24 stable row keys', () => {
  it('gives every row a distinct key that survives removal from the middle', () => {
    const rows = withKeys([{ label: 'a' }, { label: 'b' }, { label: 'c' }])
    const keys = rows.map((r) => r._key)
    expect(new Set(keys).size).toBe(3)

    const afterRemoval = rows.filter((_, i) => i !== 1)
    // 'c' keeps the key it had, so React cannot rebind its element to 'a'.
    expect(afterRemoval[1]._key).toBe(keys[2])
  })

  it('strips the client-only key before anything reaches the API', () => {
    const rows = withKeys([{ id: 'home', label: 'Home', icon: 'House' }])
    const out = stripKeys(rows)
    expect(out[0]).not.toHaveProperty('_key')
    expect(out[0]).toEqual({ id: 'home', label: 'Home', icon: 'House' })
  })

  it('never repeats a key', () => {
    const keys = Array.from({ length: 500 }, () => nextRowKey())
    expect(new Set(keys).size).toBe(500)
  })
})

describe('#28 isDirty is memoised on object identity', () => {
  beforeEach(() => {
    const base = clone(DEFAULT_PORTFOLIO) as ApiPortfolioData
    useDraftStore.setState({
      liveState: base,
      draftState: clone(base) as ApiPortfolioData,
      draftRevision: 0,
      isLiveAuthoritative: true,
    })
  })

  it('returns the same answer without re-serialising when nothing changed', () => {
    const stringify = vi.spyOn(JSON, 'stringify')
    const s = useDraftStore.getState()

    const first = s.isDirty()
    const callsAfterFirst = stringify.mock.calls.length
    const second = s.isDirty()
    const third = s.isDirty()

    expect(second).toBe(first)
    expect(third).toBe(first)
    // Repeat calls hit the cache instead of stringifying the portfolio again.
    expect(stringify.mock.calls.length).toBe(callsAfterFirst)
    stringify.mockRestore()
  })

  it('still detects a real edit', () => {
    expect(useDraftStore.getState().isDirty()).toBe(false)

    useDraftStore.getState().updateDraftConfig({
      siteConfig: { ...useDraftStore.getState().draftState!.siteConfig, siteName: 'Changed' },
    })

    expect(useDraftStore.getState().isDirty()).toBe(true)
  })

  it('reports clean again once the draft matches live', () => {
    useDraftStore.getState().updateDraftConfig({
      siteConfig: { ...useDraftStore.getState().draftState!.siteConfig, siteName: 'Changed' },
    })
    expect(useDraftStore.getState().isDirty()).toBe(true)

    useDraftStore.getState().initDraftFromLive()
    expect(useDraftStore.getState().isDirty()).toBe(false)
  })
})
