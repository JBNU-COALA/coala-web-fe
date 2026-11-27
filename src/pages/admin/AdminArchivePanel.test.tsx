import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { archiveApi, type ArchiveItem } from '../../shared/api/archive'
import { AdminArchivePanel } from './AdminArchivePanel'
vi.mock('../../shared/api/archive', () => ({ archiveApi: { getItems: vi.fn(), createItem: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn() } }))
beforeEach(() => { vi.mocked(archiveApi.getItems).mockResolvedValue([]); vi.mocked(archiveApi.createItem).mockReset() })
afterEach(cleanup)
it('creates archive records from the admin workspace', async () => {
  vi.mocked(archiveApi.createItem).mockImplementation(async (input) => ({ ...input, id: 1, ownerName: '운영진' } as ArchiveItem))
  render(<MemoryRouter><AdminArchivePanel /></MemoryRouter>)
  await screen.findByText('등록된 자료가 없습니다.')
  fireEvent.click(screen.getByRole('button', { name: '자료 추가' }))
  fireEvent.change(screen.getByLabelText('제목'), { target: { value: '새 연구 자료' } })
  fireEvent.change(screen.getByLabelText('요약'), { target: { value: '자료 요약' } })
  fireEvent.change(screen.getByLabelText('본문'), { target: { value: '자료 내용' } })
  fireEvent.change(screen.getByLabelText('연구실'), { target: { value: 'COALA Lab' } })
  fireEvent.change(screen.getByLabelText('날짜'), { target: { value: '2026-11-27' } })
  fireEvent.change(screen.getByLabelText('태그'), { target: { value: '연구, , 개발, ' } })
  fireEvent.click(screen.getByRole('button', { name: '저장' }))
  await waitFor(() => expect(archiveApi.createItem).toHaveBeenCalledWith(expect.objectContaining({ title: '새 연구 자료', category: 'labs', tags: ['연구', '개발'] })))
})
