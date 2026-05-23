import { useMemo } from 'react'
import {
  ArrowCounterClockwise,
  FloppyDisk,
  CloudArrowUp,
  ArrowsClockwise,
  Trash,
  Plus,
  PencilSimple,
  CheckCircle,
} from '@phosphor-icons/react'
import { ActionButton } from '../components/ActionButton'
import { useDraftStore } from '../store/useDraftStore'
import { usePublish } from '../hooks/usePublish'
import type { CollectionKey } from '../store/useDraftStore'
import './DiffViewer.css'

type ConfigChange = {
  type: 'config'
  section: string
  label: string
  path: string
  liveValue: unknown
  draftValue: unknown
}

type CollectionChange = {
  type: 'collection'
  collection: CollectionKey
  action: 'added' | 'modified' | 'removed'
  id: string
  label: string
  liveItem?: Record<string, unknown>
  draftItem?: Record<string, unknown>
}

type Change = ConfigChange | CollectionChange

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function friendlyLabel(path: string): string {
  const map: Record<string, string> = {
    'siteConfig.siteName': 'Site Name',
    'siteConfig.siteSubtitle': 'Subtitle',
    'siteConfig.pageTitle': 'Page Title',
    'siteConfig.metaDescription': 'Meta Description',
    'siteConfig.logoIcon': 'Logo Icon',
    'heroContent.eyebrow': 'Hero Eyebrow',
    'heroContent.headline': 'Hero Headline',
    'heroContent.body': 'Hero Body',
    'heroContent.accent': 'Hero Accent',
    'heroContent.pillIcon': 'Pill Icon',
    'heroContent.pillLabel': 'Pill Label',
    'heroContent.image': 'Hero Image',
    'heroContent.imageAlt': 'Hero Alt Text',
    'heroContent.statusPillLabel': 'Status Pill',
    'heroContent.ctaButtons': 'CTA Buttons',
    'gallerySection.eyebrow': 'Gallery Eyebrow',
    'gallerySection.title': 'Gallery Title',
    'gallerySection.description': 'Gallery Description',
    'commissions.eyebrow': 'Commissions Eyebrow',
    'commissions.title': 'Commissions Title',
    'commissions.description': 'Commissions Description',
    'commissions.statusOpen': 'Commissions Open',
    'faqPage.eyebrow': 'FAQ Eyebrow',
    'faqPage.title': 'FAQ Title',
    'faqPage.description': 'FAQ Description',
    'contactContent.section.eyebrow': 'Contact Eyebrow',
    'contactContent.section.title': 'Contact Title',
    'contactContent.section.description': 'Contact Description',
    'contactContent.infoCard': 'Contact Info Card',
    'contactContent.form': 'Contact Form',
    'footerContent.copyright': 'Footer Copyright',
    'footerContent.tagline': 'Footer Tagline',
    nav: 'Navigation Items',
    socials: 'Social Links',
  }
  return map[path] ?? path.split('.').pop() ?? path
}

function sectionLabel(section: string): string {
  const map: Record<string, string> = {
    siteConfig: 'Branding',
    heroContent: 'Hero',
    gallerySection: 'Gallery',
    commissions: 'Commissions',
    faqPage: 'FAQ',
    contactContent: 'Contact',
    footerContent: 'Footer',
    nav: 'Navigation',
    socials: 'Socials',
    artworks: 'Gallery Items',
    commissionTiers: 'Commission Tiers',
    faqItems: 'FAQ Items',
    tosSections: 'TOS Sections',
  }
  return map[section] ?? section
}

function collectionLabel(key: CollectionKey): string {
  const map: Record<CollectionKey, string> = {
    artworks: 'Gallery',
    commissionTiers: 'Commissions',
    faqItems: 'FAQ',
    tosSections: 'Terms of Service',
  }
  return map[key]
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(obj))
  const keys = path.split('.')
  let current = clone
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) current[keys[i]] = {}
    current = current[keys[i]] as Record<string, unknown>
  }
  current[keys[keys.length - 1]] = value
  return clone
}

function truncateValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'string') {
    if (val.length > 60) return `"${val.slice(0, 57)}…"`
    return `"${val}"`
  }
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'number') return String(val)
  if (Array.isArray(val)) return `[${val.length} item${val.length !== 1 ? 's' : ''}]`
  if (typeof val === 'object') return '{…}'
  return String(val)
}

function getItemName(item: Record<string, unknown>): string {
  return (
    (item.title as string) ??
    (item.heading as string) ??
    (item.label as string) ??
    (item.question as string) ??
    (item.name as string) ??
    (item._id as string) ??
    'Untitled'
  )
}

