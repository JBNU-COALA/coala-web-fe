import { useEffect, useState, type FormEvent } from 'react'
import { postsApi, type PostDetail, type CommentItem } from '../../shared/api/posts'
import { postCategoryMeta } from './postsData'
import { Icon } from '../../shared/ui/Icon'
import { useAuth } from '../../shared/auth/AuthContext'

type PostDetailPageProps = {
  postId: string
  onBack: () => void
  onWrite: () => void
}

function parseCompositeId(compositeId: string): { boardId: number; postId: number } | null {
  const parts = compositeId.split('-')
  if (parts.length < 2) return null
  const boardId = Number(parts[0])
  const postId = Number(parts[1])
  if (Number.isNaN(boardId) || Number.isNaN(postId)) return null
  return { boardId, postId }
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function estimateReadingTime(content: string) {
  const words = toPlainText(content).split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))}분 분량`
}

function toPlainText(content: string) {
  return content.replace(/<[^>]*>/g, ' ')
}

function sanitizePostContent(content: string) {
  const template = document.createElement('template')
  template.innerHTML = content

  template.content.querySelectorAll('script, style, iframe, object, embed').forEach((node) => {
    node.remove()
  })

  template.content.querySelectorAll('*').forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()
      if (name.startsWith('on') || (name === 'href' && value.startsWith('javascript:'))) {
        node.removeAttribute(attribute.name)
      }
    })
  })

  return template.innerHTML
}

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #d8f3dc 0%, #95d5b2 100%)',
  'linear-gradient(135deg, #fceabb 0%, #f8b500 100%)',
  'linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)',
  'linear-gradient(135deg, #dee2ff 0%, #b8c0ff 100%)',
  'linear-gradient(135deg, #ffe5ec 0%, #ffc2d1 100%)',
]

export function PostDetailPage({ postId, onBack, onWrite }: PostDetailPageProps) {
  const { isLoggedIn } = useAuth()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [shareCopied, setShareCopied] = useState<'idle' | 'copied' | 'error'>('idle')

  const parsed = parseCompositeId(postId)

  useEffect(() => {
    if (!parsed) {
      setError('올바르지 않은 게시글 주소입니다.')
      setIsLoading(false)
      return
    }

    const { boardId, postId: realPostId } = parsed
    setIsLoading(true)
    setError(null)

    Promise.all([
      postsApi.getPostDetail(boardId, realPostId),
      postsApi.getComments(realPostId),
    ])
      .then(([postData, commentData]) => {
        setPost(postData)
        setComments(commentData)
      })
      .catch(() => setError('게시글을 불러오는 데 실패했습니다.'))
      .finally(() => setIsLoading(false))
  }, [postId])

  const handleCopyShareLink = async () => {
    const shareUrl = window.location.href
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied('copied')
    } catch {
      setShareCopied('error')
    }
    setTimeout(() => setShareCopied('idle'), 2000)
  }

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !parsed) return
    setIsSubmittingComment(true)
    try {
      const created = await postsApi.createComment(parsed.postId, newComment.trim())
      setComments((prev) => [...prev, created])
      setNewComment('')
    } catch {
      // silently fail
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (isLoading) {
    return (
      <section className="coala-content coala-content--post-detail">
        <article className="surface-card post-detail">
          <p className="empty-post-state">게시글을 불러오는 중...</p>
        </article>
      </section>
    )
  }

  if (error || !post) {
    return (
      <section className="coala-content coala-content--post-detail">
        <article className="surface-card post-detail">
          <header className="post-detail-header">
            <button type="button" className="post-back-button" onClick={onBack}>
              <Icon name="chevron-left" size={16} />
              <span>목록으로 돌아가기</span>
            </button>
          </header>
          <p className="empty-post-state">{error ?? '게시글을 찾을 수 없습니다.'}</p>
        </article>
      </section>
    )
  }

  const coverGradient = COVER_GRADIENTS[post.boardId % COVER_GRADIENTS.length]
  const readingTime = estimateReadingTime(post.content)
  const publishedAt = formatDate(post.createdAt)
  const category = postCategoryMeta['free']
  const safeContent = sanitizePostContent(post.content)

  return (
    <section className="coala-content coala-content--post-detail">
      <article className="surface-card post-detail">
        <header className="post-detail-header">
          <button type="button" className="post-back-button" onClick={onBack}>
            <Icon name="chevron-left" size={16} />
            <span>목록으로 돌아가기</span>
          </button>

          <div className="post-header-actions">
            <button type="button" className="ghost-button" onClick={onWrite}>
              <Icon name="edit" size={15} />
              <span>새 글 쓰기</span>
            </button>
            <button
              type="button"
              className={
                shareCopied === 'copied' ? 'ghost-button ghost-button--success' : 'ghost-button'
              }
              onClick={handleCopyShareLink}
            >
              <Icon name={shareCopied === 'copied' ? 'copy' : 'link'} size={15} />
              <span>
                {shareCopied === 'copied'
                  ? '링크 복사 완료'
                  : shareCopied === 'error'
                    ? '다시 시도'
                    : '공유 링크 복사'}
              </span>
            </button>
          </div>
        </header>

        <div className="post-cover" style={{ background: coverGradient }}>
          <div className="post-cover-text">
            <span
              className={`board-context-pill board-context-pill--${category.tone} post-cover-pill`}
            >
              {category.label}
            </span>
            <p className="post-cover-subtitle">커뮤니티 게시글</p>
            <h1 className="post-cover-title">{post.title}</h1>
          </div>

          <div className="post-cover-meta">
            <div className="post-meta-author">
              <span className="board-avatar board-avatar--mint">
                {(post.authorName ?? String(post.userId))[0]}
              </span>
              <div>
                <strong>{post.authorName ?? `사용자 ${post.userId}`}</strong>
                <span>
                  {publishedAt} · {readingTime}
                </span>
              </div>
            </div>

            <div className="post-meta-stats">
              <span>
                <Icon name="eye" size={15} />
                {post.viewCount}
              </span>
              <span>
                <Icon name="message" size={15} />
                {post.commentCount ?? comments.length}
              </span>
              <span>
                <Icon name="bell" size={15} />
                {post.likeCount ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="post-body">
          <div className="post-tags">
            <span className="post-meta-updated">최종 수정: {formatDate(post.updatedAt)}</span>
          </div>

          <div
            className="post-content post-content--html"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />

          <div className="post-comments" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
              댓글 {comments.length}개
            </h3>

            {comments.map((comment) => (
              <div
                key={comment.commentId}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--surface-secondary, #f5f5f5)',
                  marginBottom: '0.5rem',
                }}
              >
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                  {comment.authorName ?? (comment.userId ? `사용자 ${comment.userId}` : '익명')}
                </p>
                <p style={{ margin: 0 }}>{comment.content}</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', opacity: 0.6 }}>
                  {formatDate(comment.createdAt)}
                </p>
              </div>
            ))}

            {isLoggedIn ? (
              <form
                onSubmit={handleSubmitComment}
                style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}
              >
                <input
                  type="text"
                  className="auth-input"
                  placeholder="댓글을 입력하세요..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="write-post-button"
                  disabled={isSubmittingComment || !newComment.trim()}
                >
                  등록
                </button>
              </form>
            ) : (
              <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.5rem' }}>
                댓글을 작성하려면 로그인이 필요합니다.
              </p>
            )}
          </div>
        </div>
      </article>
    </section>
  )
}
