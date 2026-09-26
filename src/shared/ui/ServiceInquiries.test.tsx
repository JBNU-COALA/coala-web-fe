import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { servicesApi, type ServiceInquiry } from '../api/services'
import { useAuth } from '../auth/AuthContext'
import { ServiceInquiries } from './ServiceInquiries'
import { ServicePage } from '../../pages/service/ServicePage'
import { DomainServicePanel } from '../../pages/service/DomainServicePanel'

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../api/services', () => ({ servicesApi: {
  getInquiries: vi.fn(), getDomainInquiries: vi.fn(), createInquiry: vi.fn(), createDomainInquiry: vi.fn(),
} }))
vi.mock('../../pages/service/JcloudApplyForm', () => ({ JcloudApplyForm: () => null }))
vi.mock('../../pages/service/JcloudApplyList', () => ({ JcloudApplyList: () => null }))
vi.mock('../../pages/service/DomainApplyForm', () => ({ DomainApplyForm: () => null }))

type Kind = 'instances' | 'domains'
const inquiry: ServiceInquiry = {
  id: 'inq-1', title: 'Instance access', summary: 'Short summary', author: 'Member', authorId: 7,
  content: 'The full inquiry is longer than its summary.\nPlease check the second line.',
  createdAt: '2026.09.26', status: 'answered', statusClass: 'status--approved',
  reply: 'Access has been restored.\nPlease try again.', answeredAt: '2026-09-26T02:00:00Z',
}
const reads = { instances: vi.mocked(servicesApi.getInquiries), domains: vi.mocked(servicesApi.getDomainInquiries) }
const writes = { instances: vi.mocked(servicesApi.createInquiry), domains: vi.mocked(servicesApi.createDomainInquiry) }
const auth = vi.mocked(useAuth)
const view = (kind: Kind) => <MemoryRouter><ServiceInquiries kind={kind} /></MemoryRouter>
const startDraft = () => {
  fireEvent.click(screen.getByRole('button', { name: '문의 작성' }))
  fireEvent.change(screen.getByLabelText('제목'), { target: { value: '  Draft title  ' } })
  fireEvent.change(screen.getByLabelText('내용'), { target: { value: '  Keep my question  ' } })
}

beforeEach(() => {
  vi.resetAllMocks()
  auth.mockReturnValue({ isLoggedIn: true, user: { id: 7, name: 'Member' } } as ReturnType<typeof useAuth>)
  reads.instances.mockResolvedValue([])
  reads.domains.mockResolvedValue([])
})

