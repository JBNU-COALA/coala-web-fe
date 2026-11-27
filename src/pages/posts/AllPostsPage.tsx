import { ListingControls } from '../../shared/ui/ListingControls'
import { LoadErrorState } from '../../shared/ui/LoadErrorState'
import { useEffect, useMemo, useState } from 'react'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import { postCategoryFilters, postCategoryMeta, type PostBoardFilterId } from '../../shared/postCategories'
import { extractFirstContentImage, toPlainContentPreview } from '../../shared/contentPreview'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { SafeImage } from '../../shared/ui/SafeImage'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { SelectControl } from '../../shared/ui/SelectControl'
import { Pagination } from '../../shared/ui/Pagination'
import { usePagination } from '../../shared/ui/usePagination'
import { useAuth } from '../../shared/auth/AuthContext'
import { isCommunityBoard, resolveCommunityBoardFilter } from '../../shared/communityBoards'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner'
import { CommunityBanner } from '../community/CommunityBanner'
import './all-posts.css'

type AllPostsPageProps = {
  onOpenPost: (boardId: number, postId: number) => void
  onWritePost: () => void
  title?: string
}

type EnrichedPost = PostListItem & { board?: BoardData }
type PostBoardTabId = 'all' | PostBoardFilterId


function getPostImageUrl(post: PostListItem) {
  const contentImageUrl = extractFirstContentImage(post.content)
  const imageUrl = contentImageUrl || (post.thumbnailAttachmentId ? `/api/attachments/${post.thumbnailAttachmentId}/download` : '')
  return imageUrl ? resolveApiAssetUrl(imageUrl) : null
}

function formatPostDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  })
}

const boardFilterOptions: { value: PostBoardTabId; label: string }[] = [
  { value: 'all', label: '전체' },
  ...postCategoryFilters.map((filter) => ({ value: filter.id, label: filter.label })),
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

  const [likeError, setLikeError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadRevision, setLoadRevision] = useState(0)

  useEffect(() => {
    let active = true
    const fetchData = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const boards = (await boardsApi.getBoards(true)).filter(isCommunityBoard)
        const postsArrays = await Promise.all(boards.map((b) => postsApi.getPosts(b.boardId)))
        const combined: EnrichedPost[] = postsArrays.flatMap((posts, i) =>
          posts.map((p) => ({ ...p, board: boards[i] })),
        )
        if (active) setEnrichedPosts(combined)
      } catch {
        if (active) setLoadError('게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    fetchData()
    return () => { active = false }
  }, [loadRevision])

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
  const pagination = usePagination(visiblePosts, `${activeBoard}:${normalizedQuery}:${sortMode}`)

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
      <CommunityBanner title={title} description="코알라 멤버들의 자유로운 소통 공간" />
      <div className="community-board page-container">
        <div className="community-board-layout">
          <div className="community-board-main">
            <ListingControls search={<SearchField value={query} onChange={setQuery} placeholder="제목, 내용, 작성자로 검색" />} label="게시글 검색 및 필터" actions={<button type="button" className="community-board-write" disabled={!canWriteCurrentBoard}
                  title={!canWriteCurrentBoard ? '공지는 운영진만 작성할 수 있습니다.' : undefined}
                  onClick={canWriteCurrentBoard ? onWritePost : undefined}><Icon name="pencil-color" size={16} />글 작성</button>}>

              <SelectControl label="정렬" value={sortMode} options={[{ value: 'latest', label: '최신순' }, { value: 'popular', label: '인기순' }]} onChange={setSortMode} />
            </ListingControls>
            {likeError && <p className="auth-error" role="alert">{likeError}</p>}
            <ul key={activeBoard} className="community-board-posts community-board-posts--reveal" aria-busy={isLoading}>
              {isLoading ? <li className="community-board-empty"><LoadingSpinner label="게시글을 불러오는 중..." /></li>
                : loadError ? <li><LoadErrorState message={loadError} onRetry={() => setLoadRevision((value) => value + 1)} /></li>
                : pagination.pageItems.map((post) => {
                  const category = post.board ? resolveCommunityBoardFilter(post.board) ?? 'free' : 'free'
                  const imageUrl = getPostImageUrl(post)
                  const authorName = post.anonymous ? '익명' : post.authorName || '코알라 멤버'
                  return <li key={`${post.boardId}-${post.postId}`} className="community-board-post">
                    <article>
                      <button type="button" className="community-board-post-link" onClick={() => onOpenPost(post.boardId, post.postId)}>
                        <span className="community-board-post-copy">
                          <span className="community-board-post-heading">
                            <span className="community-board-tag">#{postCategoryMeta[category].label}</span>
                            <strong>{post.title}</strong>
                          </span>
                          <span className="community-board-excerpt">{toPlainContentPreview(post.content)}</span>
                        </span>
                        {imageUrl && <SafeImage className="community-board-thumbnail" src={imageUrl} alt="" loading="lazy" />}
                      </button>
                      <div className="community-board-post-meta">
                        <span className="community-board-author"><CharacterAvatar name={authorName} seed={post.anonymous ? 'anonymous' : post.userId} size="xs" /><span>{authorName}</span></span>
                        <span className="community-board-stat" aria-label={`조회 ${post.viewCount}`}><Icon name="eye" size={17} />{post.viewCount}</span>
                        <button type="button" className={`community-board-like${post.likedByMe ? ' is-liked' : ''}`} aria-pressed={Boolean(post.likedByMe)} aria-label={`${post.title} 좋아요`} onClick={() => void togglePostLike(post)}><Icon name="heart" size={17} />{getPostLikeCount(post)}</button>
                        <span className="community-board-stat" aria-label={`댓글 ${post.commentCount ?? 0}`}><Icon name="message" size={17} />{post.commentCount ?? 0}</span>
                        <time dateTime={post.createdAt}>{formatPostDate(post.createdAt)}</time>
                      </div>
                    </article>
                  </li>
                })}
              {!isLoading && !loadError && visiblePosts.length === 0 && <li className="community-board-empty">조건에 맞는 게시글이 없습니다.</li>}
            </ul>
            <Pagination page={pagination.page} pageCount={pagination.pageCount} onChange={pagination.setPage} />
          </div>
          <aside className="community-board-filters" aria-labelledby="community-board-filters-title">
            <h2 id="community-board-filters-title">태그로 찾기</h2>
            <div>{boardFilterOptions.map((option) => <button key={option.value} type="button" aria-pressed={activeBoard === option.value} onClick={() => setActiveBoard(option.value)}>#{option.label}</button>)}</div>
          </aside>

        </div>
      </div>
    </section>
  )
}
