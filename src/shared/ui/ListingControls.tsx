import type { ReactNode } from 'react'
import './ListingControls.css'

type ListingControlsProps = {
  label: string
  count: string
  filters: ReactNode
  children: ReactNode
  accessory?: ReactNode
  message?: ReactNode
  className?: string
}

export function ListingControls({ label, count, filters, children, accessory, message, className = '' }: ListingControlsProps) {
  return (
    <section className={`listing-controls ${className}`} aria-label={label}>
      <div className="listing-controls-filters">{filters}</div>
      <div className="listing-controls-summary">
        <span role="status">{count}</span>
        {accessory}
      </div>
      <div className="listing-controls-actions">{children}</div>
      {message}
    </section>
  )
}
