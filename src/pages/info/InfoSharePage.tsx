import { useMemo, useState } from 'react'
import { resourceCards, type InfoFilterId } from './infoData'
import { Icon } from '../../shared/ui/Icon'
import { CommunityBanner } from '../community/CommunityBanner'

type InfoSharePageProps = {
  onWriteInfo?: () => void
  onOpenInfo?: (id: string) => void
}

type InfoTabId = 'all' | InfoFilterId

const infoTabFilters: { id: InfoTabId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'news', label: '소식' },
  { id: 'contest', label: '대회' },
  { id: 'lab', label: '연구실' },
  { id: 'resource', label: '자료' },
]

const filterIconById: Record<InfoTabId, Parameters<typeof Icon>[0]['name']> = {
  all: 'layout',
  news: 'bell',
  contest: 'calendar',
  lab: 'network',
  resource: 'file',
}

export function InfoSharePage({ onWriteInfo, onOpenInfo }: InfoSharePageProps) {
  const [activeFilter, setActiveFilter] = useState<InfoTabId>('all')
  const [query, setQuery] = useState('')
  const [savedResourceIds, setSavedResourceIds] = useState<Set<string>>(() => new Set())
  const [copiedResourceId, setCopiedResourceId] = useState<string | null>(null)

  const normalizedQuery = query.trim().toLowerCase()
  const activeFilterLabel =
    infoTabFilters.find((filter) => filter.id === activeFilter)?.label ?? '전체'

  const visibleResources = useMemo(() => {
    const filteredByType =
      activeFilter === 'all'
        ? resourceCards
        : resourceCards.filter((card) => card.filter === activeFilter)

    if (!normalizedQuery) {
      return filteredByType
    }

    return filteredByType.filter((card) => {
      const searchable = `${card.title} ${card.meta} ${card.source} ${card.tag}`.toLowerCase()
      return searchable.includes(normalizedQuery)
    })
  }, [activeFilter, normalizedQuery])

  const toggleSavedResource = (resourceId: string) => {
    setSavedResourceIds((current) => {
      const next = new Set(current)
      if (next.has(resourceId)) next.delete(resourceId)
      else next.add(resourceId)
      return next
    })
  }

  const copyResourceTitle = async (resourceId: string, title: string) => {
    try {
      await navigator.clipboard.writeText(title)
      setCopiedResourceId(resourceId)
      setTimeout(() => setCopiedResourceId(null), 1600)
    } catch {
      setCopiedResourceId(null)
    }
  }

  return (
    <section className="coala-content coala-content--info">
      <article className="info-shell">
        <CommunityBanner
          title="정보공유"
          tone="info"
        />

        <section className="surface-card community-list-controls info-list-controls" aria-label="정보공유 필터">
          <div className="community-list-controls__top">
            <div className="community-list-heading">
              <p>{activeFilterLabel}</p>
              <strong>{visibleResources.length}개 정보</strong>
            </div>
            <div className="community-list-actions">
              <label className="community-list-search">
                <Icon name="search" size={15} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="소식, 대회, 연구실, 자료 검색"
                />
              </label>
              <button
                type="button"
                className="write-post-button write-post-button--info"
                onClick={onWriteInfo}
              >
                <Icon name="edit" size={15} />
                글쓰기
              </button>
            </div>
          </div>

          <div className="community-filter-tabs" role="tablist" aria-label="정보공유 분류">
            {infoTabFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={activeFilter === filter.id}
                className={
                  activeFilter === filter.id
                    ? 'community-filter-tab is-active'
                    : 'community-filter-tab'
                }
                onClick={() => setActiveFilter(filter.id)}
              >
                <Icon name={filterIconById[filter.id]} size={15} />
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="surface-card info-resource-zone info-resource-zone--editorial" aria-label="정보공유 목록">
          <ul className="info-list info-list--editorial">
            {visibleResources.map((card) => (
              <li key={card.id} className="info-list-item info-list-item--editorial">
                <button
                  type="button"
                  className="info-list-open"
                  onClick={() => onOpenInfo?.(card.id)}
                >
                  <span className="info-list-tag">{card.tag}</span>
                  <div className="info-list-main">
                    <h3>{card.title}</h3>
                    <p>{card.source}</p>
                    <small>{card.meta}</small>
                  </div>
                </button>

                <div className="info-list-side">
                  <div className="info-list-actions">
                    <button
                      type="button"
                      className={
                        savedResourceIds.has(card.id)
                          ? 'info-list-action info-list-action--active'
                          : 'info-list-action'
                      }
                      aria-label="정보 저장"
                      aria-pressed={savedResourceIds.has(card.id)}
                      onClick={() => toggleSavedResource(card.id)}
                    >
                      <Icon name="book" size={14} />
                    </button>
                    <button
                      type="button"
                      className="info-list-action"
                      aria-label="정보 제목 복사"
                      onClick={() => copyResourceTitle(card.id, card.title)}
                    >
                      <Icon name={copiedResourceId === card.id ? 'copy' : 'link'} size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))}

            {visibleResources.length === 0 ? (
              <li className="info-list-empty">조건에 맞는 정보가 없습니다.</li>
            ) : null}
          </ul>
        </section>
      </article>
    </section>
  )
}
