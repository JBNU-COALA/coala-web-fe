import { useEffect, useMemo, useState, type FormEvent } from 'react'
import DOMPurify from 'dompurify'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-markdown-preview/markdown.css'
import { postsApi, type CommentItem, type PostDetail } from '../../shared/api/posts'
import { moderationApi, type ReportReasonType } from '../../shared/api/moderation'
import { postCategoryMeta } from '../../shared/postCategories'
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

function sanitizePostContent(content: string) {
  return DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
  })
}

function isHtmlPostContent(content: string) {
  return /<\/?(p|h[1-6]|ul|ol|li|blockquote|pre|div|table|section|article)\b/i.test(content)
}

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
  const [postActionError, setPostActionError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null)
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({})
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [commentEditDrafts, setCommentEditDrafts] = useState<Record<number, string>>({})
  const [commentActionError, setCommentActionError] = useState<string | null>(null)
  const [reportMessage, setReportMessage] = useState<string | null>(null)
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
    setPostActionError(null)
    setCommentActionError(null)
    setReportMessage(null)

    Promise.all([
      postsApi.getPostDetail(boardId, realPostId),
      postsApi.getComments(realPostId),
    ])
      .then(([postData, commentData]) => {
        setPost(postData)
        setComments(commentData.map((comment) => normalizeComment(comment, null)))
      })
      .catch(() => {
        setError('게시글을 찾을 수 없습니다.')
      })
      .finally(() => setIsLoading(false))
  }, [parsed])

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
    setCommentActionError(null)
    try {
      const created = await postsApi.createComment(parsed.postId, newComment.trim())
      setComments((prev) => [...prev, normalizeComment(created, user)])
      setNewComment('')
    } catch {
      setCommentActionError('댓글 작성 권한이 없거나 등록에 실패했습니다.')
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
    setCommentActionError(null)
    try {
      const created = await postsApi.createReply(parsed.postId, parentCommentId, content)
      setComments((prev) => appendReply(prev, parentCommentId, normalizeComment(created, user, parentCommentId)))
      setStatusAfterReply(parentCommentId)
    } catch {
      setCommentActionError('답글 작성 권한이 없거나 등록에 실패했습니다.')
    } finally {
      setSubmittingReplyId(null)
    }
  }

  const setStatusAfterReply = (parentCommentId: number) => {
    setReplyInputs((prev) => ({ ...prev, [parentCommentId]: '' }))
    setActiveReplyId(null)
  }

  const updateCommentInTree = (
    items: CommentItem[],
    commentId: number,
    patch: Partial<CommentItem>,
  ): CommentItem[] => items.map((item) => (
    item.commentId === commentId
      ? { ...item, ...patch }
      : { ...item, replies: item.replies ? updateCommentInTree(item.replies, commentId, patch) : item.replies }
  ))

  const removeCommentFromTree = (items: CommentItem[], commentId: number): CommentItem[] => items
    .filter((item) => item.commentId !== commentId)
    .map((item) => ({
      ...item,
      replies: item.replies ? removeCommentFromTree(item.replies, commentId) : item.replies,
    }))

  const startEditComment = (comment: CommentItem) => {
    setEditingCommentId(comment.commentId)
    setCommentEditDrafts((current) => ({ ...current, [comment.commentId]: comment.content }))
    setCommentActionError(null)
  }

  const handleUpdateComment = async (commentId: number) => {
    if (!parsed) return
    const content = commentEditDrafts[commentId]?.trim()
    if (!content) return
    setCommentActionError(null)
    try {
      const updated = await postsApi.updateComment(parsed.postId, commentId, content)
      setComments((prev) => updateCommentInTree(prev, commentId, {
        content: updated.content,
        updatedAt: updated.updatedAt,
      }))
      setEditingCommentId(null)
    } catch {
      setCommentActionError('댓글 수정 권한이 없거나 저장에 실패했습니다.')
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!parsed) return
    setCommentActionError(null)
    try {
      await postsApi.deleteComment(parsed.postId, commentId)
      setComments((prev) => removeCommentFromTree(prev, commentId))
      setEditingCommentId((current) => (current === commentId ? null : current))
    } catch {
      setCommentActionError('댓글 삭제 권한이 없거나 삭제에 실패했습니다.')
    }
  }

  const handleDeletePost = async () => {
    if (!parsed || !post) return
    const confirmed = window.confirm('게시글을 삭제할까요? 댓글과 첨부 자료도 함께 삭제됩니다.')
    if (!confirmed) return

    setPostActionError(null)
    try {
      await postsApi.deletePost(parsed.postId)
      onBack()
    } catch {
      setPostActionError('게시글 삭제 권한이 없거나 삭제에 실패했습니다.')
    }
  }

  const handleReport = async (targetType: 'POST' | 'COMMENT', targetId: number) => {
    const reasonDetail = window.prompt('신고 사유를 입력해주세요.')
    if (reasonDetail === null) return

    const normalized = reasonDetail.trim()
    const reasonType: ReportReasonType = normalized ? 'OTHER' : 'SPAM'
    setReportMessage(null)
    try {
      await moderationApi.report({
        targetType,
        targetId,
        reasonType,
        reasonDetail: normalized || undefined,
      })
      setReportMessage('신고가 접수되었습니다.')
    } catch {
      setReportMessage('이미 신고했거나 신고 접수에 실패했습니다.')
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

  const categoryKey = resolveCommunityBoardFilter({
    boardName: post.boardName ?? '',
    boardType: 'NORMAL',
  }) ?? 'free'
  const category = postCategoryMeta[categoryKey]
  const visiblePost = post
  const canManagePost = Boolean(user && user.id === post.userId && !post.locked && post.status === 'ACTIVE')
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

  const renderComment = (comment: CommentItem, isReply = false) => {
    const canManageComment = Boolean(user && comment.userId === user.id && comment.status !== 'DELETED' && comment.status !== 'ADMIN_DELETED')
    const isEditing = editingCommentId === comment.commentId
    const replyValue = replyInputs[comment.commentId] ?? ''

    return (
      <div
        key={comment.commentId}
        className={isReply ? 'post-comment-item post-comment-item--reply' : 'post-comment-thread'}
        style={isReply ? { marginLeft: 24 } : undefined}
      >
        <div className={isReply ? undefined : 'post-comment-item'}>
          <div className="post-comment-topline">
            <div className="post-comment-author-block">
              <strong className="post-comment-author">
                {comment.authorName ?? (comment.userId ? `사용자 ${comment.userId}` : '익명')}
              </strong>
              <span className="post-comment-time">{formatDate(comment.updatedAt ?? comment.createdAt)}</span>
            </div>
            {canManageComment && !isEditing ? (
              <div className="post-comment-actions">
                <button type="button" className="ghost-button" onClick={() => startEditComment(comment)}>
                  수정
                </button>
                <button type="button" className="ghost-button" onClick={() => handleDeleteComment(comment.commentId)}>
                  삭제
                </button>
              </div>
            ) : null}
            {isLoggedIn && !canManageComment && comment.status === 'ACTIVE' ? (
              <div className="post-comment-actions">
                <button type="button" className="ghost-button" onClick={() => handleReport('COMMENT', comment.commentId)}>
                  신고
                </button>
              </div>
            ) : null}
          </div>
          {isEditing ? (
            <div className="post-comment-form">
              <input
                type="text"
                className="auth-input"
                value={commentEditDrafts[comment.commentId] ?? comment.content}
                onChange={(event) => setCommentEditDrafts((current) => ({
                  ...current,
                  [comment.commentId]: event.target.value,
                }))}
              />
              <button
                type="button"
                className="write-post-button"
                disabled={!commentEditDrafts[comment.commentId]?.trim()}
                onClick={() => handleUpdateComment(comment.commentId)}
              >
                저장
              </button>
              <button type="button" className="ghost-button" onClick={() => setEditingCommentId(null)}>
                취소
              </button>
            </div>
          ) : (
            <p className="post-comment-content">{comment.content}</p>
          )}
          {isLoggedIn && !isReply && !isEditing ? (
            <button
              type="button"
              className="post-comment-reply-toggle"
              aria-expanded={activeReplyId === comment.commentId}
              onClick={() => setActiveReplyId((current) => (current === comment.commentId ? null : comment.commentId))}
            >
              답글
            </button>
          ) : null}
        </div>

        {(comment.replies ?? []).length > 0 ? (
          <div className="post-comment-replies">
            {(comment.replies ?? []).map((reply) => renderComment(reply, true))}
          </div>
        ) : null}

        {isLoggedIn && !isReply && activeReplyId === comment.commentId ? (
          <form
            onSubmit={(event) => handleSubmitReply(comment.commentId, event)}
            className="post-comment-form post-comment-form--reply"
          >
            <input
              type="text"
              className="auth-input"
              placeholder="답글을 입력하세요."
              value={replyValue}
              onChange={(event) => setReplyInputs((current) => ({
                ...current,
                [comment.commentId]: event.target.value,
              }))}
            />
            <button
              type="submit"
              className="write-post-button"
              disabled={submittingReplyId === comment.commentId || !replyValue.trim()}
            >
              답글 등록
            </button>
          </form>
        ) : null}
      </div>
    )
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
            {canManagePost ? (
              <>
                <button type="button" className="ghost-button" onClick={onEdit}>
                  <Icon name="edit" size={15} />
                  <span>수정</span>
                </button>
                <button type="button" className="ghost-button" onClick={handleDeletePost}>
                  <Icon name="file" size={15} />
                  <span>삭제</span>
                </button>
              </>
            ) : null}
            {isLoggedIn && !canManagePost ? (
              <button type="button" className="ghost-button" onClick={() => handleReport('POST', visiblePost.postId)}>
                <Icon name="bell" size={15} />
                <span>신고</span>
              </button>
            ) : null}
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
        {postActionError ? <p className="auth-error">{postActionError}</p> : null}
        {reportMessage ? <p className="auth-error">{reportMessage}</p> : null}

        <div className="post-cover">
          <div className="post-cover-text">
            <span className={`board-context-pill board-context-pill--${category.tone} post-cover-pill`}>
              {category.label}
            </span>
            <p className="post-cover-subtitle">{category.label} 게시글</p>
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
            {[category.label].map((tag) => (
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
            {commentActionError ? <p className="auth-error">{commentActionError}</p> : null}

            {comments.map((comment) => renderComment(comment))}

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
