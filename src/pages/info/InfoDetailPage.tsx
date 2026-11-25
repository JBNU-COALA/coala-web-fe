import { useEffect, useRef, useState } from 'react'
import { useRequestScope } from '../../useRequestScope'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-markdown-preview/markdown.css'
import { infoApi, type InfoArticle } from '../../shared/api/info'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { Icon } from '../../shared/ui/Icon'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { rewriteMarkdownImageUrls, normalizeMarkdownAttachmentUrl, prepareMarkdownForDisplay } from '../../shared/markdown'
import { extractFirstContentImage } from '../../shared/contentPreview'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { useAuth } from '../../shared/auth/AuthContext'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { isSameUserId } from '../../shared/auth/userIdentity'

type InfoDetailPageProps = {
  infoId: string
  onBack: () => void
  onWrite: () => void
  onEdit: () => void
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateStr)) return dateStr

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function splitSource(source: string, explicitName?: string | null, explicitDate?: string | null) {
  const [name, date] = source.split('|').map((part) => part.trim())
  return {
    name: explicitName || name || '코알라',
    date: explicitDate || date || '',
  }
}

const categoryCopy = {
  news: {
    label: '소식',
    tone: 'info-news',
  },
  contest: {
    label: '대회',
    tone: 'info-contest',
  },
  lab: {
    label: '연구실',
    tone: 'info-lab',
  },
  resource: {
    label: '자료',
    tone: 'info-resource',
  },
} as const

export function InfoDetailPage(props: InfoDetailPageProps) {
  return <InfoDetailContent key={props.infoId} {...props} />
}

