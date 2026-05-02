import { useCallback, useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TurndownService from 'turndown'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { postsApi } from '../../shared/api/posts'
import { Icon } from '../../shared/ui/Icon'

const TITLE_MAX = 100
const CONTENT_MAX = 5000

type PostWriterPageProps = {
  onClose: () => void
  writerType?: 'community' | 'info' | 'inquiry' | 'recruit'
}

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })

const ToolbarButton = ({
  onClick,
  active,
  label,
}: {
  onClick: () => void
  active?: boolean
  label: string
}) => (
  <button
    type="button"
    className={`pw-toolbar-btn${active ? ' pw-toolbar-btn--active' : ''}`}
    onClick={onClick}
  >
    {label}
  </button>
)

const writerCopy = {
  community: {
    label: 'Community Composer',
    title: '커뮤니티 글쓰기',
    subtitle: '게시판을 먼저 정하고, 제목과 본문을 작성한 뒤 우측 체크리스트에서 발행 조건을 확인합니다.',
    placeholder: '무엇을 공유하거나 질문하나요?',
  },
  info: {
    label: 'Info Share Composer',
    title: '정보공유 글쓰기',
    subtitle: '외부 개발자료, 스터디 자료, 동아리 운영 정보를 구분해 정리합니다.',
    placeholder: '어떤 자료나 정보를 공유하나요?',
  },
  inquiry: {
    label: 'Inquiry Composer',
    title: '문의사항 글쓰기',
    subtitle: '문의 목적과 필요한 조치가 드러나도록 제목과 본문을 작성합니다.',
    placeholder: '어떤 도움이 필요한가요?',
  },
  recruit: {
    label: 'Recruit Composer',
    title: '모집 글쓰기',
    subtitle: '역할, 기간, 모집 인원, 마감일을 명확히 작성합니다.',
    placeholder: '어떤 활동의 팀원을 모집하나요?',
  },
}

