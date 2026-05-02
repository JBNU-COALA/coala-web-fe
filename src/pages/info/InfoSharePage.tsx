import { useMemo, useState } from 'react'
import {
  infoFilters,
  latestInfoUpdates,
  resourceCards,
  type InfoFilterId,
} from './infoData'
import { Icon } from '../../shared/ui/Icon'
import { CommunityBanner } from '../community/CommunityBanner'

type InfoSharePageProps = {
  onWriteInfo?: () => void
}

const filterIconById: Record<InfoFilterId, Parameters<typeof Icon>[0]['name']> = {
  news: 'bell',
  contest: 'calendar',
  lab: 'network',
  resource: 'file',
}

export function InfoSharePage({ onWriteInfo: _onWriteInfo }: InfoSharePageProps) {
  const [activeFilter, setActiveFilter] = useState<InfoFilterId>('news')
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()
  const activeFilterLabel =
    infoFilters.find((filter) => filter.id === activeFilter)?.label ?? '정보'

  const visibleResources = useMemo(() => {
    const filteredByType = resourceCards.filter((card) => card.filter === activeFilter)

    if (!normalizedQuery) {
      return filteredByType
    }

    return filteredByType.filter((card) => {
      const searchable = `${card.title} ${card.meta} ${card.source} ${card.tag}`.toLowerCase()
      return searchable.includes(normalizedQuery)
    })
  }, [activeFilter, normalizedQuery])

  const popularInfo = useMemo(() => {
    const images = [
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80',
    ]

    return latestInfoUpdates.slice(0, 3).map((item, index) => ({
      label: '인기 정보',
      title: item.title,
      imageUrl: images[index % images.length],
    }))
  }, [])

  return (
    <section className="coala-content coala-content--info">
      <article className="info-shell">
        <CommunityBanner title="정보공유" tone="info" images={popularInfo} />

        <section className="surface-card community-list-controls info-list-controls" aria-label="정보공유 필터">
          <div className="community-list-controls__top">
            <div className="community-list-heading">
              <p>{activeFilterLabel}</p>
              <strong>{visibleResources.length}개 정보</strong>
            </div>
            <label className="community-list-search">
              <Icon name="search" size={15} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="소식, 대회, 연구실, 자료 검색"
              />
            </label>
          </div>

          <div className="community-filter-tabs" role="tablist" aria-label="정보공유 분류">
            {infoFilters.map((filter) => (
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

        <section className="surface-card info-resource-zone" aria-label="정보공유 목록">
          <ul className="info-list">
            {visibleResources.map((card) => (
              <li key={card.id} className="info-list-item">
                <span className="info-list-tag">{card.tag}</span>
                <div className="info-list-main">
                  <h3>{card.title}</h3>
                  <p>{card.source}</p>
                </div>
                <div className="info-list-side">
                  <span>{card.meta}</span>
                  <button type="button" className="info-list-action" aria-label="정보 열기">
                    <Icon name="link" size={14} />
                  </button>
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
