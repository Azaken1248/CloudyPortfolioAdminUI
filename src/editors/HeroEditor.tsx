import { useEffect, useRef, useState } from 'react'
import { Star, FloppyDisk, Plus, Trash, CloudArrowUp } from '@phosphor-icons/react'
import { EditorCard } from '../components/EditorCard'
import { TextInput, TextAreaInput, SelectInput } from '../components/FormField'
import { ActionButton } from '../components/ActionButton'
import { ImageUploader } from '../components/ImageUploader'
import { IconPicker } from '../components/IconPicker'
import { useDraftStore, selectDraftState } from '../store/useDraftStore'
import { usePublish } from '../hooks/usePublish'
import { useDiff } from '../hooks/useDiff'
import type { ApiCtaButton } from '../types/api'
import '../editors/ConfigEditor.css'

export function HeroEditor() {
  const draftState = useDraftStore(selectDraftState)
  const isLiveLoading = useDraftStore((s) => s.isLiveLoading)
  const updateDraftConfig = useDraftStore((s) => s.updateDraftConfig)
  const { publish, publishSection, isPublishing } = usePublish()
  const diff = useDiff()

  const [pillIcon, setPillIcon] = useState('')
  const [pillLabel, setPillLabel] = useState('')
  const [eyebrow, setEyebrow] = useState('')
  const [headline, setHeadline] = useState('')
  const [body, setBody] = useState('')
  const [accent, setAccent] = useState('')
  const [image, setImage] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [statusPillLabel, setStatusPillLabel] = useState('')
  const [ctaButtons, setCtaButtons] = useState<ApiCtaButton[]>([])

  const hydratedRef = useRef(false)
  useEffect(() => {
    if (!draftState || hydratedRef.current) return
    hydratedRef.current = true
    const h = draftState.heroContent
    setPillIcon(h.pillIcon)
    setPillLabel(h.pillLabel)
    setEyebrow(h.eyebrow)
    setHeadline(h.headline)
    setBody(h.body)
    setAccent(h.accent)
    setImage(h.image)
    setImageAlt(h.imageAlt)
    setStatusPillLabel(h.statusPillLabel)
    setCtaButtons(h.ctaButtons.map((b) => ({ ...b })))
  }, [draftState])

  const skipPushRef = useRef(true)
  useEffect(() => {
    if (skipPushRef.current) {
      skipPushRef.current = false
      return
    }
    if (!hydratedRef.current) return
    updateDraftConfig({
      heroContent: {
        pillIcon, pillLabel, eyebrow, headline, body, accent, image, imageAlt, statusPillLabel, ctaButtons,
      },
    })
    
  }, [pillIcon, pillLabel, eyebrow, headline, body, accent, image, imageAlt, statusPillLabel, ctaButtons])

  const updateCta = (i: number, field: string, value: string) => {
    const copy = [...ctaButtons]
    copy[i] = { ...copy[i], [field]: value }
    setCtaButtons(copy)
  }

  if (isLiveLoading || !draftState) {
    return <div className="editor-loading"><div className="loading-spinner" /></div>
  }

  const hasDirty = diff.sectionDirty('heroContent')

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2 className="editor-title">Hero Section</h2>
        <p className="editor-subtitle">Landing area content and call-to-action</p>
      </div>

      <EditorCard title="Content" icon={<Star size={18} />} description="Main heading and body text">
        <TextInput label="Eyebrow" value={eyebrow} onChange={setEyebrow} placeholder="Small text above headline" diff={diff.field('heroContent.eyebrow', eyebrow)} />
        <TextInput label="Headline" value={headline} onChange={setHeadline} placeholder="Welcome to my portfolio." diff={diff.field('heroContent.headline', headline)} />
        <TextAreaInput label="Body" value={body} onChange={setBody} rows={3} placeholder="A brief intro about yourself…" diff={diff.field('heroContent.body', body)} />
        <TextInput label="Accent Text" value={accent} onChange={setAccent} placeholder="Tagline or emphasis text" diff={diff.field('heroContent.accent', accent)} />
      </EditorCard>

      <EditorCard title="Status Pill" description="Badge shown at the top of the hero">
        <div className="field-grid-2">
          <TextInput label="Label" value={pillLabel} onChange={setPillLabel} diff={diff.field('heroContent.pillLabel', pillLabel)} />
          <IconPicker label="Icon" value={pillIcon} onChange={setPillIcon} diff={diff.field('heroContent.pillIcon', pillIcon)} />
        </div>
        <TextInput label="Status Label" value={statusPillLabel} onChange={setStatusPillLabel} placeholder="e.g. Open for commissions" diff={diff.field('heroContent.statusPillLabel', statusPillLabel)} />
      </EditorCard>

      <EditorCard title="Hero Image" description="Character image displayed in the hero">
        <ImageUploader value={image} onChange={setImage} label="Character Image" />
        <TextInput label="Alt Text" value={imageAlt} onChange={setImageAlt} placeholder="Describe the image for accessibility" diff={diff.field('heroContent.imageAlt', imageAlt)} />
      </EditorCard>

      <EditorCard title="CTA Buttons" description="Call-to-action buttons below the hero text">
        <div className="item-card-list">
          {ctaButtons.map((btn, i) => {
            const btnDiff = diff.field(`heroContent.ctaButtons.${i}`, btn)
            return (
              <div key={i} className={`item-card ${btnDiff ? `item-card-${btnDiff}` : ''}`}>
                <div className="item-card-header">
                  <span className="item-card-number">{i + 1}</span>
                  <span className="item-card-label">{btn.label || 'Untitled Button'}</span>
                  {btnDiff && <span className={`diff-badge diff-badge-${btnDiff}`}>{btnDiff}</span>}
                  <button className="item-card-remove" onClick={() => setCtaButtons(ctaButtons.filter((_, j) => j !== i))} type="button" title="Remove">
                    <Trash size={14} />
                  </button>
                </div>
                <div className="item-card-body">
                  <div className="field-grid-2">
                    <TextInput label="Label" value={btn.label} onChange={(v) => updateCta(i, 'label', v)} placeholder="View artwork" />
                    <TextInput label="Link" value={btn.href} onChange={(v) => updateCta(i, 'href', v)} placeholder="#gallery" />
                  </div>
                  <div className="field-grid-2">
                    <SelectInput
                      label="Style"
                      value={btn.variant}
                      onChange={(v) => updateCta(i, 'variant', v)}
                      options={[
                        { value: 'primary', label: 'Primary (filled)' },
                        { value: 'secondary', label: 'Secondary (outline)' },
                      ]}
                    />
                    <IconPicker label="Icon" value={btn.icon ?? ''} onChange={(v) => updateCta(i, 'icon', v)} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <ActionButton variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setCtaButtons([...ctaButtons, { label: '', href: '', variant: 'primary' }])}>
          Add Button
        </ActionButton>
      </EditorCard>

      <div className="editor-actions">
        {hasDirty && (
          <div className="draft-pill">
            <span className="draft-pill-dot" />
            Unsaved changes
          </div>
        )}
        <ActionButton variant="ghost" size="sm" icon={<CloudArrowUp size={14} />} loading={isPublishing} onClick={() => publishSection('config')} disabled={!hasDirty}>
          Publish Hero Only
        </ActionButton>
        <ActionButton variant="primary" icon={<FloppyDisk size={16} />} loading={isPublishing} onClick={publish}>
          Publish All
        </ActionButton>
      </div>
    </div>
  )
}
