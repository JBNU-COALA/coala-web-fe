import { useEffect, useState } from 'react'
import { Icon } from '../../shared/ui/Icon'
import { infoApi, type InfoArticle } from '../../shared/api/info'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { getFallbackInfoBoardId } from '../../shared/communityBoards'
import { extractFirstContentImage, toPlainContentPreview } from '../../shared/contentPreview'

type ResourcesCardProps = {
  onOpenInfo?: () => void
  onOpenInfoArticle?: (boardId: number, infoId: number) => void
  dashboard?: boolean
}

function getResourceThumbnailUrl(resource: InfoArticle) {
  const contentImageUrl = extractFirstContentImage(resource.content)
  const thumbnailUrl =
    contentImageUrl ||
    resource.imageUrl ||
    (resource.thumbnailAttachmentId ? `/api/attachments/${resource.thumbnailAttachmentId}/download` : '')
  return resolveApiAssetUrl(thumbnailUrl)
}

const infoResourceLabelByFilter: Record<InfoArticle['filter'], string> = {
  news: '소식',
  contest: '대회',
  lab: '연구실',
  resource: '자료',
}

export function ResourcesCard({ onOpenInfo, onOpenInfoArticle, dashboard = false }: ResourcesCardProps) {
  const [resources, setResources] = useState<InfoArticle[]>([])

  useEffect(() => {
    infoApi.getArticles('all')
      .then((items) => setResources(items.slice(0, dashboard ? 4 : 3)))
      .catch(() => setResources([]))
  }, [dashboard])

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

      <ul className={dashboard ? 'resource-list resource-list--cards' : 'resource-list'}>
        {resources.length === 0 ? (
          <li className="resource-item resource-item--empty">
            정보공유 글이 없습니다.
          </li>
        ) : resources.map((resource) => {
          const thumbnailUrl = getResourceThumbnailUrl(resource)
          const categoryLabel = infoResourceLabelByFilter[resource.filter] ?? resource.meta

          return (
            <li key={resource.id} className={dashboard ? 'resource-item resource-item--card' : 'resource-item'}>
              <button
                type="button"
                className={thumbnailUrl ? 'resource-item-button resource-item-button--with-thumbnail' : 'resource-item-button'}
                onClick={() => onOpenInfoArticle?.(getFallbackInfoBoardId(resource.filter), resource.id)}
              >
                {thumbnailUrl ? (
                  <span
                    className="resource-thumbnail"
                    style={{ backgroundImage: `url(${thumbnailUrl})` }}
                    aria-hidden="true"
                  />
                ) : (
                  <span className={`resource-icon resource-icon--${resource.filter}`}>
                    <Icon name={resource.filter === 'resource' ? 'book' : resource.filter === 'contest' ? 'calendar' : 'file'} size={16} />
                  </span>
                )}
                <span className="resource-item-content">
                  <span className={`resource-category resource-category--${resource.filter}`}>{categoryLabel}</span>
                  <span className="resource-title">{resource.title}</span>
                  <span className="resource-subtitle">{toPlainContentPreview(resource.content).slice(0, 80)}</span>
                  <span className="resource-meta">정보공유 · 조회 {resource.viewCount}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
