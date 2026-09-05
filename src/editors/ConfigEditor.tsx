import { useEffect, useRef, useState } from 'react'
import { GearIcon, FloppyDiskIcon, PlusIcon, TrashIcon, CloudArrowUpIcon } from '@phosphor-icons/react'
import { EditorCard } from '../components/EditorCard'
import { TextInput, TextAreaInput, SelectInput } from '../components/FormField'
import { ActionButton } from '../components/ActionButton'
import { IconPicker } from '../components/IconPicker'
import { withKeys, stripKeys, stripKey, nextRowKey, type Keyed } from '../lib/rowKeys'
import { useDraftStore, selectDraftState ,
  selectDraftRevision,
} from '../store/useDraftStore'
import { usePublish } from '../hooks/usePublish'
import { useDiff } from '../hooks/useDiff'
import './ConfigEditor.css'

/**
 * Nav links are in-page anchors, so an item's `id` has to match a section the
 * portfolio actually renders. It used to be derived from the label — renaming
 * "Gallery" to "My Art" produced id `my-art`, which matches nothing, and the
 * link silently stopped working with no indication in the editor.
 *
 * The target is now chosen explicitly and the label is free text.
 * `commissions` is remapped to `commission` by the portfolio's adapter.
 */
const NAV_TARGETS = [
  { value: 'home', label: 'Hero / Home' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'commissions', label: 'Commissions' },
  { value: 'faq', label: 'FAQ & Terms' },
  { value: 'contact', label: 'Contact' },
]

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
  const [navItems, setNavItems] = useState<Keyed<{ id: string; label: string; icon: string }>[]>([])
  const [socials, setSocials] = useState<Keyed<{ platform: string; url: string; label: string; icon: string }>[]>([])

  // Re-hydrate when the store replaces the draft (after publish or discard),
  // not just on first mount — otherwise these fields keep pre-publish values
  // and the next keystroke writes them back over fresh server data.
  const draftRevision = useDraftStore(selectDraftRevision)
  const hydratedRef = useRef(-1)
  useEffect(() => {
    if (!draftState || hydratedRef.current === draftRevision) return
    hydratedRef.current = draftRevision
    setSiteName(draftState.siteConfig.siteName)
    setSiteSubtitle(draftState.siteConfig.siteSubtitle)
    setPageTitle(draftState.siteConfig.pageTitle)
    setMetaDescription(draftState.siteConfig.metaDescription)
    setLogoIcon(draftState.siteConfig.logoIcon)
    setCopyright(draftState.footerContent.copyright)
    setTagline(draftState.footerContent.tagline)
    setNavItems(withKeys(draftState.nav))
    setSocials(withKeys(draftState.socials))
  }, [draftState, draftRevision])

  const skipPushRef = useRef(true)
  useEffect(() => {
    if (skipPushRef.current) {
      skipPushRef.current = false
      return
    }
    // hydratedRef holds a revision number, and revision 0 is falsy — compare
    // explicitly against the unhydrated sentinel.
    if (hydratedRef.current < 0) return
    updateDraftConfig({
      siteConfig: { siteName, siteSubtitle, pageTitle, metaDescription, logoIcon },
      footerContent: { copyright, tagline },
      nav: stripKeys(navItems),
      socials: stripKeys(socials),
    })
    
  }, [updateDraftConfig, siteName, siteSubtitle, pageTitle, metaDescription, logoIcon, copyright, tagline, navItems, socials])

  const updateNav = (i: number, field: string, value: string) => {
    const copy = [...navItems]
    copy[i] = { ...copy[i], [field]: value }
    setNavItems(copy)
  }

  // Two nav items pointing at the same section would render duplicate anchors.
  const duplicateTargets = navItems
    .map((n) => n.id)
    .filter((id, i, all) => id && all.indexOf(id) !== i)

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

      <EditorCard title="Branding" description="Core site identity" icon={<GearIcon size={18} />}>
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
            <div key={item._key} className={`item-card ${diff.field(`nav.${i}`, stripKey(item)) ? `item-card-${diff.field(`nav.${i}`, stripKey(item))}` : ''}`}>
              <div className="item-card-header">
                <span className="item-card-number">{i + 1}</span>
                <span className="item-card-label">{item.label || 'Untitled'}</span>
                {diff.field(`nav.${i}`, stripKey(item)) && (
                  <span className={`diff-badge diff-badge-${diff.field(`nav.${i}`, stripKey(item))}`}>{diff.field(`nav.${i}`, stripKey(item))}</span>
                )}
                <button className="item-card-remove" onClick={() => setNavItems(navItems.filter((_, j) => j !== i))} type="button" title="Remove">
                  <TrashIcon size={14} />
                </button>
              </div>
              <div className="item-card-body">
                <TextInput label="Label" value={item.label} onChange={(v) => updateNav(i, 'label', v)} placeholder="e.g. Home" />
                <SelectInput
                  label="Links to"
                  value={item.id}
                  onChange={(v) => updateNav(i, 'id', v)}
                  options={NAV_TARGETS}
                  helper={
                    duplicateTargets.includes(item.id)
                      ? 'Another nav item already links here.'
                      : undefined
                  }
                />
                <IconPicker label="Icon" value={item.icon} onChange={(v) => updateNav(i, 'icon', v)} />
              </div>
            </div>
          ))}
        </div>
        <ActionButton variant="ghost" size="sm" icon={<PlusIcon size={14} />} onClick={() => setNavItems([...navItems, { id: 'home', label: '', icon: '', _key: nextRowKey() }])}>
          Add Nav Item
        </ActionButton>
      </EditorCard>

      <EditorCard title="Social Links" description="Platform links shown in the footer">
        <div className="item-card-list">
          {socials.map((item, i) => (
            <div key={item._key} className={`item-card ${diff.field(`socials.${i}`, stripKey(item)) ? `item-card-${diff.field(`socials.${i}`, stripKey(item))}` : ''}`}>
              <div className="item-card-header">
                <span className="item-card-number">{i + 1}</span>
                <span className="item-card-label">{item.label || 'Untitled'}</span>
                {diff.field(`socials.${i}`, stripKey(item)) && (
                  <span className={`diff-badge diff-badge-${diff.field(`socials.${i}`, stripKey(item))}`}>{diff.field(`socials.${i}`, stripKey(item))}</span>
                )}
                <button className="item-card-remove" onClick={() => setSocials(socials.filter((_, j) => j !== i))} type="button" title="Remove">
                  <TrashIcon size={14} />
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
        <ActionButton variant="ghost" size="sm" icon={<PlusIcon size={14} />} onClick={() => setSocials([...socials, { platform: '', url: '', label: '', icon: '', _key: nextRowKey() }])}>
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
          icon={<CloudArrowUpIcon size={14} />}
          loading={isPublishing}
          onClick={() => publishSection('config')}
          disabled={!hasDirtyConfig}
        >
          Publish Config Only
        </ActionButton>
        <ActionButton
          variant="primary"
          icon={<FloppyDiskIcon size={16} />}
          loading={isPublishing}
          onClick={publish}
        >
          Publish All
        </ActionButton>
      </div>
    </div>
  )
}
