import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthPage } from './AuthPage'

const { login, signup } = vi.hoisted(() => ({ login: vi.fn(), signup: vi.fn() }))
vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: () => ({ login, signup }) }))

function LocationState() {
  const location = useLocation()
  return <output data-testid="location">{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>
}

function renderLogin() {
  return render(<MemoryRouter initialEntries={['/login']}><AuthPage mode="login" onSwitchMode={vi.fn()} /><LocationState /></MemoryRouter>)
}

function enterCredentials(email: string) {
  fireEvent.change(screen.getByRole('textbox', { name: '이메일' }), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'test-password' } })
}

describe('login email entry', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    login.mockResolvedValue(undefined)
  })

  it('shows a muted default domain until an explicit address is entered', () => {
    const { container } = renderLogin()
    const input = screen.getByRole('textbox', { name: '이메일' })
    expect(container.querySelector('.auth-email-domain')?.textContent).toBe('@jbnu.ac.kr')
    fireEvent.change(input, { target: { value: 'member' } })
    expect(container.querySelector('.auth-email-domain')).not.toBeNull()
    fireEvent.change(input, { target: { value: 'member@jbnu.ac.kr' } })
    expect(container.querySelector('.auth-email-domain')).toBeNull()
    expect((input as HTMLInputElement).value).toBe('member@jbnu.ac.kr')
    fireEvent.change(input, { target: { value: 'member' } })
    expect(container.querySelector('.auth-email-domain')).not.toBeNull()
  })

  it.each([
    ['Member', 'member@jbnu.ac.kr'],
    ['Member@JBNU.AC.KR', 'member@jbnu.ac.kr'],
    ['member@example.com', 'member@example.com'],
  ])('submits %s as %s', async (input, expected) => {
    renderLogin()
    enterCredentials(input)
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    await waitFor(() => expect(login).toHaveBeenCalledWith(expected, 'test-password'))
  })

  it.each(['', '   ', 'member@', '@jbnu.ac.kr', 'member@@jbnu.ac.kr', 'member name'])('blocks invalid input %j', (value) => {
    renderLogin()
    enterCredentials(value)
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(login).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).not.toBeNull()
  })

  it('remembers the normalized full email', async () => {
    renderLogin()
    enterCredentials('member')
    fireEvent.click(screen.getByRole('checkbox', { name: '이메일 저장' }))
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    await waitFor(() => expect(localStorage.getItem('coala.savedEmail')).toBe('member@jbnu.ac.kr'))
  })

  it('restores remembered full emails without a duplicate suffix', () => {
    localStorage.setItem('coala.savedEmail', 'member@example.com')
    const { container } = renderLogin()
    expect((screen.getByRole('textbox', { name: '이메일' }) as HTMLInputElement).value).toBe('member@example.com')
    expect(container.querySelector('.auth-email-domain')).toBeNull()
  })

  it('passes the full school email to password recovery', () => {
    renderLogin()
    enterCredentials('member')
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 찾기' }))
    expect(screen.getByTestId('location').textContent).toContain('member@jbnu.ac.kr')
  })

  it('keeps signup requiring an explicitly entered email', () => {
    const { container } = render(<MemoryRouter><AuthPage mode="signup" onSwitchMode={vi.fn()} /></MemoryRouter>)
    const input = screen.getByRole('textbox', { name: /이메일/ }) as HTMLInputElement
    expect(input.type).toBe('email')
    expect(container.querySelector('.auth-email-domain')).toBeNull()
    fireEvent.change(input, { target: { value: 'member' } })
    expect(input.validity.typeMismatch).toBe(true)
    expect(signup).not.toHaveBeenCalled()
  })
})
