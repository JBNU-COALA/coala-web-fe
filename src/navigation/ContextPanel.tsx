import { Icon } from '../shared/ui/Icon'
import type { ContextPanelData, ContextPanelItem } from './navigationData'

type ContextPanelProps = {
  panel: ContextPanelData
  onSelect: (item: ContextPanelItem) => void
  variant?: 'card' | 'bar'
}

export function ContextPanel({ panel, onSelect, variant = 'card' }: ContextPanelProps) {
  if (variant === 'bar') {
    return (
      <nav className="context-tabs" aria-label={panel.title}>
        {panel.items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.isActive ? 'context-tab is-active' : 'context-tab'}
            onClick={() => onSelect(item)}
          >
            <span>{item.label}</span>
            {item.badge ? <small>{item.badge}</small> : null}
          </button>
        ))}
      </nav>
    )
  }

  const className = 'surface-card context-card'

  return (
    <section className={className} aria-label={panel.title}>
      <header className="context-card-header">
        <h2 className="context-card-title">{panel.title}</h2>
        {panel.description ? (
          <p className="context-card-description">{panel.description}</p>
        ) : null}
      </header>

      <ul className="context-item-list">
        {panel.items.map((item) => (
          <li key={item.id} className={item.isActive ? 'context-item is-active' : 'context-item'}>
            <button type="button" className="context-item-button" onClick={() => onSelect(item)}>
              <span className="context-item-icon">
                <Icon name={item.icon} size={15} />
              </span>
              <span className="context-item-content">
                <span className="context-item-label">{item.label}</span>
                {item.description ? (
                  <span className="context-item-description">{item.description}</span>
                ) : null}
              </span>
              {item.badge ? <span className="context-item-badge">{item.badge}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
