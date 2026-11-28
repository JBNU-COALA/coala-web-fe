import { TagInput } from '../../shared/ui/TagInput'
import { RichPostEditor } from '../../shared/ui/RichPostEditor'
import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  ChangeEvent,
  FormEvent,
} from 'react'
import { isAxiosError } from 'axios'
import '@uiw/react-markdown-preview/markdown.css'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { attachmentsApi } from '../../shared/api/attachments'
import { resolveApiAssetUrl } from '../../shared/api/client'
import { postsApi } from '../../shared/api/posts'
import { useAuth } from '../../shared/auth/AuthContext'
import { Icon } from '../../shared/ui/Icon'
import { SafeImage } from '../../shared/ui/SafeImage'
import { WriterCategoryPicker } from './WriterCategoryPicker'
import './postWriter.css'
import { CommunityBanner } from '../community/CommunityBanner'
import { extractFirstMarkdownImageUrl, prepareMarkdownForDisplay } from '../../shared/markdown'
import {
  getMarkdownLengthWithoutInlineImageData,
  prepareMarkdownImageFile,
} from '../../shared/markdownImages'
import {
  isAnonymousBoard,
  isCommunityBoard,
  parsePostRouteKey,
  parseRouteId,
  resolveCommunityBoardFilter,
} from '../../shared/communityBoards'
import { infoApi, type InfoFilterId } from '../../shared/api/info'
import { useRequestScope } from '../../useRequestScope'
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner'
import posthog, { isPostHogConfigured } from '../../posthog'

const TITLE_MAX = 100
const CONTENT_MAX = 5000

type PostWriterPageProps = {
  onClose: (nextPost?: { boardId?: number; postId: number }) => void
  writerType?: 'community' | 'info' | 'inquiry' | 'recruit' | 'qna'
  editPostId?: string
}

const noticeWriterRoles = new Set(['STAFF', 'SUPER_ADMIN'])

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
  qna: {
    label: '질문게시판',
    title: '질문 올리기',
    placeholder: '개발, 진로, 연구실, 대학원 등 궁금한 점을 자유롭게 적어주세요. 익명으로 게시됩니다.',
  },
}

const infoFilterLabelById: Record<InfoFilterId, string> = {
  news: '소식',
  contest: '대회',
  lab: '연구실',
  resource: '자료',
}
const infoCategoryLabels = new Set(Object.values(infoFilterLabelById))

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError<{ message?: string; errorCode?: string }>(error)) return fallback

  const message = error.response?.data?.message
  if (message) return message

  if (error.response?.status === 401) return '로그인 후 다시 시도해주세요.'
  if (error.response?.status === 403) return '게시글 작성 권한이 없습니다.'
  if (error.response?.status === 413) return '첨부 이미지나 본문 용량이 너무 큽니다. 이미지를 줄인 뒤 다시 시도해주세요.'
  if (error.response?.status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'

  return fallback
}

function hasInlineBase64Image(markdown: string) {
  return /!\[[^\]]*]\(\s*data:image\//i.test(markdown) || /<img\b[^>]*\bsrc=(["'])data:image\//i.test(markdown)
}

function parseCompositeId(compositeId: string): { boardId: number; postId: number } | null {
  const parsed = parsePostRouteKey(compositeId)
  return parsed && parsed.boardId > 0 && parsed.postId > 0 ? parsed : null
}

function getAttachmentIdFromUrl(value?: string | null) {
  const match = value?.match(/\/(?:api|media)\/attachments\/(\d+)\/download\b/)
  return match ? Number(match[1]) : null
}

function getAttachmentIdsFromText(value: string) {
  return Array.from(value.matchAll(/\/(?:api|media)\/attachments\/(\d+)\/download\b/g))
    .map((match) => Number(match[1]))
    .filter((id) => Number.isFinite(id) && id > 0)
}

function uniqueIds(ids: Array<number | null | undefined>) {
  return [...new Set(ids.filter((id): id is number => typeof id === 'number' && Number.isFinite(id) && id > 0))]
}

export function PostWriterPage(props: PostWriterPageProps) {
  const { user } = useAuth()
  return <PostWriterSession key={JSON.stringify([props.writerType ?? 'community', props.editPostId ?? null, user?.id ?? null])} {...props} />
}

