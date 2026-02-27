import { useMemo, useState } from 'react'
import { Icon } from '../../shared/ui/Icon'
import {
  recruitCategoryMeta,
  recruitFilters,
  recruitItems,
  type RecruitCategory,
  type RecruitFilterId,
  type RecruitStatus,
} from '../../features/recruit/model/recruitData'

type RecruitPageProps = {
  onSelectRecruit: (id: string) => void
}

const categories: { id: RecruitCategory | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'study', label: '스터디' },
  { id: 'project', label: '프로젝트' },
  { id: 'tutoring', label: '멘토링' },
]

const getStatusLabel = (status: RecruitStatus) => {
  if (status === 'open') return '모집 중'
  if (status === 'closing-soon') return '마감 임박'
  return '모집 완료'
}

export function RecruitPage({ onSelectRecruit }: RecruitPageProps) {
  const [activeCategory, setActiveCategory] = useState<RecruitCategory | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState<RecruitFilterId>('all')
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()

  const visibleItems = useMemo(() => {
    return recruitItems.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false
      if (activeFilter === 'open' && item.status !== 'open') return false
      if (activeFilter === 'closing-soon' && item.status !== 'closing-soon') return false

      if (!normalizedQuery) return true

      const searchable = `${item.title} ${item.shortDesc} ${item.tags.join(' ')} ${item.techStack.join(' ')}`
        .toLowerCase()
      return searchable.includes(normalizedQuery)
    })
  }, [activeCategory, activeFilter, normalizedQuery])

  const recommendItems = recruitItems.filter((item) => item.status !== 'closed').slice(0, 2)

  return (
    <section className="coala-content coala-content--recruit">
      <div className="recruit-hero">
        <div className="recruit-hero-body">
          <span className="recruit-hero-badge">TOP PICK</span>
          <h2 className="recruit-hero-title">
            지금 인기 있는 모집을 확인하고
            <br />
            바로 팀에 합류해보세요.
          </h2>
          <p className="recruit-hero-subtitle">
            스터디, 프로젝트, 멘토링을 한 화면에서 비교하고 나에게 맞는 활동을 고를 수 있어요.
          </p>
          <div className="recruit-hero-footer">
            <button type="button" className="recruit-hero-cta">
              모집 가이드 보기
            </button>
            <span className="recruit-hero-limit">이번 달 신규 모집 18건</span>
          </div>
        </div>
        <div className="recruit-hero-deco" aria-hidden="true">
          🚀
        </div>
      </div>

      <div className="recruit-search-row">
        <label className="recruit-search">
          <Icon name="search" size={15} />
          <input
            type="search"
            placeholder="관심 있는 주제나 기술 스택으로 검색하세요."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button type="button" className="recruit-post-button">
          <Icon name="plus" size={14} />
          모집 등록
        </button>
      </div>

      <div className="recruit-section">
        <div className="recruit-section-head">
          <div>
            <h3 className="recruit-section-title">지금 뜨는 모집</h3>
            <p className="recruit-section-subtitle">최근 반응이 빠른 모집을 먼저 확인해보세요.</p>
          </div>
          <button type="button" className="recruit-section-link">
            전체 보기
          </button>
        </div>

        <ul className="recruit-recommend-grid">
          {recommendItems.map((item) => (
            <li
              key={item.id}
              className="recruit-recommend-card surface-card"
              onClick={() => onSelectRecruit(item.id)}
            >
              <div className={`recruit-recommend-icon recruit-recommend-icon--${item.category}`}>
                <Icon
                  name={
                    item.category === 'project'
                      ? 'network'
                      : item.category === 'tutoring'
                        ? 'user'
                        : 'book'
                  }
                  size={22}
                />
              </div>
              <div className="recruit-recommend-body">
                <span className={`recruit-category-badge recruit-category-badge--${item.category}`}>
                  {recruitCategoryMeta[item.category].label}
                </span>
                <p className="recruit-recommend-title">{item.title}</p>
                <p className="recruit-recommend-meta">
                  <Icon name="users" size={12} />
                  <span>
                    {item.currentMembers}/{item.maxMembers}명
                  </span>
                  <span className="dot-divider" />
                  <span>{item.createdAt}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="recruit-section">
        <div className="recruit-section-head">
          <div>
            <h3 className="recruit-section-title">전체 모집</h3>
            <p className="recruit-section-subtitle">
              모집 상태와 카테고리 필터로 원하는 모집만 빠르게 확인할 수 있어요.
            </p>
          </div>
        </div>

        <div className="recruit-toolbar">
          <ul className="recruit-category-tabs">
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  className={
                    activeCategory === category.id
                      ? 'recruit-category-tab is-active'
                      : 'recruit-category-tab'
                  }
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="recruit-subfilter-row">
            <ul className="board-filters">
              {recruitFilters.map((filter) => (
                <li key={filter.id}>
                  <button
                    type="button"
                    className={
                      activeFilter === filter.id
                        ? 'board-filter-chip is-active'
                        : 'board-filter-chip'
                    }
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="board-sort-button">
              <span>최신 등록순</span>
              <Icon name="chevron-down" size={14} />
            </button>
          </div>
        </div>

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
      </div>
    </section>
  )
}
