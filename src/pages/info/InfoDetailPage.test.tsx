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
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute('open', '') })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute('open') })
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

  it('prevents duplicate likes and preserves article content', async () => {
    const pending = deferred<Awaited<ReturnType<typeof infoApi.likeArticle>>>()
    vi.mocked(infoApi.likeArticle).mockReturnValue(pending.promise)
    render(<InfoDetailPage {...props} />)
    const save = await screen.findByRole('button', { name: '3' })
    fireEvent.click(save)
    fireEvent.click(save)
    expect(infoApi.likeArticle).toHaveBeenCalledTimes(1)
    await act(async () => { pending.resolve({ liked: false, likeCount: 2 }); await pending.promise })
    expect(screen.getByRole('button', { name: '2' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByText('Content 1')).toBeDefined()
  })

  it('keeps a late like response on the old detail instance', async () => {
    const pending = deferred<Awaited<ReturnType<typeof infoApi.likeArticle>>>()
    vi.mocked(infoApi.likeArticle).mockReturnValue(pending.promise)
    const { rerender } = render(<InfoDetailPage {...props} />)
    fireEvent.click(await screen.findByRole('button', { name: '3' }))
    vi.mocked(infoApi.getArticle).mockResolvedValue(article(2))
    rerender(<InfoDetailPage {...props} infoId="2" />)
    await screen.findByRole('heading', { name: 'Article 2' })
    await act(async () => { pending.resolve({ liked: false, likeCount: 2 }); await pending.promise })
    expect(screen.queryByRole('heading', { name: 'Article 1' })).toBeNull()
    expect(screen.getByRole('button', { name: '3' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('does not navigate away from another article when an old delete finishes', async () => {
    const pending = deferred<Awaited<ReturnType<typeof infoApi.deleteArticle>>>()
    vi.mocked(infoApi.deleteArticle).mockReturnValue(pending.promise)
    const { rerender } = render(<InfoDetailPage {...props} />)
    fireEvent.click(await screen.findByRole('button', { name: '삭제' }))
    expect(infoApi.deleteArticle).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '삭제하기' }))
    vi.mocked(infoApi.getArticle).mockResolvedValue(article(2))
    rerender(<InfoDetailPage {...props} infoId="2" />)
    await screen.findByRole('heading', { name: 'Article 2' })
    await act(async () => { pending.resolve({ data: null } as Awaited<ReturnType<typeof infoApi.deleteArticle>>); await pending.promise })
    await waitFor(() => expect(props.onBack).not.toHaveBeenCalled())
  })
})
