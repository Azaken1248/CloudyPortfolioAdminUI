import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import * as Icons from '@phosphor-icons/react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { apiUpload } from '../config/api'
import './IconPicker.css'

const ICON_LIST: { name: string; component: PhosphorIcon }[] = [
  { name: 'House', component: Icons.HouseIcon },
  { name: 'Image', component: Icons.ImageIcon },
  { name: 'Palette', component: Icons.PaletteIcon },
  { name: 'ChatCircleText', component: Icons.ChatCircleTextIcon },
  { name: 'Envelope', component: Icons.EnvelopeIcon },
  { name: 'Gear', component: Icons.GearIcon },
  { name: 'User', component: Icons.UserIcon },
  { name: 'Star', component: Icons.StarIcon },
  { name: 'Heart', component: Icons.HeartIcon },
  { name: 'MagnifyingGlass', component: Icons.MagnifyingGlassIcon },
  { name: 'InstagramLogo', component: Icons.InstagramLogoIcon },
  { name: 'TwitterLogo', component: Icons.TwitterLogoIcon },
  { name: 'DiscordLogo', component: Icons.DiscordLogoIcon },
  { name: 'YoutubeLogo', component: Icons.YoutubeLogoIcon },
  { name: 'TiktokLogo', component: Icons.TiktokLogoIcon },
  { name: 'GithubLogo', component: Icons.GithubLogoIcon },
  { name: 'LinkedinLogo', component: Icons.LinkedinLogoIcon },
  { name: 'TwitchLogo', component: Icons.TwitchLogoIcon },
  { name: 'LinkSimple', component: Icons.LinkSimpleIcon },
  { name: 'Globe', component: Icons.GlobeIcon },
  { name: 'Cloud', component: Icons.CloudIcon },
  { name: 'PaintBrush', component: Icons.PaintBrushIcon },
  { name: 'PencilSimple', component: Icons.PencilSimpleIcon },
  { name: 'Camera', component: Icons.CameraIcon },
  { name: 'Sparkle', component: Icons.SparkleIcon },
  { name: 'Diamond', component: Icons.DiamondIcon },
  { name: 'Crown', component: Icons.CrownIcon },
  { name: 'Lightning', component: Icons.LightningIcon },
  { name: 'Fire', component: Icons.FireIcon },
  { name: 'MusicNote', component: Icons.MusicNoteIcon },
  { name: 'ArrowRight', component: Icons.ArrowRightIcon },
  { name: 'ArrowLeft', component: Icons.ArrowLeftIcon },
  { name: 'CaretDown', component: Icons.CaretDownIcon },
  { name: 'Check', component: Icons.CheckIcon },
  { name: 'X', component: Icons.XIcon },
  { name: 'Plus', component: Icons.PlusIcon },
  { name: 'Info', component: Icons.InfoIcon },
  { name: 'Warning', component: Icons.WarningIcon },
  { name: 'Eye', component: Icons.EyeIcon },
  { name: 'ShieldCheck', component: Icons.ShieldCheckIcon },
  { name: 'Article', component: Icons.ArticleIcon },
  { name: 'BookOpen', component: Icons.BookOpenIcon },
  { name: 'Tag', component: Icons.TagIcon },
  { name: 'CalendarBlank', component: Icons.CalendarBlankIcon },
  { name: 'Clock', component: Icons.ClockIcon },
  { name: 'MapPin', component: Icons.MapPinIcon },
  { name: 'Money', component: Icons.MoneyIcon },
  { name: 'Gift', component: Icons.GiftIcon },
  { name: 'Handshake', component: Icons.HandshakeIcon },
  { name: 'Smiley', component: Icons.SmileyIcon },
]

type IconPickerProps = {
  label: string
  value: string
  onChange: (value: string) => void
  helper?: string
  diff?: 'modified' | 'added' | 'removed' | undefined
}

function isUrl(v: string) {
  return v.startsWith('http://') || v.startsWith('https://') || v.startsWith('blob:')
}

