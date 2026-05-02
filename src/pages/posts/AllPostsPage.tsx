import { useEffect, useMemo, useState } from 'react'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import {
  communityPosts,
  defaultPostBoardFilter,
  postCategoryFilters,
  postCategoryMeta,
  type PostBoardFilterId,
} from './postsData'
import { Icon } from '../../shared/ui/Icon'

type AllPostsPageProps = {
  onOpenPost: (postId: string) => void
  onWritePost: () => void
  title?: string
  subtitle?: string
}

type EnrichedPost = PostListItem & { board?: BoardData }
type BoardViewFilter = 'all' | 'notice' | 'popular'

function boardTypeToFilter(boardType: string): PostBoardFilterId {
  const normalized = boardType.trim().toUpperCase()
  if (normalized === 'NORMAL') return 'normal'
  if (normalized === 'RECRUIT') return 'recruit'
  return 'all'
}

const AVATAR_TONES = ['mint', 'slate', 'sky', 'sand', 'rose'] as const

function toAuthorTone(userId: number) {
  return AVATAR_TONES[userId % AVATAR_TONES.length]
}

const fallbackCommunityPosts: EnrichedPost[] = communityPosts.map((post, index) => ({
  postId: index + 1,
  boardId: post.category === 'recruit' ? 2 : 1,
  boardName: post.category === 'recruit' ? '모집' : '일반 게시판',
  userId: index + 1,
  authorName: post.author,
  title: post.title,
  content: post.excerpt,
  viewCount: Number(post.views.replace('k', '00').replace('.', '')),
  createdAt: new Date(Date.now() - index * 3600000 * 8).toISOString(),
  updatedAt: new Date(Date.now() - index * 3600000 * 8).toISOString(),
  board: {
    boardId: post.category === 'recruit' ? 2 : 1,
    boardName: post.category === 'recruit' ? '모집' : '일반 게시판',
    boardType: post.category === 'recruit' ? 'RECRUIT' : 'NORMAL',
    description: post.excerpt,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}))

const boardViewFilters: { id: BoardViewFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'notice', label: '공지' },
  { id: 'popular', label: '인기' },
]

function isNoticePost(post: EnrichedPost) {
  return post.title.includes('공지') || post.board?.boardName.includes('공지')
}

