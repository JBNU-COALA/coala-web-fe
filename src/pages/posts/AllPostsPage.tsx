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
import { CommunityBanner } from '../community/CommunityBanner'

type AllPostsPageProps = {
  onOpenPost: (postId: string) => void
  onWritePost: () => void
  title?: string
}

type EnrichedPost = PostListItem & { board?: BoardData }

function boardTypeToFilter(boardType: string, boardName = ''): PostBoardFilterId {
  if (boardName.includes('공지')) return 'notice'
  if (boardName.includes('유머')) return 'humor'
  if (boardName.toLowerCase().includes('humor')) return 'humor'
  const normalized = boardType.trim().toUpperCase()
  if (normalized === 'NOTICE') return 'notice'
  if (normalized === 'HUMOR') return 'humor'
  return 'free'
}

const AVATAR_TONES = ['mint', 'slate', 'sky', 'sand', 'rose'] as const

function toAuthorTone(userId: number) {
  return AVATAR_TONES[userId % AVATAR_TONES.length]
}

const fallbackCommunityPosts: EnrichedPost[] = communityPosts.map((post, index) => ({
  postId: index + 1,
  boardId: index + 1,
  boardName: postCategoryMeta[post.category].label,
  userId: index + 1,
  authorName: post.author,
  title: post.title,
  content: post.excerpt,
  viewCount: Number(post.views.replace('k', '00').replace('.', '')),
  createdAt: new Date(Date.now() - index * 3600000 * 8).toISOString(),
  updatedAt: new Date(Date.now() - index * 3600000 * 8).toISOString(),
  board: {
    boardId: index + 1,
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
  title = '게시판',
}: AllPostsPageProps) {
  const [activeBoard, setActiveBoard] = useState<PostBoardFilterId>(defaultPostBoardFilter)
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

  const currentBoardMeta = postCategoryMeta[activeBoard]
  const normalizedQuery = query.trim().toLowerCase()

  const visiblePosts = useMemo(() => {
    const byCategory = enrichedPosts.filter((post) => {
      if (!post.board) return false
      return boardTypeToFilter(post.board.boardType, post.board.boardName) === activeBoard
    })

    const searched = normalizedQuery
      ? byCategory.filter((post) => post.title.toLowerCase().includes(normalizedQuery))
      : byCategory

    return [...searched].sort((a, b) => {
      if (sortMode === 'popular') return b.viewCount - a.viewCount
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [activeBoard, enrichedPosts, normalizedQuery, sortMode])

  const popularPosts = useMemo(() => {
    const images = [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80',
    ]

    return [...enrichedPosts]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 3)
      .map((post, index) => ({
        label: '인기글',
        title: post.title,
        imageUrl: images[index % images.length],
      }))
  }, [enrichedPosts])

  return (
    <section className="coala-content coala-content--posts">
      <div className="board-page">
        <CommunityBanner title={title} tone="board" images={popularPosts} />

        <div className="community-section-tabs">
          {postCategoryFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={
                activeBoard === filter.id
                  ? 'community-section-tab is-active'
                  : 'community-section-tab'
              }
              onClick={() => setActiveBoard(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

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
                const category = post.board ? boardTypeToFilter(post.board.boardType, post.board.boardName) : 'free'
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