export function IconPicker({ label, value, onChange, helper, diff }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'icons' | 'upload'>('icons')
  const [uploading, setUploading] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const dropdownHeight = 320
    const spaceBelow = window.innerHeight - rect.bottom
    const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

    setPos({
      top: openAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 280),
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const onScroll = () => updatePosition()
    const scrollParent = triggerRef.current?.closest('.editor-scroll') || window
    scrollParent.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      scrollParent.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open && tab === 'icons') setTimeout(() => searchRef.current?.focus(), 50)
  }, [open, tab])

  const filtered = search
    ? ICON_LIST.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : ICON_LIST

  const CurrentIcon = ICON_LIST.find((i) => i.name === value)?.component

  const handleSelect = useCallback(
    (name: string) => {
      onChange(name)
      setOpen(false)
      setSearch('')
    },
    [onChange]
  )

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const url = await apiUpload(file)
      onChange(url)
      setOpen(false)
    } catch {
      
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`icon-picker ${diff ? `diff-${diff}` : ''}`}>
      <label className="form-field-label">
        {label}
        {diff && <span className={`diff-badge diff-badge-${diff}`}>{diff}</span>}
      </label>
      <button
        ref={triggerRef}
        type="button"
        className={`icon-picker-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className="icon-picker-preview">
          {isUrl(value) ? (
            <img src={value} alt="" className="icon-picker-uploaded-img" />
          ) : CurrentIcon ? (
            <CurrentIcon size={18} weight="regular" />
          ) : null}
        </span>
        <span className="icon-picker-value">
          {isUrl(value) ? 'Custom image' : value || 'Choose icon…'}
        </span>
        <Icons.CaretDownIcon
          size={14}
          className={`icon-picker-caret ${open ? 'rotated' : ''}`}
        />
      </button>
      {helper && <p className="form-field-helper">{helper}</p>}

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="icon-picker-dropdown"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 9999,
          }}
        >
          {}
          <div className="icon-picker-tabs">
            <button
              type="button"
              className={`icon-picker-tab ${tab === 'icons' ? 'active' : ''}`}
              onClick={() => setTab('icons')}
            >
              <Icons.GridFourIcon size={14} /> Icons
            </button>
            <button
              type="button"
              className={`icon-picker-tab ${tab === 'upload' ? 'active' : ''}`}
              onClick={() => setTab('upload')}
            >
              <Icons.CloudArrowUpIcon size={14} /> Upload
            </button>
          </div>

          {tab === 'icons' && (
            <>
              <div className="icon-picker-search-wrap">
                <Icons.MagnifyingGlassIcon size={14} className="icon-picker-search-icon" />
                <input
                  ref={searchRef}
                  className="icon-picker-search"
                  placeholder="Search icons…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="icon-picker-grid">
                {filtered.length === 0 && (
                  <p className="icon-picker-empty">No icons found</p>
                )}
                {filtered.map((icon) => (
                  <button
                    key={icon.name}
                    type="button"
                    className={`icon-picker-option ${value === icon.name ? 'selected' : ''}`}
                    onClick={() => handleSelect(icon.name)}
                    title={icon.name}
                  >
                    <icon.component size={20} weight={value === icon.name ? 'fill' : 'regular'} />
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'upload' && (
            <div className="icon-picker-upload-area">
              {isUrl(value) && (
                <div className="icon-picker-upload-preview">
                  <img src={value} alt="Current icon" />
                  <button
                    type="button"
                    className="icon-picker-upload-clear"
                    onClick={() => { onChange(''); setOpen(false) }}
                  >
                    <Icons.TrashIcon size={14} /> Remove
                  </button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }}
              />
              <button
                type="button"
                className="icon-picker-upload-btn"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <><Icons.CircleNotchIcon size={16} className="icon-spinner" /> Uploading…</>
                ) : (
                  <><Icons.CloudArrowUpIcon size={16} /> Upload custom icon</>
                )}
              </button>
              <p className="icon-picker-upload-hint">
                SVG, PNG or WebP recommended. Image will be uploaded to CDN.
              </p>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
