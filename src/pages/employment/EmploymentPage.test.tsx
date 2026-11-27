import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EmploymentPage } from './EmploymentPage'
import { employmentApi, type EmploymentReview } from '../../shared/api/employment'
import { useAuth } from '../../shared/auth/AuthContext'
import type { UserData } from '../../shared/api/auth'

vi.mock('../../shared/api/employment', () => ({ employmentApi: { options: vi.fn(), list: vi.fn(), detail: vi.fn(), save: vi.fn(), delete: vi.fn() } }))
vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: vi.fn() }))
const review: EmploymentReview = { id: 1, company: 'Example Corp', industryId: 'it', industry: 'IT', roleId: 'backend', role: '백엔드', outcome: 'ACCEPTED', stage: 'FINAL', recruitmentYear: 2026, title: '면접 후기', content: '# 후기 본문', author: '회원', createdAt: '2026-11-26', updatedAt: '2026-11-26', canManage: false, version: 0 }
function renderAt(path = '/community/employment') { return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/community/employment/*" element={<EmploymentPage />} /><Route path="/login" element={<p>로그인 화면</p>} /></Routes></MemoryRouter>) }
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.mocked(useAuth).mockReturnValue({ isLoggedIn: false, user: null } as ReturnType<typeof useAuth>)
  vi.mocked(employmentApi.options).mockResolvedValue({ options: [{ id: 'it', kind: 'INDUSTRY', label: 'IT', sortOrder: 0, published: true, version: 0 }, { id: 'backend', kind: 'ROLE', label: '백엔드', sortOrder: 0, published: true, version: 0 }], companies: ['Example Corp'] })
  vi.mocked(employmentApi.list).mockReset().mockResolvedValue({ reviews: [review], totalElements: 1, totalPages: 1, page: 0 })
  vi.mocked(employmentApi.detail).mockResolvedValue(review)
  vi.mocked(employmentApi.save).mockReset().mockResolvedValue(review)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('employment reviews', () => {
  it('filters outcomes through the dropdown', async () => {
    renderAt(); await screen.findByRole('link', { name: '면접 후기' })
    fireEvent.click(screen.getByRole('button', { name: '채용 결과: 합격' }))
    fireEvent.click(screen.getByRole('option', { name: '불합격' }))
    await waitFor(() => expect(employmentApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ outcome: 'REJECTED', page: 0 }), expect.any(AbortSignal)))
  })
  it('filters companies through API rather than filtering only the current page', async () => {
    renderAt(); await screen.findByRole('link', { name: '면접 후기' })
    fireEvent.click(screen.getByRole('button', { name: '회사: 전체 회사' }))
    fireEvent.click(screen.getByRole('option', { name: 'Example Corp' }))
    await waitFor(() => expect(employmentApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ company: 'Example Corp', page: 0 }), expect.any(AbortSignal)))
  })
  it('shows one error and retries both failed requests', async () => {
    vi.mocked(useAuth).mockReturnValue({ isLoggedIn: true, user: { id: 2 } as UserData } as ReturnType<typeof useAuth>)
    vi.mocked(employmentApi.options).mockRejectedValueOnce(new Error('offline'))
    vi.mocked(employmentApi.list).mockRejectedValueOnce(new Error('offline'))
    renderAt()
    await screen.findByRole('alert')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))
    await screen.findByRole('link', { name: '면접 후기' })
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('button', { name: '계열: 전체 계열' })).toBeTruthy()
  })
  it('requires the existing login for writing', async () => { renderAt('/community/employment/new'); await screen.findByText('로그인 화면') })
  it('hides edit/delete controls from non-owners', async () => {
    renderAt('/community/employment/1'); await screen.findByRole('heading', { name: '면접 후기' })
    expect(screen.queryByRole('button', { name: '후기 삭제' })).toBeNull()
  })
  it('saves company, industry, role and result to the backend', async () => {
    vi.mocked(useAuth).mockReturnValue({ isLoggedIn: true, user: { id: 2, verified: true, role: 'USER' } as UserData } as ReturnType<typeof useAuth>)
    renderAt('/community/employment/new'); await screen.findByLabelText('회사')
    fireEvent.change(screen.getByLabelText('회사'), { target: { value: 'New Company' } })
    fireEvent.change(screen.getByLabelText('계열'), { target: { value: 'it' } })
    fireEvent.change(screen.getByLabelText('직무'), { target: { value: 'backend' } })
    fireEvent.change(screen.getByLabelText('결과'), { target: { value: 'REJECTED' } })
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '내 경험' } })
    fireEvent.change(screen.getByLabelText('후기'), { target: { value: '면접 경험을 공유합니다.' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(employmentApi.save).toHaveBeenCalledWith(expect.objectContaining({ company: 'New Company', industryId: 'it', roleId: 'backend', outcome: 'REJECTED' }), undefined))
  })
})
