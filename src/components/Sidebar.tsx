import {
  Gear,
  Star,
  Images,
  Palette,
  ChatCircleText,
  Shield,
  Envelope,
  SignOut,
  Cloud,
  GitDiff,
} from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useDraftStore } from '../store/useDraftStore'
import './Sidebar.css'

const NAV_ITEMS = [
  { id: 'config', label: 'Site Config', icon: Gear },
  { id: 'hero', label: 'Hero Section', icon: Star },
  { id: 'gallery', label: 'Gallery', icon: Images },
  { id: 'commissions', label: 'Commissions', icon: Palette },
  { id: 'faq', label: 'FAQ', icon: ChatCircleText },
  { id: 'tos', label: 'Terms of Service', icon: Shield },
  { id: 'contact', label: 'Contact', icon: Envelope },
] as const

type SidebarProps = {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user, logout } = useAuth()
  const isDirty = useDraftStore((s) => s.isDirty())

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=64`
    : null

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Cloud size={24} weight="fill" />
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
          <GitDiff size={18} weight={activeTab === 'changes' ? 'fill' : 'regular'} />
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
          <SignOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
