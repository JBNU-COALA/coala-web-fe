import { useEffect, useMemo, useRef, useState } from 'react'
import { useRequestScope } from '../../useRequestScope'
import { infoApi, type InfoArticle, type InfoFilterId } from '../../shared/api/info'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { FilterTabs, type FilterTabOption } from '../../shared/ui/FilterTabs'
import { ViewModeToggle } from '../../shared/ui/ViewModeToggle'
import { SafeImage } from '../../shared/ui/SafeImage'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { SelectControl } from '../../shared/ui/SelectControl'
import { ListingControls } from '../../shared/ui/ListingControls'
import { Pagination } from '../../shared/ui/Pagination'
import { usePagination } from '../../shared/ui/usePagination'
import { CommunityBanner } from '../community/CommunityBanner'
import { extractFirstContentImage, toPlainContentPreview } from '../../shared/contentPreview'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { useAuth } from '../../shared/auth/AuthContext'

type InfoSharePageProps = {
  onWriteInfo?: () => void
  onOpenInfo?: (postId: number) => void
}

type InfoTabId = 'all' | InfoFilterId
type InfoListViewMode = 'card' | 'list'

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

const infoTabs: FilterTabOption<InfoTabId>[] = infoTabFilters.map((filter) => ({
  ...filter,
  icon: filterIconById[filter.id],
  tone: filter.id,
}))

const infoLabelByFilter: Record<InfoFilterId, string> = {
  news: '소식',
  contest: '대회',
  lab: '연구실',
  resource: '자료',
}

function getInfoImageUrl(card: InfoArticle) {
  const contentImageUrl = extractFirstContentImage(card.content)
  if (contentImageUrl) return resolveApiAssetUrl(contentImageUrl)
  if (card.imageUrl) return resolveApiAssetUrl(card.imageUrl)
  if (card.thumbnailAttachmentId) return resolveApiAssetUrl(`/api/attachments/${card.thumbnailAttachmentId}/download`)
  return '/coala-card-placeholder.png'
}

function InfoListThumbnail({
  imageUrl,
  viewMode,
}: {
  imageUrl: string
  viewMode: InfoListViewMode
}) {
  return (
    <div className={`board-post-thumbnail board-post-thumbnail--${viewMode}`}>
      <SafeImage
        src={imageUrl}
        alt=""
        loading="lazy"
        fallback={<img src="/coala-card-placeholder.png" alt="" loading="lazy" />}
      />
    </div>
  )
}

function getInfoLikeCount(article: InfoArticle) {
  return article.likeCount ?? 0
}

