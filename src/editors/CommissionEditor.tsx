import { useEffect, useRef, useState } from 'react'
import { PaletteIcon, FloppyDiskIcon, PlusIcon, PencilSimpleIcon, TrashIcon, CloudArrowUpIcon } from '@phosphor-icons/react'
import { EditorCard } from '../components/EditorCard'
import { TextInput, TextAreaInput } from '../components/FormField'
import { ActionButton } from '../components/ActionButton'
import { SortableList } from '../components/SortableList'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  useDraftStore,
  selectDraftState,
  selectDraftCommissionTiers,
  generateDraftId,
} from '../store/useDraftStore'
import { usePublish } from '../hooks/usePublish'
import type { ApiCommissionTier } from '../types/api'
import '../editors/ConfigEditor.css'

type TierForm = {
  name: string
  priceLabel: string
  detailTag: string
  description: string
}

const emptyForm: TierForm = { name: '', priceLabel: '', detailTag: '', description: '' }

export function CommissionEditor() {
  const draftState = useDraftStore(selectDraftState)
  const items = useDraftStore(selectDraftCommissionTiers)
  const isLiveLoading = useDraftStore((s) => s.isLiveLoading)
  const updateDraftConfig = useDraftStore((s) => s.updateDraftConfig)
  const addDraftItem = useDraftStore((s) => s.addDraftItem)
  const updateDraftItem = useDraftStore((s) => s.updateDraftItem)
  const removeDraftItem = useDraftStore((s) => s.removeDraftItem)
  const reorderDraftItems = useDraftStore((s) => s.reorderDraftItems)
  const { publish, publishSection, isPublishing } = usePublish()

  const [eyebrow, setEyebrow] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [featuredTag, setFeaturedTag] = useState('')
  const [featuredBadge, setFeaturedBadge] = useState('')
  const [featuredTitle, setFeaturedTitle] = useState('')
  const [featuredDesc, setFeaturedDesc] = useState('')
  const [featuredHighlights, setFeaturedHighlights] = useState<string[]>([])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TierForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const hydratedRef = useRef(false)
  useEffect(() => {
    if (!draftState || hydratedRef.current) return
    hydratedRef.current = true
    const c = draftState.commissions
    setEyebrow(c.section.eyebrow)
    setTitle(c.section.title)
    setDescription(c.section.description)
    if (c.featured) {
      setFeaturedTag(c.featured.tag)
      setFeaturedBadge(c.featured.badge)
      setFeaturedTitle(c.featured.title)
      setFeaturedDesc(c.featured.description)
      setFeaturedHighlights([...c.featured.highlights])
    }
  }, [draftState])

  const skipPushRef = useRef(true)
  useEffect(() => {
    if (skipPushRef.current) {
      skipPushRef.current = false
      return
    }
    if (!hydratedRef.current) return
    updateDraftConfig({
      commissions: {
        section: { eyebrow, title, description },
        featured: { tag: featuredTag, badge: featuredBadge, title: featuredTitle, description: featuredDesc, highlights: featuredHighlights },
      },
    })
    
  }, [eyebrow, title, description, featuredTag, featuredBadge, featuredTitle, featuredDesc, featuredHighlights])

  const handleSaveTier = () => {
    if (editingId) {
      updateDraftItem<ApiCommissionTier>('commissionTiers', editingId, {
        name: form.name,
        priceLabel: form.priceLabel,
        detailTag: form.detailTag,
        description: form.description,
      } as Partial<ApiCommissionTier>)
    } else {
      const newItem: ApiCommissionTier = {
        _id: generateDraftId(),
        name: form.name,
        priceLabel: form.priceLabel,
        detailTag: form.detailTag,
        description: form.description,
        sortOrder: items.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addDraftItem('commissionTiers', newItem)
    }
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = () => {
    if (!deleteId) return
    removeDraftItem('commissionTiers', deleteId)
    setDeleteId(null)
  }

  const handleReorder = (newItems: (ApiCommissionTier & { id: string })[]) => {
    const reordered = newItems.map((r) => ({ ...r, _id: r.id }) as ApiCommissionTier)
    reorderDraftItems('commissionTiers', reordered)
  }

  if (isLiveLoading || !draftState) {
    return <div className="editor-loading"><div className="loading-spinner" /></div>
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2 className="editor-title">Commissions</h2>
        <p className="editor-subtitle">Pricing tiers and featured commission</p>
      </div>

      <EditorCard title="Section Header" icon={<PaletteIcon size={18} />}>
        <TextInput label="Eyebrow" value={eyebrow} onChange={setEyebrow} />
        <TextInput label="Title" value={title} onChange={setTitle} />
        <TextAreaInput label="Description" value={description} onChange={setDescription} rows={2} />
      </EditorCard>

      <EditorCard title="Featured Card" description="Highlighted commission tier">
        <TextInput label="Tag" value={featuredTag} onChange={setFeaturedTag} />
        <TextInput label="Badge" value={featuredBadge} onChange={setFeaturedBadge} />
        <TextInput label="Title" value={featuredTitle} onChange={setFeaturedTitle} />
        <TextAreaInput label="Description" value={featuredDesc} onChange={setFeaturedDesc} rows={2} />
        <div>
          <label className="form-field-label">Highlights</label>
          <div className="points-list">
            {featuredHighlights.map((h, i) => (
              <div key={i} className="point-row">
                <input className="form-input" value={h} onChange={(e) => {
                  const copy = [...featuredHighlights]
                  copy[i] = e.target.value
                  setFeaturedHighlights(copy)
                }} />
                <button className="point-remove-btn" onClick={() => setFeaturedHighlights(featuredHighlights.filter((_, j) => j !== i))} type="button">
                  <TrashIcon size={14} />
                </button>
              </div>
            ))}
            <ActionButton variant="ghost" size="sm" icon={<PlusIcon size={14} />} onClick={() => setFeaturedHighlights([...featuredHighlights, ''])}>
              Add Highlight
            </ActionButton>
          </div>
        </div>
      </EditorCard>

      <EditorCard title={`Tiers (${items.length})`} description="Drag to reorder">
        <SortableList
          items={items.map((t) => ({ ...t, id: t._id }))}
          onReorder={handleReorder}
          renderItem={(item) => {
            const tier = items.find((t) => t._id === item.id)!
            return (
              <div className="list-item-header">
                <div style={{ minWidth: 0 }}>
                  <div className="list-item-title">{tier.name}</div>
                  <div className="list-item-meta">{tier.priceLabel} · {tier.detailTag}</div>
                </div>
                <div className="list-item-actions">
                  <button className="list-item-btn" onClick={() => { setEditingId(tier._id); setForm({ name: tier.name, priceLabel: tier.priceLabel, detailTag: tier.detailTag, description: tier.description }); setShowForm(true) }} type="button">
                    <PencilSimpleIcon size={14} /> Edit
                  </button>
                  <button className="list-item-btn list-item-btn-danger" onClick={() => setDeleteId(tier._id)} type="button">
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            )
          }}
        />
        <ActionButton variant="ghost" size="sm" icon={<PlusIcon size={14} />} onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true) }}>
          Add Tier
        </ActionButton>
      </EditorCard>

      {showForm && (
        <EditorCard title={editingId ? 'Edit Tier' : 'Add Tier'}>
          <TextInput label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <TextInput label="Price Label" value={form.priceLabel} onChange={(v) => setForm({ ...form, priceLabel: v })} placeholder="$60–$90" required />
          <TextInput label="Detail Tag" value={form.detailTag} onChange={(v) => setForm({ ...form, detailTag: v })} />
          <TextAreaInput label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={2} />
          <div className="modal-form-actions">
            <ActionButton variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</ActionButton>
            <ActionButton variant="primary" icon={<FloppyDiskIcon size={14} />} onClick={handleSaveTier}>
              {editingId ? 'Update' : 'Add'}
            </ActionButton>
          </div>
        </EditorCard>
      )}

      <div className="editor-actions">
        <div className="draft-pill">
          <span className="draft-pill-dot" />
          Draft — preview only
        </div>
        <ActionButton variant="ghost" size="sm" icon={<CloudArrowUpIcon size={14} />} loading={isPublishing} onClick={() => publishSection('commissionTiers')}>
          Publish Commissions Only
        </ActionButton>
        <ActionButton variant="primary" icon={<FloppyDiskIcon size={16} />} loading={isPublishing} onClick={publish}>
          Publish All
        </ActionButton>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Tier"
        description="This commission tier will be permanently removed."
        confirmLabel="Delete"
        loading={false}
      />
    </div>
  )
}
