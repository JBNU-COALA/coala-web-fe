import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { PasswordResetPage } from './PasswordResetPage'

const api = vi.hoisted(() => ({ requestPasswordReset: vi.fn(), confirmPasswordReset: vi.fn() }))
vi.mock('../../shared/api/auth', () => ({ authApi: api }))
afterEach(() => { cleanup(); vi.resetAllMocks() })

it('requests a code before accepting matching new passwords', async () => {
  api.requestPasswordReset.mockResolvedValue({ message: '인증번호 발송 완료' })
  api.confirmPasswordReset.mockResolvedValue({ message: '변경 완료' })
  render(<MemoryRouter><PasswordResetPage /></MemoryRouter>)
  expect(screen.queryByLabelText('새 비밀번호')).toBeNull()
  fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'member@jbnu.ac.kr' } })
  fireEvent.click(screen.getByRole('button', { name: '다음' }))
  await screen.findByLabelText('새 비밀번호')
  expect(api.requestPasswordReset).toHaveBeenCalledWith({ email: 'member@jbnu.ac.kr' })
  fireEvent.change(screen.getByLabelText('인증번호'), { target: { value: '123456' } })
  fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'new-password' } })
  fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'different' } })
  fireEvent.click(screen.getByRole('button', { name: '변경' }))
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', '새 비밀번호가 일치하지 않습니다.')
  expect(api.confirmPasswordReset).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'new-password' } })
  fireEvent.click(screen.getByRole('button', { name: '변경' }))
  await screen.findByRole('button', { name: '로그인으로 이동' })
  expect(api.confirmPasswordReset).toHaveBeenCalledWith({ email: 'member@jbnu.ac.kr', code: '123456', newPassword: 'new-password' })
})

it('keeps the email step on delivery failure and resets verification when email changes', async () => {
  api.requestPasswordReset.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ message: '발송 완료' })
  render(<MemoryRouter><PasswordResetPage /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'member@jbnu.ac.kr' } })
  fireEvent.click(screen.getByRole('button', { name: '다음' }))
  await screen.findByRole('alert')
  expect(screen.queryByLabelText('인증번호')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '다음' }))
  await screen.findByLabelText('인증번호')
  fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'other@jbnu.ac.kr' } })
  await waitFor(() => expect(screen.queryByLabelText('인증번호')).toBeNull())
  expect(screen.getByRole('button', { name: '다음' })).toBeTruthy()
})