export function PostWriterPage({ onClose, writerType = 'community' }: PostWriterPageProps) {
  const [title, setTitle] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [boards, setBoards] = useState<BoardData[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'pw-editor-area',
        'aria-label': '게시글 본문 입력',
      },
    },
  })

  // 미발행 변경사항 보호: 새로고침/창닫기 경고
  useEffect(() => {
    const dirty = () => Boolean(title.trim()) || Boolean(editor?.getText().trim())
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty()) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [editor, title])

  useEffect(() => {
    boardsApi.getBoards(true).then((list) => {
      setBoards(list)
      if (list.length > 0) setSelectedBoardId(list[0].boardId)
    }).catch(() => {})
  }, [])

  const tags = useMemo(
    () => tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tagsInput],
  )

  const getMarkdown = useCallback(() => {
    if (!editor) return ''
    return turndown.turndown(editor.getHTML())
  }, [editor])

  const handleCopyMarkdown = async () => {
    const markdown = getMarkdown()
    const fallbackCopy = () => {
      const textarea = document.createElement('textarea')
      textarea.value = markdown
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
        await navigator.clipboard.writeText(markdown)
        setCopyState('copied')
      } else {
        fallbackCopy()
      }
    } catch {
      setCopyState('error')
    }

    setTimeout(() => setCopyState('idle'), 2000)
  }

  const plainTextLength = editor?.getText().length ?? 0
  const titleOverLimit = title.length > TITLE_MAX
  const contentOverLimit = plainTextLength > CONTENT_MAX
  const selectedBoard = boards.find((board) => board.boardId === selectedBoardId)
  const copy = writerCopy[writerType]
  const writerChecks = [
    { label: '게시판 선택', done: Boolean(selectedBoardId) },
    { label: '제목 입력', done: Boolean(title.trim()) && !titleOverLimit },
    { label: '본문 작성', done: Boolean(editor?.getText().trim()) && !contentOverLimit },
    { label: '태그 정리', done: tags.length > 0 },
  ]

  const handlePublish = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const content = editor?.getHTML() ?? ''

    if (!trimmedTitle) {
      setPublishError('제목을 입력해주세요.')
      return
    }

    if (titleOverLimit) {
      setPublishError(`제목은 ${TITLE_MAX}자 이하로 입력해주세요.`)
      return
    }

    if (!editor?.getText().trim()) {
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
      await postsApi.createPost(selectedBoardId, { title: trimmedTitle, content })
      onClose()
    } catch {
      setPublishError('게시글 발행에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Ctrl/Cmd + Enter 발행 단축키
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      const formEl = (event.currentTarget.closest('form') as HTMLFormElement | null)
      formEl?.requestSubmit()
    }
  }

  if (!editor) return null

  return (
    <section className="coala-content coala-content--post-writer">
      <form className="post-writer-layout" onSubmit={handlePublish}>
        <article className="surface-card post-writer">
          <header className="post-writer-header">
            <div>
              <p className="post-writer-label">{copy.label}</p>
              <h2 className="post-writer-title">{copy.title}</h2>
              <p className="post-writer-subtitle">{copy.subtitle}</p>
            </div>

            <div className="post-writer-actions">
              <button
                type="button"
                className={copyState === 'copied' ? 'ghost-button ghost-button--success' : 'ghost-button'}
                onClick={handleCopyMarkdown}
              >
                <Icon name="copy" size={15} />
                {copyState === 'copied' ? '복사됨' : copyState === 'error' ? '복사 실패' : '마크다운'}
              </button>
              <button type="button" className="ghost-button" onClick={onClose}>
                나가기
              </button>
            </div>
          </header>

          <div className="post-writer-fields">
            <div className="post-writer-meta-grid">
              {boards.length > 0 && (
                <label className="post-writer-field">
                  <span>게시판</span>
                  <select
                    className="post-writer-input"
                    value={selectedBoardId ?? ''}
                    onChange={(e) => setSelectedBoardId(Number(e.target.value))}
                  >
                    {boards.map((b) => (
                      <option key={b.boardId} value={b.boardId}>
                        {b.boardName} ({b.boardType})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="post-writer-field">
                <span>태그</span>
                <input
                  className="post-writer-input"
                  type="text"
                  value={tagsInput}
                  placeholder="예: react, project, qna"
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </label>
            </div>

            {publishError && <p className="auth-error">{publishError}</p>}

            <label className="post-writer-field post-writer-field--title">
              <span>제목</span>
              <div className="post-writer-title-wrap">
                <input
                  className="post-writer-input post-writer-title-input"
                  type="text"
                  value={title}
                  placeholder={copy.placeholder}
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
              </div>
            </label>

            {tags.length > 0 && (
              <div className="post-writer-taglist" aria-label="입력된 태그">
                {tags.map((tag) => (
                  <span key={tag} className="post-tag">#{tag}</span>
                ))}
              </div>
            )}

            <div className="pw-editor-wrap">
              <div className="pw-toolbar" aria-label="본문 서식 도구">
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} label="H1" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="H2" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="H3" />
                <span className="pw-toolbar-divider" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="B" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="I" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} label="S" />
                <span className="pw-toolbar-divider" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="• 목록" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="1. 목록" />
                <span className="pw-toolbar-divider" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} label="인용" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} label="코드" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} label="코드블록" />
                <span className="pw-toolbar-divider" />
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} label="↩" />
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} label="↪" />
              </div>
              <EditorContent
                editor={editor}
                className="pw-editor-content"
                onKeyDown={handleEditorKeyDown}
              />
              <div className="pw-editor-footer" aria-live="polite">
                <span className={`pw-counter${contentOverLimit ? ' pw-counter--over' : ''}`}>
                  {plainTextLength} / {CONTENT_MAX}자
                </span>
                <span className="pw-shortcut-hint">
                  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> 로 빠르게 발행
                </span>
              </div>
            </div>
          </div>
        </article>

        <aside className="surface-card post-writer-side" aria-label="발행 설정">
          <div className="post-writer-side-head">
            <p className="post-writer-label">Publish</p>
            <h3>발행 전 확인</h3>
            <p>
              GitHub Discussions와 포럼형 커뮤니티처럼 카테고리, 제목, 본문을 먼저
              확정한 뒤 발행합니다.
            </p>
          </div>

          <dl className="post-writer-summary">
            <div>
              <dt>게시판</dt>
              <dd>{selectedBoard?.boardName ?? '선택 대기'}</dd>
            </div>
            <div>
              <dt>태그</dt>
              <dd>{tags.length > 0 ? `${tags.length}개` : '선택 사항'}</dd>
            </div>
          </dl>

          <ul className="post-writer-checklist">
            {writerChecks.map((check) => (
              <li key={check.label} className={check.done ? 'is-done' : ''}>
                <span>{check.done ? '✓' : ''}</span>
                {check.label}
              </li>
            ))}
          </ul>

          <div className="post-writer-guide">
            <strong>작성 팁</strong>
            <p>질문은 재현 상황과 기대 결과를, 모집은 역할과 마감일을 앞부분에 적으면 읽기 쉽습니다.</p>
          </div>

          <button type="submit" className="write-post-button write-post-button--wide" disabled={isPublishing}>
            <Icon name="plus" size={16} />
            {isPublishing ? '발행 중...' : '발행하기'}
          </button>
        </aside>
      </form>
    </section>
  )
}
