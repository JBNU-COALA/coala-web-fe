import { useId, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import './ListingControls.css'

type ListingControlsProps = {
  label: string
  filters?: ReactNode
  children?: ReactNode
  search?: ReactNode
  actions?: ReactNode
  accessory?: ReactNode
  message?: ReactNode
  className?: string
}

export function ListingControls({ label, filters, children, search, actions, accessory, message, className = '' }: ListingControlsProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  return (
    <section className={`listing-controls ${className}`} aria-label={label}>
      {filters ? <div className="listing-controls-filters">{filters}</div> : null}
      <div className="listing-controls-bar">
        {children && <div className="listing-visible-filters">{children}</div>}
        {search && <button ref={trigger} type="button" className="listing-search-toggle" aria-label={`${label} 열기`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}><Icon name="search" size={17} /></button>}
        {actions}
      </div>
      <div id={id} className={`listing-controls-reveal${open ? ' is-open' : ''}`} inert={!open} aria-hidden={!open}
        onKeyDown={(event) => { if (event.key === 'Escape' && !event.defaultPrevented) { setOpen(false); trigger.current?.focus() } }}>
        <div className="listing-controls-panel">
          <div className="listing-controls-actions">{search}</div>
        </div>
      </div>
      {accessory ? (
        <div className="listing-controls-summary">
          {accessory}
        </div>
      ) : null}
      {message}
    </section>
  )
}