export function InfoSharePage({ onWriteInfo, onOpenInfo }: InfoSharePageProps) {
  const { isLoggedIn } = useAuth()
  const [activeFilter, setActiveFilter] = useState<InfoTabId>('all')
  const [query, setQuery] = useState('')
  const [resources, setResources] = useState<InfoArticle[]>([])
  const [copiedResourceId, setCopiedResourceId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<InfoListViewMode>('card')
  const [sortMode, setSortMode] = useState<'latest' | 'popular'>('latest')
  const [likeError, setLikeError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadRevision, setLoadRevision] = useState(0)
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set())
  const mutationLocks = useRef(new Set<number>())
  const captureRequest = useRequestScope()

  function beginMutation(id: number) {
    if (mutationLocks.current.has(id)) return false
    mutationLocks.current.add(id)
    setPendingIds(new Set(mutationLocks.current))
    return true
  }

  function finishMutation(id: number) {
    mutationLocks.current.delete(id)
    setPendingIds(new Set(mutationLocks.current))
  }

  const normalizedQuery = query.trim().toLowerCase()

  useEffect(() => {
    let active = true
    infoApi.getArticles('all')
      .then((items) => { if (active) { setResources(items); setLoadError(null) } })
      .catch(() => { if (active) setLoadError('정보공유 목록을 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [loadRevision, isLoggedIn])

  const visibleResources = useMemo(() => {
    const filteredByType =
      activeFilter === 'all'
        ? resources
        : resources.filter((card) => card.filter === activeFilter)

    const searched = !normalizedQuery ? filteredByType : filteredByType.filter((card) => {
      const searchable = `${card.title} ${card.meta} ${card.source} ${card.tag}`.toLowerCase()
      return searchable.includes(normalizedQuery)
    })

    return [...searched].sort((a, b) => {
      if (sortMode === 'popular') return getInfoLikeCount(b) - getInfoLikeCount(a)
      const aTime = new Date(a.sourceDate ?? a.createdAt ?? 0).getTime()
      const bTime = new Date(b.sourceDate ?? b.createdAt ?? 0).getTime()
      return bTime - aTime
    })
  }, [activeFilter, normalizedQuery, resources, sortMode])
  const pagination = usePagination(visibleResources, `${activeFilter}:${normalizedQuery}:${sortMode}`)

  const toggleSavedResource = async (resourceId: number) => {
    if (!isLoggedIn) {
      setLikeError('정보 저장은 로그인 후 이용할 수 있습니다.')
      return
    }
    if (!beginMutation(resourceId)) return
    const isCurrent = captureRequest()
    setLikeError(null)
    try {
      const updated = await infoApi.bookmarkArticle(resourceId)
      if (isCurrent()) setResources((current) => current.map((item) => item.id === resourceId
        ? { ...item, bookmarkedByMe: updated.bookmarkedByMe, bookmarkCount: updated.bookmarkCount } : item))
    } catch {
      if (isCurrent()) setLikeError('정보 저장에 실패했습니다. 다시 시도해 주세요.')
      return
    } finally { if (isCurrent()) finishMutation(resourceId) }
  }

  const copyResourceTitle = async (resourceId: number, title: string) => {
    try {
      await navigator.clipboard.writeText(title)
      setCopiedResourceId(resourceId)
      setTimeout(() => setCopiedResourceId(null), 1600)
    } catch {
      setCopiedResourceId(null)
    }
  }

  const toggleInfoLike = async (article: InfoArticle) => {
    if (!isLoggedIn) {
      setLikeError('좋아요는 로그인 후 누를 수 있습니다.')
      return
    }

    if (!beginMutation(article.id)) return
    const isCurrent = captureRequest()
    setLikeError(null)
    try {
      const response = await infoApi.likeArticle(article.id)
      if (!isCurrent()) return
      setResources((current) =>
        current.map((item) => (
          item.id === article.id
            ? { ...item, likeCount: response.likeCount, likedByMe: response.liked }
            : item
        )),
      )
    } catch {
      if (isCurrent()) setLikeError('좋아요 처리에 실패했습니다.')
    } finally {
      if (isCurrent()) finishMutation(article.id)
    }
  }

  return (
    <section className="coala-content coala-content--info">
      <article className="info-shell">
        <CommunityBanner
          title="정보공유"
          tone="info"
          meta={`게시글 ${visibleResources.length}개`}
        />

        <ListingControls className="page-container" label="정보공유 필터" count={`게시글 ${visibleResources.length}개`}
          message={likeError ? <p className="auth-error" role="alert">{likeError}</p> : null}
          filters={<FilterTabs
            value={activeFilter}
            options={infoTabs}
            onChange={setActiveFilter}
            ariaLabel="정보공유 분류"
            separateFirst
          />}>
            <SearchField
              className="community-list-search"
              value={query}
              onChange={setQuery}
              placeholder="소식, 대회, 연구실, 자료 검색"
            />
            <SelectControl
              className="board-sort-field"
              label="정렬"
              value={sortMode}
              options={[
                { value: 'latest', label: '최신순' },
                { value: 'popular', label: '인기순' },
              ]}
              onChange={setSortMode}
            />
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <button
              type="button"
              className="write-post-button write-post-button--info"
              onClick={onWriteInfo}
            >
              <Icon name="edit" size={15} />
              글쓰기
            </button>
        </ListingControls>

        <article className={`surface-card board-shell info-board-shell board-shell--${viewMode}`} aria-label="정보공유 목록">
          <ul className={`board-post-list info-list info-list--editorial board-post-list--${viewMode}`}>
            {pagination.pageItems.map((card) => {
              const [fallbackSourceName, fallbackSourceDate] = card.source.split('|').map((part) => part.trim())
              const sourceName = card.authorName || card.sourceName || fallbackSourceName
              const sourceDate = card.sourceDate || fallbackSourceDate
              const summary = toPlainContentPreview(card.content)
              const imageUrl = getInfoImageUrl(card)
              const categoryLabel = infoLabelByFilter[card.filter]

	              return (
	                <li key={card.id} className={`board-post-row info-post-row board-post-row--${viewMode}`}>
	                  <div
	                    className={[
	                      'board-post-card',
	                      'info-post-card',
	                      `board-post-card--${viewMode}`,
	                      imageUrl ? 'board-post-card--has-image' : '',
	                    ].filter(Boolean).join(' ')}
	                  >
	                    {viewMode === 'card' && imageUrl ? (
	                      <InfoListThumbnail imageUrl={imageUrl} viewMode={viewMode} />
	                    ) : null}

                    <button
                      type="button"
                      className="info-post-open"
                      onClick={() => onOpenInfo?.(card.id)}
                    >
                      <div className="board-post-main">
                        <div className="board-post-heading">
                          <span className={`board-tag info-tag info-tag--${card.filter}`}>
                            {categoryLabel}
                          </span>
                          <h3 className="board-post-title">{card.title}</h3>
                        </div>

                        <p className="board-post-excerpt">
                          {summary.slice(0, 120)}
                        </p>

                        <p className="board-post-meta">
                          <CharacterAvatar
                            name={sourceName || '코알라'}
                            seed={card.authorId ?? card.id}
                            size="xs"
                            className="board-avatar"
                          />
                          <span>{sourceName || '코알라'}</span>
                          {sourceDate ? (
                            <>
                              <span className="dot-divider" />
                              <span>{sourceDate}</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </button>

	                    {viewMode === 'list' && imageUrl ? (
	                      <InfoListThumbnail imageUrl={imageUrl} viewMode={viewMode} />
	                    ) : null}

                    <div className="board-post-stats info-post-stats">
                      <span className="board-stat">
                        <Icon name="eye" size={14} />
                        <span>{card.viewCount}</span>
                      </span>
                      <span className="board-stat">
                        <Icon name="file" size={14} />
                        <span>{card.meta}</span>
                      </span>
                      <div className="info-list-actions">
                        <button
                          type="button"
                          className={card.likedByMe ? 'board-like-button is-liked' : 'board-like-button'}
                          aria-pressed={Boolean(card.likedByMe)}
                          aria-label={`${card.title} 좋아요`}
                          disabled={pendingIds.has(card.id)}
                          onClick={() => {
                            void toggleInfoLike(card)
                          }}
                        >
                          <Icon name="heart" size={14} />
                          <span>{getInfoLikeCount(card)}</span>
                        </button>
                        <button
                          type="button"
                          className={
                            card.bookmarkedByMe
                              ? 'info-list-action info-list-action--active'
                              : 'info-list-action'
                          }
                          aria-label="정보 저장"
                          disabled={pendingIds.has(card.id)}
                          aria-pressed={Boolean(card.bookmarkedByMe)}
                          onClick={() => {
                            void toggleSavedResource(card.id)
                          }}
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
                  </div>
                </li>
              )
            })}

            {loading ? <li className="empty-post-state" role="status">정보를 불러오는 중입니다.</li> : loadError ? <li className="empty-post-state"><p role="alert">{loadError}</p><button type="button" className="ghost-button" onClick={() => { setLoading(true); setLoadRevision((value) => value + 1) }}>다시 불러오기</button></li> : visibleResources.length === 0 ? (
              <li className="empty-post-state">조건에 맞는 정보가 없습니다.</li>
            ) : null}
          </ul>
          <Pagination page={pagination.page} pageCount={pagination.pageCount} onChange={pagination.setPage} />

        </article>
      </article>
    </section>
  )
}
