import { useEffect, useRef, useState } from 'react'
import { Images, FloppyDisk, Plus, PencilSimple, Trash, CloudArrowUp } from '@phosphor-icons/react'
import { EditorCard } from '../components/EditorCard'
import { TextInput, TextAreaInput } from '../components/FormField'
import { ActionButton } from '../components/ActionButton'
import { ImageUploader } from '../components/ImageUploader'
import { SortableList } from '../components/SortableList'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  useDraftStore,
  selectDraftState,
  selectDraftArtworks,
  generateDraftId,
} from '../store/useDraftStore'
import { usePublish } from '../hooks/usePublish'
import { useDiff } from '../hooks/useDiff'
import type { ApiArtwork } from '../types/api'
import '../editors/ConfigEditor.css'

type ArtworkForm = {
  title: string
  category: string
  description: string
  imageUrl: string
  altText: string
}

const emptyForm: ArtworkForm = { title: '', category: '', description: '', imageUrl: '', altText: '' }

export function GalleryEditor() {
  const draftState = useDraftStore(selectDraftState)
  const items = useDraftStore(selectDraftArtworks)
  const isLiveLoading = useDraftStore((s) => s.isLiveLoading)
  const updateDraftConfig = useDraftStore((s) => s.updateDraftConfig)
  const addDraftItem = useDraftStore((s) => s.addDraftItem)
  const updateDraftItem = useDraftStore((s) => s.updateDraftItem)
  const removeDraftItem = useDraftStore((s) => s.removeDraftItem)
  const reorderDraftItems = useDraftStore((s) => s.reorderDraftItems)
  const { publish, publishSection, isPublishing } = usePublish()
  const diff = useDiff()

  const [eyebrow, setEyebrow] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ArtworkForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const hydratedRef = useRef(false)
  useEffect(() => {
    if (!draftState || hydratedRef.current) return
    hydratedRef.current = true
    setEyebrow(draftState.gallerySection.eyebrow)
    setTitle(draftState.gallerySection.title)
    setDescription(draftState.gallerySection.description)
  }, [draftState])

  const skipPushRef = useRef(true)
  useEffect(() => {
    if (skipPushRef.current) {
      skipPushRef.current = false
      return
    }
    if (!hydratedRef.current) return
    updateDraftConfig({
      gallerySection: { eyebrow, title, description },
    })
    
  }, [eyebrow, title, description])

  const handleSaveArtwork = () => {
    if (editingId) {
      updateDraftItem<ApiArtwork>('artworks', editingId, {
        title: form.title,
        category: form.category,
        description: form.description,
        imageUrl: form.imageUrl,
        altText: form.altText,
      } as Partial<ApiArtwork>)
    } else {
      const newItem: ApiArtwork = {
        _id: generateDraftId(),
        title: form.title,
        category: form.category,
        description: form.description,
        imageUrl: form.imageUrl,
        altText: form.altText,
        sortOrder: items.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addDraftItem('artworks', newItem)
    }
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = () => {
    if (!deleteId) return
    removeDraftItem('artworks', deleteId)
    setDeleteId(null)
  }

  const handleReorder = (newItems: (ApiArtwork & { id: string })[]) => {
    const reordered = newItems.map((r) => ({ ...r, _id: r.id }) as ApiArtwork)
    reorderDraftItems('artworks', reordered)
  }

  const startEdit = (artwork: ApiArtwork) => {
    setEditingId(artwork._id)
    setForm({
      title: artwork.title,
      category: artwork.category,
      description: artwork.description,
      imageUrl: artwork.imageUrl,
      altText: artwork.altText,
    })
    setShowForm(true)
  }

  if (isLiveLoading || !draftState) {
    return <div className="editor-loading"><div className="loading-spinner" /></div>
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2 className="editor-title">Gallery</h2>
        <p className="editor-subtitle">Manage artworks and gallery section content</p>
      </div>

      <EditorCard title="Section Header" icon={<Images size={18} />}>
        <TextInput label="Eyebrow" value={eyebrow} onChange={setEyebrow} />
        <TextInput label="Title" value={title} onChange={setTitle} />
        <TextAreaInput label="Description" value={description} onChange={setDescription} rows={2} />
      </EditorCard>

      <EditorCard
        title={`Artworks (${items.length})`}
        description="Drag to reorder. Changes are saved when you publish."
      >
        <SortableList
          items={items.map((a) => ({ ...a, id: a._id }))}
          onReorder={handleReorder}
          renderItem={(item) => {
            const artwork = items.find((a) => a._id === item.id)!
            return (
              <div className="list-item-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  {artwork.imageUrl && (
                    <img src={artwork.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div className="list-item-title">{artwork.title}</div>
                    <div className="list-item-meta">{artwork.category}</div>
                  </div>
                </div>
                <div className="list-item-actions">
                  {diff.item('artworks', artwork._id, artwork as unknown as Record<string, unknown>) && (
                    <span className={`diff-badge diff-badge-${diff.item('artworks', artwork._id, artwork as unknown as Record<string, unknown>)}`}>
                      {diff.item('artworks', artwork._id, artwork as unknown as Record<string, unknown>)}
                    </span>
                  )}
                  <button className="list-item-btn" onClick={() => startEdit(artwork)} type="button">
                    <PencilSimple size={14} /> Edit
                  </button>
                  <button className="list-item-btn list-item-btn-danger" onClick={() => setDeleteId(artwork._id)} type="button">
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            )
          }}
        />
        <ActionButton
          variant="ghost"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true) }}
        >
          Add Artwork
        </ActionButton>
      </EditorCard>

      {showForm && (
        <EditorCard title={editingId ? 'Edit Artwork' : 'Add Artwork'}>
          <ImageUploader value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} label="Artwork Image" />
          <TextInput label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <TextInput label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} required />
          <TextAreaInput label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={2} />
          <TextInput label="Alt Text" value={form.altText} onChange={(v) => setForm({ ...form, altText: v })} />
          <div className="modal-form-actions">
            <ActionButton variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</ActionButton>
            <ActionButton variant="primary" icon={<FloppyDisk size={14} />} onClick={handleSaveArtwork}>
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
        <ActionButton variant="ghost" size="sm" icon={<CloudArrowUp size={14} />} loading={isPublishing} onClick={() => publishSection('artworks')}>
          Publish Gallery Only
        </ActionButton>
        <ActionButton variant="primary" icon={<FloppyDisk size={16} />} loading={isPublishing} onClick={publish}>
          Publish All
        </ActionButton>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Artwork"
        description="This action cannot be undone. The artwork will be permanently removed."
        confirmLabel="Delete"
        loading={false}
      />
    </div>
  )
}
