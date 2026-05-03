import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CommunityBanner } from '../community/CommunityBanner'
import { Icon } from '../../shared/ui/Icon'
import {
  recruitItems,
  type RecruitCategory,
  type RecruitFilterId,
  type RecruitItem,
  type RecruitRole,
  type RecruitStatus,
} from './recruitData'

type RecruitPageProps = {
  onSelectRecruit: (id: string) => void
  initialMode?: RecruitMode
}

type RecruitMode = 'apply' | 'write'

const categories: { id: RecruitCategory | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'study', label: '스터디' },
  { id: 'project', label: '프로젝트' },
  { id: 'tutoring', label: '멘토링' },
]

const writeCategories = categories.filter(
  (category): category is { id: RecruitCategory; label: string } => category.id !== 'all',
)

const filters: { id: RecruitFilterId; label: string }[] = [
  { id: 'all', label: '전체 보기' },
  { id: 'open', label: '모집 중' },
  { id: 'closing-soon', label: '마감 임박' },
]

const modeTabs: { id: RecruitMode; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
  { id: 'apply', label: '지원 하기', icon: 'users' },
  { id: 'write', label: '모집 공고 작성', icon: 'edit' },
]

const LOCAL_RECRUIT_STORAGE_KEY = 'coala-local-recruits'

type RecruitDraft = {
  title: string
  category: RecruitCategory
  shortDesc: string
  roles: string
  techStack: string
  meetingType: string
  expectedDuration: string
  tags: string
  detailContent: string
  processList: string
}

const defaultRecruitDraft: RecruitDraft = {
  title: '개발자 커뮤니티 활동 피드 개선 프로젝트',
  category: 'project',
  shortDesc: '활동 탭에서 작성 글, GitHub 로그, 프로젝트 기록을 한 번에 볼 수 있게 개선합니다.',
  roles: '프론트엔드:2\n백엔드:1\n기획:1',
  techStack: 'React, TypeScript, Spring Boot, GitHub API',
  meetingType: '온라인 주 1회 + Discord 상시 협업',
  expectedDuration: '6주',
  tags: '프로젝트, 커뮤니티, GitHub',
  detailContent:
    '커뮤니티에 흩어진 게시글과 GitHub 활동을 한 화면에서 확인하는 활동 피드를 만듭니다.\n지원자는 관심 역할을 선택하고, 주차별로 작은 기능을 나눠 구현합니다.',
  processList: '요구사항 정리 및 화면 설계\n프론트/백엔드 API 연결\n데모 배포 및 피드백 반영',
}

const getStatusLabel = (status: RecruitStatus) => {
  if (status === 'open') return '모집 중'
  if (status === 'closing-soon') return '마감 임박'
  return '모집 완료'
}

