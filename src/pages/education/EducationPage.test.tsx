import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import client from '../../shared/api/client'
import { useAuth } from '../../shared/auth/AuthContext'
import type { UserData } from '../../shared/api/auth'
import { EducationPage } from './EducationPage'
import { headerSubNavItems } from '../../navigation/navigationData'

vi.mock('../../shared/api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() }, resolveApiAssetUrl: (path: string) => path }))
vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: vi.fn() }))
const problem = { id: 'web-cors', title: 'CORS Misconfig', category: 'web', difficulty: 'easy', points: 100, type: 'dynamic', solved: false }
const lesson = { id: 'w01', title: '리눅스 시작', goals: ['터미널 이해'], tools: ['Linux'], challenges: ['web-cors'], done: [], homework: '기록' }
const course = { id: 'hacking-first-year', subjectId: 'hacking', slug: 'first-year', title: '1학년', description: '첫 과정', content: '# 교육 문서', level: 'beginner', kind: 'TRACK', weeks: [lesson], completedLessons: [], published: true, version: 0 }
let solved = false
function renderAt(path: string) { return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/education/*" element={<EducationPage />} /></Routes></MemoryRouter>) }
function authenticated() { vi.mocked(useAuth).mockReturnValue({ isLoggedIn: true, user: { id: 2, nickname: '학습자', role: 'USER', verified: true } as UserData } as ReturnType<typeof useAuth>) }
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  solved = false
  vi.mocked(useAuth).mockReturnValue({ isLoggedIn: false, user: null } as ReturnType<typeof useAuth>)
  vi.mocked(client.get).mockReset().mockImplementation(async (path) => {
    let data: unknown
    if (path === '/api/education/subjects') data = [{ id: 'hacking', name: '해킹', topics: '보안 학습', courseCount: 10 }, { id: 'algorithms', name: '알고리즘', topics: '문제 해결', courseCount: 0 }]
    else if (path === '/api/education/subjects/algorithms/courses') data = []
    else if (path === '/api/education/subjects/hacking/courses') data = [course, { ...course, id: 'guide', title: '교육 프로그램', kind: 'GUIDE' }]
    else if (path === '/api/education/courses/hacking-first-year') data = course
    else if (path === '/api/education/hacking/challenges') data = { challenges: [{ ...problem, solved }], count: 1 }
    else if (path === '/api/education/hacking/challenges/web-cors') data = { challenge: { ...problem, solved, description: '<script>not executable</script>', author: 'Coala', hints: ['힌트'], solve_count: 0, files: [], instance: { required: true, ttl_minutes: 30 } }, instance: null }
    else if (path === '/api/education/hacking/curriculum') data = { tracks: ['first-year', 'second-year', 'third-year', 'fourth-year', 'bob-prep', 'advanced'].map((slug) => ({ id: `hacking-${slug}`, slug, title: slug, weeks: [lesson] })) }
    else if (path === '/api/education/hacking/instances') data = { instances: [] }
    else if (path === '/api/education/hacking/scoreboard') data = { scoreboard: [] }
    else throw new Error(`Unexpected URL ${path}`)
    return { data }
  })
  vi.mocked(client.post).mockReset().mockImplementation(async () => { solved = true; return { data: { correct: true, solved: true } } })
  vi.mocked(client.put).mockReset().mockResolvedValue({ data: {} })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('database-backed education', () => {
  it.each([
    '/education/hacking/challenges',
    '/education/hacking/curriculum',
    '/education/hacking/scoreboard',
    '/education/hacking/instances',
    '/education/algorithms',
    '/education/subjects/custom',
    '/education/courses/hacking-first-year',
  ])('shows only one failure state on %s when all requests fail', async (path) => {
    authenticated()
    vi.mocked(client.get).mockRejectedValue(new Error('offline'))
    renderAt(path)
    await screen.findByRole('alert')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: '다시 불러오기' })).toHaveLength(1)
  })
  it('loads subjects and counts from the backend without CTF-specific requests', async () => {
    renderAt('/education')
    await screen.findByRole('heading', { name: '해킹' })
    expect(screen.getByText('10개 과정')).toBeTruthy()
    expect(client.get).toHaveBeenCalledTimes(1)
    expect(headerSubNavItems.education?.[0].children?.every((item) => item.path.startsWith('/education/hacking/'))).toBe(true)
  })
  it('keeps algorithms separate and displays the database empty state', async () => {
    renderAt('/education/algorithms')
    await screen.findByText('등록된 과정이 없습니다.')
    expect(screen.getByRole('heading', { name: '알고리즘', level: 1 })).toBeTruthy()
    expect(vi.mocked(client.get).mock.calls.some(([path]) => path?.includes('/hacking/'))).toBe(false)
  })
  it('loads challenges publicly and offers the existing Coala login only', async () => {
    renderAt('/education/hacking/challenges')
    await screen.findByRole('link', { name: 'CORS Misconfig' })
    expect(screen.queryByRole('link', { name: '로그인' })).toBeNull()
    expect(screen.queryByText('별도 CTF 실습 계정')).toBeNull()
  })
  it('uses Coala authentication for submissions and refreshes solved state', async () => {
    authenticated(); renderAt('/education/hacking/challenges/web-cors')
    await screen.findByRole('heading', { name: 'CORS Misconfig' })
    fireEvent.change(screen.getByLabelText('플래그'), { target: { value: 'school{test-only}' } })
    fireEvent.click(screen.getByRole('button', { name: '제출' }))
    await screen.findByText('정답입니다. 문제를 해결했습니다.')
    expect(client.post).toHaveBeenCalledWith('/api/education/hacking/submit', { challenge_id: 'web-cors', flag: 'school{test-only}' }, expect.any(Object))
    expect(document.querySelector('script')).toBeNull()
  })
  it('uses all six backend tracks and related guide documents', async () => {
    renderAt('/education/hacking/curriculum')
    await screen.findByRole('tab', { name: 'bob-prep' })
    expect(screen.getAllByRole('tab')).toHaveLength(6)
    expect(await screen.findByRole('link', { name: /교육 프로그램/ })).toBeTruthy()
  })
  it('persists lesson completion through the course progress API', async () => {
    authenticated(); renderAt('/education/courses/hacking-first-year')
    await screen.findByRole('checkbox', { name: '학습 완료' })
    fireEvent.click(screen.getByRole('checkbox', { name: '학습 완료' }))
    await waitFor(() => expect(client.put).toHaveBeenCalledWith('/api/education/courses/hacking-first-year/progress/w01', { completed: true }))
    await waitFor(() => expect((screen.getByRole('checkbox', { name: '학습 완료' }) as HTMLInputElement).checked).toBe(true))
  })
  it('does not fabricate subjects when the backend is unavailable', async () => {
    authenticated()
    vi.mocked(client.get).mockRejectedValue(new Error('offline'))
    renderAt('/education')
    await screen.findByRole('alert')
    expect(screen.queryByRole('heading', { name: '해킹' })).toBeNull()
    expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeTruthy()
  })
})
