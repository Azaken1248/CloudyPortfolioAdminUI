import { useEffect, useRef, useState } from 'react'
import { Envelope, FloppyDisk, Plus, Trash, CloudArrowUp } from '@phosphor-icons/react'
import { EditorCard } from '../components/EditorCard'
import { TextInput, TextAreaInput, SelectInput } from '../components/FormField'
import { ActionButton } from '../components/ActionButton'
import { IconPicker } from '../components/IconPicker'
import { useDraftStore, selectDraftState } from '../store/useDraftStore'
import { usePublish } from '../hooks/usePublish'
import { useDiff } from '../hooks/useDiff'
import type { ApiFormField } from '../types/api'
import '../editors/ConfigEditor.css'

export function ContactEditor() {
  const draftState = useDraftStore(selectDraftState)
  const isLiveLoading = useDraftStore((s) => s.isLiveLoading)
  const updateDraftConfig = useDraftStore((s) => s.updateDraftConfig)
  const { publish, publishSection, isPublishing } = usePublish()
  const diff = useDiff()

  const [eyebrow, setEyebrow] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [infoTag, setInfoTag] = useState('')
  const [infoTitle, setInfoTitle] = useState('')
  const [infoDescription, setInfoDescription] = useState('')
  const [infoNotes, setInfoNotes] = useState<string[]>([])
  const [formFields, setFormFields] = useState<ApiFormField[]>([])
  const [submitLabel, setSubmitLabel] = useState('')
  const [submitIcon, setSubmitIcon] = useState('')
  const [disclaimer, setDisclaimer] = useState('')

  const hydratedRef = useRef(false)
  useEffect(() => {
    if (!draftState || hydratedRef.current) return
    hydratedRef.current = true
    const c = draftState.contactContent
    setEyebrow(c.section.eyebrow)
    setTitle(c.section.title)
    setDescription(c.section.description)
    setInfoTag(c.infoCard.tag)
    setInfoTitle(c.infoCard.title)
    setInfoDescription(c.infoCard.description)
    setInfoNotes([...c.infoCard.notes])
    setFormFields(c.form.fields.map((f) => ({ ...f })))
    setSubmitLabel(c.form.submitLabel)
    setSubmitIcon(c.form.submitIcon ?? '')
    setDisclaimer(c.form.disclaimer)
  }, [draftState])

  const skipPushRef = useRef(true)
  useEffect(() => {
    if (skipPushRef.current) {
      skipPushRef.current = false
      return
    }
    if (!hydratedRef.current) return
    updateDraftConfig({
      contactContent: {
        section: { eyebrow, title, description },
        infoCard: { tag: infoTag, title: infoTitle, description: infoDescription, notes: infoNotes },
        form: { fields: formFields, submitLabel, submitIcon: submitIcon || undefined, disclaimer },
      },
    })
    
  }, [eyebrow, title, description, infoTag, infoTitle, infoDescription, infoNotes, formFields, submitLabel, submitIcon, disclaimer])

  if (isLiveLoading || !draftState) {
    return <div className="editor-loading"><div className="loading-spinner" /></div>
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2 className="editor-title">Contact</h2>
        <p className="editor-subtitle">Contact form and info card</p>
      </div>

      <EditorCard title="Section Header" icon={<Envelope size={18} />}>
        <TextInput label="Eyebrow" value={eyebrow} onChange={setEyebrow} />
        <TextInput label="Title" value={title} onChange={setTitle} />
        <TextAreaInput label="Description" value={description} onChange={setDescription} rows={2} />
      </EditorCard>

      <EditorCard title="Info Card" description="Shown beside the contact form">
        <TextInput label="Tag" value={infoTag} onChange={setInfoTag} placeholder="e.g. Info" />
        <TextInput label="Title" value={infoTitle} onChange={setInfoTitle} />
        <TextAreaInput label="Description" value={infoDescription} onChange={setInfoDescription} rows={2} />
        <div>
          <label className="form-field-label">Notes</label>
          <div className="points-list">
            {infoNotes.map((note, i) => (
              <div key={i} className="point-row">
                <input className="form-input" value={note} onChange={(e) => {
                  const copy = [...infoNotes]
                  copy[i] = e.target.value
                  setInfoNotes(copy)
                }} />
                <button className="point-remove-btn" onClick={() => setInfoNotes(infoNotes.filter((_, j) => j !== i))} type="button">
                  <Trash size={14} />
                </button>
              </div>
            ))}
            <ActionButton variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setInfoNotes([...infoNotes, ''])}>
              Add Note
            </ActionButton>
          </div>
        </div>
      </EditorCard>

      <EditorCard title="Form Fields" description="Fields shown in the contact form">
        <div className="item-card-list">
          {formFields.map((field, i) => (
            <div key={i} className="item-card">
              <div className="item-card-header">
                <span className="item-card-number">{i + 1}</span>
                <span className="item-card-label">{field.label || 'Untitled Field'}</span>
                <button className="item-card-remove" onClick={() => setFormFields(formFields.filter((_, j) => j !== i))} type="button" title="Remove">
                  <Trash size={14} />
                </button>
              </div>
              <div className="item-card-body">
                <div className="field-grid-2">
                  <TextInput label="Label" value={field.label} onChange={(v) => {
                    const copy = [...formFields]
                    copy[i] = { ...copy[i], label: v, name: v.toLowerCase().replace(/[^a-z0-9]+/g, '_') }
                    setFormFields(copy)
                  }} placeholder="e.g. Email" />
                  <SelectInput
                    label="Type"
                    value={field.type}
                    onChange={(v) => {
                      const copy = [...formFields]
                      copy[i] = { ...copy[i], type: v as ApiFormField['type'] }
                      setFormFields(copy)
                    }}
                    options={[
                      { value: 'text', label: 'Text' },
                      { value: 'email', label: 'Email' },
                      { value: 'textarea', label: 'Textarea' },
                    ]}
                  />
                </div>
                <TextInput label="Placeholder" value={field.placeholder} onChange={(v) => {
                  const copy = [...formFields]
                  copy[i] = { ...copy[i], placeholder: v }
                  setFormFields(copy)
                }} placeholder="Placeholder text…" />
              </div>
            </div>
          ))}
        </div>
        <ActionButton variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setFormFields([...formFields, { name: '', label: '', type: 'text', placeholder: '' }])}>
          Add Field
        </ActionButton>
      </EditorCard>

      <EditorCard title="Submit Button" description="Appearance of the submit button">
        <div className="field-grid-2">
          <TextInput label="Label" value={submitLabel} onChange={setSubmitLabel} placeholder="Send message" />
          <IconPicker label="Icon" value={submitIcon} onChange={setSubmitIcon} />
        </div>
        <TextAreaInput label="Disclaimer" value={disclaimer} onChange={setDisclaimer} rows={2} placeholder="Privacy notice shown below the button" />
      </EditorCard>

      <div className="editor-actions">
        <div className="draft-pill">
          <span className="draft-pill-dot" />
          Draft — preview only
        </div>
        <ActionButton variant="ghost" size="sm" icon={<CloudArrowUp size={14} />} loading={isPublishing} onClick={() => publishSection('config')}>
          Publish Contact Only
        </ActionButton>
        <ActionButton variant="primary" icon={<FloppyDisk size={16} />} loading={isPublishing} onClick={publish}>
          Publish All
        </ActionButton>
      </div>
    </div>
  )
}
