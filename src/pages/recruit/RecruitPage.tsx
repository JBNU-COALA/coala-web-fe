import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CommunityBanner } from '../community/CommunityBanner'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { FilterTabs, type FilterTabOption } from '../../shared/ui/FilterTabs'
import { SelectControl } from '../../shared/ui/SelectControl'
import { routes } from '../../shared/routes'
import { useAuth } from '../../shared/auth/AuthContext'
import { isSameUserId } from '../../shared/auth/userIdentity'
import { isAdminUser } from '../../shared/auth/adminAccess'
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

type RecruitMode = 'list' | 'applied' | 'saved' | 'manage' | 'write'
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

const recruitFilterTabs: FilterTabOption<RecruitCategory | 'all'>[] = [
  { id: 'all', label: '전체', icon: 'layout', tone: 'all' },
  { id: 'study', label: '스터디', icon: 'book', tone: 'study' },
  { id: 'project', label: '프로젝트', icon: 'users', tone: 'project' },
  { id: 'tutoring', label: '멘토링', icon: 'user', tone: 'tutoring' },
]
const recruitCategoryLabel = Object.fromEntries(
  writeCategories.map((category) => [category.id, category.label]),
) as Record<RecruitCategory, string>

const filters: { id: RecruitFilterId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'open', label: '모집중' },
  { id: 'closing-soon', label: '마감 임박' },
]

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
  title: '', category: 'project', shortDesc: '', roles: '', techStack: '',
  meetingType: '', expectedDuration: '', tags: '', detailContent: '', processList: '',
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
  emptyDescription?: string
  emptyIcon?: Parameters<typeof Icon>[0]['name']
  emptyActionLabel?: string
  onEmptyAction?: () => void
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
  emptyDescription,
  emptyIcon = 'search',
  emptyActionLabel,
  onEmptyAction,
  appliedIds,
  savedIds,
  onSelectRecruit,
  onOpenApplication,
  onToggleSaved,
}: RecruitListProps) {
  return (
    <ul className={`recruit-card-grid recruit-card-grid--${variant}`}>
      {items.map((item) => {
        const isOpen = item.status === 'open'
        const isClosingSoon = item.status === 'closing-soon'
        const canApply = isOpen || isClosingSoon
        const isApplied = appliedIds.has(item.id)
        const previewSource = [item.shortDesc, ...item.detailContent].join('\n')
        const previewImageUrl = extractFirstContentImage(previewSource) || '/coala-card-placeholder.png'
        const summary = toPlainContentPreview(item.shortDesc) || toPlainContentPreview(item.detailContent.join(' '))
        const techPreview = item.techStack.slice(0, 4)
        const rolePreview = item.roles.slice(0, 3)

        return (
          <li key={item.id} className={`recruit-card recruit-card--page recruit-card--${item.category} surface-card`}>
            <button
              type="button"
              className="recruit-card-hitarea"
              aria-label={`${item.title} 상세 모집 공고 보기`}
              onClick={() => onSelectRecruit(item.id)}
            />
            <div className="recruit-card-open recruit-card-open--with-image">
              <span
                className="recruit-card-cover"
                style={{ backgroundImage: `url(${previewImageUrl})` }}
                aria-hidden="true"
              />
              <span className="recruit-card-topline">
                <span className={`recruit-status-pill ${getStatusClass(item.status)}`}>
                  <span className="recruit-status-dot" />
                  {getStatusLabel(item.status)}
                </span>
                <span className={`recruit-category-chip recruit-category-chip--${item.category}`}>
                  {recruitCategoryLabel[item.category]}
                </span>
              </span>
              <strong className="recruit-card-title">{item.title}</strong>
              <span className="recruit-card-desc">{summary}</span>
              <span className="recruit-card-author">
                <CharacterAvatar
                  name={item.authorName || item.host}
                  seed={item.authorId ?? item.id}
                  size="xs"
                />
                <span>작성자 {item.authorName || item.host}</span>
              </span>

              <span className="recruit-card-meta-row" aria-label="모집 요약">
                <span>{item.currentMembers}/{item.maxMembers}명</span>
                <span>{item.createdAt}</span>
                <span>{item.meetingType}</span>
              </span>

              <span className="recruit-card-techs" aria-label="기술 스택">
                {techPreview.map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </span>

              <span className="recruit-card-role-preview" aria-label="모집 역할">
                {rolePreview.map((role) => (
                  <span key={role.label}>
                    {role.label} {role.current}/{role.max}
                  </span>
                ))}
              </span>

              <span className="recruit-card-members">
                {item.expectedDuration}
              </span>
            </div>

            <div className="recruit-card-actions recruit-card-actions--footer">
              {variant === 'managed' ? (
                <button
                  type="button"
                  className="recruit-save-chip"
                  onClick={() => onSelectRecruit(item.id)}
                >
                  관리
                </button>
              ) : variant === 'applied' ? (
                <span className="recruit-card-static-chip">지원 완료</span>
              ) : (
                <>
                  <button
                    type="button"
                    className={savedIds.has(item.id) ? 'recruit-save-chip recruit-save-chip--active' : 'recruit-save-chip'}
                    aria-pressed={savedIds.has(item.id)}
                    onClick={() => onToggleSaved(item.id)}
                  >
                    {savedIds.has(item.id) ? '관심 중' : '관심'}
                  </button>
                  <button
                    type="button"
                    className={
                      canApply
                        ? 'recruit-apply-chip'
                        : 'recruit-apply-chip recruit-apply-chip--closed'
                    }
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
        <li className="recruit-card-empty">
          <span className="recruit-empty-icon"><Icon name={emptyIcon} size={22} /></span>
          <strong>{emptyText}</strong>
          {emptyDescription ? <p>{emptyDescription}</p> : null}
          {emptyActionLabel && onEmptyAction ? (
            <button type="button" onClick={onEmptyAction}>{emptyActionLabel}</button>
          ) : null}
        </li>
      ) : null}
    </ul>
  )
}

export function RecruitPage({ onSelectRecruit, initialMode = 'list' }: RecruitPageProps) {
  const { isLoggedIn, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedView = searchParams.get('view')
  const initialListMode: RecruitMode = requestedView === 'applications'
    ? 'applied'
    : requestedView === 'saved' || requestedView === 'manage'
      ? requestedView
      : 'list'
  const mode: RecruitMode = initialMode === 'write' ? 'write' : initialListMode
  const [activeCategory, setActiveCategory] = useState<RecruitCategory | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState<RecruitFilterId>('all')
  const [sortMode, setSortMode] = useState<'latest' | 'popular'>('latest')
  const [query, setQuery] = useState('')
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(() => loadSavedRecruitIds())
  const [draft, setDraft] = useState<RecruitDraft>(defaultRecruitDraft)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [remoteRecruitItems, setRemoteRecruitItems] = useState<RecruitItem[]>([])

  const normalizedQuery = query.trim().toLowerCase()
  const allRecruitItems = remoteRecruitItems
  const activeCategoryLabel =
    categories.find((category) => category.id === activeCategory)?.label ?? '전체'

  useEffect(() => {
    recruitsApi.getRecruits()
      .then(setRemoteRecruitItems)
      .catch(() => setActionError('모집 목록을 불러오지 못했습니다.'))
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return

    recruitsApi.getMyApplications()
      .then((applications) => {
        setAppliedIds(new Set(applications.map((application) => application.recruitId)))
      })
      .catch(() => setActionError('지원 내역을 불러오지 못했습니다.'))
  }, [isLoggedIn])

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
  const isOperator = isAdminUser(user)
  const managedItems = useMemo(
    () => allRecruitItems.filter((item) => (
      isOperator ||
      isSameUserId(item.authorId, user?.id)
    )),
    [allRecruitItems, isOperator, user],
  )

  const openApplication = (id: string) => {
    const item = allRecruitItems.find((recruit) => recruit.id === id)
    if (!item) return

    navigate(routes.community.recruitApplicationNew(id))
  }

  const toggleSaved = (id: string) => {
    if (!isLoggedIn) {
      setActionError('관심공고 저장은 로그인 후 가능합니다.')
      return
    }

    setActionError(null)
    setSavedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else {
        next.add(id)
        recruitsApi.bookmark(id).catch(() => setActionError('관심공고 저장에 실패했습니다.'))
      }
      return next
    })
  }

  const updateDraft = <Key extends keyof RecruitDraft>(key: Key, value: RecruitDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const changeMode = (nextMode: RecruitMode) => {
    if (nextMode === 'write') {
      navigate(routes.community.recruitNoticeNew)
      return
    }

    const view = nextMode === 'applied' ? 'applications' : nextMode
    setSearchParams(view === 'list' ? {} : { view })
  }

  const handleCreateRecruit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.title.trim() || !draft.shortDesc.trim()) {
      setDraftError('제목과 한 줄 소개를 입력해주세요.')
      return
    }

    try {
      const createdRecruit = await recruitsApi.createRecruit(buildRecruitPayload(draft))
      setRemoteRecruitItems((current) => [createdRecruit, ...current])
      setDraft(defaultRecruitDraft)
      setDraftError(null)
      setActiveCategory('all')
      setActiveFilter('all')
      setSortMode('latest')
      navigate(`${routes.community.recruit}?view=manage`)
    } catch {
      setDraftError('모집 공고를 저장하지 못했습니다. 작성 내용은 유지됩니다.')
    }
  }

  const isTabActive = (tabId: Exclude<RecruitMode, 'write'>) =>
    mode === tabId || (mode === 'write' && tabId === 'manage')

  const workspaceTabs: {
    id: Exclude<RecruitMode, 'write'>
    label: string
  }[] = [
    { id: 'list', label: '모집 공고' },
    { id: 'applied', label: '지원 내역' },
    { id: 'saved', label: '관심 공고' },
    { id: 'manage', label: isOperator ? '모집 관리' : '내 공고' },
  ]

  return (
    <section className="coala-content coala-content--recruit">
      <CommunityBanner title="모집" tone="recruit" meta={`모집 공고 ${visibleItems.length}개`} />

      <nav className="recruit-workspace-nav" aria-label="모집 메뉴">
        <div className="recruit-workspace-tabs">
          {workspaceTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-current={isTabActive(tab.id) ? 'page' : undefined}
              className={isTabActive(tab.id) ? 'recruit-workspace-tab is-active' : 'recruit-workspace-tab'}
              onClick={() => changeMode(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button type="button" className="recruit-create-button" onClick={() => changeMode('write')}>
          <Icon name="plus" size={16} />
          공고 등록
        </button>
      </nav>
      {actionError ? <p className="auth-error">{actionError}</p> : null}

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
      ) : mode === 'applied' || mode === 'saved' ? (
        <section className="recruit-dashboard-panel">
          <RecruitList
            items={mode === 'applied' ? appliedItems : savedItems}
            variant={mode === 'applied' ? 'applied' : 'public'}
            emptyText={mode === 'applied' ? '지원한 공고가 없습니다.' : '저장한 관심 공고가 없습니다.'}
            emptyDescription={mode === 'applied' ? '관심 있는 모집에 지원하면 이곳에서 진행 상황을 확인할 수 있습니다.' : '나중에 다시 보고 싶은 공고를 관심 목록에 저장해보세요.'}
            emptyIcon={mode === 'applied' ? 'file' : 'heart'}
            emptyActionLabel="모집 공고 보기"
            onEmptyAction={() => changeMode('list')}
            appliedIds={appliedIds}
            savedIds={savedIds}
            onSelectRecruit={onSelectRecruit}
            onOpenApplication={openApplication}
            onToggleSaved={toggleSaved}
          />
        </section>
      ) : mode === 'manage' ? (
        <section className="recruit-dashboard-panel">
          <RecruitList
            items={managedItems}
            variant="managed"
            emptyText="작성한 모집 공고가 없습니다."
            emptyDescription="함께할 멤버를 찾을 새 모집 공고를 등록해보세요."
            emptyIcon="users"
            emptyActionLabel="공고 등록"
            onEmptyAction={() => changeMode('write')}
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
                <FilterTabs
                  value={activeCategory}
                  options={recruitFilterTabs}
                  onChange={setActiveCategory}
                  ariaLabel="모집 분류"
                  separateFirst
                  className="recruit-category-filters"
                />
              </div>

              <SelectControl
                className="recruit-filter-group recruit-status-field"
                label="상태"
                value={activeFilter}
                options={filters.map((filter) => ({ value: filter.id, label: filter.id === 'all' ? '전체 상태' : filter.label }))}
                onChange={setActiveFilter}
              />

              <SelectControl
                className="recruit-filter-group recruit-sort-field"
                label="정렬"
                value={sortMode}
                options={[
                  { value: 'latest', label: '최신 등록순' },
                  { value: 'popular', label: '인기순' },
                ]}
                onChange={setSortMode}
              />
            </div>
          </section>

          <RecruitList
            items={visibleItems}
            variant="public"
            emptyText="조건에 맞는 모집이 없습니다."
            emptyDescription="검색어나 필터를 바꾸면 다른 모집 공고를 확인할 수 있습니다."
            emptyIcon="search"
            emptyActionLabel="필터 초기화"
            onEmptyAction={() => {
              setActiveCategory('all')
              setActiveFilter('all')
              setSortMode('latest')
              setQuery('')
            }}
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
