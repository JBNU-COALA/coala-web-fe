import { useMemo, useState } from 'react'
import {
  infoCalendar,
  infoFilters,
  latestInfoTabs,
  latestInfoUpdates,
  resourceCards,
  type InfoFilterId,
  type LatestInfoTabId,
} from './infoData'
import { Icon } from '../../shared/ui/Icon'

type InfoSharePageProps = {
  onWriteInfo?: () => void
}

export function InfoSharePage({ onWriteInfo }: InfoSharePageProps) {
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
      <article className="info-shell">
        <header className="info-header">
          <div>
            <p className="info-eyebrow">Info Share</p>
            <h2 className="info-title">정보공유</h2>
          </div>
          <button type="button" className="write-post-button write-post-button--info" onClick={onWriteInfo}>
            <Icon name="edit" size={15} />
            정보공유 글쓰기
          </button>
        </header>

        <section className="surface-card info-intro-card info-intro-card--banner">
          <div className="info-intro-copy">
            <p className="info-intro-kicker">정보공유</p>
            <h3>정보공유 게시판</h3>
            <p>
              이 게시판은 동아리 정보공유 및 외부 개발자료 등을 공유하는 공간입니다.
            </p>
            <p>스터디 자료, 개발 레퍼런스, 운영 문서, 유용한 링크를 모아 확인합니다.</p>
          </div>
        </section>

        <section className="surface-card info-latest-card" aria-label="최신 정보">
          <header className="info-latest-header">
            <div>
              <p className="info-latest-eyebrow">최신정보</p>
              <h3 className="info-latest-title">최근 공유된 소식</h3>
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

        <section className="surface-card info-calendar-card" aria-label="일정">
          <header className="info-calendar-header">
            <div>
              <p className="calendar-eyebrow">일정</p>
              <h3 className="calendar-title">{infoCalendar.monthLabel}</h3>
            </div>
          </header>

          <div className="info-calendar-layout">
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
          </div>
        </section>

        <section className="surface-card info-resource-zone" aria-label="전체 정보">
          <header className="info-resource-header">
            <div>
              <p className="info-resource-eyebrow">전체정보</p>
              <h3 className="info-resource-title">자료와 링크</h3>
            </div>
            <label className="resource-search-bar">
              <Icon name="search" size={15} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="자료, 링크, 키워드 검색"
              />
            </label>
          </header>

          <section className="resource-board">
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

            <ul className="resource-card-grid">
              {visibleResources.map((card) => (
                <li key={card.id} className="resource-card-item">
                  <div className="resource-card-body">
                    <span className="resource-card-tag">{card.tag}</span>
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
          </section>
        </section>
      </article>
    </section>
  )
}
