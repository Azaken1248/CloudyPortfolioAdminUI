import { useEffect, useState } from 'react'
import { Shield, FloppyDisk, Plus, PencilSimple, Trash, CloudArrowUp } from '@phosphor-icons/react'
import { EditorCard } from '../components/EditorCard'
import { TextInput, SelectInput } from '../components/FormField'
import { ActionButton } from '../components/ActionButton'
import { SortableList } from '../components/SortableList'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  useDraftStore,
  selectDraftTosSections,
  generateDraftId,
} from '../store/useDraftStore'
import { usePublish } from '../hooks/usePublish'
import type { ApiTosSection } from '../types/api'
import '../editors/ConfigEditor.css'

type TosForm = {
  heading: string
  variant: 'default' | 'prohibited' | 'info'
  points: string[]
}

const emptyForm: TosForm = { heading: '', variant: 'default', points: [''] }

const VARIANT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'prohibited', label: 'Prohibited' },
  { value: 'info', label: 'Info' },
]

export function TosEditor() {
  const items = useDraftStore(selectDraftTosSections)
  const isLiveLoading = useDraftStore((s) => s.isLiveLoading)
  const addDraftItem = useDraftStore((s) => s.addDraftItem)
  const updateDraftItem = useDraftStore((s) => s.updateDraftItem)
  const removeDraftItem = useDraftStore((s) => s.removeDraftItem)
  const reorderDraftItems = useDraftStore((s) => s.reorderDraftItems)
  const { publish, publishSection, isPublishing } = usePublish()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TosForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSaveTos = () => {
    const payload = { heading: form.heading, variant: form.variant, points: form.points.filter(Boolean) }
    if (editingId) {
      updateDraftItem<ApiTosSection>('tosSections', editingId, payload as Partial<ApiTosSection>)
    } else {
      const newItem: ApiTosSection = {
        _id: generateDraftId(),
        ...payload,
        sortOrder: items.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addDraftItem('tosSections', newItem)
    }
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = () => {
    if (!deleteId) return
    removeDraftItem('tosSections', deleteId)
    setDeleteId(null)
  }

  const handleReorder = (newItems: (ApiTosSection & { id: string })[]) => {
    const reordered = newItems.map((r) => ({ ...r, _id: r.id }) as ApiTosSection)
    reorderDraftItems('tosSections', reordered)
  }

  const startEdit = (section: ApiTosSection) => {
    setEditingId(section._id)
    setForm({
      heading: section.heading,
      variant: section.variant,
      points: [...section.points],
    })
    setShowForm(true)
  }

  if (isLiveLoading) {
    return <div className="editor-loading"><div className="loading-spinner" /></div>
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2 className="editor-title">Terms of Service</h2>
        <p className="editor-subtitle">Manage TOS sections and rules</p>
      </div>

      <EditorCard title={`Sections (${items.length})`} description="Drag to reorder" icon={<Shield size={18} />}>
        <SortableList
          items={items.map((s) => ({ ...s, id: s._id }))}
          onReorder={handleReorder}
          renderItem={(item) => {
            const section = items.find((s) => s._id === item.id)!
            return (
              <div className="list-item-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span className={`variant-tag variant-tag-${section.variant}`}>{section.variant}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="list-item-title">{section.heading}</div>
                    <div className="list-item-meta">{section.points.length} point{section.points.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="list-item-actions">
                  <button className="list-item-btn" onClick={() => startEdit(section)} type="button">
                    <PencilSimple size={14} /> Edit
                  </button>
                  <button className="list-item-btn list-item-btn-danger" onClick={() => setDeleteId(section._id)} type="button">
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            )
          }}
        />
        <ActionButton variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true) }}>
          Add Section
        </ActionButton>
      </EditorCard>

      {showForm && (
        <EditorCard title={editingId ? 'Edit Section' : 'Add Section'}>
          <TextInput label="Heading" value={form.heading} onChange={(v) => setForm({ ...form, heading: v })} required />
          <SelectInput
            label="Variant"
            value={form.variant}
            onChange={(v) => setForm({ ...form, variant: v as TosForm['variant'] })}
            options={VARIANT_OPTIONS}
          />
          <div>
            <label className="form-field-label">Points</label>
            <div className="points-list">
              {form.points.map((point, i) => (
                <div key={i} className="point-row">
                  <input
                    className="form-input"
                    value={point}
                    onChange={(e) => {
                      const copy = [...form.points]
                      copy[i] = e.target.value
                      setForm({ ...form, points: copy })
                    }}
                    placeholder={`Point ${i + 1}`}
                  />
                  <button
                    className="point-remove-btn"
                    onClick={() => setForm({ ...form, points: form.points.filter((_, j) => j !== i) })}
                    type="button"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
              <ActionButton variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setForm({ ...form, points: [...form.points, ''] })}>
                Add Point
              </ActionButton>
            </div>
          </div>
          <div className="modal-form-actions">
            <ActionButton variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</ActionButton>
            <ActionButton variant="primary" icon={<FloppyDisk size={14} />} onClick={handleSaveTos}>
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
        <ActionButton variant="ghost" size="sm" icon={<CloudArrowUp size={14} />} loading={isPublishing} onClick={() => publishSection('tosSections')}>
          Publish TOS Only
        </ActionButton>
        <ActionButton variant="primary" icon={<FloppyDisk size={16} />} loading={isPublishing} onClick={publish}>
          Publish All
        </ActionButton>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete TOS Section"
        description="This section and all its points will be permanently removed."
        confirmLabel="Delete"
        loading={false}
      />
    </div>
  )
}
