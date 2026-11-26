import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdminDetail } from './AdminDetail'

afterEach(() => { cleanup(); vi.useRealTimers() })
it('retains content during closing and closes once after the animation', () => {
  vi.useFakeTimers()
  const onClose = vi.fn()
  render(<AdminDetail onClose={onClose}><p>상세 내용</p></AdminDetail>)
  fireEvent.click(screen.getByRole('button', { name: '닫기' }))
  expect(screen.getByText('상세 내용')).toBeTruthy()
  expect(onClose).not.toHaveBeenCalled()
  act(() => vi.advanceTimersByTime(260))
  expect(onClose).toHaveBeenCalledTimes(1)
})
