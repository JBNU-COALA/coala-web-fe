import { useEffect, useState } from 'react'
import { Icon } from '../../shared/ui/Icon'
import { infoApi, type InfoArticle } from '../../shared/api/info'

type ResourcesCardProps = {
  onOpenInfo?: () => void
  dashboard?: boolean
}

export function ResourcesCard({ onOpenInfo, dashboard = false }: ResourcesCardProps) {
  const [resources, setResources] = useState<InfoArticle[]>([])

  useEffect(() => {
    infoApi.getArticles('all')
      .then((items) => setResources(items.slice(0, 3)))
      .catch(() => setResources([]))
  }, [])

  return (
    <section className={dashboard ? 'surface-card panel resources-panel resources-panel--dashboard' : 'surface-card panel resources-panel'}>
      <header className="panel-header">
        <div>
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
        {resources.map((resource) => (
          <li key={resource.id} className="resource-item">
            <span className="resource-icon resource-icon--mint">
              <Icon name={resource.filter === 'resource' ? 'book' : resource.filter === 'contest' ? 'calendar' : 'file'} size={16} />
            </span>
            <div>
              <p className="resource-title">{resource.title}</p>
              <p className="resource-subtitle">{resource.content.replace(/[#>*_`~-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)}</p>
              <p className="resource-meta">정보공유 · {resource.meta}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
