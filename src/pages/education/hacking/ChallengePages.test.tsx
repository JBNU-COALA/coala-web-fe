import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ChallengeDetail } from './ChallengePages'
import { createCtfApi } from './api'
import { CtfHint } from './CtfHint'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute('open', '') })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute('open') })
})

it('keeps hint content mounted during opening and closing', () => {
  render(<CtfHint number={1} hint="숨겨진 힌트" />)
  const toggle = screen.getByRole('button', { name: '힌트 1' })
  const content = document.getElementById(toggle.getAttribute('aria-controls')!)!
  expect(content.getAttribute('aria-hidden')).toBe('true')
  fireEvent.click(toggle)
  expect(toggle.getAttribute('aria-expanded')).toBe('true')
  expect(content.hasAttribute('inert')).toBe(false)
  fireEvent.click(toggle)
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
  expect(content.hasAttribute('inert')).toBe(true)
  expect(content.textContent).toBe('숨겨진 힌트')
})

it.each([false, true])('shows a dismissible result modal for correct=%s', async (correct) => {
  const api = createCtfApi()
  vi.spyOn(api, 'challenge').mockResolvedValue({
    challenge: { id: '1', title: '테스트 문제', category: 'crypto', difficulty: 'easy', points: 100, type: 'static', solved: false, description: '문제 설명', author: '코알라', hints: [], solve_count: 0, files: [], instance: { required: false, port: null, kind: null, ttl_minutes: null } },
    instance: null,
  })
  vi.spyOn(api, 'submit').mockResolvedValue({ correct })
  render(<MemoryRouter initialEntries={['/challenges/1']}><Routes><Route path="/challenges/:challengeId" element={<ChallengeDetail api={api} session={{ user: { id: 1, username: '테스터', is_admin: false } }} />} /></Routes></MemoryRouter>)
  fireEvent.change(await screen.findByLabelText('플래그'), { target: { value: 'school{test}' } })
  fireEvent.click(screen.getByRole('button', { name: '제출' }))
  const dialog = await screen.findByRole('dialog', { name: correct ? '플래그 해독 성공!' : '다시 도전해 보세요' })
  expect(within(dialog).getAllByRole('button')).toHaveLength(1)
  expect(dialog.querySelector('.ctf-result-character')).not.toBeNull()
  fireEvent.click(within(dialog).getByRole('button', { name: '확인' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  if (!correct) expect((screen.getByLabelText('플래그') as HTMLInputElement).value).toBe('school{test}')
})
