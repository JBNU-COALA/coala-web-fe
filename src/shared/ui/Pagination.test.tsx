import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'
import { usePagination } from './usePagination'
import { SafeImage } from './SafeImage'

describe('listing pagination', () => {
  it('slices records, resets new filters and clamps after records are removed', () => {
    const records = Array.from({ length: 30 }, (_, i) => i)
    const { result, rerender } = renderHook(({ items, filter }) => usePagination(items, filter), { initialProps: { items: records, filter: 'all' } })
    expect(result.current.pageItems).toHaveLength(12)
    act(() => result.current.setPage(3))
    expect(result.current.pageItems).toEqual([24, 25, 26, 27, 28, 29])
    rerender({ items: records.slice(0, 4), filter: 'all' })
    expect(result.current.page).toBe(1)
    rerender({ items: records, filter: 'notice' })
    expect(result.current.page).toBe(1)
  })
  it('omits nonfunctional single-page controls', () => {
    render(<Pagination page={1} pageCount={1} onChange={vi.fn()} />)
    expect(screen.queryByRole('navigation')).toBeNull()
  })
  it('limits page buttons and supports previous/next', () => {
    const onChange = vi.fn()
    render(<Pagination page={9} pageCount={10} onChange={onChange} />)
    expect(screen.getAllByRole('button')).toHaveLength(7)
    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }))
    expect(onChange).toHaveBeenCalledWith(10)
    expect(screen.getByRole('button', { name: '9페이지' }).getAttribute('aria-current')).toBe('page')
  })
})

it('recovers an image after a failed URL is replaced', () => {
  const { rerender } = render(<SafeImage src="/missing.png" alt="사진" fallback={<span>대체 이미지</span>} />)
  fireEvent.error(screen.getByRole('img'))
  expect(screen.getByText('대체 이미지')).toBeTruthy()
  rerender(<SafeImage src="/valid.png" alt="사진" fallback={<span>대체 이미지</span>} />)
  expect(screen.getByRole('img').getAttribute('src')).toBe('/valid.png')
})
