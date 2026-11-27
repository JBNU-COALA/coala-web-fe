import { useEffect, useId, useRef, type ReactNode } from 'react'
import './confirmDialog.css'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
  hideCancel?: boolean
  className?: string
}

export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel, onConfirm, onCancel, children, hideCancel = false, className = '' }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open) {
      delete dialog.dataset.closing
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        dialog.close()
        return
      }
      dialog.dataset.closing = 'true'
      const timer = window.setTimeout(() => { dialog.close(); delete dialog.dataset.closing }, 180)
      return () => window.clearTimeout(timer)
    }
  }, [open])
  return (
    <dialog ref={ref} className={`confirm-dialog ${className}`} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onCancel={(event) => { event.preventDefault(); onCancel() }}>
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{description}</p>
      {children}
      <div className="confirm-dialog-actions">
        {!hideCancel && <button type="button" disabled={!open} autoFocus onClick={onCancel}>{cancelLabel}</button>}
        <button type="button" disabled={!open} autoFocus={hideCancel} className="confirm-dialog-primary" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  )
}
