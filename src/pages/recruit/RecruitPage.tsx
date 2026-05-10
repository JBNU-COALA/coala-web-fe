import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CommunityBanner } from '../community/CommunityBanner'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { routes } from '../../shared/routes'
import { extractFirstContentImage, toPlainContentPreview } from '../../shared/contentPreview'
import {
  recruitsApi,
  type RecruitCategory,
  type RecruitFilterId,
  type RecruitItem,
  type RecruitPostPayload,
  type RecruitRole,
  type RecruitStatus,
} from '../../shared/api/recruits'

type RecruitPageProps = {
  onSelectRecruit: (id: string) => void
  initialMode?: RecruitMode
}

type RecruitMode = 'list' | 'applications' | 'manage' | 'write'
type RecruitListVariant = 'public' | 'applied' | 'managed'

const categories: { id: RecruitCategory | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'study', label: '스터디' },
  { id: 'project', label: '프로젝트' },
  { id: 'tutoring', label: '멘토링' },
]

const writeCategories = categories.filter(
  (category): category is { id: RecruitCategory; label: string } => category.id !== 'all',
)

const recruitCategoryTabs = writeCategories

const filters: { id: RecruitFilterId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'open', label: '모집중' },
  { id: 'closing-soon', label: '마감 임박' },
]

const modeTabs: { id: Exclude<RecruitMode, 'write'>; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
  { id: 'list', label: '모집 공고', icon: 'file' },
  { id: 'applications', label: '지원내역', icon: 'users' },
  { id: 'manage', label: '모집 관리', icon: 'settings' },
]

const LOCAL_RECRUIT_STORAGE_KEY = 'coala-local-recruits'
const LOCAL_APPLICATION_STORAGE_KEY = 'coala-recruit-applications'
const LOCAL_RECRUIT_INTEREST_STORAGE_KEY = 'coala-recruit-interests'

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
  if (status === 'open') return '모집중'
  if (status === 'closing-soon') return '마감 임박'
  return '마감'
}

