import type { ReactNode } from 'react'
import { CircleNotchIcon } from '@phosphor-icons/react'
import './ActionButton.css'

type ActionButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}

export function ActionButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  onClick,
  type = 'button',
  className = '',
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={`action-btn action-btn-${variant} action-btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <CircleNotchIcon size={16} className="action-btn-spinner" />
      ) : (
        icon && <span className="action-btn-icon">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  )
}
