import { useEffect, useMemo, useState } from 'react'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import {
  communityPosts,
  postCategoryFilters,
  postCategoryMeta,
  type PostBoardFilterId,
} from './postsData'
import { Icon } from '../../shared/ui/Icon'
import { CommunityBanner } from '../community/CommunityBanner'
import { useAuth } from '../../shared/auth/AuthContext'
import { fallbackCommunityBoardIds, resolveCommunityBoardFilter } from '../../shared/communityBoards'

type AllPostsPageProps = {
  onOpenPost: (boardId: number, postId: number) => void
  onWritePost: () => void
  title?: string
}

type EnrichedPost = PostListItem & { board?: BoardData }
type PostBoardTabId = 'all' | PostBoardFilterId

const avatarTones = ['mint', 'slate', 'sky', 'sand', 'rose'] as const

function toAuthorTone(userId: number) {
  return avatarTones[userId % avatarTones.length]
}

const fallbackCommunityPosts: EnrichedPost[] = communityPosts.map((post, index) => ({
  postId: index + 1,
  boardId: fallbackCommunityBoardIds[post.category],
  boardName: postCategoryMeta[post.category].label,
  userId: index + 1,
  authorName: post.author,
  title: post.title,
  content: post.excerpt,
  viewCount: Number(post.views.replace('k', '00').replace('.', '')),
  commentCount: post.comments,
  likeCount: post.solved ? 12 : Math.max(3, post.comments * 2),
  createdAt: new Date(Date.now() - index * 3600000 * 8).toISOString(),
  updatedAt: new Date(Date.now() - index * 3600000 * 8).toISOString(),
  board: {
    boardId: fallbackCommunityBoardIds[post.category],
    boardName: postCategoryMeta[post.category].label,
    boardType: 'NORMAL',
    description: post.excerpt,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}))

export function AllPostsPage({
  onOpenPost,
  onWritePost,
  title = '게시판',
}: AllPostsPageProps) {
  const { user } = useAuth()
  const [activeBoard, setActiveBoard] = useState<PostBoardTabId>('all')
  const [enrichedPosts, setEnrichedPosts] = useState<EnrichedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<'latest' | 'popular'>('latest')

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

  const currentBoardLabel = activeBoard === 'all' ? '전체' : postCategoryMeta[activeBoard].label
  const normalizedQuery = query.trim().toLowerCase()
  const isOperator =
    Boolean(user?.email?.toLowerCase().includes('admin')) ||
    Boolean(user?.name?.includes('관리자')) ||
    Boolean(user?.nickname?.includes('운영'))
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
      if (sortMode === 'popular') return b.viewCount - a.viewCount
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [activeBoard, enrichedPosts, normalizedQuery, sortMode])

  return (
    <section className="coala-content coala-content--posts">
      <div className="board-page">
        <CommunityBanner title={title} tone="board" />

        <section className="surface-card community-list-controls board-list-controls" aria-label="게시판 필터">
          <div className="community-list-summary">
            <div className="community-list-heading">
              <p>{currentBoardLabel}</p>
              <strong>게시글 {visiblePosts.length}개</strong>
            </div>
          </div>

          <div className="community-filter-tabs community-filter-tabs--with-all" role="tablist" aria-label="게시판 분류">
            <button
              type="button"
              role="tab"
              aria-selected={activeBoard === 'all'}
              className={
                activeBoard === 'all'
                  ? 'community-filter-tab community-filter-tab--all is-active'
                  : 'community-filter-tab community-filter-tab--all'
              }
              onClick={() => setActiveBoard('all')}
            >
              전체
            </button>
            <span className="community-filter-divider" aria-hidden="true" />
            <div className="community-filter-grouped">
              {postCategoryFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={activeBoard === filter.id}
                  className={
                    activeBoard === filter.id
                      ? 'community-filter-tab is-active'
                      : 'community-filter-tab'
                  }
                  onClick={() => setActiveBoard(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="community-list-actions">
            <label className="community-list-search">
              <Icon name="search" size={15} />
              <input
                type="search"
                placeholder="게시글 제목을 검색하세요"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <label className="board-sort-field">
              <span>정렬</span>
              <select
                className="board-sort-select"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as 'latest' | 'popular')}
              >
                <option value="latest">최신순</option>
                <option value="popular">인기순</option>
              </select>
            </label>

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
        </section>

        <article className="surface-card board-shell">
          <ul className="board-post-list">
            {isLoading ? (
              <li className="empty-post-state">게시글을 불러오는 중...</li>
            ) : (
              visiblePosts.map((post) => {
                const category = post.board ? resolveCommunityBoardFilter(post.board) ?? 'free' : 'free'
                const categoryMeta = postCategoryMeta[category]
                const compositeId = `${post.boardId}-${post.postId}`

                return (
                  <li key={compositeId} className="board-post-row">
                    <button
                      type="button"
                      className="board-post-card"
                      onClick={() => onOpenPost(post.boardId, post.postId)}
                    >
                      <div className="board-post-main">
                        <div className="board-post-heading">
                          <span className={`board-tag board-tag--${categoryMeta.tone}`}>
                            {post.board?.boardName ?? categoryMeta.label}
                          </span>
                          <h3 className="board-post-title">{post.title}</h3>
                        </div>

                        <p className="board-post-excerpt">
                          {post.content.replace(/<[^>]+>/g, '').slice(0, 120)}
                        </p>

                        <p className="board-post-meta">
                          <span
                            className={`board-avatar board-avatar--${toAuthorTone(post.userId)}`}
                          >
                            {(post.authorName ?? String(post.userId))[0]}
                          </span>
                          <span>{post.authorName ?? `사용자 ${post.userId}`}</span>
                          <span className="dot-divider" />
                          <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                        </p>
                      </div>

                      <div className="board-post-stats">
                        <span className="board-stat">
                          <Icon name="eye" size={14} />
                          <span>{post.viewCount}</span>
                        </span>
                        <span className="board-stat">
                          <Icon name="message" size={14} />
                          <span>{post.commentCount ?? 0}</span>
                        </span>
                        <span className="board-stat">
                          <Icon name="bell" size={14} />
                          <span>{post.likeCount ?? 0}</span>
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
