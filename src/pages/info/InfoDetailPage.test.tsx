import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InfoDetailPage } from './InfoDetailPage'
import { infoApi, type InfoArticle } from '../../shared/api/info'

vi.mock('../../shared/api/info', () => ({ infoApi: { getArticle: vi.fn(), likeArticle: vi.fn(), bookmarkArticle: vi.fn(), deleteArticle: vi.fn() } }))
vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: () => ({ isLoggedIn: true, user: { id: 1, role: 'USER' } }) }))
vi.mock('@uiw/react-md-editor/nohighlight', () => ({ default: { Markdown: ({ source }: { source: string }) => <div>{source}</div> } }))

const article = (id = 1): InfoArticle => ({ id, title: `Article ${id}`, filter: 'news', tag: 'test', meta: '', source: 'Author', sourceName: 'Author', sourceDate: '2026-09-26', authorId: 1, content: `Content ${id}`, imageUrl: '', viewCount: 1, bookmarkCount: 0, likeCount: 3, likedByMe: true })
const props = { infoId: '1', onBack: vi.fn(), onWrite: vi.fn(), onEdit: vi.fn() }

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((value) => { resolve = value })
  return { promise, resolve }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(infoApi.getArticle).mockResolvedValue(article())
})

describe('information article interactions', () => {
  it('retries a failed load', async () => {
    vi.mocked(infoApi.getArticle).mockRejectedValueOnce(new Error('Offline'))
    render(<InfoDetailPage {...props} />)
    fireEvent.click(await screen.findByRole('button', { name: '다시 불러오기' }))
    expect(await screen.findByRole('heading', { name: 'Article 1' })).toBeDefined()
    expect(infoApi.getArticle).toHaveBeenCalledTimes(2)
  })

  it('does not fetch an invalid ID', async () => {
    render(<InfoDetailPage {...props} infoId="invalid" />)
    expect(screen.getByRole('alert').textContent).toContain('올바르지 않은')
    expect(infoApi.getArticle).not.toHaveBeenCalled()
  })

  it('prevents duplicate saves without overwriting unrelated reaction fields', async () => {
    const pending = deferred<InfoArticle>()
    vi.mocked(infoApi.bookmarkArticle).mockReturnValue(pending.promise)
    render(<InfoDetailPage {...props} />)
    const save = await screen.findByRole('button', { name: '저장' })
    fireEvent.click(save)
    fireEvent.click(save)
    expect(infoApi.bookmarkArticle).toHaveBeenCalledTimes(1)
    await act(async () => { pending.resolve({ ...article(), bookmarkedByMe: true, bookmarkCount: 1, likeCount: 0, likedByMe: false }); await pending.promise })
    expect(screen.getByRole('button', { name: '저장됨' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: '3' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('keeps a late save response on the old detail instance', async () => {
    const pending = deferred<InfoArticle>()
    vi.mocked(infoApi.bookmarkArticle).mockReturnValue(pending.promise)
    const { rerender } = render(<InfoDetailPage {...props} />)
    fireEvent.click(await screen.findByRole('button', { name: '저장' }))
    vi.mocked(infoApi.getArticle).mockResolvedValue(article(2))
    rerender(<InfoDetailPage {...props} infoId="2" />)
    await screen.findByRole('heading', { name: 'Article 2' })
    await act(async () => { pending.resolve({ ...article(), bookmarkedByMe: true }); await pending.promise })
    expect(screen.queryByRole('heading', { name: 'Article 1' })).toBeNull()
    expect(screen.getByRole('button', { name: '저장' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('does not navigate away from another article when an old delete finishes', async () => {
    const pending = deferred<Awaited<ReturnType<typeof infoApi.deleteArticle>>>()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(infoApi.deleteArticle).mockReturnValue(pending.promise)
    const { rerender } = render(<InfoDetailPage {...props} />)
    fireEvent.click(await screen.findByRole('button', { name: '삭제' }))
    vi.mocked(infoApi.getArticle).mockResolvedValue(article(2))
    rerender(<InfoDetailPage {...props} infoId="2" />)
    await screen.findByRole('heading', { name: 'Article 2' })
    await act(async () => { pending.resolve({ data: null } as Awaited<ReturnType<typeof infoApi.deleteArticle>>); await pending.promise })
    await waitFor(() => expect(props.onBack).not.toHaveBeenCalled())
  })
})
