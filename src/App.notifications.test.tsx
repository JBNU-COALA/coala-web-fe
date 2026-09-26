// @vitest-environment jsdom
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { notificationsApi, type NotificationItem } from './shared/api/notifications'
import App from './App'

const auth = vi.hoisted(() => ({
  isLoggedIn: true,
  user: { id: 1, name: 'First user', email: 'first@example.test', role: 'USER' },
  logout: vi.fn(),
}))
vi.mock('./shared/auth/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('./pages/about/AboutPage', () => ({ AboutPage: () => <div>About page</div> }))
vi.mock('./shared/api/notifications', () => ({ notificationsApi: {
  getNotifications: vi.fn(), getUnreadCount: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn(),
} }))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise })
  return { promise, resolve }
}

const notification: NotificationItem = { id: 1, type: 'COMMENT', title: 'First user notification', message: 'Message', read: false }
const app = () => <StrictMode><MemoryRouter initialEntries={['/about']}><App /></MemoryRouter></StrictMode>

beforeEach(() => {
  vi.resetAllMocks()
  auth.isLoggedIn = true
  auth.user = { id: 1, name: 'First user', email: 'first@example.test', role: 'USER' }
  vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 1 })
  vi.mocked(notificationsApi.getNotifications).mockResolvedValue([notification])
  vi.mocked(notificationsApi.markRead).mockResolvedValue({ ...notification, read: true })
  vi.mocked(notificationsApi.markAllRead).mockResolvedValue(undefined)
})
afterEach(cleanup)

describe('notification session isolation', () => {
  it('does not issue duplicate list loads from a StrictMode updater', async () => {
    render(app())
    fireEvent.click(await screen.findByRole('button', { name: '알림 1개' }))
    await screen.findByText(notification.title)
    expect(notificationsApi.getNotifications).toHaveBeenCalledTimes(1)
  })

  it('ignores unread and list responses from a logged-out session, even after the same user logs in', async () => {
    const count = deferred<{ count: number }>()
    const list = deferred<NotificationItem[]>()
    vi.mocked(notificationsApi.getUnreadCount).mockReturnValue(count.promise)
    vi.mocked(notificationsApi.getNotifications).mockReturnValueOnce(list.promise)
    const view = render(app())
    await screen.findByText('About page')
    fireEvent.click(screen.getByRole('button', { name: '알림 0개' }))
    auth.isLoggedIn = false
    view.rerender(app())
    expect(screen.queryByRole('button', { name: /알림 \d+개/ })).toBeNull()
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 0 })
    auth.isLoggedIn = true
    view.rerender(app())
    await act(async () => { count.resolve({ count: 9 }); list.resolve([notification]) })
    const bell = screen.getByRole('button', { name: '알림 0개' })
    expect(bell.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText(notification.title)).toBeNull()
  })

  it('clears notification state when switching accounts without an intervening logout', async () => {
    const view = render(app())
    fireEvent.click(await screen.findByRole('button', { name: '알림 1개' }))
    await screen.findByText(notification.title)
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 0 })
    auth.user = { ...auth.user, id: 2, name: 'Second user' }
    view.rerender(app())
    expect(screen.queryByText(notification.title)).toBeNull()
    const bell = await screen.findByRole('button', { name: '알림 0개' })
    expect(bell.getAttribute('aria-expanded')).toBe('false')
  })

  it('does not let an old mark-all completion clear the new account count', async () => {
    const marked = deferred<void>()
    vi.mocked(notificationsApi.markAllRead).mockReturnValue(marked.promise)
    const view = render(app())
    fireEvent.click(await screen.findByRole('button', { name: '알림 1개' }))
    await screen.findByText(notification.title)
    fireEvent.click(screen.getByRole('button', { name: '모두 읽음' }))
    fireEvent.click(screen.getByRole('button', { name: '모두 읽음' }))
    expect(notificationsApi.markAllRead).toHaveBeenCalledTimes(1)
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 4 })
    auth.user = { ...auth.user, id: 2 }
    view.rerender(app())
    await screen.findByRole('button', { name: '알림 4개' })
    await act(async () => marked.resolve())
    expect(screen.getByRole('button', { name: '알림 4개' })).toBeTruthy()
  })

  it('keeps the unread count and exposes a read failure instead of claiming success', async () => {
    vi.mocked(notificationsApi.markRead).mockRejectedValue(new Error('offline'))
    render(app())
    fireEvent.click(await screen.findByRole('button', { name: '알림 1개' }))
    fireEvent.click(await screen.findByRole('button', { name: /First user notification/ }))
    await screen.findByText('알림 읽음 처리에 실패했습니다.')
    expect(screen.getByRole('button', { name: '알림 1개' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '알림 1개' }))
    fireEvent.click(screen.getByRole('button', { name: '알림 1개' }))
    await waitFor(() => expect(screen.queryByText('알림 읽음 처리에 실패했습니다.')).toBeNull())
    await screen.findByText(notification.title)
  })
})
