import { useEffect, useRef, useState } from 'react'
import { ChatCircleTextIcon, FloppyDiskIcon, PlusIcon, PencilSimpleIcon, TrashIcon, CloudArrowUpIcon } from '@phosphor-icons/react'
import { EditorCard } from '../components/EditorCard'
import { TextInput, TextAreaInput } from '../components/FormField'
import { ActionButton } from '../components/ActionButton'
import { SortableList } from '../components/SortableList'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  useDraftStore,
  selectDraftState,
  selectDraftFaqItems,
  generateDraftId,
} from '../store/useDraftStore'
import { usePublish } from '../hooks/usePublish'
import type { ApiFaqItem } from '../types/api'
import '../editors/ConfigEditor.css'

type FaqForm = { question: string; answer: string }
const emptyForm: FaqForm = { question: '', answer: '' }

export function FaqEditor() {
  const draftState = useDraftStore(selectDraftState)
  const items = useDraftStore(selectDraftFaqItems)
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
  const [faqHeading, setFaqHeading] = useState('')
  const [tosHeading, setTosHeading] = useState('')
  const [tosAcceptanceText, setTosAcceptanceText] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FaqForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const hydratedRef = useRef(false)
  useEffect(() => {
    if (!draftState || hydratedRef.current) return
    hydratedRef.current = true
    const f = draftState.faqPage
    setEyebrow(f.section.eyebrow)
    setTitle(f.section.title)
    setDescription(f.section.description)
    setFaqHeading(f.faqHeading)
    setTosHeading(f.tosHeading)
    setTosAcceptanceText(f.tosAcceptanceText)
  }, [draftState])

  const skipPushRef = useRef(true)
  useEffect(() => {
    if (skipPushRef.current) {
      skipPushRef.current = false
      return
    }
    if (!hydratedRef.current) return
    updateDraftConfig({
      faqPage: {
        section: { eyebrow, title, description },
        faqHeading, tosHeading, tosAcceptanceText,
      },
    })
    
  }, [eyebrow, title, description, faqHeading, tosHeading, tosAcceptanceText])

  const handleSaveFaq = () => {
    if (editingId) {
      updateDraftItem<ApiFaqItem>('faqItems', editingId, {
        question: form.question,
        answer: form.answer,
      } as Partial<ApiFaqItem>)
    } else {
      const newItem: ApiFaqItem = {
        _id: generateDraftId(),
        question: form.question,
        answer: form.answer,
        sortOrder: items.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addDraftItem('faqItems', newItem)
    }
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleDelete = () => {
    if (!deleteId) return
    removeDraftItem('faqItems', deleteId)
    setDeleteId(null)
  }

  const handleReorder = (newItems: (ApiFaqItem & { id: string })[]) => {
    const reordered = newItems.map((r) => ({ ...r, _id: r.id }) as ApiFaqItem)
    reorderDraftItems('faqItems', reordered)
  }

  if (isLiveLoading || !draftState) {
    return <div className="editor-loading"><div className="loading-spinner" /></div>
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2 className="editor-title">FAQ</h2>
        <p className="editor-subtitle">Frequently asked questions</p>
      </div>

      <EditorCard title="Page Config" icon={<ChatCircleTextIcon size={18} />}>
        <TextInput label="Eyebrow" value={eyebrow} onChange={setEyebrow} />
        <TextInput label="Title" value={title} onChange={setTitle} />
        <TextAreaInput label="Description" value={description} onChange={setDescription} rows={2} />
        <TextInput label="FAQ Heading" value={faqHeading} onChange={setFaqHeading} />
        <TextInput label="TOS Heading" value={tosHeading} onChange={setTosHeading} />
        <TextAreaInput label="TOS Acceptance Text" value={tosAcceptanceText} onChange={setTosAcceptanceText} rows={2} />
      </EditorCard>

      <EditorCard title={`Questions (${items.length})`} description="Drag to reorder">
        <SortableList
          items={items.map((f) => ({ ...f, id: f._id }))}
          onReorder={handleReorder}
          renderItem={(item) => {
            const faq = items.find((f) => f._id === item.id)!
            return (
              <div className="list-item-header">
                <div style={{ minWidth: 0 }}>
                  <div className="list-item-title">{faq.question}</div>
                  <div className="list-item-meta" style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {faq.answer}
                  </div>
                </div>
                <div className="list-item-actions">
                  <button className="list-item-btn" onClick={() => { setEditingId(faq._id); setForm({ question: faq.question, answer: faq.answer }); setShowForm(true) }} type="button">
                    <PencilSimpleIcon size={14} /> Edit
                  </button>
                  <button className="list-item-btn list-item-btn-danger" onClick={() => setDeleteId(faq._id)} type="button">
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            )
          }}
        />
        <ActionButton variant="ghost" size="sm" icon={<PlusIcon size={14} />} onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true) }}>
          Add FAQ
        </ActionButton>
      </EditorCard>

      {showForm && (
        <EditorCard title={editingId ? 'Edit FAQ' : 'Add FAQ'}>
          <TextInput label="Question" value={form.question} onChange={(v) => setForm({ ...form, question: v })} required />
          <TextAreaInput label="Answer" value={form.answer} onChange={(v) => setForm({ ...form, answer: v })} rows={4} required />
          <div className="modal-form-actions">
            <ActionButton variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</ActionButton>
            <ActionButton variant="primary" icon={<FloppyDiskIcon size={14} />} onClick={handleSaveFaq}>
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
        <ActionButton variant="ghost" size="sm" icon={<CloudArrowUpIcon size={14} />} loading={isPublishing} onClick={() => publishSection('faqItems')}>
          Publish FAQ Only
        </ActionButton>
        <ActionButton variant="primary" icon={<FloppyDiskIcon size={16} />} loading={isPublishing} onClick={publish}>
          Publish All
        </ActionButton>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete FAQ"
        description="This question will be permanently removed."
        confirmLabel="Delete"
        loading={false}
      />
    </div>
  )
}
