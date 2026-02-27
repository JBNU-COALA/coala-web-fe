import { Icon } from '../../../shared/ui/Icon'
import { resourceItems } from '../model/homeData'

type ResourcesCardProps = {
  onOpenInfo?: () => void
}

export function ResourcesCard({ onOpenInfo }: ResourcesCardProps) {
  return (
    <section className="surface-card panel resources-panel">
      <header className="panel-header">
        <h2 className="panel-title">
          <Icon name="book" size={16} />
          <span>정보공유</span>
        </h2>
        <button
          type="button"
          className="icon-action"
          aria-label="정보공유 페이지 열기"
          onClick={onOpenInfo}
        >
          <Icon name="plus" size={14} />
        </button>
      </header>

      <ul className="resource-list">
        {resourceItems.map((resource) => (
          <li key={resource.id} className="resource-item">
            <span className={`resource-icon resource-icon--${resource.tone}`}>
              <Icon name={resource.icon} size={16} />
            </span>
            <div>
              <p className="resource-title">{resource.title}</p>
              <p className="resource-subtitle">{resource.subtitle}</p>
              <p className="resource-meta">{resource.meta}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

