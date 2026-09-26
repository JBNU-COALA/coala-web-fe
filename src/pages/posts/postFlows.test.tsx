// @vitest-environment jsdom
import { StrictMode, type ComponentProps } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type MDEditor from '@uiw/react-md-editor/nohighlight'
import { postsApi, type PostDetail } from '../../shared/api/posts'
import { boardsApi, type BoardData } from '../../shared/api/boards'
import { infoApi, type InfoArticle } from '../../shared/api/info'
import { attachmentsApi } from '../../shared/api/attachments'
import { PostDetailPage } from './PostDetailPage'
import { PostWriterPage } from './PostWriterPage'

const auth = vi.hoisted(() => ({
  isLoggedIn: true,
  user: { id: 1, name: 'Author', nickname: 'Writer', role: 'USER' },
}))
vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../../shared/api/posts', () => ({ postsApi: {
  getPostDetail: vi.fn(), getComments: vi.fn(), createPost: vi.fn(), updatePost: vi.fn(),
  deletePost: vi.fn(), createComment: vi.fn(), createReply: vi.fn(),
  updateComment: vi.fn(), deleteComment: vi.fn(), likePost: vi.fn(),
} }))
vi.mock('../../shared/api/boards', () => ({ boardsApi: { getBoards: vi.fn() } }))
vi.mock('../../shared/api/info', () => ({ infoApi: {
  getArticle: vi.fn(), createArticle: vi.fn(), updateArticle: vi.fn(),
} }))
vi.mock('../../shared/api/attachments', () => ({ attachmentsApi: { uploadImage: vi.fn() } }))
vi.mock('@uiw/react-md-editor/nohighlight', () => {
  function Editor({ value, onChange, textareaProps, commands }: ComponentProps<typeof MDEditor>) {
    const upload = commands?.find((command) => command?.name === 'image-upload')
    return <>
      <textarea aria-label={textareaProps?.['aria-label']} placeholder={textareaProps?.placeholder}
        onKeyDown={textareaProps?.onKeyDown} onPaste={textareaProps?.onPaste}
        onDrop={textareaProps?.onDrop} onDragOver={textareaProps?.onDragOver}
        className="w-md-editor-text-input" value={value}
        onChange={(event) => onChange?.(event.target.value)} />
      <button type="button" aria-label="이미지 첨부" onClick={() => upload?.execute?.({} as never, {
        replaceSelection: (text: string) => onChange?.(`${value}${text}`),
      } as never)}>Upload</button>
    </>
  }
  Editor.Markdown = ({ source }: { source: string }) => <div>{source}</div>
  return { default: Editor, commands: { image: {} } }
})

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const post = (postId: number, boardId = 1): PostDetail => ({
  postId, boardId, boardName: 'free', userId: 1, title: `Post ${postId}`,
  content: `Body ${postId}`, viewCount: 0, status: 'ACTIVE',
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
})
const board = (boardId: number, boardName: string): BoardData => ({
  boardId, boardName, boardType: 'NORMAL', description: '', isActive: true,
  createdAt: '', updatedAt: '',
})
const article = (id: number): InfoArticle => ({
  id, title: `Article ${id}`, content: `Article body ${id}`, filter: 'news', tag: 'news',
  meta: '', source: '', sourceName: '', sourceDate: '2026-01-01', imageUrl: '',
  viewCount: 0, bookmarkCount: 0,
})
const detailProps = { onBack: vi.fn(), onWrite: vi.fn(), onEdit: vi.fn() }
const titleInput = () => screen.getByRole<HTMLInputElement>('textbox', { name: '게시글 제목' })
const contentInput = () => screen.getByRole<HTMLTextAreaElement>('textbox', { name: '게시글 본문 입력' })
const submit = () => fireEvent.submit(titleInput().closest('form')!)

