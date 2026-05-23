import { useEffect, useRef, useState } from 'react'
import { Gear, FloppyDisk, Plus, Trash, CloudArrowUp } from '@phosphor-icons/react'
import { EditorCard } from '../components/EditorCard'
import { TextInput, TextAreaInput } from '../components/FormField'
import { ActionButton } from '../components/ActionButton'
import { IconPicker } from '../components/IconPicker'
import { useDraftStore, selectDraftState } from '../store/useDraftStore'
import { usePublish } from '../hooks/usePublish'
import { useDiff } from '../hooks/useDiff'
import './ConfigEditor.css'

export function ConfigEditor() {
  const draftState = useDraftStore(selectDraftState)
  const isLiveLoading = useDraftStore((s) => s.isLiveLoading)
  const updateDraftConfig = useDraftStore((s) => s.updateDraftConfig)
  const { publish, publishSection, isPublishing } = usePublish()
  const diff = useDiff()

  const [siteName, setSiteName] = useState('')
  const [siteSubtitle, setSiteSubtitle] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [logoIcon, setLogoIcon] = useState('')
  const [copyright, setCopyright] = useState('')
  const [tagline, setTagline] = useState('')
  const [navItems, setNavItems] = useState<{ id: string; label: string; icon: string }[]>([])
  const [socials, setSocials] = useState<{ platform: string; url: string; label: string; icon: string }[]>([])

  const hydratedRef = useRef(false)
  useEffect(() => {
    if (!draftState || hydratedRef.current) return
    hydratedRef.current = true
    setSiteName(draftState.siteConfig.siteName)
    setSiteSubtitle(draftState.siteConfig.siteSubtitle)
    setPageTitle(draftState.siteConfig.pageTitle)
    setMetaDescription(draftState.siteConfig.metaDescription)
    setLogoIcon(draftState.siteConfig.logoIcon)
    setCopyright(draftState.footerContent.copyright)
    setTagline(draftState.footerContent.tagline)
    setNavItems(draftState.nav.map((n) => ({ ...n })))
    setSocials(draftState.socials.map((s) => ({ ...s })))
  }, [draftState])

  const skipPushRef = useRef(true)
  useEffect(() => {
    if (skipPushRef.current) {
      skipPushRef.current = false
      return
    }
    if (!hydratedRef.current) return
    updateDraftConfig({
      siteConfig: { siteName, siteSubtitle, pageTitle, metaDescription, logoIcon },
      footerContent: { copyright, tagline },
      nav: navItems,
      socials,
    })
    
  }, [siteName, siteSubtitle, pageTitle, metaDescription, logoIcon, copyright, tagline, navItems, socials])

  const updateNav = (i: number, field: string, value: string) => {
    const copy = [...navItems]
    copy[i] = { ...copy[i], [field]: value }
    if (field === 'label') {
      copy[i].id = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    setNavItems(copy)
  }

  const updateSocial = (i: number, field: string, value: string) => {
    const copy = [...socials]
    copy[i] = { ...copy[i], [field]: value }
    if (field === 'label') {
      copy[i].platform = value.toLowerCase().replace(/[^a-z0-9]+/g, '')
    }
    setSocials(copy)
  }

  if (isLiveLoading || !draftState) {
    return <div className="editor-loading"><div className="loading-spinner" /></div>
  }

  const hasDirtyConfig = diff.sectionDirty('siteConfig') || diff.sectionDirty('footerContent') || diff.sectionDirty('nav') || diff.sectionDirty('socials')

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2 className="editor-title">Site Configuration</h2>
        <p className="editor-subtitle">General settings, navigation, and social links</p>
      </div>

      <EditorCard title="Branding" description="Core site identity" icon={<Gear size={18} />}>
        <div className="field-grid-2">
          <TextInput label="Site Name" value={siteName} onChange={setSiteName} placeholder="Cluwudy" diff={diff.field('siteConfig.siteName', siteName)} />
          <TextInput label="Subtitle" value={siteSubtitle} onChange={setSiteSubtitle} placeholder="portfolio" diff={diff.field('siteConfig.siteSubtitle', siteSubtitle)} />
        </div>
        <TextInput label="Page Title" value={pageTitle} onChange={setPageTitle} placeholder="Cluwudy — Artist Portfolio" diff={diff.field('siteConfig.pageTitle', pageTitle)} />
        <TextAreaInput label="Meta Description" value={metaDescription} onChange={setMetaDescription} placeholder="SEO description for search engines…" rows={2} diff={diff.field('siteConfig.metaDescription', metaDescription)} />
        <IconPicker label="Logo Icon" value={logoIcon} onChange={setLogoIcon} diff={diff.field('siteConfig.logoIcon', logoIcon)} />
      </EditorCard>

      <EditorCard title="Footer" description="Copyright and tagline">
        <TextInput label="Copyright" value={copyright} onChange={setCopyright} diff={diff.field('footerContent.copyright', copyright)} />
        <TextInput label="Tagline" value={tagline} onChange={setTagline} diff={diff.field('footerContent.tagline', tagline)} />
      </EditorCard>

      <EditorCard title="Navigation" description="Items shown in the top navigation bar">
        <div className="item-card-list">
          {navItems.map((item, i) => (
            <div key={i} className={`item-card ${diff.field(`nav.${i}`, item) ? `item-card-${diff.field(`nav.${i}`, item)}` : ''}`}>
              <div className="item-card-header">
                <span className="item-card-number">{i + 1}</span>
                <span className="item-card-label">{item.label || 'Untitled'}</span>
                {diff.field(`nav.${i}`, item) && (
                  <span className={`diff-badge diff-badge-${diff.field(`nav.${i}`, item)}`}>{diff.field(`nav.${i}`, item)}</span>
                )}
                <button className="item-card-remove" onClick={() => setNavItems(navItems.filter((_, j) => j !== i))} type="button" title="Remove">
                  <Trash size={14} />
                </button>
              </div>
              <div className="item-card-body">
                <TextInput label="Label" value={item.label} onChange={(v) => updateNav(i, 'label', v)} placeholder="e.g. Home" />
                <IconPicker label="Icon" value={item.icon} onChange={(v) => updateNav(i, 'icon', v)} />
              </div>
            </div>
          ))}
        </div>
        <ActionButton variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setNavItems([...navItems, { id: '', label: '', icon: '' }])}>
          Add Nav Item
        </ActionButton>
      </EditorCard>

      <EditorCard title="Social Links" description="Platform links shown in the footer">
        <div className="item-card-list">
          {socials.map((item, i) => (
            <div key={i} className={`item-card ${diff.field(`socials.${i}`, item) ? `item-card-${diff.field(`socials.${i}`, item)}` : ''}`}>
              <div className="item-card-header">
                <span className="item-card-number">{i + 1}</span>
                <span className="item-card-label">{item.label || 'Untitled'}</span>
                {diff.field(`socials.${i}`, item) && (
                  <span className={`diff-badge diff-badge-${diff.field(`socials.${i}`, item)}`}>{diff.field(`socials.${i}`, item)}</span>
                )}
                <button className="item-card-remove" onClick={() => setSocials(socials.filter((_, j) => j !== i))} type="button" title="Remove">
                  <Trash size={14} />
                </button>
              </div>
              <div className="item-card-body">
                <div className="field-grid-2">
                  <TextInput label="Name" value={item.label} onChange={(v) => updateSocial(i, 'label', v)} placeholder="e.g. Instagram" />
                  <IconPicker label="Icon" value={item.icon} onChange={(v) => updateSocial(i, 'icon', v)} />
                </div>
                <TextInput label="URL" value={item.url} onChange={(v) => updateSocial(i, 'url', v)} placeholder="https://…" type="url" />
              </div>
            </div>
          ))}
        </div>
        <ActionButton variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setSocials([...socials, { platform: '', url: '', label: '', icon: '' }])}>
          Add Social Link
        </ActionButton>
      </EditorCard>

      <div className="editor-actions">
        {hasDirtyConfig && (
          <div className="draft-pill">
            <span className="draft-pill-dot" />
            Unsaved changes
          </div>
        )}
        <ActionButton
          variant="ghost"
          size="sm"
          icon={<CloudArrowUp size={14} />}
          loading={isPublishing}
          onClick={() => publishSection('config')}
          disabled={!hasDirtyConfig}
        >
          Publish Config Only
        </ActionButton>
        <ActionButton
          variant="primary"
          icon={<FloppyDisk size={16} />}
          loading={isPublishing}
          onClick={publish}
        >
          Publish All
        </ActionButton>
      </div>
    </div>
  )
}