const loadLocalRecruitItems = (): RecruitItem[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(LOCAL_RECRUIT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)

const parseRoles = (value: string): RecruitRole[] => {
  const roles = splitList(value).map((line) => {
    const matched = line.match(/^(.+?)[\s:：/]+(\d+)$/)
    if (!matched) return { label: line, current: 0, max: 1 }
    return { label: matched[1].trim(), current: 0, max: Number(matched[2]) || 1 }
  })

  return roles.length > 0 ? roles : [{ label: '팀원', current: 0, max: 1 }]
}

const buildRecruitItem = (draft: RecruitDraft): RecruitItem => {
  const roles = parseRoles(draft.roles)
  const maxMembers = roles.reduce((sum, role) => sum + role.max, 0)
  const tags = splitList(draft.tags).map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
  const techStack = splitList(draft.techStack)
  const detailContent = splitList(draft.detailContent)
  const processList = splitList(draft.processList)

  return {
    id: `local-recruit-${Date.now()}`,
    title: draft.title.trim(),
    shortDesc: draft.shortDesc.trim(),
    category: draft.category,
    status: 'open',
    currentMembers: 0,
    maxMembers,
    host: '나',
    hostInitials: '나',
    hostTone: 'mint',
    hostRole: '모집 작성자',
    trustScore: 88.0,
    tags: tags.length > 0 ? tags : ['#모집'],
    techStack: techStack.length > 0 ? techStack : ['협업'],
    roles,
    meetingType: draft.meetingType.trim() || '협의 후 결정',
    expectedDuration: draft.expectedDuration.trim() || '협의 후 결정',
    detailContent: detailContent.length > 0 ? detailContent : [draft.shortDesc.trim()],
    processList: processList.length > 0 ? processList : ['지원자 확인', '팀 빌딩', '킥오프'],
    comments: [],
    createdAt: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    views: 0,
    bookmarks: 0,
  }
}

export function RecruitPage({ onSelectRecruit, initialMode = 'apply' }: RecruitPageProps) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<RecruitMode>(initialMode)
  const [activeCategory, setActiveCategory] = useState<RecruitCategory | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState<RecruitFilterId>('all')
  const [sortMode, setSortMode] = useState<'latest' | 'popular'>('latest')
  const [query, setQuery] = useState('')
  const [appliedIds, setAppliedIds] = useState<Set<string>>(() => new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set())
  const [draft, setDraft] = useState<RecruitDraft>(defaultRecruitDraft)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [localRecruitItems, setLocalRecruitItems] = useState<RecruitItem[]>(() => loadLocalRecruitItems())

  const normalizedQuery = query.trim().toLowerCase()
  const allRecruitItems = useMemo(
    () => [...localRecruitItems, ...recruitItems],
    [localRecruitItems],
  )
  const activeCategoryLabel =
    categories.find((category) => category.id === activeCategory)?.label ?? '전체'

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  const visibleItems = useMemo(() => {
    const filtered = allRecruitItems.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false
      if (activeFilter === 'open' && item.status !== 'open') return false
      if (activeFilter === 'closing-soon' && item.status !== 'closing-soon') return false

      if (!normalizedQuery) return true

      const searchable = `${item.title} ${item.shortDesc} ${item.tags.join(' ')} ${item.techStack.join(' ')}`.toLowerCase()
      return searchable.includes(normalizedQuery)
    })

    return [...filtered].sort((a, b) => {
      if (sortMode === 'popular') return b.views + b.bookmarks - (a.views + a.bookmarks)
      return new Date(b.createdAt.replace(/\./g, '-')).getTime()
        - new Date(a.createdAt.replace(/\./g, '-')).getTime()
    })
  }, [activeCategory, activeFilter, allRecruitItems, normalizedQuery, sortMode])

  const popularRecruit = useMemo(() => {
    const images = [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=80',
    ]

    return [...allRecruitItems]
      .sort((a, b) => b.views + b.bookmarks * 12 - (a.views + a.bookmarks * 12))
      .slice(0, 3)
      .map((item, index) => ({
        label: '인기 모집',
        title: item.title,
        imageUrl: images[index % images.length],
      }))
  }, [allRecruitItems])

  const toggleApplied = (id: string) => {
    setAppliedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSaved = (id: string) => {
    setSavedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const updateDraft = <Key extends keyof RecruitDraft>(key: Key, value: RecruitDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const changeMode = (nextMode: RecruitMode) => {
    setMode(nextMode)
    navigate(nextMode === 'write' ? '/community/recruit/write' : '/community/recruit')
  }

  const handleCreateRecruit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.title.trim() || !draft.shortDesc.trim()) {
      setDraftError('제목과 한 줄 소개를 입력해주세요.')
      return
    }

    const createdRecruit = buildRecruitItem(draft)
    setLocalRecruitItems((current) => {
      const next = [createdRecruit, ...current]
      window.localStorage.setItem(LOCAL_RECRUIT_STORAGE_KEY, JSON.stringify(next))
      return next
    })
    setDraft(defaultRecruitDraft)
    setDraftError(null)
    setActiveCategory('all')
    setActiveFilter('all')
    setSortMode('latest')
    setMode('apply')
    navigate('/community/recruit')
  }

  return (
    <section className="coala-content coala-content--recruit">
      <CommunityBanner title="모집" tone="recruit" images={popularRecruit} />

      <div className="community-section-tabs">
        {modeTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={mode === tab.id ? 'community-section-tab is-active' : 'community-section-tab'}
            onClick={() => changeMode(tab.id)}
          >
            <Icon name={tab.icon} size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'write' ? (
        <form className="surface-card recruit-write-panel" onSubmit={handleCreateRecruit}>
          <header>
            <h3>모집 공고 작성</h3>
            <p>지원 화면에 보이는 역할, 인원, 기간, 진행 방식까지 같은 규격으로 작성합니다.</p>
          </header>

          <div className="recruit-write-category-tabs" role="tablist" aria-label="모집 공고 분류">
            {writeCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={draft.category === category.id}
                className={
                  draft.category === category.id
                    ? 'community-filter-tab is-active'
                    : 'community-filter-tab'
                }
                onClick={() => updateDraft('category', category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="recruit-write-grid">
            <label className="jcloud-field">
              <span className="jcloud-label">제목</span>
              <input
                className="jcloud-input"
                value={draft.title}
                onChange={(event) => updateDraft('title', event.target.value)}
                placeholder="모집 공고 제목"
              />
            </label>
            <label className="jcloud-field recruit-write-wide">
              <span className="jcloud-label">한 줄 소개</span>
              <input
                className="jcloud-input"
                value={draft.shortDesc}
                onChange={(event) => updateDraft('shortDesc', event.target.value)}
                placeholder="목록 카드에 보일 모집 요약"
              />
            </label>
            <label className="jcloud-field">
              <span className="jcloud-label">모집 역할/인원</span>
              <textarea
                className="jcloud-textarea"
                rows={4}
                value={draft.roles}
                onChange={(event) => updateDraft('roles', event.target.value)}
                placeholder="프론트엔드:2&#10;백엔드:1"
              />
            </label>
            <label className="jcloud-field">
              <span className="jcloud-label">기술 스택</span>
              <textarea
                className="jcloud-textarea"
                rows={4}
                value={draft.techStack}
                onChange={(event) => updateDraft('techStack', event.target.value)}
                placeholder="React, TypeScript, Spring Boot"
              />
            </label>
            <label className="jcloud-field">
              <span className="jcloud-label">진행 방식</span>
              <input
                className="jcloud-input"
                value={draft.meetingType}
                onChange={(event) => updateDraft('meetingType', event.target.value)}
                placeholder="온라인 주 1회 + 상시 협업"
              />
            </label>
            <label className="jcloud-field">
              <span className="jcloud-label">예상 기간</span>
              <input
                className="jcloud-input"
                value={draft.expectedDuration}
                onChange={(event) => updateDraft('expectedDuration', event.target.value)}
                placeholder="6주"
              />
            </label>
            <label className="jcloud-field recruit-write-wide">
              <span className="jcloud-label">태그</span>
              <input
                className="jcloud-input"
                value={draft.tags}
                onChange={(event) => updateDraft('tags', event.target.value)}
                placeholder="프로젝트, 커뮤니티, GitHub"
              />
            </label>
            <label className="jcloud-field recruit-write-wide">
              <span className="jcloud-label">모집 소개</span>
              <textarea
                className="jcloud-textarea"
                rows={5}
                value={draft.detailContent}
                onChange={(event) => updateDraft('detailContent', event.target.value)}
                placeholder="모집 배경, 목표, 기대 산출물을 적어주세요."
              />
            </label>
            <label className="jcloud-field recruit-write-wide">
              <span className="jcloud-label">진행 프로세스</span>
              <textarea
                className="jcloud-textarea"
                rows={4}
                value={draft.processList}
                onChange={(event) => updateDraft('processList', event.target.value)}
                placeholder="요구사항 정리&#10;기능 구현&#10;데모 배포"
              />
            </label>
          </div>
          {draftError ? <p className="auth-error">{draftError}</p> : null}
          <div className="recruit-write-footer">
            <button type="submit" className="jcloud-submit-button">작성 완료</button>
          </div>
        </form>
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
              <button
                type="button"
                className="community-status-chip"
                onClick={() => setSortMode((current) => (current === 'latest' ? 'popular' : 'latest'))}
              >
                {sortMode === 'latest' ? '최신 등록순' : '인기순'}
              </button>
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
                  <div className="recruit-card-techs">
                    {item.techStack.slice(0, 3).map((tech) => (
                      <span key={tech}>{tech}</span>
                    ))}
                  </div>
                  <div className="recruit-card-footer">
                    <span className="recruit-card-members">
                      <Icon name="users" size={12} />
                      <span>
                        {item.currentMembers}/{item.maxMembers}명
                      </span>
                    </span>
                    <div className="recruit-card-actions">
                      <button
                        type="button"
                        className={
                          savedIds.has(item.id)
                            ? 'recruit-save-chip recruit-save-chip--active'
                            : 'recruit-save-chip'
                        }
                        aria-pressed={savedIds.has(item.id)}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleSaved(item.id)
                        }}
                      >
                        {savedIds.has(item.id) ? '저장됨' : '관심'}
                      </button>
                      <button
                        type="button"
                        className={
                          isOpen || isClosingSoon
                            ? 'recruit-apply-chip'
                            : 'recruit-apply-chip recruit-apply-chip--closed'
                        }
                        disabled={!isOpen && !isClosingSoon}
                        onClick={(event) => {
                          event.stopPropagation()
                          if (isOpen || isClosingSoon) toggleApplied(item.id)
                        }}
                      >
                        {isOpen || isClosingSoon
                          ? appliedIds.has(item.id)
                            ? '지원 완료'
                            : '지원하기'
                          : '마감'}
                      </button>
                    </div>
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
