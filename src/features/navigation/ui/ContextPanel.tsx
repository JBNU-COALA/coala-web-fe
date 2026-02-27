import { Icon } from '../../../shared/ui/Icon'
import type { ContextPanelData, ContextPanelItem } from '../model/navigationData'

type ContextPanelProps = {
  panel: ContextPanelData
  onSelect: (item: ContextPanelItem) => void
}

export function ContextPanel({ panel, onSelect }: ContextPanelProps) {
  return (
    <section className="surface-card context-card" aria-label={panel.title}>
      <header className="context-card-header">
        <h2 className="context-card-title">{panel.title}</h2>
        <p className="context-card-description">{panel.description}</p>
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