function InfoDetailContent({ infoId, onBack, onEdit }: InfoDetailPageProps) {
  const { isLoggedIn, user } = useAuth()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [infoActionError, setInfoActionError] = useState<string | null>(null)
  const [likeMessage, setLikeMessage] = useState<string | null>(null)
  const [item, setItem] = useState<InfoArticle | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [mutationPending, setMutationPending] = useState(false)
  const [loadRevision, setLoadRevision] = useState(0)
  const mutationLock = useRef(false)
  const captureRequest = useRequestScope()

  function beginMutation() {
    if (mutationLock.current) return false
    mutationLock.current = true
    setMutationPending(true)
    return true
  }

  function finishMutation() {
    mutationLock.current = false
    setMutationPending(false)
  }

  useEffect(() => {
    let active = true
    const numericId = Number(infoId)
    if (!Number.isSafeInteger(numericId) || numericId <= 0) return
    infoApi.getArticle(numericId)
      .then((value) => {
        if (active) {
          setItem(value)
          setLoadError(false)
          setInfoActionError(null)
          setLikeMessage(null)
        }
      })
      .catch(() => { if (active) { setItem(null); setLoadError(true) } })
    return () => { active = false }
  }, [infoId, loadRevision])

  const invalidId = !Number.isSafeInteger(Number(infoId)) || Number(infoId) <= 0
  if (!item || item.id !== Number(infoId)) {
    return (
      <section className="coala-content coala-content--post-detail">
        <article className="surface-card post-detail info-detail-page">
          <header className="post-detail-header">
            <button type="button" className="post-back-button" onClick={onBack}>
              <Icon name="chevron-left" size={16} />
              <span>정보공유로 돌아가기</span>
            </button>
          </header>
          <div className="info-detail-load-state">
          <p className="empty-post-state" role={loadError || invalidId ? 'alert' : 'status'}>{invalidId ? '올바르지 않은 게시글 주소입니다.' : loadError ? '정보공유 글을 불러오지 못했습니다. 삭제되었거나 접근 권한이 없는 글일 수 있습니다.' : '정보공유 글을 불러오는 중입니다.'}</p>
          {loadError && !invalidId && <button type="button" className="ghost-button retry-button" onClick={() => { setLoadError(false); setLoadRevision((value) => value + 1) }}>다시 불러오기</button>}
          </div>
        </article>
      </section>
    )
  }

  const copy = categoryCopy[item.filter]
  const title = item.title
  const markdown = item.content
  const renderedMarkdown = rewriteMarkdownImageUrls(
    prepareMarkdownForDisplay(markdown),
    (url) => resolveApiAssetUrl(normalizeMarkdownAttachmentUrl(url)),
  )
  const tags = Array.from(new Set([copy.label, item.tag].map((tag) => tag.trim()).filter(Boolean)))
  const source = splitSource(item.source, item.authorName || item.sourceName, item.sourceDate)
  const fallbackAttachmentUrl = item.thumbnailAttachmentId
    ? `/media/attachments/${item.thumbnailAttachmentId}/download`
    : ''
  const coverImageUrl = resolveApiAssetUrl(item.imageUrl || extractFirstContentImage(markdown) || fallbackAttachmentUrl)
  const canManageInfo = isSameUserId(item.authorId, user?.id) || isAdminUser(user)

  const handleToggleInfoLike = async () => {
    if (!item) return
    if (!isLoggedIn) {
      setLikeMessage('좋아요는 로그인 후 누를 수 있습니다.')
      return
    }

    if (!beginMutation()) return
    const isCurrent = captureRequest()
    setLikeMessage(null)
    try {
      const response = await infoApi.likeArticle(item.id)
      if (!isCurrent()) return
      setItem((current) => current
        ? { ...current, likeCount: response.likeCount, likedByMe: response.liked }
        : current)
    } catch {
      if (isCurrent()) setLikeMessage('좋아요 처리에 실패했습니다.')
    } finally {
      if (isCurrent()) finishMutation()
    }
  }

  const handleDeleteInfo = async () => {
    if (!item || mutationLock.current) return
    setDeleteConfirmOpen(false)

    if (!beginMutation()) return
    const isCurrent = captureRequest()
    setInfoActionError(null)
    try {
      await infoApi.deleteArticle(item.id)
      if (isCurrent()) onBack()
    } catch {
      if (isCurrent()) setInfoActionError('정보공유 글 삭제 권한이 없거나 삭제에 실패했습니다.')
    } finally {
      if (isCurrent()) finishMutation()
    }
  }

  return (
    <section className="coala-content coala-content--post-detail">
      <article className="surface-card post-detail info-detail-page">
        <header className="post-detail-header">
          <button type="button" className="post-back-button" onClick={onBack}>
            <Icon name="chevron-left" size={16} />
            <span>정보공유로 돌아가기</span>
          </button>


        </header>
        {infoActionError ? <p className="auth-error">{infoActionError}</p> : null}
        {likeMessage ? <p className="auth-error">{likeMessage}</p> : null}

        <div className={coverImageUrl ? 'post-cover post-cover--info post-cover--has-media' : 'post-cover post-cover--info'}>
          <div className="post-cover-text">
            <span className={`board-context-pill board-context-pill--${copy.tone} post-cover-pill`}>
              #{copy.label}
            </span>
            <h1 className="post-cover-title">{title}</h1>
          </div>

          {coverImageUrl ? (
            <div className="post-cover-media" aria-hidden="true">
              <img src={coverImageUrl} alt="" loading="lazy" />
            </div>
          ) : null}

          <div className="post-cover-meta">
            <div className="post-meta-author">
              <CharacterAvatar
                name={source.name}
                seed={item.authorId ?? item.id}
                size="sm"
                className="board-avatar"
              />
              <div>
                <strong>{source.name}</strong>
                <span>{formatDate(source.date)}</span>
              </div>
            </div>

            <div className="post-meta-stats">
              <span><Icon name="eye-color" size={15} />{item.viewCount}</span>
              <button
                type="button"
                className={item.likedByMe ? 'post-like-button is-liked' : 'post-like-button'}
                aria-pressed={Boolean(item.likedByMe)}
                disabled={mutationPending}
                onClick={handleToggleInfoLike}
              >
                <Icon name="heart-color" size={15} />
                <span>{item.likeCount ?? 0}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="post-body">
          <div className="post-tags">
            {tags.filter((tag) => tag !== copy.label).map((tag) => (
              <span key={tag} className="post-tag">#{tag}</span>
            ))}
            <span className="post-meta-updated">최종 수정: {formatDate(source.date)}</span>
          </div>

          <MDEditor.Markdown
            className="post-content post-content--markdown"
            source={renderedMarkdown}
            style={{ whiteSpace: 'pre-wrap' }}
          />
        </div>
        {canManageInfo && (
          <div className="post-header-actions info-detail-footer-actions">
            <button type="button" className="ghost-button" disabled={mutationPending} title="수정" onClick={onEdit}>
              <Icon name="pencil-color" size={15} />
              <span className="sr-only">수정</span>
            </button>
            <button type="button" className="ghost-button" disabled={mutationPending} title="삭제" onClick={() => setDeleteConfirmOpen(true)}>
              <Icon name="trash-color" size={15} />
              <span className="sr-only">삭제</span>
            </button>
          </div>
        )}
      </article>
      <ConfirmDialog open={deleteConfirmOpen} title="정보공유 글을 삭제할까요?"
        description="첨부 이미지도 함께 삭제됩니다." confirmLabel="삭제하기" cancelLabel="취소"
        onConfirm={handleDeleteInfo} onCancel={() => setDeleteConfirmOpen(false)} />
    </section>
  )
}
