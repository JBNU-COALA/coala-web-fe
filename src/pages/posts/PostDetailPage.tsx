import { useEffect, useMemo, useState, type FormEvent } from 'react'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-markdown-preview/markdown.css'
import { postsApi, type CommentItem, type PostDetail } from '../../shared/api/posts'
import {
  communityPosts,
  postCategoryMeta,
  postDetailContentById,
  type PostDetailContent,
} from '../../dummy/postsData'
import { Icon } from '../../shared/ui/Icon'
import { useAuth } from '../../shared/auth/AuthContext'
import type { UserData } from '../../shared/api/auth'
import { copyMarkdown, htmlToReadableMarkdown, type MarkdownCopyState } from '../../shared/markdown'
import { resolveCommunityBoardFilter } from '../../shared/communityBoards'

type PostDetailPageProps = {
  postId: string
  onBack: () => void
  onWrite: () => void
  onEdit: () => void
}

type LocalPostEdit = {
  title: string
  content: string
  tagsInput: string
  boardId: number | null
  writerType: string
  updatedAt: string
}

const LOCAL_POST_EDIT_STORAGE_KEY = 'coala-local-post-edits'

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

function toFallbackKey(realPostId: number) {
  return `post-${String(realPostId).padStart(3, '0')}`
}

function buildFallbackPost(realPostId: number): PostDetail | null {
  const fallbackKey = toFallbackKey(realPostId)
  const item = communityPosts.find((post) => post.id === fallbackKey)
  if (!item) return null

  const detail = postDetailContentById[fallbackKey]
  const content = detail
    ? detail.content
        .map((block) => {
          if (block.type === 'heading') return `<h2>${block.text}</h2>`
          if (block.type === 'quote') return `<blockquote>${block.text}</blockquote>`
          if (block.type === 'code') return `<pre><code>${block.code}</code></pre>`
          if (block.type === 'list') {
            return `<ul>${block.items.map((listItem) => `<li>${listItem}</li>`).join('')}</ul>`
          }
          return `<p>${block.text}</p>`
        })
        .join('')
    : `<p>${item.excerpt}</p>`

  return {
    postId: realPostId,
    boardId: realPostId,
    boardName: postCategoryMeta[item.category].label,
    userId: realPostId,
    authorName: item.author,
    title: item.title,
    content,
    viewCount: Number(item.views.replace('k', '00').replace('.', '')),
    commentCount: item.comments,
    likeCount: item.solved ? 12 : Math.max(3, item.comments * 2),
    createdAt: new Date(Date.now() - realPostId * 3600000 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function getFallbackDetail(realPostId: number): PostDetailContent | undefined {
  return postDetailContentById[toFallbackKey(realPostId)]
}

function loadLocalPostEdits(): Record<string, LocalPostEdit> {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(LOCAL_POST_EDIT_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
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

function isHtmlPostContent(content: string) {
  return /<\/?(p|h[1-6]|ul|ol|li|blockquote|pre|div|table|section|article)\b/i.test(content)
}

const fallbackComments: CommentItem[] = [
  {
    commentId: 1,
    parentCommentId: null,
    userId: 2,
    authorName: '김예린',
    content: '댓글 예시입니다.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    replies: [],
  },
]

function getCurrentUserName(user: UserData | null) {
  return user?.nickname || user?.name || user?.email || '나'
}

function normalizeComment(comment: CommentItem, user: UserData | null, parentCommentId: number | null = null): CommentItem {
  const commentParentId = comment.parentCommentId ?? parentCommentId
  return {
    ...comment,
    parentCommentId: commentParentId,
    userId: comment.userId ?? user?.id,
    authorName: comment.authorName ?? (user ? getCurrentUserName(user) : undefined),
    updatedAt: comment.updatedAt ?? comment.createdAt,
    replies: (comment.replies ?? []).map((reply) => normalizeComment(reply, user, comment.commentId)),
  }
}

function countCommentTree(comments: CommentItem[]): number {
  return comments.reduce((sum, comment) => sum + 1 + countCommentTree(comment.replies ?? []), 0)
}

function appendReply(comments: CommentItem[], parentCommentId: number, reply: CommentItem): CommentItem[] {
  return comments.map((comment) => {
    if (comment.commentId === parentCommentId) {
      return {
        ...comment,
        replies: [...(comment.replies ?? []), reply],
      }
    }

    return {
      ...comment,
      replies: appendReply(comment.replies ?? [], parentCommentId, reply),
    }
  })
}

export function PostDetailPage({ postId, onBack, onWrite, onEdit }: PostDetailPageProps) {
  const { isLoggedIn, user } = useAuth()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null)
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({})
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [submittingReplyId, setSubmittingReplyId] = useState<number | null>(null)
  const [shareCopied, setShareCopied] = useState<'idle' | 'copied' | 'error'>('idle')
  const [markdownCopied, setMarkdownCopied] = useState<MarkdownCopyState>('idle')

  const parsed = useMemo(() => parseCompositeId(postId), [postId])

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
        setComments(
          commentData.length > 0
            ? commentData.map((comment) => normalizeComment(comment, null))
            : fallbackComments,
        )
      })
      .catch(() => {
        const fallbackPost = buildFallbackPost(realPostId)
        if (fallbackPost) {
          setPost(fallbackPost)
          setComments(fallbackComments)
          return
        }
        setError('게시글을 찾을 수 없습니다.')
      })
      .finally(() => setIsLoading(false))
  }, [parsed])

  const fallbackDetail = useMemo(
    () => (parsed ? getFallbackDetail(parsed.postId) : undefined),
    [parsed],
  )

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
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
      setComments((prev) => [...prev, normalizeComment(created, user)])
      setNewComment('')
    } catch {
      setComments((prev) => [
        ...prev,
        {
          commentId: Date.now(),
          parentCommentId: null,
          userId: user?.id ?? 0,
          authorName: getCurrentUserName(user),
          content: newComment.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          replies: [],
        },
      ])
      setNewComment('')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleSubmitReply = async (parentCommentId: number, e: FormEvent) => {
    e.preventDefault()
    if (!parsed) return
    const content = (replyInputs[parentCommentId] ?? '').trim()
    if (!content) return

    setSubmittingReplyId(parentCommentId)
    try {
      const created = await postsApi.createReply(parsed.postId, parentCommentId, content)
      setComments((prev) => appendReply(prev, parentCommentId, normalizeComment(created, user, parentCommentId)))
      setStatusAfterReply(parentCommentId)
    } catch {
      setComments((prev) =>
        appendReply(prev, parentCommentId, {
          commentId: Date.now(),
          parentCommentId,
          userId: user?.id ?? 0,
          authorName: getCurrentUserName(user),
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          replies: [],
        }),
      )
      setStatusAfterReply(parentCommentId)
    } finally {
      setSubmittingReplyId(null)
    }
  }

  const setStatusAfterReply = (parentCommentId: number) => {
    setReplyInputs((prev) => ({ ...prev, [parentCommentId]: '' }))
    setActiveReplyId(null)
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

  const categoryKey = resolveCommunityBoardFilter({
    boardName: post.boardName ?? '',
    boardType: 'NORMAL',
  }) ?? 'free'
  const category = postCategoryMeta[categoryKey]
  const localEdit = loadLocalPostEdits()[postId]
  const visiblePost = localEdit
    ? {
        ...post,
        title: localEdit.title,
        content: localEdit.content,
        updatedAt: localEdit.updatedAt,
      }
    : post
  const safeContent = sanitizePostContent(visiblePost.content)
  const isHtmlContent = isHtmlPostContent(visiblePost.content)
  const sourceMarkdown = isHtmlContent
    ? htmlToReadableMarkdown(visiblePost.content)
    : visiblePost.content
  const totalCommentCount = countCommentTree(comments)

  const handleCopyMarkdown = async () => {
    setMarkdownCopied(await copyMarkdown(sourceMarkdown) ? 'copied' : 'error')
    setTimeout(() => setMarkdownCopied('idle'), 2000)
  }

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
              <span>글쓰기</span>
            </button>
            <button type="button" className="ghost-button" onClick={onEdit}>
              <Icon name="edit" size={15} />
              <span>수정</span>
            </button>
            <button
              type="button"
              className={markdownCopied === 'copied' ? 'ghost-button ghost-button--success' : 'ghost-button'}
              onClick={handleCopyMarkdown}
            >
              <Icon name="copy" size={15} />
              <span>{markdownCopied === 'copied' ? '복사 완료' : markdownCopied === 'error' ? '복사 실패' : '마크다운 복사'}</span>
            </button>
            <button
              type="button"
              className={shareCopied === 'copied' ? 'ghost-button ghost-button--success' : 'ghost-button'}
              onClick={handleCopyShareLink}
            >
              <Icon name={shareCopied === 'copied' ? 'copy' : 'link'} size={15} />
              <span>{shareCopied === 'copied' ? '복사 완료' : '공유하기'}</span>
            </button>
          </div>
        </header>

        <div className="post-cover" style={{ background: fallbackDetail?.coverGradient }}>
          <div className="post-cover-text">
            <span className={`board-context-pill board-context-pill--${category.tone} post-cover-pill`}>
              {category.label}
            </span>
            <p className="post-cover-subtitle">{fallbackDetail?.subtitle ?? '커뮤니티 게시글'}</p>
            <h1 className="post-cover-title">{visiblePost.title}</h1>
          </div>

          <div className="post-cover-meta">
            <div className="post-meta-author">
              <span className="board-avatar board-avatar--mint">
                {(post.authorName ?? String(post.userId))[0]}
              </span>
              <div>
                <strong>{visiblePost.authorName ?? `사용자 ${visiblePost.userId}`}</strong>
                <span>{formatDate(visiblePost.createdAt)}</span>
              </div>
            </div>

            <div className="post-meta-stats">
              <span><Icon name="eye" size={15} />{visiblePost.viewCount}</span>
              <span><Icon name="message" size={15} />{totalCommentCount}</span>
              <span><Icon name="bell" size={15} />{visiblePost.likeCount ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="post-body">
          <div className="post-tags">
            {(fallbackDetail?.tags ?? ['커뮤니티']).map((tag) => (
              <span key={tag} className="post-tag">#{tag}</span>
            ))}
            <span className="post-meta-updated">최종 수정: {formatDate(visiblePost.updatedAt)}</span>
          </div>

          {isHtmlContent ? (
            <div
              className="post-content post-content--html"
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />
          ) : (
            <MDEditor.Markdown
              className="post-content post-content--markdown"
              source={visiblePost.content}
              style={{ whiteSpace: 'pre-wrap' }}
            />
          )}

          <section className="post-comments">
            <h3>댓글 {totalCommentCount}개</h3>

            {comments.map((comment) => (
              <div key={comment.commentId} className="post-comment-thread">
                <div className="post-comment-item">
                  <strong>{comment.authorName ?? (comment.userId ? `사용자 ${comment.userId}` : '익명')}</strong>
                  <p>{comment.content}</p>
                  <span>{formatDate(comment.createdAt)}</span>
                  {isLoggedIn ? (
                    <button
                      type="button"
                      className="post-comment-reply-toggle"
                      aria-expanded={activeReplyId === comment.commentId}
                      onClick={() =>
                        setActiveReplyId((current) => (current === comment.commentId ? null : comment.commentId))
                      }
                    >
                      답글
                    </button>
                  ) : null}
                </div>

                {(comment.replies ?? []).length > 0 ? (
                  <div className="post-comment-replies">
                    {(comment.replies ?? []).map((reply) => (
                      <div key={reply.commentId} className="post-comment-item post-comment-item--reply">
                        <strong>{reply.authorName ?? (reply.userId ? `사용자 ${reply.userId}` : '익명')}</strong>
                        <p>{reply.content}</p>
                        <span>{formatDate(reply.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {isLoggedIn && activeReplyId === comment.commentId ? (
                  <form
                    onSubmit={(event) => handleSubmitReply(comment.commentId, event)}
                    className="post-comment-form post-comment-form--reply"
                  >
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="답글을 입력하세요."
                      value={replyInputs[comment.commentId] ?? ''}
                      onChange={(event) =>
                        setReplyInputs((prev) => ({ ...prev, [comment.commentId]: event.target.value }))
                      }
                    />
                    <button
                      type="submit"
                      className="write-post-button"
                      disabled={submittingReplyId === comment.commentId || !(replyInputs[comment.commentId] ?? '').trim()}
                    >
                      답글 등록
                    </button>
                  </form>
                ) : null}
              </div>
            ))}

            {isLoggedIn ? (
              <form onSubmit={handleSubmitComment} className="post-comment-form">
                <input
                  type="text"
                  className="auth-input"
                  placeholder="댓글을 입력하세요."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
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
              <p className="post-comment-login">댓글 작성은 로그인 후 가능합니다.</p>
            )}
          </section>
        </div>
      </article>
    </section>
  )
}