export function AllPostsPage({
  onOpenPost,
  onWritePost,
  title = '전체 게시글',
  subtitle,
}: AllPostsPageProps) {
  const [activeBoard, setActiveBoard] = useState<PostBoardFilterId>(defaultPostBoardFilter)
  const [enrichedPosts, setEnrichedPosts] = useState<EnrichedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<'latest' | 'popular'>('latest')
  const [viewFilter, setViewFilter] = useState<BoardViewFilter>('all')

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const boards = await boardsApi.getBoards(true)
        const postsArrays = await Promise.all(boards.map((b) => postsApi.getPosts(b.boardId)))
        const combined: EnrichedPost[] = postsArrays.flatMap((posts, i) =>
          posts.map((p) => ({ ...p, board: boards[i] })),
        )
        setEnrichedPosts(combined.length > 0 ? combined : fallbackCommunityPosts)
      } catch {
        setEnrichedPosts(fallbackCommunityPosts)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const currentBoardMeta = postCategoryMeta[activeBoard]
  const normalizedQuery = query.trim().toLowerCase()

  const visiblePosts = useMemo(() => {
    const byCategory =
      activeBoard === 'all'
        ? enrichedPosts
        : enrichedPosts.filter(
            (p) => p.board && boardTypeToFilter(p.board.boardType) === activeBoard,
          )

    const searched = normalizedQuery
      ? byCategory.filter((p) => p.title.toLowerCase().includes(normalizedQuery))
      : byCategory

    const byView =
      viewFilter === 'notice'
        ? searched.filter(isNoticePost)
        : viewFilter === 'popular'
          ? searched.filter((p) => p.viewCount >= 900)
          : searched

    return [...byView].sort((a, b) => {
      if (sortMode === 'popular') return b.viewCount - a.viewCount
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [activeBoard, enrichedPosts, normalizedQuery, sortMode, viewFilter])

  return (
    <section className="coala-content coala-content--posts">
      <div className="board-page">
        <header className="board-hero">
          <div>
            <p className="board-eyebrow">Community</p>
            <h2 className="board-title">{title}</h2>
            <p className="board-subtitle">{subtitle ?? `총 ${enrichedPosts.length}개의 게시글`}</p>
          </div>
        </header>

        <div className="board-search-row">
          <label className="board-search">
            <Icon name="search" size={17} />
            <input
              type="search"
              placeholder="게시글 제목을 검색하세요"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="board-sort-button"
            onClick={() =>
              setSortMode((currentMode) => (currentMode === 'latest' ? 'popular' : 'latest'))
            }
          >
            <span>{sortMode === 'latest' ? '최신순' : '인기순'}</span>
            <Icon name="chevron-down" size={14} />
          </button>
        </div>

        <div className="board-filter-row">
          <ul className="board-filters" aria-label="게시판 필터">
            {postCategoryFilters.map((filter) => (
              <li key={filter.id}>
                <button
                  type="button"
                  className={
                    activeBoard === filter.id
                      ? 'board-filter-chip is-active'
                      : 'board-filter-chip'
                  }
                  onClick={() => setActiveBoard(filter.id)}
                >
                  {filter.label}
                </button>
              </li>
            ))}
          </ul>

          <ul className="board-filters" aria-label="글 성격 필터">
            {boardViewFilters.map((filter) => (
              <li key={filter.id}>
                <button
                  type="button"
                  className={
                    viewFilter === filter.id
                      ? 'board-filter-chip board-filter-chip--strong is-active'
                      : 'board-filter-chip board-filter-chip--strong'
                  }
                  onClick={() => setViewFilter(filter.id)}
                >
                  {filter.label}
                </button>
              </li>
            ))}
          </ul>

          <button type="button" className="write-post-button write-post-button--board" onClick={onWritePost}>
            <Icon name="edit" size={15} />
            <span>글쓰기</span>
          </button>
        </div>

      <article className="surface-card board-shell">
        <div className="board-toolbar">
          <div className="board-context">
            <span className={`board-context-pill board-context-pill--${currentBoardMeta.tone}`}>
              {currentBoardMeta.label}
            </span>
            <p>{currentBoardMeta.description}</p>
          </div>

          <div className="board-toolbar-actions">
            <span className="board-count">{visiblePosts.length}개의 글</span>
          </div>
        </div>

        <ul className="board-post-list">
          {isLoading ? (
            <li className="empty-post-state">게시글을 불러오는 중...</li>
          ) : (
            visiblePosts.map((post) => {
              const category = post.board ? boardTypeToFilter(post.board.boardType) : 'all'
              const categoryMeta = postCategoryMeta[category]
              const compositeId = `${post.boardId}-${post.postId}`

              return (
                <li key={compositeId} className="board-post-row">
                  <button
                    type="button"
                    className="board-post-card"
                    onClick={() => onOpenPost(compositeId)}
                  >
                    <div className="board-post-main">
                      <div className="board-post-heading">
                        <span className={`board-tag board-tag--${categoryMeta.tone}`}>
                          {post.board?.boardName ?? categoryMeta.label}
                        </span>
                        <h3 className="board-post-title">{post.title}</h3>
                      </div>

                      <p className="board-post-meta">
                        <span
                          className={`board-avatar board-avatar--${toAuthorTone(post.userId)}`}
                        >
                          {(post.authorName ?? String(post.userId))[0]}
                        </span>
                        <span>{post.authorName ?? `사용자 ${post.userId}`}</span>
                      </p>
                    </div>

                    <div className="board-post-stats">
                      <span className="board-stat">
                        <Icon name="eye" size={14} />
                        <span>{post.viewCount}</span>
                      </span>
                      <span className="board-stat">
                        <Icon name="message" size={14} />
                        <span>0</span>
                      </span>
                    </div>
                  </button>
                </li>
              )
            })
          )}

          {!isLoading && visiblePosts.length === 0 && (
            <li className="empty-post-state">조건에 맞는 게시글이 없습니다.</li>
          )}
        </ul>

        <footer className="board-pagination" aria-label="페이지네이션">
          <button type="button" className="page-button is-active">
            1
          </button>
        </footer>
      </article>
      </div>
    </section>
  )
}
