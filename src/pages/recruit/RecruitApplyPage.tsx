import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MDEditor, { commands, type ICommand } from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-md-editor/markdown-editor.css'
import { CommunityBanner } from '../community/CommunityBanner'
import { Icon } from '../../shared/ui/Icon'
import { recruitsApi, type RecruitItem } from '../../shared/api/recruits'
import { useAuth } from '../../shared/auth/AuthContext'
import { mutationError } from '../../shared/api/mutationError'
import { applicationStatusLabel, useRecruitApplications } from './useRecruitApplications'
import './recruit-workspace.css'
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
const createDefaultApplicationDraft = (item: RecruitItem): RecruitApplicationDraft => ({
  role: item.roles[0]?.label ?? '',
  body: `## 자기소개\n\n\n## 지원 동기\n\n${item.title}에 관심을 가지게 된 이유를 적어주세요.\n\n## 가능한 역할과 시간\n\n\n## 남기고 싶은 말\n\n`,
})

export function RecruitApplyPage() {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const recruitId = params.get('id')
  return <RecruitApplicationContent key={`${user?.id}:${recruitId}`} recruitId={recruitId} />
}

function RecruitApplicationContent({ recruitId }: { recruitId: string | null }) {
  const navigate = useNavigate()
  const editorRootRef = useRef<HTMLDivElement | null>(null)
  const applications = useRecruitApplications()
  const application = applications.items.find((entry) => entry.recruitId === recruitId)
  const [loading, setLoading] = useState(Boolean(recruitId))
  const [loadError, setLoadError] = useState('')
  const [revision, setRevision] = useState(0)
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [markdownCopied, setMarkdownCopied] = useState<MarkdownCopyState>('idle')
  const [imageError, setImageError] = useState<string | null>(null)
  const [remoteItem, setRemoteItem] = useState<RecruitItem | null>(null)
  const item = remoteItem?.id === recruitId ? remoteItem : null
  const [draft, setDraft] = useState<RecruitApplicationDraft>(() => (
    item ? createDefaultApplicationDraft(item) : { role: '', body: '' }
  ))
  const imageUploadCommand = useMemo(
    () => createMarkdownImageCommand({
      onError: setImageError,
    }),
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
    let active = true
    if (recruitId) {
      recruitsApi.getRecruit(recruitId)
        .then((value) => { if (active) setRemoteItem(value) })
        .catch(() => { if (active) setLoadError('모집 공고를 불러오지 못했습니다.') })
        .finally(() => { if (active) setLoading(false) })
    }
    return () => { active = false }
  }, [recruitId, revision])

  useEffect(() => {
    if (!item || applications.loading || applications.error || initialized) return
    setDraft(application ? { role: application.role, body: application.body } : createDefaultApplicationDraft(item))
    setSubmitted(false)
    setError(null)
    setInitialized(true)
  }, [item, application, applications.loading, applications.error, initialized])

  const locked = item?.status === 'closed' || application?.status === 'accepted'
  const originalDraft = application ?? (item ? createDefaultApplicationDraft(item) : { role: '', body: '' })
  const dirty = initialized && !submitted && (draft.role !== originalDraft.role || draft.body !== originalDraft.body)
  useEffect(() => {
    if (!dirty) return
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [dirty])

  const goBackToRecruit = () => {
    if (dirty && !window.confirm('작성 중인 지원 내용을 취소할까요?')) return
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
    const textarea = event.currentTarget
    try {
      const markdown = await readMarkdownImagesFromClipboard(event, { onError: setImageError })
      if (markdown) {
        insertImagesIntoEditor(textarea, markdown)
        setImageError(null)
      }
    } catch (error) {
      setImageError(error instanceof Error ? error.message : '이미지를 첨부하지 못했습니다.')
    }
  }

  const handleEditorDrop = async (event: DragEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget
    try {
      const markdown = await readMarkdownImagesFromDrop(event, { onError: setImageError })
      if (markdown) {
        insertImagesIntoEditor(textarea, markdown)
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!item || saving || locked || !initialized) return

    const markdownBody = draft.body.replace(/[#*_`>\-\s]/g, '')
    if (!draft.role.trim() || !markdownBody.trim()) {
      setError('지원 역할과 지원 내용을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      await recruitsApi.apply(item.id, { role: draft.role.trim(), body: draft.body })
      setSubmitted(true)
      setError(null)
    } catch (error) {
      setError(mutationError(error, '지원서를 제출하지 못했습니다. 작성 내용은 유지됩니다.'))
    } finally { setSaving(false) }
  }

  if (!item || applications.loading || applications.error || !initialized) {
    return (
      <section className="coala-content coala-content--recruit">
        <CommunityBanner title="지원하기" tone="recruit" />
        <div className="surface-card recruit-application-empty">
          <strong role={loadError || applications.error ? 'alert' : 'status'}>
            {loadError || applications.error || (loading || applications.loading || item ? '지원서를 불러오는 중입니다.' : '지원할 모집 공고를 찾을 수 없습니다.')}
          </strong>
          {(loadError || applications.error) && <button type="button" className="ghost-button" onClick={() => {
            if (loadError) { setLoadError(''); setLoading(true); setRevision((value) => value + 1) }
            if (applications.error) applications.retry()
          }}>다시 불러오기</button>}
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
            <button type="button" className="recruit-row-button recruit-row-button--primary" onClick={() => navigate(`${routes.community.recruit}?view=applications`)}>
              지원 내역
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
            <p>{application ? `지원서 · ${applicationStatusLabel(application.status)}` : '지원하기'}</p>
            <h3>{item.title}</h3>
          </div>
          <button type="button" className="recruit-row-button" onClick={goBackToRecruit}>
            공고로 돌아가기
          </button>
        </header>
        {locked && <p role="status">{application?.status === 'accepted' ? '승인된 지원서는 수정할 수 없습니다.' : '모집이 마감되어 지원서를 제출할 수 없습니다.'}</p>}

        <fieldset disabled={saving || locked}>
        <label className="jcloud-field">
          <span className="jcloud-label">지원 역할</span>
          <select
            className="jcloud-input"
            required
            value={draft.role}
            onChange={(event) => setDraft({ ...draft, role: event.target.value })}
          >
            <option value="">역할 선택</option>
            {draft.role && !item.roles.some((role) => role.label === draft.role) && <option value={draft.role} disabled>{draft.role} (모집 종료)</option>}
            {item.roles.map((role) => <option key={role.label} value={role.label}>{role.label} ({role.current}/{role.max}명)</option>)}
          </select>
        </label>

        <label className="jcloud-field recruit-application-editor-field">
          <span className="jcloud-label">지원 내용</span>
          <div ref={editorRootRef} className="recruit-application-editor" data-color-mode="light">
            <MDEditor
              value={draft.body}
              onChange={(value) => setDraft({ ...draft, body: value ?? '' })}
              preview="edit"
              height={360}
              visibleDragbar={false}
              commands={applicationCommands}
              textareaProps={{
                disabled: saving || locked,
                maxLength: 20000,
                'aria-label': '지원 내용',
                onPaste: handleEditorPaste,
                onDrop: handleEditorDrop,
                onDragOver: handleEditorDragOver,
                placeholder: '자기소개, 지원 동기, 가능한 역할과 시간을 적어주세요.',
              }}
            />
          </div>
        </label>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        {imageError ? <p className="auth-error" role="alert">{imageError}</p> : null}

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
          <button type="submit" className="jcloud-submit-button" disabled={saving || locked}>
            {saving ? '제출 중...' : application ? '지원서 수정' : '제출'}
          </button>
        </div>
        </fieldset>
      </form>
    </section>
  )
}