function calculateChanges(
  live: Record<string, unknown>,
  draft: Record<string, unknown>
): Change[] {
  const changes: Change[] = []

  const CONFIG_PATHS = [
    'siteConfig.siteName', 'siteConfig.siteSubtitle', 'siteConfig.pageTitle',
    'siteConfig.metaDescription', 'siteConfig.logoIcon',
    'heroContent.eyebrow', 'heroContent.headline', 'heroContent.body',
    'heroContent.accent', 'heroContent.pillIcon', 'heroContent.pillLabel',
    'heroContent.image', 'heroContent.imageAlt', 'heroContent.statusPillLabel',
    'heroContent.ctaButtons',
    'gallerySection.eyebrow', 'gallerySection.title', 'gallerySection.description',
    'commissions.eyebrow', 'commissions.title', 'commissions.description', 'commissions.statusOpen',
    'faqPage.eyebrow', 'faqPage.title', 'faqPage.description',
    'contactContent.section.eyebrow', 'contactContent.section.title', 'contactContent.section.description',
    'contactContent.infoCard', 'contactContent.form',
    'footerContent.copyright', 'footerContent.tagline',
    'nav', 'socials',
  ]

  for (const path of CONFIG_PATHS) {
    const liveVal = getNestedValue(live, path)
    const draftVal = getNestedValue(draft, path)
    if (!deepEqual(liveVal, draftVal)) {
      const section = path.split('.')[0]
      changes.push({
        type: 'config',
        section,
        label: friendlyLabel(path),
        path,
        liveValue: liveVal,
        draftValue: draftVal,
      })
    }
  }

  const collections: CollectionKey[] = ['artworks', 'commissionTiers', 'faqItems', 'tosSections']
  for (const col of collections) {
    const liveItems = (live[col] as { _id: string }[]) ?? []
    const draftItems = (draft[col] as { _id: string }[]) ?? []
    const liveById = new Map(liveItems.map((i) => [i._id, i as Record<string, unknown>]))
    const draftById = new Map(draftItems.map((i) => [i._id, i as Record<string, unknown>]))

    for (const [id, item] of liveById) {
      if (!draftById.has(id)) {
        changes.push({
          type: 'collection',
          collection: col,
          action: 'removed',
          id,
          label: getItemName(item),
          liveItem: item,
        })
      }
    }
    
    for (const [id, item] of draftById) {
      if (id.startsWith('draft_')) {
        changes.push({
          type: 'collection',
          collection: col,
          action: 'added',
          id,
          label: getItemName(item),
          draftItem: item,
        })
      }
    }
    
    for (const [id, draftItem] of draftById) {
      if (id.startsWith('draft_')) continue
      const liveItem = liveById.get(id)
      if (!liveItem) continue
      const { _id: _a, createdAt: _b, updatedAt: _c, __v: _d, sortOrder: _e, ...lr } = liveItem
      const { _id: _f, createdAt: _g, updatedAt: _h, __v: _i, sortOrder: _j, ...dr } = draftItem
      void _a; void _b; void _c; void _d; void _e; void _f; void _g; void _h; void _i; void _j
      if (!deepEqual(lr, dr)) {
        changes.push({
          type: 'collection',
          collection: col,
          action: 'modified',
          id,
          label: getItemName(draftItem),
          liveItem,
          draftItem,
        })
      }
    }
  }

  return changes
}

