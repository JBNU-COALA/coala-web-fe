import { useMemo, useState } from 'react'
import {
  communityPosts,
  postCategoryMeta,
  totalPostCountLabel,
  type PostBoardFilterId,
} from '../../features/posts/model/postsData'
import { Icon } from '../../shared/ui/Icon'

type AllPostsPageProps = {
  activeBoard: PostBoardFilterId
  onOpenPost: (postId: string) => void
  onWritePost: () => void
  title?: string
  subtitle?: string
}

const compactToNumber = (value: string) => {
  if (value.endsWith('k')) {
    return Math.round(Number.parseFloat(value) * 1000)
  }

  return Number.parseInt(value, 10)
}

export function AllPostsPage({
  activeBoard,
  onOpenPost,
  onWritePost,
  title = '전체 게시글',
  subtitle = totalPostCountLabel,
}: AllPostsPageProps) {
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<'latest' | 'popular'>('latest')
  const currentBoardMeta = postCategoryMeta[activeBoard]

  const normalizedQuery = query.trim().toLowerCase()

  const visiblePosts = useMemo(() => {
    const byCategory =
      activeBoard === 'all'
        ? communityPosts
        : communityPosts.filter((post) => post.category === activeBoard)

    const byQuery = normalizedQuery
      ? byCategory.filter((post) => {
          const searchable = `${post.title} ${post.author}`.toLowerCase()
          return searchable.includes(normalizedQuery)
        })
      : byCategory

    if (sortMode === 'popular') {
      return [...byQuery].sort((left, right) => {
        const leftScore = compactToNumber(left.views) + left.comments * 6
        const rightScore = compactToNumber(right.views) + right.comments * 6
        return rightScore - leftScore
      })
    }

    return byQuery
  }, [activeBoard, normalizedQuery, sortMode])

  return (
    <section className="coala-content coala-content--posts">
      <article className="surface-card board-shell">
        <header className="board-shell-header">
          <div>
            <h2 className="board-title">{title}</h2>
            <p className="board-subtitle">{subtitle}</p>
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
                setSortMode((currentMode) =>
                  currentMode === 'latest' ? 'popular' : 'latest',
                )
              }
            >
              <span>{sortMode === 'latest' ? '최신순' : '인기순'}</span>
              <Icon name="chevron-down" size={14} />
            </button>
          </div>
        </div>

        <ul className="board-post-list">
          {visiblePosts.map((post) => {
            const category = postCategoryMeta[post.category]

            return (
              <li key={post.id} className="board-post-row">
                <button
                  type="button"
                  className="board-post-card"
                  onClick={() => onOpenPost(post.id)}
                >
                  <div className="board-post-main">
                    <div className="board-post-heading">
                      <span className={`board-tag board-tag--${category.tone}`}>
                        {category.label}
                      </span>
                      <h3 className="board-post-title">{post.title}</h3>
                    </div>

                    <p className="board-post-excerpt">{post.excerpt}</p>

                    <p className="board-post-meta">
                      <span className={`board-avatar board-avatar--${post.authorTone}`}>
                        {post.authorInitials}
                      </span>
                      <span>{post.author}</span>
                      <span className="dot-divider" />
                      <span>{post.publishedAt}</span>
                    </p>
                  </div>

                  <div className="board-post-stats">
                    <span className="board-stat">
                      <Icon name="eye" size={14} />
                      <span>{post.views}</span>
                    </span>
                    <span
                      className={
                        post.solved ? 'board-stat board-stat--solved' : 'board-stat'
                      }
                    >
                      <Icon name="message" size={14} />
                      <span>{post.comments}</span>
                    </span>
                  </div>
                </button>
              </li>
            )
          })}

          {visiblePosts.length === 0 ? (
            <li className="empty-post-state">조건에 맞는 게시글이 없습니다.</li>
          ) : null}
        </ul>

        <footer className="board-pagination" aria-label="페이지네이션">
          <button type="button" className="page-button" aria-label="이전 페이지">
            <Icon name="chevron-left" size={14} />
          </button>
          <button type="button" className="page-button is-active">
            1
          </button>
          <button type="button" className="page-button">
            2
          </button>
          <button type="button" className="page-button">
            3
          </button>
          <span className="page-gap">...</span>
          <button type="button" className="page-button">
            12
          </button>
          <button type="button" className="page-button" aria-label="다음 페이지">
            <Icon name="chevron-right" size={14} />
          </button>
        </footer>
      </article>
    </section>
  )
}
