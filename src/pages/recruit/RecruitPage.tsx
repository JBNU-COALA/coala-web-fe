import { useMemo, useState } from 'react'
import { CommunityBanner } from '../community/CommunityBanner'
import { Icon } from '../../shared/ui/Icon'
import {
  recruitItems,
  type RecruitCategory,
  type RecruitFilterId,
  type RecruitStatus,
} from './recruitData'

type RecruitPageProps = {
  onSelectRecruit: (id: string) => void
}

type RecruitMode = 'apply' | 'write'

const categories: { id: RecruitCategory | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'study', label: '스터디' },
  { id: 'project', label: '프로젝트' },
  { id: 'tutoring', label: '멘토링' },
]

const filters: { id: RecruitFilterId; label: string }[] = [
  { id: 'all', label: '전체 보기' },
  { id: 'open', label: '모집 중' },
  { id: 'closing-soon', label: '마감 임박' },
]

const modeTabs: { id: RecruitMode; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
  { id: 'apply', label: '지원 하기', icon: 'users' },
  { id: 'write', label: '모집 공고 작성', icon: 'edit' },
]

const getStatusLabel = (status: RecruitStatus) => {
  if (status === 'open') return '모집 중'
  if (status === 'closing-soon') return '마감 임박'
  return '모집 완료'
}

export function RecruitPage({ onSelectRecruit }: RecruitPageProps) {
  const [mode, setMode] = useState<RecruitMode>('apply')
  const [activeCategory, setActiveCategory] = useState<RecruitCategory | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState<RecruitFilterId>('all')
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()
  const activeCategoryLabel =
    categories.find((category) => category.id === activeCategory)?.label ?? '전체'

  const visibleItems = useMemo(() => {
    return recruitItems.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false
      if (activeFilter === 'open' && item.status !== 'open') return false
      if (activeFilter === 'closing-soon' && item.status !== 'closing-soon') return false

      if (!normalizedQuery) return true

      const searchable = `${item.title} ${item.shortDesc} ${item.tags.join(' ')} ${item.techStack.join(' ')}`.toLowerCase()
      return searchable.includes(normalizedQuery)
    })
  }, [activeCategory, activeFilter, normalizedQuery])

  const popularRecruit = useMemo(() => {
    const images = [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=80',
    ]

    return [...recruitItems]
      .sort((a, b) => b.views + b.bookmarks * 12 - (a.views + a.bookmarks * 12))
      .slice(0, 3)
      .map((item, index) => ({
        label: '인기 모집',
        title: item.title,
        imageUrl: images[index % images.length],
      }))
  }, [])

  return (
    <section className="coala-content coala-content--recruit">
      <CommunityBanner title="모집" tone="recruit" images={popularRecruit} />

      <div className="community-section-tabs">
        {modeTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={mode === tab.id ? 'community-section-tab is-active' : 'community-section-tab'}
            onClick={() => setMode(tab.id)}
          >
            <Icon name={tab.icon} size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'write' ? (
        <section className="surface-card recruit-write-panel">
          <header>
            <h3>모집 공고 작성</h3>
            <p>모집 제목, 역할, 일정, 진행 방식을 정리해 공고를 작성합니다.</p>
          </header>
          <div className="recruit-write-grid">
            <label className="jcloud-field">
              <span className="jcloud-label">제목</span>
              <input className="jcloud-input" placeholder="모집 공고 제목" />
            </label>
            <label className="jcloud-field">
              <span className="jcloud-label">분류</span>
              <select className="jcloud-select" defaultValue="project">
                <option value="study">스터디</option>
                <option value="project">프로젝트</option>
                <option value="tutoring">멘토링</option>
              </select>
            </label>
            <label className="jcloud-field recruit-write-wide">
              <span className="jcloud-label">내용</span>
              <textarea className="jcloud-textarea" rows={5} placeholder="모집 내용과 필요한 역할을 적어주세요." />
            </label>
          </div>
          <div className="recruit-write-footer">
            <button type="button" className="jcloud-submit-button">작성 완료</button>
          </div>
        </section>
      ) : (
        <>
          <section className="surface-card community-list-controls recruit-list-controls" aria-label="모집 필터">
            <div className="community-list-controls__top">
              <div className="community-list-heading">
                <p>{activeCategoryLabel}</p>
                <strong>{visibleItems.length}개 모집</strong>
              </div>
              <label className="community-list-search">
                <Icon name="search" size={15} />
                <input
                  type="search"
                  placeholder="주제, 기술 스택, 역할 검색"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>

            <div className="community-filter-tabs" role="tablist" aria-label="모집 분류">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category.id}
                  className={
                    activeCategory === category.id
                      ? 'community-filter-tab is-active'
                      : 'community-filter-tab'
                  }
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="community-status-filters" aria-label="모집 상태">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={
                    activeFilter === filter.id
                      ? 'community-status-chip is-active'
                      : 'community-status-chip'
                  }
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>

          <ul className="recruit-card-grid">
            {visibleItems.map((item) => {
              const isOpen = item.status === 'open'
              const isClosingSoon = item.status === 'closing-soon'

              return (
                <li
                  key={item.id}
                  className="recruit-card surface-card"
                  onClick={() => onSelectRecruit(item.id)}
                >
                  <div className="recruit-card-tags">{item.tags.join('  ')}</div>
                  <span
                    className={`recruit-status-badge ${
                      isOpen
                        ? 'recruit-status--open'
                        : isClosingSoon
                          ? 'recruit-status--closing'
                          : 'recruit-status--closed'
                    }`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                  <p className="recruit-card-title">{item.title}</p>
                  <p className="recruit-card-desc">{item.shortDesc}</p>
                  <div className="recruit-card-footer">
                    <span className="recruit-card-members">
                      <Icon name="users" size={12} />
                      <span>
                        {item.currentMembers}/{item.maxMembers}명
                      </span>
                    </span>
                    <button
                      type="button"
                      className={
                        isOpen || isClosingSoon
                          ? 'recruit-apply-chip'
                          : 'recruit-apply-chip recruit-apply-chip--closed'
                      }
                      onClick={(event) => event.stopPropagation()}
                    >
                      {isOpen || isClosingSoon ? '지원하기' : '마감'}
                    </button>
                  </div>
                </li>
              )
            })}

            {visibleItems.length === 0 ? (
              <li className="recruit-card-empty">조건에 맞는 모집이 없습니다.</li>
            ) : null}
          </ul>
        </>
      )}
    </section>
  )
}