export function DiffViewer() {
  const liveState = useDraftStore((s) => s.liveState)
  const draftState = useDraftStore((s) => s.draftState)
  const updateDraftConfig = useDraftStore((s) => s.updateDraftConfig)
  const updateDraftSection = useDraftStore((s) => s.updateDraftSection)
  const removeDraftItem = useDraftStore((s) => s.removeDraftItem)
  const addDraftItem = useDraftStore((s) => s.addDraftItem)
  const resetDraft = useDraftStore((s) => s.resetDraft)
  const { publish, publishSection, isPublishing } = usePublish()

  const changes = useMemo(() => {
    if (!liveState || !draftState) return []
    return calculateChanges(
      liveState as unknown as Record<string, unknown>,
      draftState as unknown as Record<string, unknown>,
    )
  }, [liveState, draftState])

  const grouped = useMemo(() => {
    const groups = new Map<string, Change[]>()
    for (const ch of changes) {
      const key = ch.type === 'config' ? ch.section : ch.collection
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(ch)
    }
    return groups
  }, [changes])

  const rollbackConfig = (path: string) => {
    if (!liveState) return
    const liveVal = getNestedValue(liveState as unknown as Record<string, unknown>, path)
    const keys = path.split('.')
    if (keys.length === 1) {
      updateDraftConfig({ [path]: liveVal } as Partial<Record<string, unknown>>)
    } else {
      const topKey = keys[0]
      const draftTop = (draftState as unknown as Record<string, unknown>)[topKey]
      const subPath = keys.slice(1).join('.')
      const restored = setNestedValue(
        (draftTop ?? {}) as Record<string, unknown>,
        subPath,
        getNestedValue(liveState as unknown as Record<string, unknown>, path)
      )
      updateDraftConfig({ [topKey]: restored } as Partial<Record<string, unknown>>)
    }
  }

  const rollbackCollection = (change: CollectionChange) => {
    if (change.action === 'added') {
      removeDraftItem(change.collection, change.id)
    } else if (change.action === 'removed' && change.liveItem) {
      addDraftItem(change.collection, change.liveItem as { _id: string } & Record<string, unknown>)
    } else if (change.action === 'modified' && change.liveItem) {
      const list = ((draftState as unknown as Record<string, unknown>)[change.collection] as { _id: string }[])
        .map((item) => (item._id === change.id ? change.liveItem : item))
      updateDraftSection(change.collection, list as unknown as typeof draftState[typeof change.collection])
    }
  }

  if (changes.length === 0) {
    return (
      <div className="diff-viewer">
        <div className="diff-viewer-empty">
          <CheckCircle size={40} weight="light" />
          <h3>No pending changes</h3>
          <p>All sections match the live site. Edits you make will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="diff-viewer">
      <div className="diff-viewer-header">
        <div className="diff-viewer-header-info">
          <h2 className="diff-viewer-title">Pending Changes</h2>
          <span className="diff-viewer-count">{changes.length} change{changes.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="diff-viewer-header-actions">
          <ActionButton
            variant="ghost"
            size="sm"
            icon={<ArrowsClockwise size={14} />}
            onClick={resetDraft}
          >
            Discard All
          </ActionButton>
          <ActionButton
            variant="primary"
            size="sm"
            icon={<FloppyDisk size={14} />}
            loading={isPublishing}
            onClick={publish}
          >
            Publish All
          </ActionButton>
        </div>
      </div>

      <div className="diff-viewer-sections">
        {Array.from(grouped.entries()).map(([section, sectionChanges]) => (
          <div key={section} className="diff-section">
            <div className="diff-section-header">
              <h3 className="diff-section-title">{sectionLabel(section)}</h3>
              <span className="diff-section-count">{sectionChanges.length}</span>
              {sectionChanges[0].type === 'collection' && (
                <ActionButton
                  variant="ghost"
                  size="sm"
                  icon={<CloudArrowUp size={12} />}
                  loading={isPublishing}
                  onClick={() => publishSection(section as CollectionKey)}
                  className="diff-section-publish"
                >
                  Publish
                </ActionButton>
              )}
              {sectionChanges[0].type === 'config' && (
                <ActionButton
                  variant="ghost"
                  size="sm"
                  icon={<CloudArrowUp size={12} />}
                  loading={isPublishing}
                  onClick={() => publishSection('config')}
                  className="diff-section-publish"
                >
                  Publish
                </ActionButton>
              )}
            </div>

            <div className="diff-items">
              {sectionChanges.map((change, i) => (
                <div key={i} className={`diff-item diff-item-${change.type === 'config' ? 'modified' : (change as CollectionChange).action}`}>
                  <div className="diff-item-indicator" />
                  <div className="diff-item-content">
                    <div className="diff-item-header">
                      <span className="diff-item-icon">
                        {change.type === 'collection' && (change as CollectionChange).action === 'added' && <Plus size={12} />}
                        {change.type === 'collection' && (change as CollectionChange).action === 'removed' && <Trash size={12} />}
                        {(change.type === 'config' || (change.type === 'collection' && (change as CollectionChange).action === 'modified')) && <PencilSimple size={12} />}
                      </span>
                      <span className="diff-item-label">
                        {change.type === 'config' ? change.label : `${collectionLabel((change as CollectionChange).collection)}: ${(change as CollectionChange).label}`}
                      </span>
                      <span className={`diff-item-badge diff-item-badge-${change.type === 'config' ? 'modified' : (change as CollectionChange).action}`}>
                        {change.type === 'config' ? 'modified' : (change as CollectionChange).action}
                      </span>
                    </div>

                    {}
                    {change.type === 'config' && (
                      <div className="diff-item-values">
                        <div className="diff-val diff-val-old">
                          <span className="diff-val-prefix">−</span>
                          <span>{truncateValue(change.liveValue)}</span>
                        </div>
                        <div className="diff-val diff-val-new">
                          <span className="diff-val-prefix">+</span>
                          <span>{truncateValue(change.draftValue)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="diff-item-rollback"
                    onClick={() => {
                      if (change.type === 'config') {
                        rollbackConfig(change.path)
                      } else {
                        rollbackCollection(change as CollectionChange)
                      }
                    }}
                    title="Rollback this change"
                    type="button"
                  >
                    <ArrowCounterClockwise size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
