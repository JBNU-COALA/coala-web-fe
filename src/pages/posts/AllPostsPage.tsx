import { useEffect, useMemo, useState } from 'react'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import { postCategoryFilters, postCategoryMeta, type PostBoardFilterId } from '../../shared/postCategories'
import { extractFirstContentImage, toPlainContentPreview } from '../../shared/contentPreview'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { FilterTabs, type FilterTabOption } from '../../shared/ui/FilterTabs'
import { ViewModeToggle } from '../../shared/ui/ViewModeToggle'
import { SafeImage } from '../../shared/ui/SafeImage'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { SelectControl } from '../../shared/ui/SelectControl'
import { CommunityBanner } from '../community/CommunityBanner'
import { useAuth } from '../../shared/auth/AuthContext'
import { resolveCommunityBoardFilter } from '../../shared/communityBoards'
import { resolveApiAssetUrl } from '../../shared/api/client'

type AllPostsPageProps = {
  onOpenPost: (boardId: number, postId: number) => void
  onWritePost: () => void
  title?: string
}

type EnrichedPost = PostListItem & { board?: BoardData }
type PostBoardTabId = 'all' | PostBoardFilterId
type PostListViewMode = 'card' | 'list'

const boardFilterIconById: Record<PostBoardTabId, Parameters<typeof Icon>[0]['name']> = {
  all: 'layout',
  notice: 'bell',
  free: 'message',
  humor: 'palette',
}

function getPostImageUrl(post: PostListItem) {
  const contentImageUrl = extractFirstContentImage(post.content)
  const imageUrl = contentImageUrl || (post.thumbnailAttachmentId ? `/api/attachments/${post.thumbnailAttachmentId}/download` : '')
  return imageUrl ? resolveApiAssetUrl(imageUrl) : null
}

function formatPostDateTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function PostListThumbnail({
  imageUrl,
  viewMode,
}: {
  imageUrl: string
  viewMode: PostListViewMode
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

function formatPostDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const boardTabs: FilterTabOption<PostBoardTabId>[] = [
  { id: 'all', label: '전체', icon: boardFilterIconById.all, tone: 'all' },
  ...postCategoryFilters.map((filter) => ({
    id: filter.id,
    label: filter.label,
    icon: boardFilterIconById[filter.id],
    tone: filter.id,
  })),
]

function getPostLikeCount(post: PostListItem) {
  return post.likeCount ?? 0
}

export function AllPostsPage({
  onOpenPost,
  onWritePost,
  title = '게시판',
}: AllPostsPageProps) {
  const { isLoggedIn, user } = useAuth()
  const [activeBoard, setActiveBoard] = useState<PostBoardTabId>('all')
  const [enrichedPosts, setEnrichedPosts] = useState<EnrichedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<'latest' | 'popular'>('latest')
  const [viewMode, setViewMode] = useState<PostListViewMode>('list')
  const [likeError, setLikeError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const boards = await boardsApi.getBoards(true)
        const postsArrays = await Promise.all(boards.map((b) => postsApi.getPosts(b.boardId)))
        const combined: EnrichedPost[] = postsArrays.flatMap((posts, i) =>
          posts.map((p) => ({ ...p, board: boards[i] })),
        )
        setEnrichedPosts(combined)
      } catch {
        setEnrichedPosts([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const currentBoardLabel = activeBoard === 'all' ? '전체' : postCategoryMeta[activeBoard].label
  const normalizedQuery = query.trim().toLowerCase()
  const isOperator = user?.role === 'STAFF' || user?.role === 'SUPER_ADMIN'
  const canWriteCurrentBoard = activeBoard !== 'notice' || isOperator

  const visiblePosts = useMemo(() => {
    const byCategory = enrichedPosts.filter((post) => {
      if (!post.board) return false
      const postCategory = resolveCommunityBoardFilter(post.board)
      if (!postCategory) return false
      if (activeBoard === 'all') return true
      return postCategory === activeBoard
    })

    const searched = normalizedQuery
      ? byCategory.filter((post) => {
          const searchable = `${post.title} ${post.content} ${post.authorName ?? ''}`.toLowerCase()
          return searchable.includes(normalizedQuery)
        })
      : byCategory

    return [...searched].sort((a, b) => {
      if (sortMode === 'popular') return getPostLikeCount(b) - getPostLikeCount(a)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [activeBoard, enrichedPosts, normalizedQuery, sortMode])

  const togglePostLike = async (post: EnrichedPost) => {
    if (!isLoggedIn) {
      setLikeError('좋아요는 로그인 후 누를 수 있습니다.')
      return
    }

    setLikeError(null)
    try {
      const response = await postsApi.likePost(post.postId)
      setEnrichedPosts((current) =>
        current.map((item) => (
          item.postId === post.postId
            ? { ...item, likeCount: response.likeCount, likedByMe: response.liked }
            : item
        )),
      )
    } catch {
      setLikeError('좋아요 처리에 실패했습니다.')
    }
  }

  return (
    <section className="coala-content coala-content--posts">
      <div className="board-page">
        <CommunityBanner title={title} tone="board" meta={`게시글 ${visiblePosts.length}개`} />

        <section className="surface-card community-list-controls board-list-controls" aria-label="게시판 필터">
          <div className="community-list-summary">
            <div className="community-list-heading">
              <p>{currentBoardLabel}</p>
              <strong>게시글 {visiblePosts.length}개</strong>
            </div>
          </div>

          <FilterTabs
            value={activeBoard}
            options={boardTabs}
            onChange={setActiveBoard}
            ariaLabel="게시판 분류"
            separateFirst
            className="community-filter-tabs"
          />

          <div className="community-list-actions">
            <SearchField
              className="community-list-search"
              value={query}
              onChange={setQuery}
              placeholder="게시글 제목을 검색하세요"
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
              className="write-post-button write-post-button--board"
              disabled={!canWriteCurrentBoard}
              title={!canWriteCurrentBoard ? '공지는 운영진만 작성할 수 있습니다.' : undefined}
              onClick={canWriteCurrentBoard ? onWritePost : undefined}
            >
              <Icon name="edit" size={15} />
              글쓰기
            </button>
          </div>
          {likeError ? <p className="auth-error board-like-error">{likeError}</p> : null}
        </section>

        <article className={`surface-card board-shell board-shell--editorial board-shell--${viewMode}`}>
          {viewMode === 'list' ? (
            <div className="board-table-head" aria-hidden="true">
              <span>분류</span>
              <span>제목</span>
              <span>작성자</span>
              <span>작성일</span>
              <span>조회</span>
              <span>댓글</span>
              <span>좋아요</span>
            </div>
          ) : null}
          <ul className={`board-post-list board-post-list--editorial board-post-list--${viewMode}`}>
            {isLoading ? (
              <li className="empty-post-state">게시글을 불러오는 중...</li>
            ) : (
              visiblePosts.map((post) => {
                const category = post.board ? resolveCommunityBoardFilter(post.board) ?? 'free' : 'free'
                const categoryMeta = postCategoryMeta[category]
                const compositeId = `${post.boardId}-${post.postId}`
                const imageUrl = getPostImageUrl(post)
                const cardImageUrl = imageUrl ?? '/coala-card-placeholder.png'
                const summary = toPlainContentPreview(post.content)
                const authorName = post.authorName ?? `사용자 ${post.userId}`

	                return (
	                  <li key={compositeId} className={`board-post-row board-post-row--${viewMode}`}>
	                    <article
	                      className={[
	                        'board-post-card',
	                        `board-post-card--${viewMode}`,
	                        viewMode === 'card' ? 'board-post-card--has-image' : '',
	                      ].filter(Boolean).join(' ')}
                        role="button"
                        tabIndex={0}
	                      onClick={() => onOpenPost(post.boardId, post.postId)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          event.preventDefault()
                          onOpenPost(post.boardId, post.postId)
                        }}
	                    >
	                      {viewMode === 'card' ? (
	                        <PostListThumbnail imageUrl={cardImageUrl} viewMode={viewMode} />
	                      ) : null}

	                      <div className="board-post-main">
                        <div className="board-post-heading">
                          <span className={`board-tag board-tag--${categoryMeta.tone}`}>
                            {post.board?.boardName ?? categoryMeta.label}
                          </span>
                          {category === 'notice' ? <Icon name="bell" size={14} /> : null}
                          <h3 className="board-post-title">{post.title}</h3>
                        </div>

                        <p className="board-post-excerpt">
                          {summary.slice(0, 120)}
                        </p>

                        <p className="board-post-meta">
                          <CharacterAvatar name={authorName} seed={post.userId} size="xs" className="board-avatar" />
                          <span>{authorName}</span>
                          <span className="dot-divider" />
                          <span>{formatPostDateTime(post.createdAt)}</span>
                        </p>
                      </div>


                      {viewMode === 'list' ? (
                        <div className="board-table-meta" aria-label="게시글 정보">
                          <span className="board-table-author">
                            <CharacterAvatar name={authorName} seed={post.userId} size="xs" className="board-avatar" />
                            {authorName}
                          </span>
                          <span>{formatPostDate(post.createdAt)}</span>
                          <span>{post.viewCount}</span>
                          <span>{post.commentCount ?? 0}</span>
                          <span>{getPostLikeCount(post)}</span>
                        </div>
                      ) : null}

                      <div className="board-post-stats">
                        <span className="board-stat">
                          <Icon name="eye" size={14} />
                          <span>{post.viewCount}</span>
                        </span>
                        <span className="board-stat">
                          <Icon name="message" size={14} />
                          <span>{post.commentCount ?? 0}</span>
                        </span>
                        <button
                          type="button"
                          className={post.likedByMe ? 'board-like-button is-liked' : 'board-like-button'}
                          aria-pressed={Boolean(post.likedByMe)}
                          aria-label={`${post.title} 좋아요`}
                          onClick={(event) => {
                            event.stopPropagation()
                            void togglePostLike(post)
                          }}
                        >
                          <Icon name="heart" size={14} />
                          <span>{getPostLikeCount(post)}</span>
                        </button>
                      </div>
                    </article>
                  </li>
                )
              })
            )}

            {!isLoading && visiblePosts.length === 0 && (
              <li className="empty-post-state">조건에 맞는 게시글이 없습니다.</li>
            )}
          </ul>

          <footer className="board-pagination" aria-label="페이지">
            <button type="button" className="page-button is-active">
              1
            </button>
          </footer>
        </article>
      </div>
    </section>
  )
}
