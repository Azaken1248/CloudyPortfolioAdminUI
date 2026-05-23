import type { ReactNode } from 'react'
import './EditorCard.css'

type EditorCardProps = {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function EditorCard({
  title,
  description,
  icon,
  children,
  className = '',
}: EditorCardProps) {
  return (
    <div className={`editor-card ${className}`}>
      <div className="editor-card-header">
        {icon && <div className="editor-card-icon">{icon}</div>}
        <div>
          <h3 className="editor-card-title">{title}</h3>
          {description && (
            <p className="editor-card-description">{description}</p>
          )}
        </div>
      </div>
      <div className="editor-card-body">{children}</div>
    </div>
  )
}
