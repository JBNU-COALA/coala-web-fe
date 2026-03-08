import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TurndownService from 'turndown'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { postsApi } from '../../shared/api/posts'
import { Icon } from '../../shared/ui/Icon'

type PostWriterPageProps = {
  onClose: () => void
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

export function PostWriterPage({ onClose }: PostWriterPageProps) {
  const [title, setTitle] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [boards, setBoards] = useState<BoardData[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: `<h2>안녕하세요!</h2><p>여기에 글을 자유롭게 작성해보세요.</p>`,
    editorProps: {
      attributes: {
        class: 'pw-editor-area',
      },
    },
  })

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

  const handlePublish = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedBoardId) {
      setPublishError('게시판을 선택해주세요.')
      return
    }
    setIsPublishing(true)
    setPublishError(null)
    try {
      const content = editor?.getHTML() ?? ''
      await postsApi.createPost(selectedBoardId, { title, content })
      onClose()
    } catch {
      setPublishError('게시글 발행에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsPublishing(false)
    }
  }

  if (!editor) return null

  return (
    <section className="coala-content coala-content--post-writer">
      <form className="surface-card post-writer" onSubmit={handlePublish}>
        <header className="post-writer-header">
          <div>
            <p className="post-writer-label">새 글 작성</p>
            <h2 className="post-writer-title">커뮤니티 글쓰기</h2>
          </div>

          <div className="post-writer-actions">
            <button
              type="button"
              className={copyState === 'copied' ? 'ghost-button ghost-button--success' : 'ghost-button'}
              onClick={handleCopyMarkdown}
            >
              <Icon name="copy" size={15} />
              {copyState === 'copied' ? '복사됨' : copyState === 'error' ? '복사 실패' : '마크다운으로 복사'}
            </button>
            <button type="button" className="ghost-button" onClick={onClose}>
              나가기
            </button>
            <button type="submit" className="write-post-button" disabled={isPublishing}>
              <Icon name="plus" size={16} />
              {isPublishing ? '발행 중...' : '발행하기'}
            </button>
          </div>
        </header>

        <div className="post-writer-fields">
          {boards.length > 0 && (
            <select
              className="post-writer-input"
              value={selectedBoardId ?? ''}
              onChange={(e) => setSelectedBoardId(Number(e.target.value))}
            >
              {boards.map((b) => (
                <option key={b.boardId} value={b.boardId}>
                  {b.boardName}
                </option>
              ))}
            </select>
          )}
          {publishError && <p className="auth-error">{publishError}</p>}

          <input
            className="post-writer-input post-writer-title-input"
            type="text"
            value={title}
            placeholder="제목을 입력하세요"
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="post-writer-input"
            type="text"
            value={tagsInput}
            placeholder="태그 (쉼표로 구분)"
            onChange={(e) => setTagsInput(e.target.value)}
          />
          {tags.length > 0 && (
            <div className="post-writer-taglist">
              {tags.map((tag) => (
                <span key={tag} className="post-tag">#{tag}</span>
              ))}
            </div>
          )}

          <div className="pw-editor-wrap">
            <div className="pw-toolbar">
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
            <EditorContent editor={editor} className="pw-editor-content" />
          </div>
        </div>
      </form>
    </section>
  )
}
