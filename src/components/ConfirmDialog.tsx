import { useEffect, useRef, type ReactNode } from 'react'
import { Warning } from '@phosphor-icons/react'
import { ActionButton } from './ActionButton'
import './ConfirmDialog.css'

type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
  icon?: ReactNode
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
  icon,
  loading,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog ref={dialogRef} className="confirm-dialog" onClose={onClose}>
      <div className="confirm-dialog-content">
        <div className="confirm-dialog-icon">
          {icon ?? <Warning size={24} weight="fill" />}
        </div>
        <h3 className="confirm-dialog-title">{title}</h3>
        {description && (
          <p className="confirm-dialog-description">{description}</p>
        )}
        <div className="confirm-dialog-actions">
          <ActionButton variant="ghost" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            variant={variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </ActionButton>
        </div>
      </div>
    </dialog>
  )
}
