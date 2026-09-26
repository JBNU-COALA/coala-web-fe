import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../auth/AuthContext'
import type { UserData } from '../api/auth'
import { ServiceWorkspace } from './ServiceWorkspace'

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('./ServiceInquiries', () => ({ ServiceInquiries: ({ kind }: { kind: string }) => <p>문의 {kind}</p> }))

function Harness({ kind = 'instances' }: { kind?: 'instances' | 'domains' }) {
  const location = useLocation()
  const navigate = useNavigate()
  return <><ServiceWorkspace kind={kind} form={(done) => <button onClick={done}>제출 테스트</button>} list={<p>신청 목록</p>} />
    <output>{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>이전 화면</button></>
}
const setUser = (role?: string) => vi.mocked(useAuth).mockReturnValue({ user: role ? { id: 1, role } as unknown as UserData : null } as ReturnType<typeof useAuth>)
beforeEach(() => setUser())

describe('shared service workspace', () => {
  it.each([undefined, 'MEMBER'])('does not expose management to %s', (role) => {
    setUser(role)
    render(<MemoryRouter><Harness /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: '관리자' })).toBeNull()
  })

  it.each(['instances', 'domains'] as const)('links authorized %s management to the single admin editor', (kind) => {
    setUser('STAFF')
    render(<MemoryRouter><Harness kind={kind} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: '관리자' }))
    expect(screen.getByRole('status').textContent).toBe(`/admin?tab=${kind}`)
  })

  it('preserves unrelated parameters and restores the selected tab on back navigation', () => {
    render(<MemoryRouter initialEntries={['/services/official/instance?source=profile']}><Harness /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: '신청 내역' }))
    expect(screen.getByText('신청 목록')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('source=profile&instanceTab=list')
    fireEvent.click(screen.getByRole('button', { name: '문의사항' }))
    expect(screen.getByText('문의 instances')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '이전 화면' }))
    expect(screen.getByText('신청 목록')).toBeTruthy()
  })

  it('opens domain inquiries from a deep link and shows the list after submission', () => {
    render(<MemoryRouter initialEntries={['/services/official/domain?domainTab=inquiry']}><Harness kind="domains" /></MemoryRouter>)
    expect(screen.getByText('문의 domains')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '신청하기' }))
    fireEvent.click(screen.getByRole('button', { name: '제출 테스트' }))
    expect(screen.getByText('신청 목록')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('domainTab=list')
  })
})