beforeEach(() => {
  vi.resetAllMocks()
  auth.user = { id: 1, name: 'Author', nickname: 'Writer', role: 'USER' }
  vi.mocked(boardsApi.getBoards).mockResolvedValue([board(1, 'free'), board(2, 'humor')])
  vi.mocked(postsApi.getComments).mockResolvedValue([])
  vi.mocked(postsApi.getPostDetail).mockImplementation((_boardId, id) => Promise.resolve(post(id)))
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('post detail request boundaries', () => {
  it.each(['invalid', '0-2', '1-0', '1-2-extra', 'Infinity-1', '1-2.5'])('rejects invalid route %s without fetching', (postId) => {
    render(<PostDetailPage {...detailProps} postId={postId} />)
    expect(screen.getByText('올바르지 않은 게시글 주소입니다.')).toBeTruthy()
    expect(postsApi.getPostDetail).not.toHaveBeenCalled()
    expect(postsApi.getComments).not.toHaveBeenCalled()
  })

  it('ignores late loads and resets comment drafts on route changes', async () => {
    const old = deferred<PostDetail>()
    vi.mocked(postsApi.getPostDetail).mockReturnValueOnce(old.promise)
    const view = render(<PostDetailPage {...detailProps} postId="1-1" />)
    view.rerender(<PostDetailPage {...detailProps} postId="1-2" />)
    await screen.findByRole('heading', { name: 'Post 2' })
    await act(async () => old.resolve(post(1)))
    expect(screen.queryByRole('heading', { name: 'Post 1' })).toBeNull()
    fireEvent.change(screen.getByPlaceholderText('댓글을 입력하세요.'), { target: { value: 'Old draft' } })
    view.rerender(<PostDetailPage {...detailProps} postId="1-3" />)
    expect(screen.getByText('게시글을 불러오는 중...')).toBeTruthy()
    await screen.findByRole('heading', { name: 'Post 3' })
    expect(screen.getByPlaceholderText<HTMLInputElement>('댓글을 입력하세요.').value).toBe('')
  })

  it('does not navigate back when deletion finishes on a different post', async () => {
    const deletion = deferred<Awaited<ReturnType<typeof postsApi.deletePost>>>()
    vi.mocked(postsApi.deletePost).mockReturnValue(deletion.promise)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const view = render(<PostDetailPage {...detailProps} postId="1-1" />)
    await screen.findByRole('heading', { name: 'Post 1' })
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    expect(postsApi.deletePost).toHaveBeenCalledTimes(1)
    view.rerender(<PostDetailPage {...detailProps} postId="1-2" />)
    await act(async () => deletion.resolve({} as Awaited<ReturnType<typeof postsApi.deletePost>>))
    expect(detailProps.onBack).not.toHaveBeenCalled()
    await screen.findByRole('heading', { name: 'Post 2' })
  })

  it('preserves text typed while a comment is being submitted', async () => {
    const creation = deferred<Awaited<ReturnType<typeof postsApi.createComment>>>()
    vi.mocked(postsApi.createComment).mockReturnValue(creation.promise)
    render(<PostDetailPage {...detailProps} postId="1-1" />)
    await screen.findByRole('heading', { name: 'Post 1' })
    const input = screen.getByPlaceholderText<HTMLInputElement>('댓글을 입력하세요.')
    fireEvent.change(input, { target: { value: 'First comment' } })
    fireEvent.submit(input.closest('form')!)
    fireEvent.submit(input.closest('form')!)
    expect(postsApi.createComment).toHaveBeenCalledTimes(1)
    fireEvent.change(input, { target: { value: 'Next draft' } })
    await act(async () => creation.resolve({ commentId: 1, content: 'First comment', createdAt: '' }))
    expect(input.value).toBe('Next draft')
    expect(screen.getByText('First comment')).toBeTruthy()
  })

  it('recovers from a failed detail load when another route is opened', async () => {
    vi.mocked(postsApi.getPostDetail).mockRejectedValueOnce(new Error('offline'))
    const view = render(<PostDetailPage {...detailProps} postId="1-1" />)
    await screen.findByText('게시글을 찾을 수 없습니다.')
    view.rerender(<PostDetailPage {...detailProps} postId="1-2" />)
    await screen.findByRole('heading', { name: 'Post 2' })
    expect(screen.queryByText('게시글을 찾을 수 없습니다.')).toBeNull()
  })
})

describe('writer draft and request boundaries', () => {
  it.each(['USER', 'STAFF', 'SUPER_ADMIN'])('uses stable category keys for renamed boards and notice permissions for %s', async (role) => {
    auth.user = { ...auth.user, role }
    vi.mocked(boardsApi.getBoards).mockResolvedValue([
      { ...board(1, 'General discussion'), categoryKey: 'free' },
      { ...board(2, 'Announcements'), categoryKey: 'notice' },
      { ...board(3, 'free resources'), categoryKey: 'resource' },
      { ...board(4, '문의사항'), categoryKey: null },
    ])
    render(<PostWriterPage onClose={vi.fn()} />)
    await screen.findByRole('radio', { name: /General discussion/ })
    expect(Boolean(screen.queryByRole('radio', { name: /Announcements/ }))).toBe(role !== 'USER')
    expect(screen.queryByRole('radio', { name: /free resources/ })).toBeNull()
    expect(screen.queryByRole('radio', { name: /문의사항/ })).toBeNull()
  })

  it('ignores an edit response after switching to a new draft', async () => {
    const loading = deferred<PostDetail>()
    vi.mocked(postsApi.getPostDetail).mockReturnValue(loading.promise)
    const onClose = vi.fn()
    const view = render(<PostWriterPage onClose={onClose} editPostId="1-1" />)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: '저장하기' }).disabled).toBe(true)
    view.rerender(<PostWriterPage onClose={onClose} />)
    fireEvent.change(titleInput(), { target: { value: 'New draft' } })
    await act(async () => loading.resolve(post(1)))
    expect(titleInput().value).toBe('New draft')
    expect(contentInput().value).toBe('')
  })

  it('does not reset or reload an edited draft when the author profile changes', async () => {
    const onClose = vi.fn()
    const view = render(<PostWriterPage onClose={onClose} editPostId="1-1" />)
    await waitFor(() => expect(titleInput().value).toBe('Post 1'))
    fireEvent.change(titleInput(), { target: { value: 'Unsaved edit' } })
    auth.user = { ...auth.user, nickname: 'Renamed' }
    view.rerender(<PostWriterPage onClose={onClose} editPostId="1-1" />)
    expect(titleInput().value).toBe('Unsaved edit')
    expect(postsApi.getPostDetail).toHaveBeenCalledTimes(1)
  })

  it('preserves the original board when the board list arrives last', async () => {
    const boards = deferred<BoardData[]>()
    vi.mocked(boardsApi.getBoards).mockReturnValue(boards.promise)
    vi.mocked(postsApi.getPostDetail).mockResolvedValue(post(1, 2))
    render(<PostWriterPage onClose={vi.fn()} editPostId="2-1" />)
    await waitFor(() => expect(titleInput().value).toBe('Post 1'))
    await act(async () => boards.resolve([board(1, 'free'), board(2, 'humor')]))
    expect(screen.getByRole('radio', { name: /humor/ }).getAttribute('aria-checked')).toBe('true')
  })

  it('does not silently move an edit into the first writable board', async () => {
    vi.mocked(postsApi.getPostDetail).mockResolvedValue(post(1, 3))
    render(<PostWriterPage onClose={vi.fn()} editPostId="3-1" />)
    await waitFor(() => expect(titleInput().value).toBe('Post 1'))
    submit()
    expect(postsApi.updatePost).not.toHaveBeenCalled()
    expect(screen.getByText('게시판을 선택해주세요.')).toBeTruthy()
  })

  it.each(['', '0', '-1', '1-2', '1.5', 'Infinity'])('blocks invalid info edit %s instead of creating an article', (editPostId) => {
    render(<PostWriterPage onClose={vi.fn()} writerType="info" editPostId={editPostId} />)
    expect(screen.getByRole('alert').textContent).toBe('올바르지 않은 게시글 주소입니다.')
    submit()
    expect(infoApi.getArticle).not.toHaveBeenCalled()
    expect(infoApi.createArticle).not.toHaveBeenCalled()
    expect(postsApi.getPostDetail).not.toHaveBeenCalled()
  })

  it('shows failed info edit loads and blocks saves', async () => {
    vi.mocked(infoApi.getArticle).mockRejectedValue(new Error('offline'))
    render(<PostWriterPage onClose={vi.fn()} writerType="info" editPostId="1" />)
    await screen.findByRole('alert')
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole<HTMLButtonElement>('button', { name: '저장하기' }).disabled).toBe(true)
    submit()
    expect(infoApi.updateArticle).not.toHaveBeenCalled()
  })

  it('retains drafts on save failure and permits retry without duplicate requests', async () => {
    const saving = deferred<Awaited<ReturnType<typeof postsApi.createPost>>>()
    vi.mocked(postsApi.createPost).mockReturnValueOnce(saving.promise).mockResolvedValueOnce({ postId: 2, title: 'Draft', content: 'Body' })
    const onClose = vi.fn()
    render(<PostWriterPage onClose={onClose} />)
    await screen.findByRole('radio', { name: /free/ })
    fireEvent.change(titleInput(), { target: { value: 'Draft' } })
    fireEvent.change(contentInput(), { target: { value: 'Body' } })
    submit()
    submit()
    expect(postsApi.createPost).toHaveBeenCalledTimes(1)
    await act(async () => saving.reject(new Error('offline')))
    expect(titleInput().value).toBe('Draft')
    expect(contentInput().value).toBe('Body')
    expect(onClose).not.toHaveBeenCalled()
    submit()
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('does not close the new editor when an older save finishes', async () => {
    const saving = deferred<Awaited<ReturnType<typeof postsApi.updatePost>>>()
    vi.mocked(postsApi.updatePost).mockReturnValue(saving.promise)
    const onClose = vi.fn()
    const view = render(<PostWriterPage onClose={onClose} editPostId="1-1" />)
    await waitFor(() => expect(titleInput().value).toBe('Post 1'))
    submit()
    expect(postsApi.updatePost).toHaveBeenCalledTimes(1)
    view.rerender(<PostWriterPage onClose={onClose} writerType="info" />)
    fireEvent.change(titleInput(), { target: { value: 'Fresh info' } })
    await act(async () => saving.resolve({ postId: 1, boardId: 1, title: 'Post 1', content: 'Body 1', updatedAt: '' }))
    expect(onClose).not.toHaveBeenCalled()
    expect(titleInput().value).toBe('Fresh info')
  })

  it('keeps existing attachments when an edited post adds another image', async () => {
    vi.mocked(postsApi.getPostDetail).mockResolvedValue({ ...post(1), content: '![old](/media/attachments/7/download)', thumbnailAttachmentId: 7 })
    vi.mocked(attachmentsApi.uploadImage).mockResolvedValue({ attachmentId: 8, url: '/media/attachments/8/download' } as Awaited<ReturnType<typeof attachmentsApi.uploadImage>>)
    render(<PostWriterPage onClose={vi.fn()} editPostId="1-1" />)
    await waitFor(() => expect(titleInput().value).toBe('Post 1'))
    fireEvent.paste(contentInput(), { clipboardData: { files: [new File(['image'], 'image.png', { type: 'image/png' })] } })
    await waitFor(() => expect(contentInput().value).toContain('/media/attachments/8/download'))
    submit()
    expect(postsApi.updatePost).toHaveBeenCalledWith(1, expect.objectContaining({ attachmentIds: [7, 8], thumbnailAttachmentId: 7 }))
  })

  it('does not insert a late upload into a new draft', async () => {
    const uploading = deferred<Awaited<ReturnType<typeof attachmentsApi.uploadImage>>>()
    vi.mocked(attachmentsApi.uploadImage).mockReturnValue(uploading.promise)
    const onClose = vi.fn()
    const view = render(<PostWriterPage onClose={onClose} />)
    await screen.findByRole('radio', { name: /free/ })
    fireEvent.paste(contentInput(), { clipboardData: { files: [new File(['image'], 'image.png', { type: 'image/png' })] } })
    await waitFor(() => expect(attachmentsApi.uploadImage).toHaveBeenCalledTimes(1))
    expect(screen.getByRole<HTMLButtonElement>('button', { name: '발행하기' }).disabled).toBe(true)
    view.rerender(<PostWriterPage onClose={onClose} writerType="info" />)
    fireEvent.change(contentInput(), { target: { value: 'Fresh body' } })
    await act(async () => uploading.resolve({ attachmentId: 8, url: '/media/attachments/8/download' } as Awaited<ReturnType<typeof attachmentsApi.uploadImage>>))
    expect(contentInput().value).toBe('Fresh body')
    expect(screen.queryByText('종료된 편집 화면입니다.')).toBeNull()
  })

  it('opens the toolbar file picker only on execution and cancels a selection from an old editor', async () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const onClose = vi.fn()
    const view = render(<PostWriterPage onClose={onClose} />)
    await screen.findByRole('radio', { name: /free/ })
    expect(click).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '이미지 첨부' }))
    expect(click).toHaveBeenCalledTimes(1)
    const picker = click.mock.contexts[0] as HTMLInputElement
    expect(picker.type).toBe('file')
    view.rerender(<PostWriterPage onClose={onClose} writerType="info" />)
    await act(async () => {
      fireEvent.change(picker, { target: { files: [new File(['image'], 'image.png', { type: 'image/png' })] } })
    })
    expect(attachmentsApi.uploadImage).not.toHaveBeenCalled()
    expect(contentInput().value).toBe('')
  })

  it('discards the first StrictMode load after its effect cleanup', async () => {
    const stale = deferred<InfoArticle>()
    vi.mocked(infoApi.getArticle).mockReturnValueOnce(stale.promise).mockResolvedValueOnce(article(1))
    render(<StrictMode><PostWriterPage onClose={vi.fn()} writerType="info" editPostId="1" /></StrictMode>)
    await waitFor(() => expect(titleInput().value).toBe('Article 1'))
    fireEvent.change(titleInput(), { target: { value: 'Current draft' } })
    await act(async () => stale.resolve({ ...article(1), title: 'Stale title' }))
    expect(titleInput().value).toBe('Current draft')
  })
})
