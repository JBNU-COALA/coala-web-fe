import { useId, useState, type ReactNode } from 'react'
import { Icon } from '../../shared/ui/Icon'
import './admin-search.css'

export function AdminSearch({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return <div className="admin-search-disclosure">
    <button type="button" className="admin-search-trigger" aria-label="검색창 열기" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}><Icon name="search" size={16} /></button>
    <div id={id} className={`admin-search-reveal${open ? ' is-open' : ''}`} inert={!open} aria-hidden={!open}>
      <div>{children}</div>
    </div>
  </div>
}
