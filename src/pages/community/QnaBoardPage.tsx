import { useEffect, useMemo, useState } from 'react'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'
import { toPlainContentPreview } from '../../shared/contentPreview'
import { Icon } from '../../shared/ui/Icon'
import { SearchField } from '../../shared/ui/SearchField'
import { CommunityBanner } from './CommunityBanner'
import { useAuth } from '../../shared/auth/AuthContext'
import { isAnonymousBoard } from '../../shared/communityBoards'

type QnaBoardPageProps = {
  onOpenPost: (boardId: number, postId: number) => void
  onWritePost: () => void
}

const QNA_CAPTION =
  '개발, 진로, 연구실, 대학원 등 궁금한 점이 있다면 익명게시판에 자유롭게 질문해주세요!\n' +
  '동아리에는 연구실이나 대학원에 진학한 선배들도 있어 다양한 경험을 바탕으로 답변해드립니다.'

const avatarTones = ['mint', 'slate', 'sky', 'sand', 'rose'] as const

function toAuthorTone(seed: number) {
  return avatarTones[Math.abs(seed) % avatarTones.length]
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

export function QnaBoardPage({ onOpenPost, onWritePost }: QnaBoardPageProps) {
  const { isLoggedIn } = useAuth()
  const [board, setBoard] = useState<BoardData | null>(null)
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [likeError, setLikeError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const boards = await boardsApi.getBoards(true)
        const qnaBoard = boards.find(isAnonymousBoard) ?? null
        if (cancelled) return
        setBoard(qnaBoard)

        if (qnaBoard) {
          const list = await postsApi.getPosts(qnaBoard.boardId)
          if (!cancelled) setPosts(list)
        } else {
          setPosts([])
        }
      } catch {
        if (!cancelled) {
          setBoard(null)
          setPosts([])
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const visiblePosts = useMemo(() => {
    const searched = normalizedQuery
      ? posts.filter((post) => {
          const searchable = `${post.title} ${post.content} ${post.authorName ?? ''}`.toLowerCase()
          return searchable.includes(normalizedQuery)
        })
      : posts

    return [...searched].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [normalizedQuery, posts])

  const togglePostLike = async (post: PostListItem) => {
    if (!isLoggedIn) {
      setLikeError('좋아요는 로그인 후 누를 수 있습니다.')
      return
    }

    setLikeError(null)
    try {
      const response = await postsApi.likePost(post.postId)
      setPosts((current) =>
        current.map((item) =>
          item.postId === post.postId
            ? { ...item, likeCount: response.likeCount, likedByMe: response.liked }
            : item,
        ),
      )
    } catch {
      setLikeError('좋아요 처리에 실패했습니다.')
    }
  }

  return (
    <section className="coala-content coala-content--posts">
      <div className="board-page">
        <CommunityBanner title="질문게시판" description={QNA_CAPTION} tone="board" />

        <section className="surface-card community-list-controls board-list-controls" aria-label="질문게시판 필터">
          <div className="community-list-summary">
            <div className="community-list-heading">
              <p>익명 질문</p>
              <strong>게시글 {visiblePosts.length}개</strong>
            </div>
          </div>

          <div className="community-list-actions">
            <SearchField
              className="community-list-search"
              value={query}
              onChange={setQuery}
              placeholder="질문 제목을 검색하세요"
            />

            <button
              type="button"
              className="write-post-button write-post-button--board"
              disabled={!board}
              title={!board ? '질문게시판이 아직 준비되지 않았습니다.' : undefined}
              onClick={board ? onWritePost : undefined}
            >
              <Icon name="edit" size={15} />
              질문 올리기
            </button>
          </div>
          {likeError ? <p className="auth-error board-like-error">{likeError}</p> : null}
        </section>

        <article className="surface-card board-shell board-shell--editorial board-shell--list">
          <ul className="board-post-list board-post-list--editorial board-post-list--list">
            {isLoading ? (
              <li className="empty-post-state">게시글을 불러오는 중...</li>
            ) : !board ? (
              <li className="empty-post-state">질문게시판이 아직 준비되지 않았습니다.</li>
            ) : (
              visiblePosts.map((post) => {
                const summary = toPlainContentPreview(post.content)

                return (
                  <li key={post.postId} className="board-post-row board-post-row--list">
                    <article
                      className="board-post-card board-post-card--list"
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenPost(post.boardId, post.postId)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return
                        event.preventDefault()
                        onOpenPost(post.boardId, post.postId)
                      }}
                    >
                      <div className="board-post-main">
                        <div className="board-post-heading">
                          <span className="board-tag board-tag--free">질문</span>
                          <h3 className="board-post-title">{post.title}</h3>
                        </div>

                        <p className="board-post-excerpt">{summary.slice(0, 120)}</p>

                        <p className="board-post-meta">
                          <span className={`board-avatar board-avatar--${toAuthorTone(post.postId)}`}>
                            {(post.authorName ?? '익명')[0]}
                          </span>
                          <span>{post.authorName ?? '익명'}</span>
                          <span className="dot-divider" />
                          <span>{formatPostDateTime(post.createdAt)}</span>
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
                          <span>{post.likeCount ?? 0}</span>
                        </button>
                      </div>
                    </article>
                  </li>
                )
              })
            )}

            {!isLoading && board && visiblePosts.length === 0 && (
              <li className="empty-post-state">아직 등록된 질문이 없습니다. 첫 질문을 남겨보세요!</li>
            )}
          </ul>
        </article>
      </div>
    </section>
  )
}
