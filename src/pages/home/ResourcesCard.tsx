import { Icon } from '../../shared/ui/Icon'
import { resourceItems } from './homeData'

type ResourcesCardProps = {
  onOpenInfo?: () => void
  dashboard?: boolean
}

export function ResourcesCard({ onOpenInfo, dashboard = false }: ResourcesCardProps) {
  return (
    <section className={dashboard ? 'surface-card panel resources-panel resources-panel--dashboard' : 'surface-card panel resources-panel'}>
      <header className="panel-header">
        <div>
          {dashboard ? <p className="portal-section-eyebrow">Info Share</p> : null}
          <h2 className="panel-title">
            <Icon name="book" size={16} />
            <span>{dashboard ? '정보공유' : '정보공유 업데이트'}</span>
          </h2>
        </div>
        <button
          type="button"
          className={dashboard ? 'panel-action panel-action--solid' : 'icon-action'}
          aria-label="정보공유 페이지 열기"
          onClick={onOpenInfo}
        >
          {dashboard ? '전체 보기' : <Icon name="plus" size={14} />}
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
