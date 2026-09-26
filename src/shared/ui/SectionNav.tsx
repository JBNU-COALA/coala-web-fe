import { useEffect, useRef, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import './SectionNav.css'

type SectionNavProps<T extends string> = {
  label: string
  items: readonly { id: T; label: string; icon?: IconName }[]
  value: T
  onChange: (id: T) => void
  action?: ReactNode
  className?: string
}

export function SectionNav<T extends string>({
  label,
  items,
  value,
  onChange,
  action,
  className = '',
}: SectionNavProps<T>) {
  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = strip.current
    const selected = container?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    )
    if (!container || !selected) return
    const revealSelection = () => {
      const left = selected.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft
      if (left < container.scrollLeft) container.scrollLeft = left
      else if (left + selected.offsetWidth > container.scrollLeft + container.clientWidth) {
        container.scrollLeft = left + selected.offsetWidth - container.clientWidth
      }
    }
    revealSelection()
    const observer = new ResizeObserver(revealSelection)
    observer.observe(container)
    return () => observer.disconnect()
  }, [value])

  return (
    <nav className={`section-nav ${className}`} aria-label={label}>
      <div className="section-nav-items" ref={strip}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={value === item.id ? 'page' : undefined}
            className="section-nav-item"
            onClick={() => onChange(item.id)}
          >
            {item.icon && <Icon name={item.icon} size={16} />}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      {action && <div className="section-nav-action">{action}</div>}
    </nav>
  )
}
