import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import client from '../../shared/api/client'
import { AdminEducationPanel } from './AdminEducationPanel'

vi.mock('../../shared/api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }))
beforeEach(() => {
  vi.mocked(client.get).mockReset().mockImplementation(async (path) => ({ data: path === '/api/admin/education/subjects' ? [{ id: 'hacking', name: '해킹', topics: '보안', published: true, sortOrder: 0, version: 0 }, { id: 'algorithms', name: '알고리즘', topics: '문제 해결', published: true, sortOrder: 1, version: 0 }] : [] }))
  vi.mocked(client.put).mockReset().mockResolvedValue({ data: { version: 0 } })
})
afterEach(cleanup)
describe('education administrator data entry', () => {
  it('defaults a new course to its selected subject, keeping algorithms separate', async () => {
    render(<AdminEducationPanel />)
    await screen.findByRole('option', { name: '알고리즘' })
    fireEvent.change(screen.getByLabelText('콘텐츠 종류'), { target: { value: 'courses' } })
    fireEvent.change(screen.getByLabelText('분야 필터'), { target: { value: 'algorithms' } })
    expect((screen.getByLabelText('교육 분야') as HTMLSelectElement).value).toBe('algorithms')
    await waitFor(() => expect(client.get).toHaveBeenCalledWith('/api/admin/education/subjects/algorithms/courses', expect.any(Object)))
  })
  it('saves new subjects through the backend rather than modifying a local list', async () => {
    render(<AdminEducationPanel />)
    await screen.findByRole('option', { name: '알고리즘' })
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'data-science' } })
    fireEvent.change(screen.getByLabelText('이름 · 제목'), { target: { value: '데이터 과학' } })
    fireEvent.change(screen.getByLabelText('분야 소개'), { target: { value: '분석 · 모델링' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(client.put).toHaveBeenCalledWith('/api/admin/education/subjects/data-science', expect.objectContaining({ id: 'data-science', name: '데이터 과학', version: null, published: false })))
    await screen.findByText('저장했습니다.')
  })
  it('preserves the version of an existing subject for optimistic updates', async () => {
    render(<AdminEducationPanel />)
    await screen.findByRole('option', { name: '해킹' })
    fireEvent.change(screen.getByLabelText('기존 항목'), { target: { value: 'hacking' } })
    await waitFor(() => expect((screen.getByLabelText('이름 · 제목') as HTMLInputElement).value).toBe('해킹'))
    fireEvent.change(screen.getByLabelText('이름 · 제목'), { target: { value: '정보보안' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(client.put).toHaveBeenCalledWith('/api/admin/education/subjects/hacking', expect.objectContaining({ name: '정보보안', version: 0 })))
  })
})
