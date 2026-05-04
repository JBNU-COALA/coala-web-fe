import { useState } from 'react'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-markdown-preview/markdown.css'
import { resourceCards } from '../../dummy/infoData'
import { Icon } from '../../shared/ui/Icon'
import { copyMarkdown, downloadMarkdown, toMarkdownFilename, type MarkdownCopyState } from '../../shared/markdown'

type InfoDetailPageProps = {
  infoId: string
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

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateStr)) return dateStr

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function splitSource(source: string) {
  const [name, date] = source.split('|').map((part) => part.trim())
  return {
    name: name || '코알라',
    date: date || '',
  }
}

const categoryCopy = {
  news: {
    label: '소식',
    tone: 'notice',
  },
  contest: {
    label: '대회',
    tone: 'free',
  },
  lab: {
    label: '연구실',
    tone: 'notice',
  },
  resource: {
    label: '자료',
    tone: 'humor',
  },
} as const

export function InfoDetailPage({ infoId, onBack, onWrite, onEdit }: InfoDetailPageProps) {
  const [markdownCopied, setMarkdownCopied] = useState<MarkdownCopyState>('idle')
  const [shareCopied, setShareCopied] = useState<'idle' | 'copied' | 'error'>('idle')
  const item = resourceCards.find((resource) => String(resource.id) === infoId) ?? resourceCards[0]
  const copy = categoryCopy[item.filter]
  const localEdits = loadLocalPostEdits()
  const localEdit =
    localEdits[String(item.id)] ?? localEdits[`resource-${String(item.id).padStart(3, '0')}`]
  const title = localEdit?.title ?? item.title
  const markdown = localEdit?.content ?? item.content
  const tags = (localEdit?.tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean) ?? [
    copy.label,
    item.tag,
  ])
  const source = splitSource(item.source)

  const handleCopyMarkdown = async () => {
    setMarkdownCopied(await copyMarkdown(markdown) ? 'copied' : 'error')
    setTimeout(() => setMarkdownCopied('idle'), 2000)
  }

  const handleDownloadMarkdown = () => {
    downloadMarkdown(toMarkdownFilename(title, 'coala-info'), markdown)
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
              <span>{markdownCopied === 'copied' ? '복사 완료' : markdownCopied === 'error' ? '복사 실패' : '마크다운'}</span>
            </button>
            <button type="button" className="ghost-button" onClick={handleDownloadMarkdown}>
              <Icon name="file" size={15} />
              <span>.md</span>
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

        <div className="post-cover post-cover--info">
          <div className="post-cover-text">
            <span className={`board-context-pill board-context-pill--${copy.tone} post-cover-pill`}>
              {copy.label}
            </span>
            <p className="post-cover-subtitle">정보공유</p>
            <h1 className="post-cover-title">{title}</h1>
          </div>

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
              <span><Icon name="file" size={15} />{item.meta}</span>
              <span><Icon name="book" size={15} />{item.tag}</span>
            </div>
          </div>
        </div>

        <div className="post-body">
          <div className="post-tags">
            {tags.map((tag) => (
              <span key={tag} className="post-tag">#{tag}</span>
            ))}
            <span className="post-meta-updated">최종 수정: {localEdit?.updatedAt ? formatDate(localEdit.updatedAt) : source.date}</span>
          </div>

          <MDEditor.Markdown
            className="post-content post-content--markdown"
            source={markdown}
            style={{ whiteSpace: 'pre-wrap' }}
          />
        </div>
      </article>
    </section>
  )
}
