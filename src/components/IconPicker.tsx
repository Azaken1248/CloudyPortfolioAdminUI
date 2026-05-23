import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import * as Icons from '@phosphor-icons/react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { apiUpload } from '../config/api'
import './IconPicker.css'

const ICON_LIST: { name: string; component: PhosphorIcon }[] = [
  { name: 'House', component: Icons.House },
  { name: 'Image', component: Icons.Image },
  { name: 'Palette', component: Icons.Palette },
  { name: 'ChatCircleText', component: Icons.ChatCircleText },
  { name: 'Envelope', component: Icons.Envelope },
  { name: 'Gear', component: Icons.Gear },
  { name: 'User', component: Icons.User },
  { name: 'Star', component: Icons.Star },
  { name: 'Heart', component: Icons.Heart },
  { name: 'MagnifyingGlass', component: Icons.MagnifyingGlass },
  { name: 'InstagramLogo', component: Icons.InstagramLogo },
  { name: 'TwitterLogo', component: Icons.TwitterLogo },
  { name: 'DiscordLogo', component: Icons.DiscordLogo },
  { name: 'YoutubeLogo', component: Icons.YoutubeLogo },
  { name: 'TiktokLogo', component: Icons.TiktokLogo },
  { name: 'GithubLogo', component: Icons.GithubLogo },
  { name: 'LinkedinLogo', component: Icons.LinkedinLogo },
  { name: 'TwitchLogo', component: Icons.TwitchLogo },
  { name: 'LinkSimple', component: Icons.LinkSimple },
  { name: 'Globe', component: Icons.Globe },
  { name: 'Cloud', component: Icons.Cloud },
  { name: 'PaintBrush', component: Icons.PaintBrush },
  { name: 'PencilSimple', component: Icons.PencilSimple },
  { name: 'Camera', component: Icons.Camera },
  { name: 'Sparkle', component: Icons.Sparkle },
  { name: 'Diamond', component: Icons.Diamond },
  { name: 'Crown', component: Icons.Crown },
  { name: 'Lightning', component: Icons.Lightning },
  { name: 'Fire', component: Icons.Fire },
  { name: 'MusicNote', component: Icons.MusicNote },
  { name: 'ArrowRight', component: Icons.ArrowRight },
  { name: 'ArrowLeft', component: Icons.ArrowLeft },
  { name: 'CaretDown', component: Icons.CaretDown },
  { name: 'Check', component: Icons.Check },
  { name: 'X', component: Icons.X },
  { name: 'Plus', component: Icons.Plus },
  { name: 'Info', component: Icons.Info },
  { name: 'Warning', component: Icons.Warning },
  { name: 'Eye', component: Icons.Eye },
  { name: 'ShieldCheck', component: Icons.ShieldCheck },
  { name: 'Article', component: Icons.Article },
  { name: 'BookOpen', component: Icons.BookOpen },
  { name: 'Tag', component: Icons.Tag },
  { name: 'CalendarBlank', component: Icons.CalendarBlank },
  { name: 'Clock', component: Icons.Clock },
  { name: 'MapPin', component: Icons.MapPin },
  { name: 'Money', component: Icons.Money },
  { name: 'Gift', component: Icons.Gift },
  { name: 'Handshake', component: Icons.Handshake },
  { name: 'Smiley', component: Icons.Smiley },
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
        <Icons.CaretDown
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
              <Icons.GridFour size={14} /> Icons
            </button>
            <button
              type="button"
              className={`icon-picker-tab ${tab === 'upload' ? 'active' : ''}`}
              onClick={() => setTab('upload')}
            >
              <Icons.CloudArrowUp size={14} /> Upload
            </button>
          </div>

          {tab === 'icons' && (
            <>
              <div className="icon-picker-search-wrap">
                <Icons.MagnifyingGlass size={14} className="icon-picker-search-icon" />
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
                    <Icons.Trash size={14} /> Remove
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
                  <><Icons.CircleNotch size={16} className="icon-spinner" /> Uploading…</>
                ) : (
                  <><Icons.CloudArrowUp size={16} /> Upload custom icon</>
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
