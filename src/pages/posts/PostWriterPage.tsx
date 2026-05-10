import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  ClipboardEvent,
  CSSProperties,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import { isAxiosError } from 'axios'
import MDEditor, { commands, type ICommand } from '@uiw/react-md-editor/nohighlight'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { attachmentsApi } from '../../shared/api/attachments'
import { postsApi } from '../../shared/api/posts'
import { useAuth } from '../../shared/auth/AuthContext'
import { Icon } from '../../shared/ui/Icon'
import { copyMarkdown } from '../../shared/markdown'
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
  resolveCommunityBoardFilter,
  resolveInfoBoardFilter,
} from '../../shared/communityBoards'
import { infoApi, type InfoFilterId } from '../../shared/api/info'

const TITLE_MAX = 100
const CONTENT_MAX = 5000

type PostWriterPageProps = {
  onClose: () => void
  writerType?: 'community' | 'info' | 'inquiry' | 'recruit'
  editPostId?: string
}

const nowIso = new Date().toISOString()
const noticeWriterRoles = new Set(['STAFF', 'SUPER_ADMIN'])

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

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError<{ message?: string; errorCode?: string }>(error)) return fallback

  const message = error.response?.data?.message
  if (message) return message

  if (error.response?.status === 401) return '로그인 후 다시 시도해주세요.'
  if (error.response?.status === 403) return '게시글 작성 권한이 없습니다.'
  if (error.response?.status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'

  return fallback
}

function parseCompositeId(compositeId: string): { boardId: number; postId: number } | null {
  const parts = compositeId.split('-')
  if (parts.length < 2) return null
  const boardId = Number(parts[0])
  const postId = Number(parts[1])
  if (Number.isNaN(boardId) || Number.isNaN(postId)) return null
  return { boardId, postId }
}

