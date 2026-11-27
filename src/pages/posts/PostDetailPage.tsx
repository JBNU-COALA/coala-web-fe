import { useEffect, useRef, useState, type FormEvent } from 'react'
import DOMPurify from 'dompurify'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-markdown-preview/markdown.css'
import { postsApi, type CommentItem, type PostDetail } from '../../shared/api/posts'
import { moderationApi } from '../../shared/api/moderation'
import { postCategoryMeta } from '../../shared/postCategories'
import { Icon } from '../../shared/ui/Icon'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { useAuth } from '../../shared/auth/AuthContext'
import type { UserData } from '../../shared/api/auth'
import { isSameUserId } from '../../shared/auth/userIdentity'
import { rewriteMarkdownImageUrls, normalizeMarkdownAttachmentUrl, prepareMarkdownForDisplay } from '../../shared/markdown'
import { parsePostRouteKey, resolveCommunityBoardFilter } from '../../shared/communityBoards'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { useRequestScope } from '../../useRequestScope'
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner'

type PostDetailPageProps = {
  postId: string
  onBack: () => void
  onWrite: () => void
  onEdit: () => void
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

export function PostDetailPage(props: PostDetailPageProps) {
  const { isLoggedIn, user } = useAuth()
  const parsed = parsePostRouteKey(props.postId)
  if (!parsed || parsed.boardId <= 0 || parsed.postId <= 0) {
    return (
      <section className="coala-content coala-content--post-detail">
        <button type="button" className="post-back-button" onClick={props.onBack}>목록으로 돌아가기</button>
        <p className="empty-post-state">올바르지 않은 게시글 주소입니다.</p>
      </section>
    )
  }
  return <PostDetailSession key={`${props.postId}:${isLoggedIn ? user?.id : 'guest'}`} {...props} />
}

function PostDetailSession({ postId, onBack, onEdit }: PostDetailPageProps) {
  const { isLoggedIn, user } = useAuth()
  const captureScope = useRequestScope()
  const pendingActions = useRef(new Set<string>())
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
  const reportDialog = useRef<HTMLDialogElement>(null)
  const [reportTarget, setReportTarget] = useState<{ targetType: 'POST' | 'COMMENT'; targetId: number } | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportError, setReportError] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  useEffect(() => {
    if (reportTarget) reportDialog.current?.showModal()
    else reportDialog.current?.close()
  }, [reportTarget])
  useEffect(() => { setReportTarget(null) }, [postId, user?.id])

  const [likeMessage, setLikeMessage] = useState<string | null>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [submittingReplyId, setSubmittingReplyId] = useState<number | null>(null)

  const parsed = parsePostRouteKey(postId)!
  const { boardId, postId: realPostId } = parsed

  useEffect(() => {
    const isCurrent = captureScope()
    Promise.all([
      postsApi.getPostDetail(boardId, realPostId),
      postsApi.getComments(realPostId),
    ])
      .then(([postData, commentData]) => {
        if (!isCurrent()) return
        setPost(postData)
        setComments(commentData.map((comment) => normalizeComment(comment, null)))
      })
      .catch(() => {
        if (isCurrent()) setError('게시글을 찾을 수 없습니다.')
      })
      .finally(() => { if (isCurrent()) setIsLoading(false) })
  }, [boardId, captureScope, realPostId])

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || pendingActions.current.has('comment')) return
    const isCurrent = captureScope()
    const submittedDraft = newComment
    pendingActions.current.add('comment')
    setIsSubmittingComment(true)
    setCommentActionError(null)
    try {
      const created = await postsApi.createComment(parsed.postId, newComment.trim())
      if (!isCurrent()) return
      setComments((prev) => [...prev, normalizeComment(created, user)])
      setNewComment((current) => current === submittedDraft ? '' : current)
    } catch {
      if (isCurrent()) setCommentActionError('댓글 작성 권한이 없거나 등록에 실패했습니다.')
    } finally {
      pendingActions.current.delete('comment')
      if (isCurrent()) setIsSubmittingComment(false)
    }
  }

  const handleSubmitReply = async (parentCommentId: number, e: FormEvent) => {
    e.preventDefault()
    if (pendingActions.current.has('reply')) return
    const content = (replyInputs[parentCommentId] ?? '').trim()
    if (!content) return
    const isCurrent = captureScope()
    pendingActions.current.add('reply')

    setSubmittingReplyId(parentCommentId)
    setCommentActionError(null)
    try {
      const created = await postsApi.createReply(parsed.postId, parentCommentId, content)
      if (!isCurrent()) return
      setComments((prev) => appendReply(prev, parentCommentId, normalizeComment(created, user, parentCommentId)))
      setReplyInputs((prev) => ({
        ...prev,
        [parentCommentId]: prev[parentCommentId]?.trim() === content ? '' : prev[parentCommentId],
      }))
      setActiveReplyId((current) => current === parentCommentId ? null : current)
    } catch {
      if (isCurrent()) setCommentActionError('답글 작성 권한이 없거나 등록에 실패했습니다.')
    } finally {
      pendingActions.current.delete('reply')
      if (isCurrent()) setSubmittingReplyId(null)
    }
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
    const action = `comment:${commentId}`
    if (pendingActions.current.has(action)) return
    const content = commentEditDrafts[commentId]?.trim()
    if (!content) return
    const isCurrent = captureScope()
    pendingActions.current.add(action)
    setCommentActionError(null)
    try {
      const updated = await postsApi.updateComment(parsed.postId, commentId, content)
      if (!isCurrent()) return
      setComments((prev) => updateCommentInTree(prev, commentId, {
        content: updated.content,
        updatedAt: updated.updatedAt,
      }))
      setEditingCommentId((current) => current === commentId ? null : current)
    } catch {
      if (isCurrent()) setCommentActionError('댓글 수정 권한이 없거나 저장에 실패했습니다.')
    } finally {
      pendingActions.current.delete(action)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    const action = `comment:${commentId}`
    if (pendingActions.current.has(action)) return
    const isCurrent = captureScope()
    pendingActions.current.add(action)
    setCommentActionError(null)
    try {
      await postsApi.deleteComment(parsed.postId, commentId)
      if (!isCurrent()) return
      setComments((prev) => removeCommentFromTree(prev, commentId))
      setEditingCommentId((current) => (current === commentId ? null : current))
    } catch {
      if (isCurrent()) setCommentActionError('댓글 삭제 권한이 없거나 삭제에 실패했습니다.')
    } finally {
      pendingActions.current.delete(action)
    }
  }

  const handleDeletePost = async () => {
    if (!post || pendingActions.current.has('delete')) return
    const confirmed = window.confirm('게시글을 삭제할까요? 댓글과 첨부 자료도 함께 삭제됩니다.')
    if (!confirmed) return
    const isCurrent = captureScope()
    pendingActions.current.add('delete')
    setPostActionError(null)
    try {
      await postsApi.deletePost(parsed.postId)
      if (isCurrent()) onBack()
    } catch {
      if (isCurrent()) setPostActionError('게시글 삭제 권한이 없거나 삭제에 실패했습니다.')
    } finally {
      pendingActions.current.delete('delete')
    }
  }

  const handleReport = (targetType: 'POST' | 'COMMENT', targetId: number) => {
    setReportReason('')
    setReportError('')
    setReportTarget({ targetType, targetId })
  }

  const submitReport = async (event: FormEvent) => {
    event.preventDefault()
    if (!reportTarget || !reportReason.trim() || pendingActions.current.has('report')) return
    const isCurrent = captureScope()
    pendingActions.current.add('report')
    setReportSubmitting(true)
    setReportError('')
    try {
      await moderationApi.report({ ...reportTarget, reasonType: 'OTHER', reasonDetail: reportReason.trim() })
      if (isCurrent()) {
        setReportTarget(null)
        setReportMessage('신고가 접수되었습니다.')
      }
    } catch {
      if (isCurrent()) setReportError('이미 신고했거나 신고 접수에 실패했습니다.')
    } finally {
      pendingActions.current.delete('report')
      setReportSubmitting(false)
    }
  }

  const handleTogglePostLike = async () => {
    if (!post || pendingActions.current.has('like')) return
    if (!isLoggedIn) {
      setLikeMessage('좋아요는 로그인 후 누를 수 있습니다.')
      return
    }
    const isCurrent = captureScope()
    pendingActions.current.add('like')
    setLikeMessage(null)
    try {
      const response = await postsApi.likePost(post.postId)
      if (!isCurrent()) return
      setPost((current) => current
        ? { ...current, likeCount: response.likeCount, likedByMe: response.liked }
        : current)
    } catch {
      if (isCurrent()) setLikeMessage('좋아요 처리에 실패했습니다.')
    } finally {
      pendingActions.current.delete('like')
    }
  }

  if (isLoading) {
    return (
      <section className="coala-content coala-content--post-detail">
        <dialog ref={reportDialog} className="post-report-dialog" aria-labelledby="post-report-title"
        onCancel={(event) => { if (reportSubmitting) event.preventDefault(); else setReportTarget(null) }}
        onClose={() => setReportTarget(null)}>
        <form onSubmit={submitReport}>
          <h2 id="post-report-title"><Icon name="siren-color" size={24} />신고하기</h2>
          <p>운영진이 확인할 수 있도록 신고 사유를 알려주세요.</p>
          <label htmlFor="post-report-reason">신고 사유</label>
          <textarea id="post-report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)}
            required rows={4} maxLength={1000} disabled={reportSubmitting} placeholder="신고 사유를 입력해주세요." />
          {reportError && <p role="alert">{reportError}</p>}
          <div className="post-report-dialog-actions">
            <button type="button" disabled={reportSubmitting} onClick={() => setReportTarget(null)}>취소</button>
            <button type="submit" disabled={reportSubmitting || !reportReason.trim()}>{reportSubmitting ? '접수 중...' : '신고 접수'}</button>
          </div>
        </form>
      </dialog>
      <article className="surface-card post-detail">
          <LoadingSpinner label="게시글을 불러오는 중..." />
        </article>
      </section>
    )
  }

  if (error || !post) {
    return (
      <section className="coala-content coala-content--post-detail">
        <dialog ref={reportDialog} className="post-report-dialog" aria-labelledby="post-report-title"
        onCancel={(event) => { if (reportSubmitting) event.preventDefault(); else setReportTarget(null) }}
        onClose={() => setReportTarget(null)}>
        <form onSubmit={submitReport}>
          <h2 id="post-report-title"><Icon name="siren-color" size={24} />신고하기</h2>
          <p>운영진이 확인할 수 있도록 신고 사유를 알려주세요.</p>
          <label htmlFor="post-report-reason">신고 사유</label>
          <textarea id="post-report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)}
            required rows={4} maxLength={1000} disabled={reportSubmitting} placeholder="신고 사유를 입력해주세요." />
          {reportError && <p role="alert">{reportError}</p>}
          <div className="post-report-dialog-actions">
            <button type="button" disabled={reportSubmitting} onClick={() => setReportTarget(null)}>취소</button>
            <button type="submit" disabled={reportSubmitting || !reportReason.trim()}>{reportSubmitting ? '접수 중...' : '신고 접수'}</button>
          </div>
        </form>
      </dialog>
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
  })
  const category = categoryKey
    ? postCategoryMeta[categoryKey]
    : { label: post.boardName || '게시글', tone: 'free' as const, description: '' }
  const visiblePost = post
  const canManagePost = Boolean(isSameUserId(user?.id, post.userId) && !post.locked && post.status === 'ACTIVE')
  const renderedContent = rewriteMarkdownImageUrls(
    prepareMarkdownForDisplay(visiblePost.content),
    (url) => resolveApiAssetUrl(normalizeMarkdownAttachmentUrl(url)),
  )
  const safeContent = sanitizePostContent(renderedContent)
  const isHtmlContent = isHtmlPostContent(visiblePost.content)
  const totalCommentCount = countCommentTree(comments)

  const renderComment = (comment: CommentItem, isReply = false) => {
    const canManageComment = Boolean(isSameUserId(comment.userId, user?.id) && comment.status !== 'DELETED' && comment.status !== 'ADMIN_DELETED')
    const isEditing = editingCommentId === comment.commentId
    const replyValue = replyInputs[comment.commentId] ?? ''

    return (
      <div
        id={`comment-${comment.commentId}`}
        key={comment.commentId}
        className={isReply ? 'post-comment-item post-comment-item--reply' : 'post-comment-thread'}

      >
        <div className={isReply ? undefined : 'post-comment-item'}>
          <div className="post-comment-topline">
            <div className="post-comment-author-block">
              <CharacterAvatar
                name={comment.authorName ?? (comment.userId ? `사용자 ${comment.userId}` : '익명')}
                seed={comment.userId ?? comment.commentId}
                size="xs"
                className="board-avatar"
              />
              <div className="post-comment-author-copy">
                <strong className="post-comment-author">
                  {comment.authorName ?? (comment.userId ? `사용자 ${comment.userId}` : '익명')}
                </strong>
                <span className="post-comment-time">{formatDate(comment.updatedAt ?? comment.createdAt)}</span>
              </div>
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
                <button type="button" className="ghost-button post-report-icon" aria-label="신고" title="신고" onClick={() => handleReport('COMMENT', comment.commentId)}>
                  <Icon name="siren-color" size={18} />
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
              {activeReplyId === comment.commentId ? '답글 닫기' : '답글'}
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
              aria-label="답글"
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
              disabled={submittingReplyId !== null || !replyValue.trim()}
            >
              답글 등록
            </button>
            <button type="button" className="ghost-button" onClick={() => setActiveReplyId(null)}>취소</button>
          </form>
        ) : null}
      </div>
    )
  }

  return (
    <section className="coala-content coala-content--post-detail">
      <dialog ref={reportDialog} className="post-report-dialog" aria-labelledby="post-report-title"
        onCancel={(event) => { if (reportSubmitting) event.preventDefault(); else setReportTarget(null) }}
        onClose={() => setReportTarget(null)}>
        <form onSubmit={submitReport}>
          <h2 id="post-report-title"><Icon name="siren-color" size={24} />신고하기</h2>
          <p>운영진이 확인할 수 있도록 신고 사유를 알려주세요.</p>
          <label htmlFor="post-report-reason">신고 사유</label>
          <textarea id="post-report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)}
            required rows={4} maxLength={1000} disabled={reportSubmitting} placeholder="신고 사유를 입력해주세요." />
          {reportError && <p role="alert">{reportError}</p>}
          <div className="post-report-dialog-actions">
            <button type="button" disabled={reportSubmitting} onClick={() => setReportTarget(null)}>취소</button>
            <button type="submit" disabled={reportSubmitting || !reportReason.trim()}>{reportSubmitting ? '접수 중...' : '신고 접수'}</button>
          </div>
        </form>
      </dialog>
      <article className="surface-card post-detail">
        <header className="post-detail-header">
          <button type="button" className="post-back-button" onClick={onBack}>
            <Icon name="chevron-left" size={16} />
            <span>목록으로 돌아가기</span>
          </button>

          <div className="post-header-actions">
            {isLoggedIn && !post.mine && !isSameUserId(user?.id, post.userId) && <button type="button" className="ghost-button post-report-icon" aria-label="신고" title="신고" onClick={() => handleReport('POST', post.postId)}><Icon name="siren-color" size={16} /></button>}
            {canManagePost ? (
              <>
                <button type="button" className="ghost-button" title="수정" onClick={onEdit}>
                  <Icon name="pencil-color" size={15} />
                  <span className="sr-only">수정</span>
                </button>
                <button type="button" className="ghost-button" title="삭제" onClick={handleDeletePost}>
                  <Icon name="trash-color" size={15} />
                  <span className="sr-only">삭제</span>
                </button>
              </>
            ) : null}
          </div>
        </header>
        {postActionError ? <p className="auth-error">{postActionError}</p> : null}
        {reportMessage ? <p className="auth-error">{reportMessage}</p> : null}
        {likeMessage ? <p className="auth-error">{likeMessage}</p> : null}

        <div className="post-cover">
          <div className="post-cover-text">
            <div className="post-category-meta-row">
            <span className={`board-context-pill board-context-pill--${category.tone} post-cover-pill`}>
              #{category.label}
            </span>
              <span className="post-meta-updated">최종 수정: {formatDate(visiblePost.updatedAt)}</span>
            </div>
            <h1 className="post-cover-title">{visiblePost.title}</h1>
          </div>

          <div className="post-cover-meta">
            <div className="post-meta-author">
              <CharacterAvatar
                name={visiblePost.authorName ?? (visiblePost.userId ? `사용자 ${visiblePost.userId}` : '익명')}
                seed={visiblePost.userId}
                size="sm"
                className="board-avatar"
              />
              <div>
                <strong>{visiblePost.authorName ?? (visiblePost.userId ? `사용자 ${visiblePost.userId}` : '익명')}</strong>
                <span>{formatDate(visiblePost.createdAt)}</span>
              </div>
            </div>

            <div className="post-meta-stats">
              <span><Icon name="eye-color" size={15} />{visiblePost.viewCount}</span>
              <span><Icon name="message-color" size={15} />{totalCommentCount}</span>
              <button
                type="button"
                className={visiblePost.likedByMe ? 'post-like-button is-liked' : 'post-like-button'}
                aria-label="좋아요"
                aria-pressed={Boolean(visiblePost.likedByMe)}
                onClick={handleTogglePostLike}
              >
                <Icon name="heart-color" size={15} />
                <span>{visiblePost.likeCount ?? 0}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="post-body">

          {isHtmlContent ? (
            <div
              className="post-content post-content--html"
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />
          ) : (
            <MDEditor.Markdown
              className="post-content post-content--markdown"
              source={renderedContent}
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
import '../home/portal-badge-colors.css'
