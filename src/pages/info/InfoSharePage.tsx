import { useMemo, useState } from 'react'
import {
  featuredArticle,
  infoCalendar,
  infoFilters,
  latestInfoTabs,
  latestInfoUpdates,
  resourceCards,
  type InfoFilterId,
  type LatestInfoTabId,
} from '../../features/info/model/infoData'
import { Icon } from '../../shared/ui/Icon'

export function InfoSharePage() {
  const [activeFilter, setActiveFilter] = useState<InfoFilterId>('all')
  const [query, setQuery] = useState('')
  const [activeLatestTab, setActiveLatestTab] = useState<LatestInfoTabId>('all')

  const normalizedQuery = query.trim().toLowerCase()

  const visibleResources = useMemo(() => {
    const filteredByType =
      activeFilter === 'all'
        ? resourceCards
        : resourceCards.filter((card) => card.filter === activeFilter)

    if (!normalizedQuery) {
      return filteredByType
    }

    return filteredByType.filter((card) => {
      const searchable = `${card.title} ${card.meta} ${card.source}`.toLowerCase()
      return searchable.includes(normalizedQuery)
    })
  }, [activeFilter, normalizedQuery])

  const visibleLatestInfo = useMemo(() => {
    if (activeLatestTab === 'all') {
      return latestInfoUpdates
    }

    return latestInfoUpdates.filter((item) => item.type === activeLatestTab)
  }, [activeLatestTab])

  return (
    <section className="coala-content coala-content--info">
      <article className="surface-card info-shell">
        <header className="info-header">
          <h2 className="info-title">정보공유</h2>
          <p className="info-subtitle">
            스터디 자료, 운영 문서, 외부 레퍼런스를 탐색하고 팀과 공유하세요.
          </p>
        </header>

        <section className="info-hero" aria-label="대표 아티클">
          <div className="info-hero-copy">
            <p className="info-hero-category">{featuredArticle.category}</p>
            <h3 className="info-hero-title">{featuredArticle.title}</h3>
            <p className="info-hero-description">{featuredArticle.description}</p>
            <div className="info-hero-controls">
              <button type="button" className="hero-arrow-button" aria-label="이전">
                <Icon name="chevron-left" size={16} />
              </button>
              <button type="button" className="hero-arrow-button" aria-label="다음">
                <Icon name="chevron-right" size={16} />
              </button>
            </div>
          </div>
          <img src={featuredArticle.imageUrl} alt="대표 아티클" className="info-hero-image" />
        </section>

        <section className="info-highlights" aria-label="캘린더와 최신 정보">
          <section className="surface-card info-calendar-card" aria-label="이번 달 일정">
            <header className="info-calendar-header">
              <div>
                <p className="calendar-eyebrow">COALA 일정</p>
                <h3 className="calendar-title">{infoCalendar.monthLabel}</h3>
              </div>
              <button type="button" className="calendar-manage-button">
                일정 관리
              </button>
            </header>

            <div className="info-calendar-grid" role="grid">
              {infoCalendar.weekdayLabels.map((weekday) => (
                <div key={weekday} className="calendar-weekday">
                  {weekday}
                </div>
              ))}
              {infoCalendar.days.map((day) => {
                const className = [
                  'calendar-day',
                  day.isMuted ? 'is-muted' : '',
                  day.hasEvent ? 'has-event' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <div key={day.id} className={className} role="gridcell" aria-label={`${day.label}일`}>
                    {day.label}
                    {day.hasEvent ? <span className="calendar-dot" /> : null}
                  </div>
                )
              })}
            </div>

            <ul className="info-calendar-schedule">
              {infoCalendar.schedules.map((schedule) => (
                <li key={schedule.id} className="calendar-schedule-item">
                  <p className="calendar-schedule-date">{schedule.dateLabel}</p>
                  <div>
                    <p className="calendar-schedule-title">{schedule.title}</p>
                    <p className="calendar-schedule-type">{schedule.type}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="surface-card info-latest-card" aria-label="최신 정보">
            <header className="info-latest-header">
              <div>
                <p className="info-latest-eyebrow">최신 정보</p>
                <h3 className="info-latest-title">지금 막 올라온 소식</h3>
              </div>
              <ul className="latest-tab-list" role="tablist">
                {latestInfoTabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeLatestTab === tab.id}
                      className={
                        activeLatestTab === tab.id
                          ? 'latest-tab-button is-active'
                          : 'latest-tab-button'
                      }
                      onClick={() => setActiveLatestTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </header>

            <ul className="latest-info-list">
              {visibleLatestInfo.map((item) => (
                <li key={item.id} className="latest-info-item">
                  <div className="latest-info-head">
                    <span className="latest-info-category">{item.category}</span>
                    <span className="latest-info-time">{item.timestamp}</span>
                  </div>
                  <p className="latest-info-title">{item.title}</p>
                  <p className="latest-info-summary">{item.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        </section>

        <section className="info-resource-zone" aria-label="전체 자료">
          <header className="info-resource-header">
            <p className="info-resource-eyebrow">전체 정보</p>
            <h3 className="info-resource-title">PDF 가이드, 스터디 자료, 링크를 한 번에</h3>
          </header>

          <section className="resource-board">
            <header className="resource-board-header">
              <label className="resource-search-bar">
                <Icon name="search" size={15} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="가이드, PDF, 링크를 검색하세요"
                />
              </label>
              <ul className="resource-filter-list" aria-label="자료 필터">
                {infoFilters.map((filter) => (
                  <li key={filter.id}>
                    <button
                      type="button"
                      className={
                        activeFilter === filter.id
                          ? 'resource-filter-chip is-active'
                          : 'resource-filter-chip'
                      }
                      onClick={() => setActiveFilter(filter.id)}
                    >
                      {filter.label}
                    </button>
                  </li>
                ))}
              </ul>
            </header>

            <ul className="resource-card-grid">
              {visibleResources.map((card) => (
                <li key={card.id} className="resource-card-item">
                  <div className="resource-card-media-wrap">
                    <img src={card.imageUrl} alt={card.title} className="resource-card-image" />
                    <span className="resource-card-tag">{card.tag}</span>
                  </div>
                  <div className="resource-card-body">
                    <h4 className="resource-card-title">{card.title}</h4>
                    <p className="resource-card-source">{card.source}</p>
                  </div>
                  <footer className="resource-card-footer">
                    <span>{card.meta}</span>
                    <button type="button" className="resource-card-action" aria-label="자료 열기">
                      <Icon name="link" size={14} />
                    </button>
                  </footer>
                </li>
              ))}
            </ul>

            <div className="resource-board-footer">
              <button type="button" className="load-more-button">
                자료 더 보기
              </button>
              <p className="resource-count-text">
                총 {visibleResources.length}개 / 전체 {resourceCards.length}개 자료 표시 중
              </p>
            </div>
          </section>
        </section>
      </article>
    </section>
  )
}
