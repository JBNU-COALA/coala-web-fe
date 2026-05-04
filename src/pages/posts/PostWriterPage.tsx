import { useEffect, useMemo, useState, type ClipboardEvent, type DragEvent, type FormEvent, type KeyboardEvent } from 'react'
import MDEditor, { commands, type ICommand } from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { postsApi } from '../../shared/api/posts'
import { Icon } from '../../shared/ui/Icon'
import { copyMarkdown, downloadMarkdown, toMarkdownFilename } from '../../shared/markdown'
import {
  createMarkdownImageCommand,
  getMarkdownLengthWithoutInlineImageData,
  insertMarkdownBlockAtRange,
  readMarkdownImagesFromClipboard,
  readMarkdownImagesFromDrop,
} from '../../shared/markdownImages'
import {
  fallbackCommunityBoardIds,
  fallbackInfoBoardIds,
  fallbackRecruitBoardId,
  isCommunityBoard,
  isInfoBoard,
} from '../../shared/communityBoards'
import { resourceCards } from '../info/infoData'
import { communityPosts, postCategoryMeta, postDetailContentById, type PostDetailContent } from './postsData'

const TITLE_MAX = 100
const CONTENT_MAX = 12000

type PostWriterPageProps = {
  onClose: () => void
  writerType?: 'community' | 'info' | 'inquiry' | 'recruit'
  editPostId?: string
}

const nowIso = new Date().toISOString()

