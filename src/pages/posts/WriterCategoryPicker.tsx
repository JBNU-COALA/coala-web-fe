import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../../shared/ui/Icon'
import '../../shared/ui/confirmDialog.css'

type Props = { label: string; value: string; options: { value: string; label: string }[]; disabled?: boolean; onChange: (value: string) => void }
export function WriterCategoryPicker({ label, value, options, disabled, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open) {
      delete dialog.dataset.closing
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { dialog.close(); return }
      dialog.dataset.closing = 'true'
      const timer = window.setTimeout(() => { dialog.close(); delete dialog.dataset.closing }, 180)
      return () => window.clearTimeout(timer)
    }
  }, [open])
  return <>
    <button type="button" className="writer-category-trigger" disabled={disabled} aria-label={`${label}: ${options.find((option) => option.value === value)?.label ?? ''}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      {options.find((option) => option.value === value)?.label ?? label}<Icon name="chevron-down" size={14} />
    </button>
    <dialog ref={ref} className="confirm-dialog writer-category-dialog" aria-labelledby={`${id}-title`} onCancel={(event) => { event.preventDefault(); setOpen(false) }}>
      <h2 id={`${id}-title`}>{label}</h2>
      <div role="listbox" aria-label={label} className="writer-category-options">
        {options.map((option) => <button type="button" role="option" aria-selected={option.value === value} key={option.value} disabled={!open} onClick={() => { onChange(option.value); setOpen(false) }}>{option.label}{option.value === value && <span aria-hidden="true">✓</span>}</button>)}
      </div>
      <div className="confirm-dialog-actions"><button type="button" autoFocus disabled={!open} onClick={() => setOpen(false)}>닫기</button></div>
    </dialog>
  </>
}