describe('authenticated service inquiries', () => {
  it.each(['instances', 'domains'] as const)('does not read or expose write controls for a logged-out %s visitor', (kind) => {
    auth.mockReturnValue({ isLoggedIn: false, user: null } as ReturnType<typeof useAuth>)
    render(view(kind))
    expect(screen.getByRole('link', { name: '로그인하기' }).getAttribute('href')).toBe('/login')
    expect(screen.queryByRole('button', { name: '문의 작성' })).toBeNull()
    expect(reads.instances).not.toHaveBeenCalled()
    expect(reads.domains).not.toHaveBeenCalled()
    expect(writes.instances).not.toHaveBeenCalled()
    expect(writes.domains).not.toHaveBeenCalled()
  })

  it.each(['instances', 'domains'] as const)('reads full %s content and replies from the matching namespace', async (kind) => {
    reads[kind].mockResolvedValue([inquiry])
    const { container } = render(view(kind))
    await screen.findByText(inquiry.title)
    expect(container.querySelector('.service-inquiries-content')?.textContent).toBe(inquiry.content)
    expect(container.querySelector('.service-inquiries-reply p')?.textContent).toBe(inquiry.reply)
    expect(container.querySelector('time[datetime]')?.getAttribute('datetime')).toBe(inquiry.answeredAt)
    expect(screen.getByText('답변 완료')).toBeTruthy()
    expect(screen.queryByText(inquiry.summary)).toBeNull()
    expect(reads[kind === 'instances' ? 'domains' : 'instances']).not.toHaveBeenCalled()
  })

  it.each([
    ['open', '검토 중'], ['검토 중', '검토 중'], ['답변 대기', '검토 중'],
    ['answered', '답변 완료'], ['답변 완료', '답변 완료'], ['closed', '종료'], ['종료', '종료'],
  ])('normalizes %s to %s while retaining legacy summary fallback', async (status, label) => {
    reads.instances.mockResolvedValue([{ ...inquiry, status, content: undefined, reply: '', answeredAt: null }])
    render(view('instances'))
    expect(await screen.findByText(label)).toBeTruthy()
    expect(screen.getByText(inquiry.summary)).toBeTruthy()
    expect(screen.queryByText('운영진 답변')).toBeNull()
  })

  it.each(['instances', 'domains'] as const)('blocks duplicate %s saves and clears the draft only after success', async (kind) => {
    let complete!: (value: ServiceInquiry) => void
    writes[kind].mockImplementation(() => new Promise((resolve) => { complete = resolve }))
    const { container } = render(view(kind))
    await screen.findByText('등록된 문의가 없습니다.')
    startDraft()
    act(() => {
      fireEvent.submit(container.querySelector('form')!)
      fireEvent.submit(container.querySelector('form')!)
    })
    expect(writes[kind]).toHaveBeenCalledTimes(1)
    expect(writes[kind]).toHaveBeenCalledWith({ title: 'Draft title', content: 'Keep my question' })
    expect(writes[kind === 'instances' ? 'domains' : 'instances']).not.toHaveBeenCalled()
    expect((screen.getByRole('button', { name: '새로고침' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('제목') as HTMLInputElement).value).toBe('  Draft title  ')
    await act(async () => complete({ ...inquiry, title: 'Draft title', status: 'open', reply: '', answeredAt: null }))
    expect(screen.getByText('문의가 등록되었습니다.')).toBeTruthy()
    expect(screen.queryByLabelText('제목')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '문의 작성' }))
    expect((screen.getByLabelText('제목') as HTMLInputElement).value).toBe('')
  })

  it('retains the complete draft on failure and allows a successful retry', async () => {
    writes.instances.mockRejectedValueOnce(new Error('Request failed')).mockResolvedValueOnce(inquiry)
    const { container } = render(view('instances'))
    await screen.findByText('등록된 문의가 없습니다.')
    startDraft()
    fireEvent.submit(container.querySelector('form')!)
    await screen.findByRole('alert')
    expect((screen.getByLabelText('내용') as HTMLTextAreaElement).value).toBe('  Keep my question  ')
    expect((screen.getByRole('button', { name: '문의 등록' }) as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: '작성 닫기' }))
    fireEvent.click(screen.getByRole('button', { name: '문의 작성' }))
    expect((screen.getByLabelText('제목') as HTMLInputElement).value).toBe('  Draft title  ')
    fireEvent.submit(container.querySelector('form')!)
    await screen.findByText('문의가 등록되었습니다.')
    expect(writes.instances).toHaveBeenCalledTimes(2)
  })

  it('distinguishes loading and failure from an empty list and preserves the draft during retry', async () => {
    reads.instances.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValueOnce([inquiry])
    render(view('instances'))
    expect(screen.getByRole('status').textContent).toContain('불러오는 중')
    expect(screen.queryByText('등록된 문의가 없습니다.')).toBeNull()
    await screen.findByRole('alert')
    expect(screen.queryByText('등록된 문의가 없습니다.')).toBeNull()
    startDraft()
    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))
    await screen.findByText(inquiry.title)
    expect((screen.getByLabelText('내용') as HTMLTextAreaElement).value).toBe('  Keep my question  ')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('refreshes an administrators new reply without replacing an open draft', async () => {
    reads.instances.mockResolvedValueOnce([{ ...inquiry, status: 'open', reply: '', answeredAt: null }]).mockResolvedValueOnce([inquiry])
    const { container } = render(view('instances'))
    await screen.findByText('검토 중')
    startDraft()
    fireEvent.click(screen.getByRole('button', { name: '새로고침' }))
    await screen.findByText('답변 완료')
    expect(container.querySelector('.service-inquiries-reply p')?.textContent).toBe(inquiry.reply)
    expect((screen.getByLabelText('내용') as HTMLTextAreaElement).value).toBe('  Keep my question  ')
  })

  it('does not let an old namespace response replace the current service', async () => {
    let complete!: (value: ServiceInquiry[]) => void
    reads.instances.mockImplementation(() => new Promise((resolve) => { complete = resolve }))
    const { rerender } = render(view('instances'))
    rerender(view('domains'))
    await screen.findByText('등록된 문의가 없습니다.')
    await act(async () => complete([inquiry]))
    expect(screen.queryByText(inquiry.title)).toBeNull()
    expect(reads.domains).toHaveBeenCalledTimes(1)
  })

  it('resets private content and drafts across account changes and ignores a previous pending save', async () => {
    reads.instances.mockResolvedValueOnce([inquiry]).mockResolvedValueOnce([])
    let complete!: (value: ServiceInquiry) => void
    writes.instances.mockImplementation(() => new Promise((resolve) => { complete = resolve }))
    const { container, rerender } = render(view('instances'))
    await screen.findByText(inquiry.title)
    startDraft()
    fireEvent.submit(container.querySelector('form')!)
    auth.mockReturnValue({ isLoggedIn: true, user: { id: 8, name: 'Other' } } as ReturnType<typeof useAuth>)
    rerender(view('instances'))
    expect(screen.queryByText(inquiry.title)).toBeNull()
    expect(screen.queryByLabelText('내용')).toBeNull()
    await screen.findByText('등록된 문의가 없습니다.')
    await act(async () => complete(inquiry))
    expect(screen.queryByText(inquiry.title)).toBeNull()
    expect(screen.queryByText('문의가 등록되었습니다.')).toBeNull()
  })

  it('hides private inquiries immediately on logout and stops further reads', async () => {
    reads.instances.mockResolvedValue([inquiry])
    const { rerender } = render(view('instances'))
    await screen.findByText(inquiry.title)
    startDraft()
    auth.mockReturnValue({ isLoggedIn: false, user: null } as ReturnType<typeof useAuth>)
    rerender(view('instances'))
    expect(screen.queryByText(inquiry.title)).toBeNull()
    expect(screen.queryByLabelText('내용')).toBeNull()
    expect(screen.getByRole('link', { name: '로그인하기' })).toBeTruthy()
    expect(reads.instances).toHaveBeenCalledTimes(1)
    expect(writes.instances).not.toHaveBeenCalled()
  })

  it('validates the backend title limit even when native form validation is bypassed', async () => {
    const { container } = render(view('instances'))
    await screen.findByText('등록된 문의가 없습니다.')
    startDraft()
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: 'a'.repeat(121) } })
    fireEvent.submit(container.querySelector('form')!)
    expect(screen.getByRole('alert').textContent).toContain('1~120자')
    expect(writes.instances).not.toHaveBeenCalled()
  })

  it('wires the instance inquiry tab to the common panel', async () => {
    render(<MemoryRouter initialEntries={['/services/official/instance?instanceTab=inquiry']}><ServicePage /></MemoryRouter>)
    await screen.findByRole('heading', { name: /인스턴스 문의사항/ })
    await waitFor(() => expect(reads.instances).toHaveBeenCalledTimes(1))
  })

  it('wires the domain inquiry tab to the common panel', async () => {
    render(<MemoryRouter><DomainServicePanel /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: '문의사항' }))
    await screen.findByRole('heading', { name: /도메인 문의사항/ })
    await waitFor(() => expect(reads.domains).toHaveBeenCalledTimes(1))
  })
})
