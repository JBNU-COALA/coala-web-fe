// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'

const auth = vi.hoisted(() => ({ isLoggedIn: false, user: null as null | { id: number; verified: boolean }, logout: vi.fn() }))
vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('../auth/AuthPage', () => ({ AuthPage: () => { const location = useLocation(); return <div>Login destination: {location.state?.from?.pathname}</div> } }))
vi.mock('../home/HomePage', () => ({ HomePage: () => <div>Member portal content</div> }))
vi.mock('../../shared/api/notifications', () => ({ notificationsApi: { getUnreadCount: vi.fn().mockResolvedValue({ count: 0 }) } }))
afterEach(() => { cleanup(); auth.isLoggedIn = false; auth.user = null })

describe('public landing and member portal', () => {
  it('shows the koala landing first with the recruiting banner', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('코알라')
    expect(screen.getByRole('link', { name: '지원하러 가기' }).getAttribute('href')).toBe('/recruiting')
    expect(screen.queryByText('동아리 회원을 위한 게시판과 자료를 이용할 수 있습니다.')).toBeNull()
    expect(screen.getByRole('link', { name: 'RECRUITING' }).getAttribute('href')).toBe('/recruiting')
    expect(screen.queryByText('Member portal content')).toBeNull()
  })
  it('redirects visitors opening the member portal to login and preserves the destination', async () => {
    render(<MemoryRouter initialEntries={['/portal']}><App /></MemoryRouter>)
    expect(await screen.findByText('Login destination: /portal')).toBeTruthy()
    expect(screen.queryByText('Member portal content')).toBeNull()
  })
  it('allows an authenticated verified account into the existing portal', async () => {
    auth.isLoggedIn = true
    auth.user = { id: 1, verified: true }
    render(<MemoryRouter initialEntries={['/portal']}><App /></MemoryRouter>)
    expect(await screen.findByText('Member portal content')).toBeTruthy()
  })
})
