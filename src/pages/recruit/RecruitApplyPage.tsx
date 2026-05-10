/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, type ClipboardEvent, type DragEvent, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MDEditor, { commands, type ICommand } from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-md-editor/markdown-editor.css'
import { CommunityBanner } from '../community/CommunityBanner'
import { Icon } from '../../shared/ui/Icon'
import { recruitItems, type RecruitItem } from '../../dummy/recruitData'
import { copyMarkdown, downloadMarkdown, toMarkdownFilename, type MarkdownCopyState } from '../../shared/markdown'
import {
  createMarkdownImageCommand,
  insertMarkdownBlockAtRange,
  readMarkdownImagesFromClipboard,
  readMarkdownImagesFromDrop,
} from '../../shared/markdownImages'
import { routes } from '../../shared/routes'

type RecruitApplicationDraft = {
  role: string
  body: string
}

type StoredRecruitApplication = RecruitApplicationDraft & {
  recruitId: string
  submittedAt: string
}

const LOCAL_RECRUIT_STORAGE_KEY = 'coala-local-recruits'
const LOCAL_APPLICATION_STORAGE_KEY = 'coala-recruit-applications'

const baseApplicationCommands: ICommand[] = [
  commands.bold,
  commands.italic,
  commands.strikethrough,
  commands.divider,
  commands.title1,
  commands.title2,
  commands.title3,
  commands.divider,
  commands.link,
  commands.image,
  commands.quote,
  commands.code,
  commands.codeBlock,
  commands.divider,
  commands.unorderedListCommand,
  commands.orderedListCommand,
  commands.checkedListCommand,
]
const loadLocalRecruitItems = (): RecruitItem[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(LOCAL_RECRUIT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const loadStoredApplications = (): Record<string, StoredRecruitApplication> => {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(LOCAL_APPLICATION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const createDefaultApplicationDraft = (item: RecruitItem): RecruitApplicationDraft => ({
  role: item.roles[0]?.label ?? '',
  body: `## 자기소개\n\n\n## 지원 동기\n\n${item.title}에 관심을 가지게 된 이유를 적어주세요.\n\n## 가능한 역할과 시간\n\n\n## 남기고 싶은 말\n\n`,
})

export function RecruitApplyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const recruitId = searchParams.get('id')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [markdownCopied, setMarkdownCopied] = useState<MarkdownCopyState>('idle')
  const [imageError, setImageError] = useState<string | null>(null)
  const allRecruitItems = useMemo(() => [...loadLocalRecruitItems(), ...recruitItems], [])
  const item = allRecruitItems.find((recruit) => recruit.id === recruitId) ?? null
  const [draft, setDraft] = useState<RecruitApplicationDraft>(() => (
    item ? createDefaultApplicationDraft(item) : { role: '', body: '' }
  ))
  const imageUploadCommand = useMemo(
    () => createMarkdownImageCommand({ onError: setImageError }),
    [],
  )
  const applicationCommands = useMemo(
    () => [
      ...baseApplicationCommands.slice(0, 10),
      imageUploadCommand,
      ...baseApplicationCommands.slice(10),
    ],
    [imageUploadCommand],
  )

  useEffect(() => {
    if (!item) return
    const stored = loadStoredApplications()[item.id]
    setDraft(stored ? { role: stored.role, body: stored.body } : createDefaultApplicationDraft(item))
    setSubmitted(false)
    setError(null)
  }, [item])

  const goBackToRecruit = () => {
    navigate(item ? routes.community.recruitNotice(item.id) : routes.community.recruit)
  }

  const handleCopyMarkdown = async () => {
    setMarkdownCopied(await copyMarkdown(draft.body) ? 'copied' : 'error')
    setTimeout(() => setMarkdownCopied('idle'), 2000)
  }

  const handleDownloadMarkdown = () => {
    downloadMarkdown(toMarkdownFilename(`${item?.title ?? 'recruit'}-지원서`, 'coala-recruit-application'), draft.body)
  }

  const insertImagesIntoEditor = (textarea: HTMLTextAreaElement, markdown: string) => {
    const result = insertMarkdownBlockAtRange(
      textarea.value,
      markdown,
      textarea.selectionStart,
      textarea.selectionEnd,
    )
    setDraft((current) => ({ ...current, body: result.value }))
    window.requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.cursor, result.cursor)
    })
  }

  const handleEditorPaste = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    try {
      const markdown = await readMarkdownImagesFromClipboard(event, { onError: setImageError })
      if (markdown) {
        insertImagesIntoEditor(event.currentTarget, markdown)
        setImageError(null)
      }
    } catch (error) {
      setImageError(error instanceof Error ? error.message : '이미지를 첨부하지 못했습니다.')
    }
  }

  const handleEditorDrop = async (event: DragEvent<HTMLTextAreaElement>) => {
    try {
      const markdown = await readMarkdownImagesFromDrop(event, { onError: setImageError })
      if (markdown) {
        insertImagesIntoEditor(event.currentTarget, markdown)
        setImageError(null)
      }
    } catch (error) {
      setImageError(error instanceof Error ? error.message : '이미지를 첨부하지 못했습니다.')
    }
  }

  const handleEditorDragOver = (event: DragEvent<HTMLTextAreaElement>) => {
    if (Array.from(event.dataTransfer.items).some((dragItem) => dragItem.type.startsWith('image/'))) {
      event.preventDefault()
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!item) return

    const markdownBody = draft.body.replace(/[#*_`>\-\s]/g, '')
    if (!draft.role.trim() || !markdownBody.trim()) {
      setError('지원 역할과 지원 내용을 입력해주세요.')
      return
    }

    const applications = loadStoredApplications()
    applications[item.id] = {
      recruitId: item.id,
      role: draft.role.trim(),
      body: draft.body,
      submittedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(LOCAL_APPLICATION_STORAGE_KEY, JSON.stringify(applications))
    setSubmitted(true)
    setError(null)
  }

  if (!item) {
    return (
      <section className="coala-content coala-content--recruit">
        <CommunityBanner title="지원하기" tone="recruit" />
        <div className="surface-card recruit-application-empty">
          <strong>지원할 모집 공고를 찾을 수 없습니다.</strong>
          <button type="button" className="recruit-row-button recruit-row-button--primary" onClick={() => navigate(routes.community.recruit)}>
            모집 목록
          </button>
        </div>
      </section>
    )
  }

  if (submitted) {
    return (
      <section className="coala-content coala-content--recruit">
        <CommunityBanner title="지원하기" tone="recruit" />
        <div className="surface-card recruit-application-success">
          <Icon name="file" size={22} />
          <div>
            <h3>제출되었습니다.</h3>
            <p>{item.title}</p>
          </div>
          <div className="recruit-application-success-actions">
            <button type="button" className="recruit-row-button" onClick={goBackToRecruit}>
              공고로 돌아가기
            </button>
            <button type="button" className="recruit-row-button recruit-row-button--primary" onClick={() => navigate(routes.community.recruit)}>
              모집 목록
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="coala-content coala-content--recruit">
      <CommunityBanner title="지원하기" tone="recruit" />

      <form className="surface-card recruit-application-panel recruit-application-panel--page" onSubmit={handleSubmit}>
        <header className="recruit-application-head">
          <div>
            <p>지원하기</p>
            <h3>{item.title}</h3>
          </div>
          <button type="button" className="recruit-row-button" onClick={goBackToRecruit}>
            공고로 돌아가기
          </button>
        </header>

        <label className="jcloud-field">
          <span className="jcloud-label">지원 역할</span>
          <input
            className="jcloud-input"
            value={draft.role}
            onChange={(event) => setDraft({ ...draft, role: event.target.value })}
            placeholder="프론트엔드, 백엔드, 기획"
          />
        </label>

        <label className="jcloud-field recruit-application-editor-field">
          <span className="jcloud-label">지원 내용</span>
          <div className="recruit-application-editor" data-color-mode="light">
            <MDEditor
              value={draft.body}
              onChange={(value) => setDraft({ ...draft, body: value ?? '' })}
              preview="edit"
              height={360}
              visibleDragbar={false}
              commands={applicationCommands}
              textareaProps={{
                onPaste: handleEditorPaste,
                onDrop: handleEditorDrop,
                onDragOver: handleEditorDragOver,
                placeholder: '자기소개, 지원 동기, 가능한 역할과 시간을 적어주세요.',
              }}
            />
          </div>
        </label>

        {error ? <p className="auth-error">{error}</p> : null}
        {imageError ? <p className="auth-error">{imageError}</p> : null}

        <div className="recruit-application-footer">
          <button
            type="button"
            className={markdownCopied === 'copied' ? 'ghost-button ghost-button--success' : 'ghost-button'}
            onClick={handleCopyMarkdown}
          >
            <Icon name="copy" size={15} />
            {markdownCopied === 'copied' ? '복사됨' : markdownCopied === 'error' ? '복사 실패' : '마크다운'}
          </button>
          <button type="button" className="ghost-button" onClick={handleDownloadMarkdown}>
            <Icon name="file" size={15} />
            .md
          </button>
          <button type="submit" className="jcloud-submit-button">
            제출
          </button>
        </div>
      </form>
    </section>
  )
}
