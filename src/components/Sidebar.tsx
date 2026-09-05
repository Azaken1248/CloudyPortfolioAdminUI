import {
  GearIcon,
  StarIcon,
  ImagesIcon,
  PaletteIcon,
  ChatCircleTextIcon,
  ShieldIcon,
  EnvelopeIcon,
  SignOutIcon,
  GitDiffIcon,
} from '@phosphor-icons/react'
import { useMemo } from 'react'
import { useAuth } from '../context/authContext'
import { useDraftStore } from '../store/useDraftStore'
import './Sidebar.css'

const NAV_ITEMS = [
  { id: 'config', label: 'Site Config', icon: GearIcon },
  { id: 'hero', label: 'Hero Section', icon: StarIcon },
  { id: 'gallery', label: 'Gallery', icon: ImagesIcon },
  { id: 'commissions', label: 'Commissions', icon: PaletteIcon },
  { id: 'faq', label: 'FAQ', icon: ChatCircleTextIcon },
  { id: 'tos', label: 'Terms of Service', icon: ShieldIcon },
  { id: 'contact', label: 'Contact', icon: EnvelopeIcon },
] as const

type SidebarProps = {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user, logout } = useAuth()
  // Subscribe to the two states rather than calling isDirty() inside the
  // selector: a selector runs on every store change, so the comparison ran on
  // every keystroke regardless of whether either state had actually changed.
  const liveState = useDraftStore((s) => s.liveState)
  const draftState = useDraftStore((s) => s.draftState)
  const isDirty = useMemo(
    () => (liveState && draftState ? useDraftStore.getState().isDirty() : false),
    [liveState, draftState],
  )

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=64`
    : null

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/favicon.svg" alt="Cloudy" width={24} height={24} style={{ display: 'block' }} />
          <span className="sidebar-logo-text">Cloudy Admin</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
              type="button"
            >
              <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
              <span>{item.label}</span>
            </button>
          )
        })}

        <div className="sidebar-nav-divider" />

        <button
          className={`sidebar-nav-item sidebar-nav-changes ${activeTab === 'changes' ? 'active' : ''}`}
          onClick={() => onTabChange('changes')}
          type="button"
        >
          <GitDiffIcon size={18} weight={activeTab === 'changes' ? 'fill' : 'regular'} />
          <span>Changes</span>
          {isDirty && <span className="sidebar-changes-dot" />}
        </button>
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.username}
                className="sidebar-avatar"
              />
            ) : (
              <div className="sidebar-avatar-placeholder">
                {user.username[0]?.toUpperCase()}
              </div>
            )}
            <div className="sidebar-user-info">
              <span className="sidebar-username">{user.username}</span>
              <span className="sidebar-role">Admin</span>
            </div>
          </div>
        )}
        <button className="sidebar-logout" onClick={logout} type="button">
          <SignOutIcon size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
