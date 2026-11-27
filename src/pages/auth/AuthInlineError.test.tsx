import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthInlineError } from './AuthInlineError'

afterEach(() => { cleanup(); vi.useRealTimers() })

it('dismisses after five seconds and cancels its timer on unmount', () => {
  vi.useFakeTimers()
  const dismiss = vi.fn()
  const view = render(<AuthInlineError message="로그인 정보를 확인해 주세요." onDismiss={dismiss} />)
  expect(screen.getByRole('alert').textContent).toBe('로그인 정보를 확인해 주세요.')
  act(() => vi.advanceTimersByTime(4999))
  expect(dismiss).not.toHaveBeenCalled()
  act(() => vi.advanceTimersByTime(1))
  expect(dismiss).toHaveBeenCalledOnce()
  view.unmount()
  const second = render(<AuthInlineError message="오류" onDismiss={dismiss} />)
  second.unmount()
  act(() => vi.advanceTimersByTime(5000))
  expect(dismiss).toHaveBeenCalledOnce()
})