function PostWriterSession({ onClose, writerType = 'community', editPostId }: PostWriterPageProps) {
  const { user } = useAuth()
  const [infoAuthorName] = useState(() => user?.nickname?.trim() || user?.name || '코알라')
  const captureScope = useRequestScope()
  const publishing = useRef(false)
  const pendingUploads = useRef(0)
  const [uploadCount, setUploadCount] = useState(0)
  const canWriteNotice = noticeWriterRoles.has(user?.role ?? '')
  const getWritableBoards = useCallback((list: BoardData[]) => (
    writerType === 'community' && !canWriteNotice
      ? list.filter((board) => resolveCommunityBoardFilter(board) !== 'notice')
      : list
  ), [canWriteNotice, writerType])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [imageError, setImageError] = useState<string | null>(null)
  const [boards, setBoards] = useState<BoardData[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
  const [infoEditFilter, setInfoEditFilter] = useState<InfoFilterId | null>(null)
  const [infoSourceName, setInfoSourceName] = useState(infoAuthorName)
  const [infoSourceDate, setInfoSourceDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [infoImageUrl, setInfoImageUrl] = useState('')
  const [infoImageAttachmentId, setInfoImageAttachmentId] = useState<number | null>(null)
  const [attachmentIds, setAttachmentIds] = useState<number[]>([])
  const [thumbnailAttachmentId, setThumbnailAttachmentId] = useState<number | null>(null)
  const [isUploadingInfoImage, setIsUploadingInfoImage] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const isEditMode = editPostId !== undefined
  const validEditId = !isEditMode || Boolean(writerType === 'info' ? parseRouteId(editPostId) : parseCompositeId(editPostId))
  const [isEditLoading, setIsEditLoading] = useState(isEditMode && validEditId)
  const [loadError, setLoadError] = useState<string | null>(validEditId ? null : '올바르지 않은 게시글 주소입니다.')
  const [isBoardsLoading, setIsBoardsLoading] = useState(writerType !== 'info')
  const [boardError, setBoardError] = useState<string | null>(null)
  const [boardRevision, setBoardRevision] = useState(0)

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
    if (writerType === 'info') return
    let active = true
    setIsBoardsLoading(true)
    setBoardError(null)
    boardsApi.getBoards(true).then((list) => {
      if (!active) return
      const preferredBoards =
        writerType === 'recruit'
          ? list.filter((board) => board.boardType === 'RECRUIT')
          : writerType === 'qna'
            ? list.filter(isAnonymousBoard)
            : writerType === 'community'
                ? list.filter(isCommunityBoard)
                : list.filter((board) => board.boardType === 'NORMAL' && board.boardName === '문의사항')

      const nextBoards = getWritableBoards(preferredBoards)
      setBoards(nextBoards)
      setSelectedBoardId((current) => current ?? (isEditMode ? null : nextBoards[0]?.boardId ?? null))
      setBoardError(nextBoards.length ? null : '작성 가능한 게시판이 없습니다.')
    }).catch(() => {
      if (!active) return
      setBoards([])
      setSelectedBoardId(null)
      setBoardError('게시판 정보를 불러오지 못했습니다.')
    }).finally(() => {
      if (active) setIsBoardsLoading(false)
    })
    return () => { active = false }
  }, [getWritableBoards, isEditMode, writerType, boardRevision])

  useEffect(() => {
    if (!editPostId || !validEditId) return
    const isCurrent = captureScope()
    const parsed = writerType === 'info' ? null : parseCompositeId(editPostId)
    if (parsed) {
      postsApi.getPostDetail(parsed.boardId, parsed.postId).then((post) => {
        if (!isCurrent()) return
        setTitle(post.title)
        setContent(prepareMarkdownForDisplay(post.content))
        setTagsInput(post.boardName ?? '')
        setSelectedBoardId(post.boardId)
        setAttachmentIds(uniqueIds([...getAttachmentIdsFromText(post.content), post.thumbnailAttachmentId]))
        setThumbnailAttachmentId(post.thumbnailAttachmentId ?? null)
        setInfoImageUrl('')
        setInfoImageAttachmentId(null)
      }).catch(() => {
        if (isCurrent()) setLoadError('수정할 게시글을 불러오지 못했습니다.')
      }).finally(() => {
        if (isCurrent()) setIsEditLoading(false)
      })
      return
    }

    const infoArticleId = parseRouteId(editPostId)
    if (writerType === 'info' && infoArticleId) {
      infoApi.getArticle(infoArticleId).then((article) => {
        if (!isCurrent()) return
        setTitle(article.title)
        const displayContent = prepareMarkdownForDisplay(article.content)
        setContent(displayContent)
        setTagsInput(article.meta || article.tag)
        setInfoEditFilter(article.filter)
        setInfoSourceName(article.authorName || article.sourceName || infoAuthorName)
        setInfoSourceDate(article.sourceDate || new Date().toISOString().slice(0, 10))
        const imageAttachmentId = getAttachmentIdFromUrl(article.imageUrl)
        const nextAttachmentIds = uniqueIds([
          ...(article.attachmentIds ?? []),
          ...getAttachmentIdsFromText(displayContent),
          imageAttachmentId,
        ])
        setAttachmentIds(nextAttachmentIds)
        setThumbnailAttachmentId(article.thumbnailAttachmentId ?? imageAttachmentId ?? nextAttachmentIds[0] ?? null)
        setInfoImageUrl(article.imageUrl || extractFirstMarkdownImageUrl(displayContent) || '')
        setInfoImageAttachmentId(article.thumbnailAttachmentId ?? imageAttachmentId ?? null)
      }).catch(() => {
        if (isCurrent()) setLoadError('수정할 게시글을 불러오지 못했습니다.')
      }).finally(() => {
        if (isCurrent()) setIsEditLoading(false)
      })
    }
  }, [captureScope, editPostId, infoAuthorName, validEditId, writerType])

  const uploadEditorImage = useCallback(async (file: File) => {
    const isCurrent = captureScope()
    if (publishing.current) throw new Error('저장이 끝난 뒤 이미지를 첨부해주세요.')
    pendingUploads.current += 1
    setUploadCount(pendingUploads.current)
    try {
      const uploaded = await attachmentsApi.uploadImage(file)
      if (!isCurrent()) throw new Error('종료된 편집 화면입니다.')
      setAttachmentIds((current) => [...new Set([...current, uploaded.attachmentId])])
      setThumbnailAttachmentId((current) => current ?? uploaded.attachmentId)
      if (writerType === 'info') {
        setInfoImageUrl((current) => current || uploaded.url)
        setInfoImageAttachmentId((current) => current ?? uploaded.attachmentId)
      }
      return uploaded.url
    } finally {
      pendingUploads.current -= 1
      if (isCurrent()) setUploadCount(pendingUploads.current)
    }
  }, [captureScope, writerType])
  const handleInfoImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || publishing.current || isUploadingInfoImage) return
    const isCurrent = captureScope()
    pendingUploads.current += 1
    setUploadCount(pendingUploads.current)

    setIsUploadingInfoImage(true)
    setImageError(null)
    try {
      const uploadFile = await prepareMarkdownImageFile(file)
      if (!isCurrent()) return
      const uploaded = await attachmentsApi.uploadImage(uploadFile)
      if (!isCurrent()) return
      setInfoImageUrl(uploaded.url)
      setInfoImageAttachmentId(uploaded.attachmentId)
      setAttachmentIds((current) => uniqueIds([...current, uploaded.attachmentId]))
      setThumbnailAttachmentId(uploaded.attachmentId)
    } catch (error) {
      if (isCurrent()) setImageError(error instanceof Error ? error.message : '이미지를 첨부하지 못했습니다.')
    } finally {
      pendingUploads.current -= 1
      if (isCurrent()) {
        setUploadCount(pendingUploads.current)
        setIsUploadingInfoImage(false)
      }
    }
  }

  const clearInfoImage = () => {
    const removedAttachmentId = infoImageAttachmentId ?? getAttachmentIdFromUrl(infoImageUrl)
    setInfoImageUrl('')
    setInfoImageAttachmentId(null)
    if (removedAttachmentId) {
      setAttachmentIds((current) => current.filter((id) => id !== removedAttachmentId))
      setThumbnailAttachmentId((current) => (current === removedAttachmentId ? null : current))
    }
  }

  const titleOverLimit = title.length > TITLE_MAX
  const contentLength = getMarkdownLengthWithoutInlineImageData(content)
  const contentOverLimit = contentLength > CONTENT_MAX
  const copy = writerCopy[writerType]

  const handlePublish = async (event: FormEvent) => {
    event.preventDefault()
    if (publishing.current || pendingUploads.current > 0 || isEditLoading || isBoardsLoading || loadError || boardError) return
    const isCurrent = captureScope()
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

    if (hasInlineBase64Image(trimmedContent)) {
      setPublishError('이미지는 본문에 base64로 넣지 말고 이미지 첨부 버튼이나 붙여넣기로 업로드해주세요.')
      return
    }

    if (writerType !== 'info' && !boards.some((board) => board.boardId === selectedBoardId)) {
      setPublishError('게시판을 선택해주세요.')
      return
    }

    publishing.current = true
    setIsPublishing(true)
    setPublishError(null)
    try {
      if (writerType === 'info') {
        const filter = infoEditFilter ?? 'news'
        const categoryLabel = infoFilterLabelById[filter]
        const imageUrl = infoImageUrl.trim() || extractFirstMarkdownImageUrl(trimmedContent) || ''
        const trimmedMeta = tagsInput.trim()
        const meta = !trimmedMeta || infoCategoryLabels.has(trimmedMeta) ? categoryLabel : trimmedMeta
        const nextAttachmentIds = uniqueIds([
          ...attachmentIds,
          ...getAttachmentIdsFromText(trimmedContent),
          getAttachmentIdFromUrl(imageUrl),
          infoImageAttachmentId,
        ])
        const nextThumbnailAttachmentId =
          thumbnailAttachmentId
          ?? infoImageAttachmentId
          ?? getAttachmentIdFromUrl(imageUrl)
          ?? nextAttachmentIds[0]
          ?? null
        const payload = {
          filter: filter as InfoFilterId,
          tag: categoryLabel,
          title: trimmedTitle,
          meta,
          sourceName: infoSourceName,
          sourceDate: infoSourceDate,
          content: trimmedContent,
          imageUrl,
          attachmentIds: nextAttachmentIds,
          thumbnailAttachmentId: nextThumbnailAttachmentId,
        }
        if (editPostId) {
          const updatedArticle = await infoApi.updateArticle(Number(editPostId), payload)
          if (isPostHogConfigured) posthog.capture('post_updated', { post_type: writerType, has_attachments: nextAttachmentIds.length > 0 })
          if (isCurrent()) onClose({ postId: updatedArticle.id })
          return
        } else {
          const createdArticle = await infoApi.createArticle(payload)
          if (isPostHogConfigured) posthog.capture('post_published', { post_type: writerType, has_attachments: nextAttachmentIds.length > 0 })
          if (isCurrent()) onClose({ postId: createdArticle.id })
          return
        }
      } else if (editPostId) {
        const parsed = parseCompositeId(editPostId)
        if (parsed) {
          await postsApi.updatePost(parsed.postId, {
            boardId: selectedBoardId!,
            title: trimmedTitle,
            content: trimmedContent,
            attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
            thumbnailAttachmentId: thumbnailAttachmentId ?? undefined,
          })
          if (isPostHogConfigured) posthog.capture('post_updated', { post_type: writerType, has_attachments: attachmentIds.length > 0 })
          if (isCurrent()) onClose({ boardId: selectedBoardId!, postId: parsed.postId })
          return
        } else {
          throw new Error('invalid post id')
        }
      } else {
        await postsApi.createPost(selectedBoardId!, {
          title: trimmedTitle,
          content: trimmedContent,
          attachmentIds,
          thumbnailAttachmentId,
        })
        if (isPostHogConfigured) {
          posthog.capture('post_published', { post_type: writerType, has_attachments: attachmentIds.length > 0 })
        }
      }
      if (isCurrent()) onClose()
    } catch (error) {
      if (!isCurrent()) return
      if (editPostId) {
        setPublishError(getApiErrorMessage(error, '게시글 수정 권한이 없거나 저장에 실패했습니다.'))
        return
      }
      setPublishError(getApiErrorMessage(error, '게시글 발행에 실패했습니다. 다시 시도해주세요.'))
    } finally {
      publishing.current = false
      if (isCurrent()) setIsPublishing(false)
    }
  }

  return (
    <section className="coala-content coala-content--post-writer coala-content--velog-writer post-writer-has-banner">
      <CommunityBanner
        title={writerType === 'info' ? '정보공유' : writerType === 'qna' ? '질문게시판' : '게시판'}
        tone={writerType === 'info' ? 'info' : 'board'}
        description={writerType === 'info' ? '대회 · 연구실 · 학습 자료까지, 함께 보면 좋은 정보를 공유해요.' : writerType === 'qna' ? '개발, 진로, 연구실, 대학원 등 궁금한 점이 있다면 자유롭게 질문해주세요!' : '코알라 멤버들의 자유로운 소통 공간'}
      />
      <form className="post-writer-layout post-writer-layout--velog" onSubmit={handlePublish}>
        <article className="post-writer post-writer--velog">
          {isEditLoading && <LoadingSpinner label="게시글을 불러오는 중..." />}
          {loadError && <p className="auth-error" role="alert">{loadError}</p>}
          <fieldset className="post-writer-fields velog-writer-fields" disabled={isPublishing || isEditLoading || Boolean(loadError)} style={{ border: 0, margin: 0, minWidth: 0 }}>
            {publishError && <p className="auth-error">{publishError}</p>}
            {imageError && <p className="auth-error">{imageError}</p>}

            <label className="velog-title-field">
              <input
                className="velog-title-input"
                type="text"
                value={title}
                placeholder="제목"
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX + 20}
                aria-label="게시글 제목"
                aria-invalid={titleOverLimit}
              />
            </label>

            <div className="info-writer-details">
              {writerType === 'info' || boards.length > 1 ? <>
              <div className="info-writer-detail-row"><span className="info-writer-detail-label">분류</span><div className="info-writer-category-field">
              {writerType === 'info' ? <WriterCategoryPicker label="정보공유 분류" value={infoEditFilter ?? 'news'}
                options={Object.entries(infoFilterLabelById).map(([value, label]) => ({ value, label }))}
                disabled={isPublishing || isEditLoading} onChange={(value) => setInfoEditFilter(value as InfoFilterId)} /> : <WriterCategoryPicker label={`${copy.label} 선택`} value={String(selectedBoardId ?? '')} options={boards.map((board) => ({ value: String(board.boardId), label: board.boardName }))} disabled={isPublishing || isEditLoading || isBoardsLoading || boards.length < 2} onChange={(value) => setSelectedBoardId(Number(value))} />}
              </div><span className="info-writer-detail-label">작성일</span><span className="info-writer-detail-value">{infoSourceDate}</span></div>
              <div className="info-writer-detail-row info-writer-detail-row--author"><span className="info-writer-detail-label">작성자</span><span className="info-writer-detail-value">{infoSourceName}</span></div>
              </> : <div className="info-writer-detail-row">
                <span className="info-writer-detail-label">작성자</span><span className="info-writer-detail-value">{infoSourceName}</span>
                <span className="info-writer-detail-label">작성일</span><span className="info-writer-detail-value">{infoSourceDate}</span>
              </div>}
              <div className="info-writer-detail-row info-writer-detail-row--author"><span className="info-writer-detail-label">태그</span><TagInput value={tagsInput} onChange={setTagsInput} /></div>
            </div>

            <div
              className="pw-editor-wrap velog-editor-wrap"
              data-color-mode="light"
            >
              <RichPostEditor value={content} onChange={setContent} disabled={isPublishing || isEditLoading || Boolean(loadError)} uploadImage={uploadEditorImage} onError={setImageError} />
              <div className="writer-body-counter" aria-live="polite"><span className={`pw-counter${contentOverLimit ? ' pw-counter--over' : ''}`}>{contentLength} / {CONTENT_MAX}자</span></div>
            </div>
              <section className="info-writer-image-field" aria-label="대표 이미지">
                <div className="info-writer-image-copy"><strong>대표 이미지</strong><span>목록과 상세 상단에 표시됩니다.</span></div>
                <div className="info-writer-image-tiles">
                  <label className="info-writer-upload-tile">
                    <Icon name="plus" size={24} />
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="대표 이미지 첨부" onChange={handleInfoImageChange} disabled={isUploadingInfoImage} />
                  </label>
                  {infoImageUrl && <div className="info-writer-image-preview" key={infoImageUrl}>
                    <SafeImage src={resolveApiAssetUrl(infoImageUrl)} alt="대표 이미지" fallback={<span className="info-writer-image-unavailable">이미지를 불러올 수 없습니다</span>} />
                    <button type="button" className="info-writer-image-remove" aria-label="대표 이미지 제거" onClick={clearInfoImage} disabled={isUploadingInfoImage}><Icon name="close" size={12} /></button>
                  </div>}
                </div>
              </section>

          </fieldset>

          {boardError && <div className="writer-board-notice" role="status">
            <span>글은 계속 작성할 수 있습니다. 등록하려면 게시판 연결을 다시 확인해주세요.</span>
            <button type="button" onClick={() => setBoardRevision((value) => value + 1)}>다시 연결</button>
          </div>}
          <footer className="velog-writer-footer" aria-live="polite">
            <button type="button" className="ghost-button writer-cancel-button" disabled={isPublishing} onClick={() => onClose()}>취소</button>
            <button type="submit" className="write-post-button velog-publish-button" disabled={isPublishing || isEditLoading || isBoardsLoading || uploadCount > 0 || Boolean(loadError || boardError)}>
              {isPublishing ? (isEditMode ? '저장 중...' : '작성 중...') : (isEditMode ? '저장하기' : '작성하기')}
            </button>
          </footer>
        </article>
      </form>
    </section>
  )
}
