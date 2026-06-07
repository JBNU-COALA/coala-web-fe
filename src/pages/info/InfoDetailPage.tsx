import { useEffect, useState } from 'react'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-markdown-preview/markdown.css'
import { infoApi, type InfoArticle } from '../../shared/api/info'
import { Icon } from '../../shared/ui/Icon'
import { copyMarkdown, rewriteMarkdownImageUrls, normalizeMarkdownAttachmentUrl, prepareMarkdownForDisplay, type MarkdownCopyState } from '../../shared/markdown'
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

export function InfoDetailPage({ infoId, onBack, onWrite, onEdit }: InfoDetailPageProps) {
  const { isLoggedIn, user } = useAuth()
  const [markdownCopied, setMarkdownCopied] = useState<MarkdownCopyState>('idle')
  const [shareCopied, setShareCopied] = useState<'idle' | 'copied' | 'error'>('idle')
  const [infoActionError, setInfoActionError] = useState<string | null>(null)
  const [likeMessage, setLikeMessage] = useState<string | null>(null)
  const [item, setItem] = useState<InfoArticle | null>(null)

  useEffect(() => {
    const numericId = Number(infoId)
    if (Number.isNaN(numericId)) return
    setInfoActionError(null)
    setLikeMessage(null)
    infoApi.getArticle(numericId)
      .then(setItem)
      .catch(() => setItem(null))
  }, [infoId])

  if (!item) {
    return (
      <section className="coala-content coala-content--post-detail">
        <article className="surface-card post-detail info-detail-page">
          <header className="post-detail-header">
            <button type="button" className="post-back-button" onClick={onBack}>
              <Icon name="chevron-left" size={16} />
              <span>정보공유로 돌아가기</span>
            </button>
          </header>
          <p className="empty-post-state">정보공유 글을 불러오는 중입니다.</p>
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

  const handleCopyMarkdown = async () => {
    setMarkdownCopied(await copyMarkdown(markdown) ? 'copied' : 'error')
    setTimeout(() => setMarkdownCopied('idle'), 2000)
  }

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied('copied')
    } catch {
      setShareCopied('error')
    }
    setTimeout(() => setShareCopied('idle'), 2000)
  }

  const handleToggleInfoLike = async () => {
    if (!item) return
    if (!isLoggedIn) {
      setLikeMessage('좋아요는 로그인 후 누를 수 있습니다.')
      return
    }

    setLikeMessage(null)
    try {
      const response = await infoApi.likeArticle(item.id)
      setItem((current) => current
        ? { ...current, likeCount: response.likeCount, likedByMe: response.liked }
        : current)
    } catch {
      setLikeMessage('좋아요 처리에 실패했습니다.')
    }
  }

  const handleDeleteInfo = async () => {
    if (!item) return
    const confirmed = window.confirm('정보공유 글을 삭제할까요? 첨부 이미지도 함께 정리됩니다.')
    if (!confirmed) return

    setInfoActionError(null)
    try {
      await infoApi.deleteArticle(item.id)
      onBack()
    } catch {
      setInfoActionError('정보공유 글 삭제 권한이 없거나 삭제에 실패했습니다.')
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

          <div className="post-header-actions">
            <button type="button" className="ghost-button" onClick={onWrite}>
              <Icon name="edit" size={15} />
              <span>정보 글쓰기</span>
            </button>
            {canManageInfo ? (
              <>
                <button type="button" className="ghost-button" onClick={onEdit}>
                  <Icon name="edit" size={15} />
                  <span>수정</span>
                </button>
                <button type="button" className="ghost-button" onClick={handleDeleteInfo}>
                  <Icon name="file" size={15} />
                  <span>삭제</span>
                </button>
              </>
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
              <span>{shareCopied === 'copied' ? '복사 완료' : '공유 링크'}</span>
            </button>
          </div>
        </header>
        {infoActionError ? <p className="auth-error">{infoActionError}</p> : null}
        {likeMessage ? <p className="auth-error">{likeMessage}</p> : null}

        <div className={coverImageUrl ? 'post-cover post-cover--info post-cover--has-media' : 'post-cover post-cover--info'}>
          <div className="post-cover-text">
            <span className={`board-context-pill board-context-pill--${copy.tone} post-cover-pill`}>
              {copy.label}
            </span>
            <p className="post-cover-subtitle">정보공유</p>
            <h1 className="post-cover-title">{title}</h1>
          </div>

          {coverImageUrl ? (
            <div className="post-cover-media" aria-hidden="true">
              <img src={coverImageUrl} alt="" loading="lazy" />
            </div>
          ) : null}

          <div className="post-cover-meta">
            <div className="post-meta-author">
              <span className="board-avatar board-avatar--mint">
                {source.name[0]}
              </span>
              <div>
                <strong>{source.name}</strong>
                <span>{formatDate(source.date)}</span>
              </div>
            </div>

            <div className="post-meta-stats">
              <span><Icon name="eye" size={15} />{item.viewCount}</span>
              <span><Icon name="file" size={15} />{item.meta}</span>
              <span><Icon name="book" size={15} />{item.tag}</span>
              <button
                type="button"
                className={item.likedByMe ? 'post-like-button is-liked' : 'post-like-button'}
                aria-pressed={Boolean(item.likedByMe)}
                onClick={handleToggleInfoLike}
              >
                <Icon name="heart" size={15} />
                <span>{item.likeCount ?? 0}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="post-body">
          <div className="post-tags">
            {tags.map((tag) => (
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
      </article>
    </section>
  )
}
