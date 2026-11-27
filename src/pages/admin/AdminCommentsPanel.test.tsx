import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { adminCommentsApi } from '../../shared/api/adminComments'
import { AdminCommentsPanel } from './AdminCommentsPanel'
vi.mock('../../shared/api/adminComments', () => ({ adminCommentsApi: { list: vi.fn(), act: vi.fn() } }))
beforeEach(() => { vi.mocked(adminCommentsApi.list).mockResolvedValue({ comments: [{ id: 3, postId: 1, boardId: 2, content: '관리 대상 댓글', postTitle: '원문 글', status: 'ACTIVE', createdAt: '', reply: false }], totalElements: 1, totalPages: 1 }); vi.mocked(adminCommentsApi.act).mockReset().mockResolvedValue(undefined) })
afterEach(cleanup)
it('requires a reason, confirms and calls the existing moderation endpoint once', async () => {
  render(<MemoryRouter><AdminCommentsPanel /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: '숨김' }))
  const dialog = screen.getByRole('alertdialog', { name: '댓글 관리 확인' })
  expect((within(dialog).getByRole('button', { name: '확인' }) as HTMLButtonElement).disabled).toBe(true)
  fireEvent.change(within(dialog).getByLabelText('댓글 조치 사유'), { target: { value: '신고 검토' } })
  fireEvent.click(within(dialog).getByRole('button', { name: '확인' }))
  await screen.findByText('댓글 숨김 처리를 완료했습니다.')
  expect(adminCommentsApi.act).toHaveBeenCalledExactlyOnceWith(3, 'hide', '신고 검토')
})
it('filters from the server and keeps a failed action and reason available for retry', async () => {
  vi.mocked(adminCommentsApi.act).mockRejectedValue(new Error('offline'))
  render(<MemoryRouter><AdminCommentsPanel /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: '관리자 삭제' }))
  fireEvent.change(screen.getByLabelText('댓글 조치 사유'), { target: { value: '검토 사유' } })
  fireEvent.click(screen.getByRole('button', { name: '확인' }))
  await waitFor(() => expect(adminCommentsApi.act).toHaveBeenCalled())
  expect((screen.getByLabelText('댓글 조치 사유') as HTMLTextAreaElement).value).toBe('검토 사유')
  fireEvent.change(screen.getByLabelText('댓글 상태'), { target: { value: 'HIDDEN' } })
  await waitFor(() => expect(adminCommentsApi.list).toHaveBeenLastCalledWith('HIDDEN', '', 0, expect.any(AbortSignal)))
})
