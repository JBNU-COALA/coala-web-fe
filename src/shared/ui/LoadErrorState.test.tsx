import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { useAuth } from '../auth/AuthContext'
import { LoadErrorState } from './LoadErrorState'

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))
afterEach(cleanup)

it.each([false, true])('handles a resource failure with logged-in state %s', async (isLoggedIn) => {
  vi.mocked(useAuth).mockReturnValue({ isLoggedIn } as ReturnType<typeof useAuth>)
  const retry = vi.fn()
  render(<MemoryRouter><Routes>
    <Route path="/" element={<LoadErrorState message="자료 조회 실패" onRetry={retry} />} />
    <Route path="/login" element={<p>로그인 화면</p>} />
  </Routes></MemoryRouter>)
  if (isLoggedIn) {
    expect(screen.getByRole('alert').textContent).toBe('자료 조회 실패')
    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))
    expect(retry).toHaveBeenCalledOnce()
  } else {
    expect(await screen.findByText('로그인 화면')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  }
})