export function PostWriterPage({ onClose, writerType = 'community', editPostId }: PostWriterPageProps) {
  const { user } = useAuth()
  const editorRootRef = useRef<HTMLDivElement | null>(null)
  const canWriteNotice = noticeWriterRoles.has(user?.role ?? '')
  const getWritableBoards = (list: BoardData[]) => (
    writerType === 'community' && !canWriteNotice
      ? list.filter((board) => resolveCommunityBoardFilter(board) !== 'notice')
      : list
  )
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [imageError, setImageError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const editorWrapRef = useRef<HTMLDivElement | null>(null)
  const [editorSplitPercent, setEditorSplitPercent] = useState(50)
  const [isResizingEditor, setIsResizingEditor] = useState(false)
  const [boards, setBoards] = useState<BoardData[]>(getWritableBoards(fallbackBoardsByType[writerType]))
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(getWritableBoards(fallbackBoardsByType[writerType])[0]?.boardId ?? null)
  const [attachmentIds, setAttachmentIds] = useState<number[]>([])
  const [thumbnailAttachmentId, setThumbnailAttachmentId] = useState<number | null>(null)
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

  const updateEditorSplit = (clientX: number) => {
    const rect = editorWrapRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0) return

    const nextPercent = ((clientX - rect.left) / rect.width) * 100
    setEditorSplitPercent(Math.min(72, Math.max(28, nextPercent)))
  }

  useEffect(() => {
    if (!isResizingEditor) return undefined

    const handlePointerMove = (event: PointerEvent) => updateEditorSplit(event.clientX)
    const stopResizing = () => setIsResizingEditor(false)

    document.body.classList.add('is-editor-resizing')
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResizing)
    window.addEventListener('pointercancel', stopResizing)

    return () => {
      document.body.classList.remove('is-editor-resizing')
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopResizing)
      window.removeEventListener('pointercancel', stopResizing)
    }
  }, [isResizingEditor])

  useEffect(() => {
    const fallbackBoards = getWritableBoards(fallbackBoardsByType[writerType])
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

      const nextBoards = getWritableBoards(preferredBoards.length > 0 ? preferredBoards : fallbackBoards)
      setBoards(nextBoards)
      setSelectedBoardId(nextBoards[0]?.boardId ?? null)
    }).catch(() => {})
  }, [canWriteNotice, writerType])

  useEffect(() => {
    if (!editPostId) {
      setTitle('')
      setContent('')
      setTagsInput('')
      setAttachmentIds([])
      setThumbnailAttachmentId(null)
      return
    }

    const parsed = parseCompositeId(editPostId)
    if (parsed) {
      postsApi.getPostDetail(parsed.boardId, parsed.postId).then((post) => {
        setTitle(post.title)
        setContent(post.content)
        setTagsInput(post.boardName ?? '')
        setSelectedBoardId(post.boardId)
      }).catch(() => {
        setPublishError('수정할 게시글을 불러오지 못했습니다.')
      })
      return
    }

    const infoArticleId = Number(editPostId)
    if (writerType === 'info' && Number.isFinite(infoArticleId)) {
      infoApi.getArticle(infoArticleId).then((article) => {
        setTitle(article.title)
        setContent(article.content)
        setTagsInput(article.tag)
      }).catch(() => {})
    }
  }, [editPostId, writerType])

  const tags = useMemo(
    () => tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tagsInput],
  )
  const imageUploadCommand = useMemo(
    () => createMarkdownImageCommand({
      uploadImage: async (file) => {
        const uploaded = await attachmentsApi.uploadImage(file)
        setAttachmentIds((current) => [...new Set([...current, uploaded.attachmentId])])
        setThumbnailAttachmentId((current) => current ?? uploaded.attachmentId)
        return uploaded.url
      },
      onError: setImageError,
      getTextArea: () => editorRootRef.current?.querySelector<HTMLTextAreaElement>('.w-md-editor-text-input') ?? null,
    }),
    [],
  )
  const markdownCommands = useMemo(
    () => [
      ...baseMarkdownCommands.slice(0, 10),
      imageUploadCommand,
      ...baseMarkdownCommands.slice(10),
    ],
    [imageUploadCommand],
  )

  const handleCopyMarkdown = async () => {
    setCopyState(await copyMarkdown(content) ? 'copied' : 'error')
    setTimeout(() => setCopyState('idle'), 2000)
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
      const markdown = await readMarkdownImagesFromClipboard(event, {
        uploadImage: async (file) => {
          const uploaded = await attachmentsApi.uploadImage(file)
          setAttachmentIds((current) => [...new Set([...current, uploaded.attachmentId])])
          setThumbnailAttachmentId((current) => current ?? uploaded.attachmentId)
          return uploaded.url
        },
        onError: setImageError,
      })
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
      const markdown = await readMarkdownImagesFromDrop(event, {
        uploadImage: async (file) => {
          const uploaded = await attachmentsApi.uploadImage(file)
          setAttachmentIds((current) => [...new Set([...current, uploaded.attachmentId])])
          setThumbnailAttachmentId((current) => current ?? uploaded.attachmentId)
          return uploaded.url
        },
        onError: setImageError,
      })
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
      if (writerType === 'info') {
        const selectedBoard = boards.find((board) => board.boardId === selectedBoardId)
        const filter = (selectedBoard ? resolveInfoBoardFilter(selectedBoard) : null) ?? 'news'
        const payload = {
          filter: filter as InfoFilterId,
          tag: tags[0] ?? selectedBoard?.boardName ?? '소식',
          title: trimmedTitle,
          meta: tagsInput.trim() || selectedBoard?.boardName || '정보공유',
          sourceName: '코알라',
          sourceDate: new Date().toISOString().slice(0, 10),
          content: trimmedContent,
          imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
        }
        if (editPostId && Number.isFinite(Number(editPostId))) {
          await infoApi.updateArticle(Number(editPostId), payload)
        } else {
          await infoApi.createArticle(payload)
        }
      } else if (editPostId) {
        const parsed = parseCompositeId(editPostId)
        if (parsed) {
          await postsApi.updatePost(parsed.postId, {
            title: trimmedTitle,
            content: trimmedContent,
            attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
            thumbnailAttachmentId: thumbnailAttachmentId ?? undefined,
          })
        } else {
          throw new Error('invalid post id')
        }
      } else {
        await postsApi.createPost(selectedBoardId, {
          title: trimmedTitle,
          content: trimmedContent,
          attachmentIds,
          thumbnailAttachmentId,
        })
      }
      onClose()
    } catch (error) {
      if (editPostId) {
        setPublishError(getApiErrorMessage(error, '게시글 수정 권한이 없거나 저장에 실패했습니다.'))
        return
      }
      setPublishError(getApiErrorMessage(error, '게시글 발행에 실패했습니다. 다시 시도해주세요.'))
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

  const handleEditorResizePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    updateEditorSplit(event.clientX)
    setIsResizingEditor(true)
  }

  return (
    <section className="coala-content coala-content--post-writer coala-content--velog-writer">
      <form className="post-writer-layout post-writer-layout--velog" onSubmit={handlePublish}>
        <article className="post-writer post-writer--velog">
          <header className="velog-writer-topbar">
            <div className="velog-writer-type">
              <p className="post-writer-label">{copy.title}</p>
              <span className="velog-writer-context">{copy.label}</span>
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
            {boards.length > 0 && (
              <section className="velog-board-picker" aria-label={`${copy.label} 선택`}>
                <div className="velog-board-picker-head">
                  <span>{copy.label} 선택</span>
                </div>
                <div className="velog-board-options" role="radiogroup" aria-label={`${copy.label} 분류`}>
                  {boards.map((board) => (
                    <button
                      key={board.boardId}
                      type="button"
                      role="radio"
                      aria-checked={selectedBoardId === board.boardId}
                      className={selectedBoardId === board.boardId ? 'velog-board-option is-active' : 'velog-board-option'}
                      onClick={() => setSelectedBoardId(board.boardId)}
                    >
                      <span>{board.boardName}</span>
                      <small>{board.description || `${copy.label} 게시글`}</small>
                    </button>
                  ))}
                </div>
              </section>
            )}

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

            <div
              ref={(node) => {
                editorRootRef.current = node
                editorWrapRef.current = node
              }}
              className={isResizingEditor ? 'pw-editor-wrap velog-editor-wrap is-resizing' : 'pw-editor-wrap velog-editor-wrap'}
              style={{ '--editor-edit-width': `${editorSplitPercent}%` } as CSSProperties}
              data-color-mode="light"
            >
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
              {showPreview && (
                <button
                  type="button"
                  className="velog-editor-resizer"
                  style={{ left: `${editorSplitPercent}%` }}
                  aria-label="마크다운 미리보기 너비 조절"
                  onPointerDown={handleEditorResizePointerDown}
                >
                  <span />
                </button>
              )}
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
