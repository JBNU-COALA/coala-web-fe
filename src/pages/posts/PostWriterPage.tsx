import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import MDEditor, { commands, type ICommand } from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { postsApi } from '../../shared/api/posts'
import { Icon } from '../../shared/ui/Icon'

const TITLE_MAX = 100
const CONTENT_MAX = 12000

type PostWriterPageProps = {
  onClose: () => void
  writerType?: 'community' | 'info' | 'inquiry' | 'recruit'
}

const nowIso = new Date().toISOString()

const fallbackBoardsByType: Record<NonNullable<PostWriterPageProps['writerType']>, BoardData[]> = {
  community: [
    { boardId: 1, boardName: '공지', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
    { boardId: 2, boardName: '자유', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
    { boardId: 3, boardName: '유머', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
  ],
  info: [
    { boardId: 11, boardName: '소식', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
    { boardId: 12, boardName: '대회', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
    { boardId: 13, boardName: '연구실', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
    { boardId: 14, boardName: '자료', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
  ],
  inquiry: [
    { boardId: 21, boardName: '문의사항', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
  ],
  recruit: [
    { boardId: 31, boardName: '모집', boardType: 'RECRUIT', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
  ],
}

const writerCopy = {
  community: {
    label: '게시판',
    title: '게시글 쓰기',
    placeholder: '본문을 Markdown으로 작성하세요.',
  },
  info: {
    label: '정보공유',
    title: '정보공유 쓰기',
    placeholder: '공유할 소식, 대회, 연구실, 자료 내용을 Markdown으로 작성하세요.',
  },
  inquiry: {
    label: '문의사항',
    title: '문의사항 쓰기',
    placeholder: '문의 내용을 Markdown으로 작성하세요.',
  },
  recruit: {
    label: '모집',
    title: '모집 글쓰기',
    placeholder: '역할, 기간, 모집 인원, 마감일을 Markdown으로 작성하세요.',
  },
}

const highlightCommand: ICommand = {
  name: 'highlight',
  keyCommand: 'highlight',
  buttonProps: { 'aria-label': '형광펜' },
  icon: <span className="pw-md-command-text">형광</span>,
  execute: (state, api) => {
    const selectedText = state.selectedText || '형광펜'
    const prefix = '<mark>'
    const suffix = '</mark>'
    api.replaceSelection(`${prefix}${selectedText}${suffix}`)
    api.setSelectionRange({
      start: state.selection.start + prefix.length,
      end: state.selection.start + prefix.length + selectedText.length,
    })
  },
}

const markdownCommands: ICommand[] = [
  commands.bold,
  commands.italic,
  commands.strikethrough,
  highlightCommand,
  commands.divider,
  commands.title1,
  commands.title2,
  commands.title3,
  commands.divider,
  commands.link,
  commands.quote,
  commands.code,
  commands.codeBlock,
  commands.divider,
  commands.unorderedListCommand,
  commands.orderedListCommand,
  commands.checkedListCommand,
  commands.table,
]

const markdownExtraCommands: ICommand[] = [
  commands.codeEdit,
  commands.codeLive,
  commands.codePreview,
  commands.fullscreen,
]

export function PostWriterPage({ onClose, writerType = 'community' }: PostWriterPageProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [showPreview, setShowPreview] = useState(true)
  const [boards, setBoards] = useState<BoardData[]>(fallbackBoardsByType[writerType])
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(fallbackBoardsByType[writerType][0]?.boardId ?? null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  useEffect(() => {
    const dirty = Boolean(title.trim()) || Boolean(content.trim())
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [content, title])

  useEffect(() => {
    const fallbackBoards = fallbackBoardsByType[writerType]
    setBoards(fallbackBoards)
    setSelectedBoardId(fallbackBoards[0]?.boardId ?? null)

    boardsApi.getBoards(true).then((list) => {
      const preferredBoards =
        writerType === 'recruit'
          ? list.filter((board) => board.boardType === 'RECRUIT')
          : list.filter((board) => board.boardType === 'NORMAL')

      const nextBoards = preferredBoards.length > 0 ? preferredBoards : fallbackBoards
      setBoards(nextBoards)
      setSelectedBoardId(nextBoards[0]?.boardId ?? null)
    }).catch(() => {})
  }, [writerType])

  const tags = useMemo(
    () => tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tagsInput],
  )

  const handleCopyMarkdown = async () => {
    const fallbackCopy = () => {
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        setCopyState('copied')
      } catch {
        setCopyState('error')
      }
      document.body.removeChild(textarea)
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(content)
        setCopyState('copied')
      } else {
        fallbackCopy()
      }
    } catch {
      setCopyState('error')
    }

    setTimeout(() => setCopyState('idle'), 2000)
  }

  const titleOverLimit = title.length > TITLE_MAX
  const contentOverLimit = content.length > CONTENT_MAX
  const copy = writerCopy[writerType]

  const handlePublish = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle) {
      setPublishError('제목을 입력해주세요.')
      return
    }

    if (titleOverLimit) {
      setPublishError(`제목은 ${TITLE_MAX}자 이하로 입력해주세요.`)
      return
    }

    if (!trimmedContent) {
      setPublishError('내용을 입력해주세요.')
      return
    }

    if (contentOverLimit) {
      setPublishError(`내용은 ${CONTENT_MAX}자 이하로 입력해주세요.`)
      return
    }

    if (!selectedBoardId) {
      setPublishError('게시판을 선택해주세요.')
      return
    }

    setIsPublishing(true)
    setPublishError(null)
    try {
      await postsApi.createPost(selectedBoardId, { title: trimmedTitle, content: trimmedContent })
      onClose()
    } catch {
      setPublishError('게시글 발행에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      const formEl = event.currentTarget.closest('form') as HTMLFormElement | null
      formEl?.requestSubmit()
    }
  }

  return (
    <section className="coala-content coala-content--post-writer coala-content--velog-writer">
      <form className="post-writer-layout post-writer-layout--velog" onSubmit={handlePublish}>
        <article className="post-writer post-writer--velog">
          <header className="velog-writer-topbar">
            <div className="velog-writer-type">
              <p className="post-writer-label">{copy.label}</p>
              {boards.length > 0 && (
                <label className="velog-select-field">
                  <span>분류</span>
                  <select
                    className="velog-select"
                    value={selectedBoardId ?? ''}
                    onChange={(e) => setSelectedBoardId(Number(e.target.value))}
                  >
                    {boards.map((b) => (
                      <option key={b.boardId} value={b.boardId}>
                        {b.boardName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="post-writer-actions velog-writer-actions">
              <button
                type="button"
                className={showPreview ? 'ghost-button' : 'ghost-button ghost-button--active'}
                aria-pressed={!showPreview}
                onClick={() => setShowPreview((value) => !value)}
              >
                <Icon name="eye" size={15} />
                {showPreview ? '미리보기 끄기' : '미리보기 켜기'}
              </button>
              <button
                type="button"
                className={copyState === 'copied' ? 'ghost-button ghost-button--success' : 'ghost-button'}
                onClick={handleCopyMarkdown}
              >
                <Icon name="copy" size={15} />
                {copyState === 'copied' ? '복사됨' : copyState === 'error' ? '복사 실패' : '마크다운 복사'}
              </button>
              <button type="button" className="ghost-button" onClick={onClose}>
                나가기
              </button>
            </div>
          </header>

          <div className="post-writer-fields velog-writer-fields">
            {publishError && <p className="auth-error">{publishError}</p>}

            <label className="velog-title-field">
              <input
                className="velog-title-input"
                type="text"
                value={title}
                placeholder={writerType === 'info' ? '정보공유 제목' : '제목을 입력하세요'}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX + 20}
                aria-label="게시글 제목"
                aria-invalid={titleOverLimit}
              />
              <span
                className={`pw-counter${titleOverLimit ? ' pw-counter--over' : ''}`}
                aria-live="polite"
              >
                {title.length} / {TITLE_MAX}
              </span>
            </label>

            <label className="velog-tag-field">
              <input
                className="velog-tag-input"
                type="text"
                value={tagsInput}
                placeholder="태그를 입력하세요. 쉼표로 구분됩니다."
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </label>

            {tags.length > 0 && (
              <div className="post-writer-taglist" aria-label="입력된 태그">
                {tags.map((tag) => (
                  <span key={tag} className="post-tag">#{tag}</span>
                ))}
              </div>
            )}

            <div className="pw-editor-wrap velog-editor-wrap" data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(value) => setContent(value ?? '')}
                height="calc(100vh - 330px)"
                minHeight={420}
                preview={showPreview ? 'live' : 'edit'}
                visibleDragbar={false}
                commands={markdownCommands}
                extraCommands={markdownExtraCommands}
                textareaProps={{
                  placeholder: copy.placeholder,
                  'aria-label': '게시글 본문 입력',
                  onKeyDown: handleEditorKeyDown,
                }}
              />
            </div>
          </div>

          <footer className="velog-writer-footer" aria-live="polite">
            <div>
              <span className={`pw-counter${contentOverLimit ? ' pw-counter--over' : ''}`}>
                {content.length} / {CONTENT_MAX}자
              </span>
              <span className="pw-shortcut-hint">
                <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd>
              </span>
            </div>
            <button type="submit" className="write-post-button velog-publish-button" disabled={isPublishing}>
              <Icon name="plus" size={16} />
              {isPublishing ? '발행 중...' : '발행하기'}
            </button>
          </footer>
        </article>
      </form>
    </section>
  )
}