const getStatusClass = (status: RecruitStatus) => {
  if (status === 'open') return 'recruit-status--open'
  if (status === 'closing-soon') return 'recruit-status--closing'
  return 'recruit-status--closed'
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

const loadAppliedRecruitIds = () => {
  if (typeof window === 'undefined') return new Set<string>()

  try {
    const raw = window.localStorage.getItem(LOCAL_APPLICATION_STORAGE_KEY)
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return new Set<string>()
    return new Set(Object.keys(parsed))
  } catch {
    return new Set<string>()
  }
}

const loadSavedRecruitIds = () => {
  if (typeof window === 'undefined') return new Set<string>()

  try {
    const raw = window.localStorage.getItem(LOCAL_RECRUIT_INTEREST_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [])
  } catch {
    return new Set<string>()
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

const buildRecruitPayload = (draft: RecruitDraft): RecruitPostPayload => {
  const roles = parseRoles(draft.roles)
  const tags = splitList(draft.tags).map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
  return {
    title: draft.title.trim(),
    shortDesc: draft.shortDesc.trim(),
    category: draft.category,
    roles: roles.map((role) => ({ label: role.label, max: role.max })),
    techStack: splitList(draft.techStack),
    meetingType: draft.meetingType.trim() || '협의 후 결정',
    expectedDuration: draft.expectedDuration.trim() || '협의 후 결정',
    tags: tags.length > 0 ? tags : ['#모집'],
    detailContent: splitList(draft.detailContent),
    processList: splitList(draft.processList),
  }
}

type RecruitListProps = {
  items: RecruitItem[]
  variant: RecruitListVariant
  emptyText: string
  appliedIds: Set<string>
  savedIds: Set<string>
  onSelectRecruit: (id: string) => void
  onOpenApplication: (id: string) => void
  onToggleSaved: (id: string) => void
}

function RecruitList({
  items,
  variant,
  emptyText,
  appliedIds,
  savedIds,
  onSelectRecruit,
  onOpenApplication,
  onToggleSaved,
}: RecruitListProps) {
  return (
    <ul className="recruit-list">
      {items.map((item) => {
        const isOpen = item.status === 'open'
        const isClosingSoon = item.status === 'closing-soon'
        const canApply = isOpen || isClosingSoon
        const isApplied = appliedIds.has(item.id)
        const previewSource = [item.shortDesc, ...item.detailContent].join('\n')
        const previewImageUrl = extractFirstContentImage(previewSource)
        const summary = toPlainContentPreview(item.shortDesc) || toPlainContentPreview(item.detailContent.join(' '))

        return (
          <li key={item.id} className="recruit-list-row surface-card">
            <button
              type="button"
              className={previewImageUrl ? 'recruit-row-main recruit-row-main--with-image' : 'recruit-row-main'}
              onClick={() => onSelectRecruit(item.id)}
            >
              {previewImageUrl ? (
                <span
                  className="recruit-row-thumbnail"
                  style={{ backgroundImage: `url(${previewImageUrl})` }}
                  aria-hidden="true"
                />
              ) : null}
              <span className={`recruit-status-pill ${getStatusClass(item.status)}`}>
                <span className="recruit-status-dot" />
                {getStatusLabel(item.status)}
              </span>
              <span className="recruit-row-copy">
                <strong>{item.title}</strong>
                <span>{summary}</span>
              </span>
            </button>

            <div className="recruit-row-meta">
              <span>{item.currentMembers}/{item.maxMembers}명</span>
              <span>{item.createdAt}</span>
              <span>{item.techStack.slice(0, 2).join(', ')}</span>
            </div>

            <div className="recruit-row-actions">
              {variant === 'managed' ? (
                <button
                  type="button"
                  className="recruit-row-button"
                  onClick={() => onSelectRecruit(item.id)}
                >
                  관리
                </button>
              ) : variant === 'applied' ? (
                <span className="recruit-row-static-chip">지원 완료</span>
              ) : (
                <>
                  <button
                    type="button"
                    className={savedIds.has(item.id) ? 'recruit-row-button is-active' : 'recruit-row-button'}
                    aria-pressed={savedIds.has(item.id)}
                    onClick={() => onToggleSaved(item.id)}
                  >
                    {savedIds.has(item.id) ? '관심 중' : '관심'}
                  </button>
                  <button
                    type="button"
                    className={isApplied ? 'recruit-row-button recruit-row-button--primary is-active' : 'recruit-row-button recruit-row-button--primary'}
                    disabled={!canApply}
                    onClick={() => {
                      if (canApply) onOpenApplication(item.id)
                    }}
                  >
                    {canApply ? (isApplied ? '지원서 수정' : '지원하기') : '마감'}
                  </button>
                </>
              )}
            </div>
          </li>
        )
      })}

      {items.length === 0 ? (
        <li className="recruit-card-empty">{emptyText}</li>
      ) : null}
    </ul>
  )
}

export function RecruitPage({ onSelectRecruit, initialMode = 'list' }: RecruitPageProps) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<RecruitMode>(initialMode)
  const [activeCategory, setActiveCategory] = useState<RecruitCategory | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState<RecruitFilterId>('all')
  const [sortMode, setSortMode] = useState<'latest' | 'popular'>('latest')
  const [query, setQuery] = useState('')
  const [appliedIds, setAppliedIds] = useState<Set<string>>(() => loadAppliedRecruitIds())
  const [savedIds, setSavedIds] = useState<Set<string>>(() => loadSavedRecruitIds())
  const [applicationView, setApplicationView] = useState<'applied' | 'saved'>('applied')
  const [draft, setDraft] = useState<RecruitDraft>(defaultRecruitDraft)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [localRecruitItems, setLocalRecruitItems] = useState<RecruitItem[]>(() => loadLocalRecruitItems())
  const [remoteRecruitItems, setRemoteRecruitItems] = useState<RecruitItem[]>([])

  const normalizedQuery = query.trim().toLowerCase()
  const allRecruitItems = useMemo(
    () => [...localRecruitItems, ...remoteRecruitItems],
    [localRecruitItems, remoteRecruitItems],
  )
  const activeCategoryLabel =
    categories.find((category) => category.id === activeCategory)?.label ?? '전체'

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    recruitsApi.getRecruits()
      .then(setRemoteRecruitItems)
      .catch(() => setRemoteRecruitItems([]))
  }, [])

  useEffect(() => {
    const syncAppliedIds = () => setAppliedIds(loadAppliedRecruitIds())

    syncAppliedIds()
    window.addEventListener('focus', syncAppliedIds)
    return () => window.removeEventListener('focus', syncAppliedIds)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(LOCAL_RECRUIT_INTEREST_STORAGE_KEY, JSON.stringify([...savedIds]))
  }, [savedIds])

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

  const appliedItems = useMemo(
    () => allRecruitItems.filter((item) => appliedIds.has(item.id)),
    [allRecruitItems, appliedIds],
  )

  const savedItems = useMemo(
    () => allRecruitItems.filter((item) => savedIds.has(item.id)),
    [allRecruitItems, savedIds],
  )

  const openApplication = (id: string) => {
    const item = allRecruitItems.find((recruit) => recruit.id === id)
    if (!item) return

    navigate(routes.community.recruitApplicationNew(id))
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
    navigate(nextMode === 'write' ? routes.community.recruitNoticeNew : routes.community.recruit)
  }

  const handleCreateRecruit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.title.trim() || !draft.shortDesc.trim()) {
      setDraftError('제목과 한 줄 소개를 입력해주세요.')
      return
    }

    try {
      const createdRecruit = await recruitsApi.createRecruit(buildRecruitPayload(draft))
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
      setMode('manage')
      navigate(routes.community.recruit)
    } catch {
      const createdRecruit = buildRecruitItem(draft)
      setLocalRecruitItems((current) => {
        const next = [createdRecruit, ...current]
        window.localStorage.setItem(LOCAL_RECRUIT_STORAGE_KEY, JSON.stringify(next))
        return next
      })
      setDraftError('서버 저장에 실패해 이 브라우저에 임시 저장했습니다.')
      setMode('manage')
      navigate(routes.community.recruit)
    }
  }

  const isTabActive = (tabId: Exclude<RecruitMode, 'write'>) =>
    mode === tabId || (mode === 'write' && tabId === 'manage')

  return (
    <section className="coala-content coala-content--recruit">
      <CommunityBanner title="모집" tone="recruit" />

      <div className="community-section-tabs">
        {modeTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={isTabActive(tab.id) ? 'community-section-tab is-active' : 'community-section-tab'}
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
            <h3>공고 작성</h3>
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
                placeholder="목록에 보일 모집 요약"
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
      ) : mode === 'applications' ? (
        <section className="recruit-dashboard-panel">
          <header className="recruit-dashboard-header">
            <div>
              <h3>지원내역</h3>
              <p>{applicationView === 'applied' ? appliedItems.length : savedItems.length}개</p>
            </div>
          </header>
          <div className="surface-card recruit-history-filter" role="group" aria-label="모집 내역 필터">
            <span>구분</span>
            <div className="recruit-history-filter-options">
              <button
                type="button"
                aria-pressed={applicationView === 'applied'}
                className={applicationView === 'applied' ? 'recruit-history-filter-chip is-active' : 'recruit-history-filter-chip'}
                onClick={() => setApplicationView('applied')}
              >
                지원내역
              </button>
              <button
                type="button"
                aria-pressed={applicationView === 'saved'}
                className={applicationView === 'saved' ? 'recruit-history-filter-chip is-active' : 'recruit-history-filter-chip'}
                onClick={() => setApplicationView('saved')}
              >
                관심공고
              </button>
            </div>
          </div>
          <RecruitList
            items={applicationView === 'applied' ? appliedItems : savedItems}
            variant={applicationView === 'applied' ? 'applied' : 'public'}
            emptyText={applicationView === 'applied' ? '지원내역이 없습니다.' : '관심공고가 없습니다.'}
            appliedIds={appliedIds}
            savedIds={savedIds}
            onSelectRecruit={onSelectRecruit}
            onOpenApplication={openApplication}
            onToggleSaved={toggleSaved}
          />
        </section>
      ) : mode === 'manage' ? (
        <section className="recruit-dashboard-panel">
          <header className="recruit-dashboard-header">
            <div>
              <h3>모집 관리</h3>
              <p>{localRecruitItems.length}개</p>
            </div>
            <button type="button" className="jcloud-submit-button" onClick={() => changeMode('write')}>
              <Icon name="plus" size={15} />
              공고 작성
            </button>
          </header>
          <RecruitList
            items={localRecruitItems}
            variant="managed"
            emptyText="작성한 모집 공고가 없습니다."
            appliedIds={appliedIds}
            savedIds={savedIds}
            onSelectRecruit={onSelectRecruit}
            onOpenApplication={openApplication}
            onToggleSaved={toggleSaved}
          />
        </section>
      ) : (
        <>
          <section className="surface-card recruit-control-panel" aria-label="모집 공고 필터">
            <div className="recruit-control-head">
              <div>
                <p>{activeCategoryLabel}</p>
                <strong>모집 {visibleItems.length}개</strong>
              </div>
              <SearchField
                className="community-list-search recruit-search"
                value={query}
                onChange={setQuery}
                placeholder="주제, 기술 스택, 역할 검색"
              />
            </div>

            <div className="recruit-filter-grid">
              <div className="recruit-filter-group">
                <span>분류</span>
                <div className="recruit-segmented recruit-segmented--with-all" role="tablist" aria-label="모집 분류">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === 'all'}
                    className={activeCategory === 'all' ? 'is-active' : ''}
                    onClick={() => setActiveCategory('all')}
                  >
                    전체
                  </button>
                  <span className="recruit-segmented-divider" aria-hidden="true" />
                  <div className="recruit-segmented-group">
                    {recruitCategoryTabs.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        role="tab"
                        aria-selected={activeCategory === category.id}
                        className={activeCategory === category.id ? 'is-active' : ''}
                        onClick={() => setActiveCategory(category.id)}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="recruit-filter-group">
                <span>상태</span>
                <div className="recruit-segmented recruit-segmented--status" role="tablist" aria-label="모집 상태">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      role="tab"
                      aria-selected={activeFilter === filter.id}
                      className={activeFilter === filter.id ? 'is-active' : ''}
                      onClick={() => setActiveFilter(filter.id)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="recruit-filter-group recruit-sort-field">
                <span>정렬</span>
                <select
                  className="recruit-sort-select"
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as 'latest' | 'popular')}
                >
                  <option value="latest">최신 등록순</option>
                  <option value="popular">인기순</option>
                </select>
              </label>
            </div>
          </section>

          <RecruitList
            items={visibleItems}
            variant="public"
            emptyText="조건에 맞는 모집이 없습니다."
            appliedIds={appliedIds}
            savedIds={savedIds}
            onSelectRecruit={onSelectRecruit}
            onOpenApplication={openApplication}
            onToggleSaved={toggleSaved}
          />
        </>
      )}
    </section>
  )
}
