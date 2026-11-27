import { useId, useState } from 'react'
import { Icon } from '../../../shared/ui/Icon'

export function CtfHint({ hint, number }: { hint: string; number: number }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return <div className={`ctf-hint${open ? ' is-open' : ''}`}>
    <button type="button" className="ctf-hint-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
      <Icon name="chevron-right" size={16} />힌트 {number}
    </button>
    <div id={id} className="ctf-hint-content" aria-hidden={!open} inert={!open}>
      <div><p>{hint}</p></div>
    </div>
  </div>
}
