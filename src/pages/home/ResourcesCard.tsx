import { useEffect, useState } from 'react'
import { Icon } from '../../shared/ui/Icon'
import { infoApi, type InfoArticle } from '../../shared/api/info'
import { getFallbackInfoBoardId } from '../../shared/communityBoards'
import { extractFirstContentImage, toPlainContentPreview } from '../../shared/contentPreview'

type ResourcesCardProps = {
  onOpenInfo?: () => void
  onOpenInfoArticle?: (boardId: number, infoId: number) => void
  dashboard?: boolean
}

function getResourceThumbnailUrl(resource: InfoArticle) {
  const contentImageUrl = extractFirstContentImage(resource.content)
  if (contentImageUrl) return contentImageUrl
  return resource.imageUrl && !resource.imageUrl.includes('images.unsplash.com') ? resource.imageUrl : ''
}

export function ResourcesCard({ onOpenInfo, onOpenInfoArticle, dashboard = false }: ResourcesCardProps) {
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
        {resources.map((resource) => {
          const thumbnailUrl = getResourceThumbnailUrl(resource)

          return (
            <li key={resource.id} className="resource-item">
              <button
                type="button"
                className="resource-item-button"
                onClick={() => onOpenInfoArticle?.(getFallbackInfoBoardId(resource.filter), resource.id)}
              >
                {thumbnailUrl ? (
                  <span
                    className="resource-thumbnail"
                    style={{ backgroundImage: `url(${thumbnailUrl})` }}
                    aria-hidden="true"
                  />
                ) : (
                  <span className="resource-icon resource-icon--mint">
                    <Icon name={resource.filter === 'resource' ? 'book' : resource.filter === 'contest' ? 'calendar' : 'file'} size={16} />
                  </span>
                )}
                <span className="resource-item-content">
                  <span className="resource-title">{resource.title}</span>
                  <span className="resource-subtitle">{toPlainContentPreview(resource.content).slice(0, 80)}</span>
                  <span className="resource-meta">정보공유 · {resource.meta}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
