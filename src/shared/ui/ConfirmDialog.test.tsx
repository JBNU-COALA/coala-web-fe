import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
  HTMLDialogElement.prototype.close = function () { this.open = false }
})
afterEach(cleanup)
it('keeps dismissing separate from discarding and closes when requested', () => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  const props = { open: true, title: '작성을 취소할까요?', description: '작성 내용은 저장되지 않습니다.', confirmLabel: '작성 취소', cancelLabel: '계속 작성', onConfirm, onCancel }
  const { rerender } = render(<ConfirmDialog {...props} />)
  const dialog = screen.getByRole('dialog')
  fireEvent.click(screen.getByRole('button', { name: '계속 작성' }))
  expect(onCancel).toHaveBeenCalledTimes(1)
  expect(onConfirm).not.toHaveBeenCalled()
  fireEvent(dialog, new Event('cancel', { cancelable: true }))
  expect(onCancel).toHaveBeenCalledTimes(2)
  expect(onConfirm).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: '작성 취소' }))
  expect(onConfirm).toHaveBeenCalledTimes(1)
  rerender(<ConfirmDialog {...props} open={false} />)
  expect((dialog as HTMLDialogElement).open).toBe(false)
})
