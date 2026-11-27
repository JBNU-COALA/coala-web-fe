import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { QnaBoardPage } from './QnaBoardPage'
import { boardsApi } from '../../shared/api/boards'

vi.mock('../../shared/api/boards', () => ({ boardsApi: { getBoards: vi.fn() } }))
vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: () => ({ isLoggedIn: true }) }))
afterEach(cleanup)

it('distinguishes failed loading from an unconfigured board and retries', async () => {
  vi.mocked(boardsApi.getBoards).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([])
  render(<MemoryRouter><QnaBoardPage onOpenPost={vi.fn()} onWritePost={vi.fn()} /></MemoryRouter>)
  expect((await screen.findByRole('alert')).textContent).toContain('불러오지 못했습니다')
  expect(document.querySelector('.board-table-head')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))
  await screen.findByText('질문게시판이 아직 준비되지 않았습니다.')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(document.querySelector('.board-table-head')).toBeNull()
})
