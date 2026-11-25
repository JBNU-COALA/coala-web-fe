// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AllPostsPage } from './AllPostsPage'
import { boardsApi } from '../../shared/api/boards'
import { postsApi, type PostListItem } from '../../shared/api/posts'

vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: () => ({ isLoggedIn: true, user: { id: 1, role: 'USER' } }) }))
vi.mock('../../shared/api/boards', () => ({ boardsApi: { getBoards: vi.fn() } }))
vi.mock('../../shared/api/posts', () => ({ postsApi: { getPosts: vi.fn(), likePost: vi.fn() } }))
const post = (id: number, boardId: number, title: string): PostListItem => ({
  postId: id, boardId, title, content: '함께 나누는 개발 이야기', userId: 2, authorName: '코알라',
  viewCount: 5, commentCount: 2, likeCount: id, createdAt: `2026-11-${id + 10}`, updatedAt: '',
})
beforeEach(() => {
  vi.clearAllMocks()
  Element.prototype.scrollIntoView = vi.fn()
  vi.mocked(boardsApi.getBoards).mockResolvedValue([
    { boardId: 1, boardName: '자유게시판', categoryKey: 'free', boardType: 'NORMAL', description: '', isActive: true, createdAt: '', updatedAt: '' },
    { boardId: 2, boardName: '공지사항', categoryKey: 'notice', boardType: 'NORMAL', description: '', isActive: true, createdAt: '', updatedAt: '' },
  ])
  vi.mocked(postsApi.getPosts).mockImplementation(async (id) => id === 1 ? [post(1, 1, '자유로운 이야기')] : [post(2, 2, '새 공지')])
})
afterEach(cleanup)

it('filters by category and search while retaining the notice write restriction', async () => {
  render(<AllPostsPage onOpenPost={vi.fn()} onWritePost={vi.fn()} />)
  await screen.findByText('자유로운 이야기')
  fireEvent.click(screen.getByRole('button', { name: '#공지' }))
  expect(screen.queryByText('자유로운 이야기')).toBeNull()
  expect((screen.getByRole('button', { name: '게시글 작성하기' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: '#전체' }))
  fireEvent.click(screen.getByRole('button', { name: '게시글 검색' }))
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '자유로운' } })
  expect(screen.queryByText('새 공지')).toBeNull()
  expect(screen.getByText('자유로운 이야기')).toBeTruthy()
})

it('likes a post independently of navigation and opens its correct board', async () => {
  const open = vi.fn()
  vi.mocked(postsApi.likePost).mockResolvedValue({ liked: true, likeCount: 10 })
  render(<AllPostsPage onOpenPost={open} onWritePost={vi.fn()} />)
  const title = await screen.findByText('자유로운 이야기')
  fireEvent.click(screen.getByRole('button', { name: '자유로운 이야기 좋아요' }))
  expect(await within(screen.getByRole('button', { name: '자유로운 이야기 좋아요' })).findByText('10')).toBeTruthy()
  expect(open).not.toHaveBeenCalled()
  fireEvent.click(title)
  expect(open).toHaveBeenCalledWith(1, 1)
})