const fallbackBoardsByType: Record<NonNullable<PostWriterPageProps['writerType']>, BoardData[]> = {
  community: [
    { boardId: fallbackCommunityBoardIds.notice, boardName: '공지', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
    { boardId: fallbackCommunityBoardIds.free, boardName: '자유', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
    { boardId: fallbackCommunityBoardIds.humor, boardName: '유머', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
  ],
  info: [
    { boardId: fallbackInfoBoardIds.news, boardName: '소식', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
    { boardId: fallbackInfoBoardIds.contest, boardName: '대회', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
    { boardId: fallbackInfoBoardIds.lab, boardName: '연구실', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
    { boardId: fallbackInfoBoardIds.resource, boardName: '자료', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
  ],
  inquiry: [
    { boardId: 21, boardName: '문의사항', boardType: 'NORMAL', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
  ],
  recruit: [
    { boardId: fallbackRecruitBoardId, boardName: '모집', boardType: 'RECRUIT', description: '', isActive: true, createdAt: nowIso, updatedAt: nowIso },
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

const baseMarkdownCommands: ICommand[] = [
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
  commands.image,
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

const LOCAL_POST_EDIT_STORAGE_KEY = 'coala-local-post-edits'

type LocalPostEdit = {
  title: string
  content: string
  tagsInput: string
  boardId: number | null
  writerType: NonNullable<PostWriterPageProps['writerType']>
  updatedAt: string
}

function parseCompositeId(compositeId: string): { boardId: number; postId: number } | null {
  const parts = compositeId.split('-')
  if (parts.length < 2) return null
  const boardId = Number(parts[0])
  const postId = Number(parts[1])
  if (Number.isNaN(boardId) || Number.isNaN(postId)) return null
  return { boardId, postId }
}

function markdownFromDetail(detail?: PostDetailContent) {
  if (!detail) return ''

  return detail.content.map((block) => {
    if (block.type === 'heading') return `## ${block.text}`
    if (block.type === 'quote') return `> ${block.text}`
    if (block.type === 'code') return `\`\`\`${block.language}\n${block.code}\n\`\`\``
    if (block.type === 'list') return block.items.map((item) => `- ${item}`).join('\n')
    return block.text
  }).join('\n\n')
}

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

function saveLocalPostEdit(key: string, edit: LocalPostEdit) {
  const edits = loadLocalPostEdits()
  edits[key] = edit
  window.localStorage.setItem(LOCAL_POST_EDIT_STORAGE_KEY, JSON.stringify(edits))
}

export function PostWriterPage({ onClose, writerType = 'community', editPostId }: PostWriterPageProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [imageError, setImageError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [boards, setBoards] = useState<BoardData[]>(fallbackBoardsByType[writerType])
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(fallbackBoardsByType[writerType][0]?.boardId ?? null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const isEditMode = Boolean(editPostId)

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
          : writerType === 'info'
            ? list.filter(isInfoBoard)
            : writerType === 'community'
              ? list.filter(isCommunityBoard)
              : list.filter((board) => board.boardType === 'NORMAL')

      const nextBoards = preferredBoards.length > 0 ? preferredBoards : fallbackBoards
      setBoards(nextBoards)
      setSelectedBoardId(nextBoards[0]?.boardId ?? null)
    }).catch(() => {})
  }, [writerType])

  useEffect(() => {
    if (!editPostId) {
      setTitle('')
      setContent('')
      setTagsInput('')
      return
    }

    const stored = loadLocalPostEdits()[editPostId]
    if (stored) {
      setTitle(stored.title)
      setContent(stored.content)
      setTagsInput(stored.tagsInput)
      setSelectedBoardId(stored.boardId)
      return
    }

    const parsed = parseCompositeId(editPostId)
    if (parsed) {
      const fallbackKey = `post-${String(parsed.postId).padStart(3, '0')}`
      const fallbackPost = communityPosts.find((post) => post.id === fallbackKey)
      const fallbackDetail = postDetailContentById[fallbackKey]

      if (fallbackPost) {
        setTitle(fallbackPost.title)
        setContent(markdownFromDetail(fallbackDetail) || fallbackPost.excerpt)
        setTagsInput(fallbackDetail?.tags.join(', ') ?? postCategoryMeta[fallbackPost.category].label)
        setSelectedBoardId(parsed.boardId)
      }

      postsApi.getPostDetail(parsed.boardId, parsed.postId).then((post) => {
        setTitle(post.title)
        setContent(post.content)
        setTagsInput(post.boardName ?? '')
        setSelectedBoardId(post.boardId)
      }).catch(() => {})
      return
    }

    const infoItem = resourceCards.find((item) => String(item.id) === editPostId)
    if (infoItem) {
      setTitle(infoItem.title)
      setContent(infoItem.content)
      setTagsInput(infoItem.tag)
    }
  }, [editPostId])

  const tags = useMemo(
    () => tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tagsInput],
  )
  const imageUploadCommand = useMemo(
    () => createMarkdownImageCommand({ onError: setImageError }),
    [],
  )
  const markdownCommands = useMemo(
    () => [
      ...baseMarkdownCommands.slice(0, 11),
      imageUploadCommand,
      ...baseMarkdownCommands.slice(11),
    ],
    [imageUploadCommand],
  )

  const handleCopyMarkdown = async () => {
    setCopyState(await copyMarkdown(content) ? 'copied' : 'error')
    setTimeout(() => setCopyState('idle'), 2000)
  }

  const handleDownloadMarkdown = () => {
    downloadMarkdown(toMarkdownFilename(title, writerType), content)
  }

  const insertImagesIntoEditor = (textarea: HTMLTextAreaElement, markdown: string) => {
    const result = insertMarkdownBlockAtRange(
      textarea.value,
      markdown,
      textarea.selectionStart,
      textarea.selectionEnd,
    )
    setContent(result.value)
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
    if (Array.from(event.dataTransfer.items).some((item) => item.type.startsWith('image/'))) {
      event.preventDefault()
    }
  }

  const titleOverLimit = title.length > TITLE_MAX
  const contentLength = getMarkdownLengthWithoutInlineImageData(content)
  const contentOverLimit = contentLength > CONTENT_MAX
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
      if (editPostId) {
        const parsed = parseCompositeId(editPostId)
        if (parsed) {
          await postsApi.updatePost(parsed.postId, { title: trimmedTitle, content: trimmedContent })
        }

        saveLocalPostEdit(editPostId, {
          title: trimmedTitle,
          content: trimmedContent,
          tagsInput,
          boardId: selectedBoardId,
          writerType,
          updatedAt: new Date().toISOString(),
        })
      } else {
        await postsApi.createPost(selectedBoardId, { title: trimmedTitle, content: trimmedContent })
      }
      onClose()
    } catch {
      if (editPostId) {
        saveLocalPostEdit(editPostId, {
          title: trimmedTitle,
          content: trimmedContent,
          tagsInput,
          boardId: selectedBoardId,
          writerType,
          updatedAt: new Date().toISOString(),
        })
        onClose()
        return
      }
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
              <button type="button" className="ghost-button" onClick={handleDownloadMarkdown}>
                <Icon name="file" size={15} />
                .md 추출
              </button>
              <button type="button" className="ghost-button" onClick={onClose}>
                나가기
              </button>
            </div>
          </header>

          <div className="post-writer-fields velog-writer-fields">
            {publishError && <p className="auth-error">{publishError}</p>}
            {imageError && <p className="auth-error">{imageError}</p>}

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
                  onPaste: handleEditorPaste,
                  onDrop: handleEditorDrop,
                  onDragOver: handleEditorDragOver,
                }}
              />
            </div>
          </div>

          <footer className="velog-writer-footer" aria-live="polite">
            <div>
              <span className={`pw-counter${contentOverLimit ? ' pw-counter--over' : ''}`}>
                {contentLength} / {CONTENT_MAX}자
              </span>
              <span className="pw-shortcut-hint">
                <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd>
              </span>
            </div>
            <button type="submit" className="write-post-button velog-publish-button" disabled={isPublishing}>
              <Icon name="plus" size={16} />
              {isPublishing ? (isEditMode ? '저장 중...' : '발행 중...') : (isEditMode ? '저장하기' : '발행하기')}
            </button>
          </footer>
        </article>
      </form>
    </section>
  )
}
