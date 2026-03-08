import { useEffect, useMemo, useState } from 'react'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import { postCategoryMeta, type PostBoardFilterId } from '../../features/posts/model/postsData'
import { Icon } from '../../shared/ui/Icon'

type AllPostsPageProps = {
  activeBoard: PostBoardFilterId
  onOpenPost: (postId: string) => void
  onWritePost: () => void
  title?: string
  subtitle?: string
}

type EnrichedPost = PostListItem & { board?: BoardData }

function boardTypeToFilter(boardType: string): PostBoardFilterId {
  if (boardType === 'free') return 'free'
  if (boardType === 'alumni') return 'alumni'
  return 'all'
}

const AVATAR_TONES = ['mint', 'slate', 'sky', 'sand', 'rose'] as const

function toAuthorTone(userId: number) {
  return AVATAR_TONES[userId % AVATAR_TONES.length]
}

export function AllPostsPage({
  activeBoard,
  onOpenPost,
  onWritePost,
  title = '전체 게시글',
  subtitle,
}: AllPostsPageProps) {
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
        setEnrichedPosts(combined)
      } catch {
        setEnrichedPosts([])
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

    return normalizedQuery
      ? byCategory.filter((p) => p.title.toLowerCase().includes(normalizedQuery))
      : byCategory
  }, [activeBoard, enrichedPosts, normalizedQuery, sortMode])

  return (
    <section className="coala-content coala-content--posts">
      <article className="surface-card board-shell">
        <header className="board-shell-header">
          <div>
            <h2 className="board-title">{title}</h2>
            <p className="board-subtitle">
              {subtitle ?? `총 ${enrichedPosts.length}개의 게시글이 있습니다.`}
            </p>
          </div>

          <div className="board-actions">
            <label className="board-search">
              <Icon name="search" size={15} />
              <input
                type="search"
                placeholder="검색어를 입력하세요..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <button type="button" className="write-post-button" onClick={onWritePost}>
              <Icon name="edit" size={14} />
              <span>글쓰기</span>
            </button>
          </div>
        </header>

        <div className="board-toolbar">
          <div className="board-context">
            <span className={`board-context-pill board-context-pill--${currentBoardMeta.tone}`}>
              {currentBoardMeta.label}
            </span>
            <p>{currentBoardMeta.description}</p>
          </div>

          <div className="board-toolbar-actions">
            <span className="board-count">{visiblePosts.length}개의 글</span>
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
                          {String(post.userId)[0]}
                        </span>
                        <span>사용자 {post.userId}</span>
                      </p>
                    </div>

                    <div className="board-post-stats">
                      <span className="board-stat">
                        <Icon name="eye" size={14} />
                        <span>0</span>
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
    </section>
  )
}
