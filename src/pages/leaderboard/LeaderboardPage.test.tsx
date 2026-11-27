import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { usersApi, type ActivityMember } from '../../shared/api/users'
import { loadRecentAttendanceRecords } from '../../shared/activityRepository'
import type { StudyRecord } from '../../shared/activity'
import { LeaderboardPage } from './LeaderboardPage'

vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('../../shared/api/users', () => ({ usersApi: { getUsers: vi.fn() } }))
vi.mock('../../shared/activityRepository', () => ({ loadRecentAttendanceRecords: vi.fn() }))
const member = (id: string, name: string) => ({ id, name, githubHandle: name, role: '일반', grade: '3학년', lab: '', focus: '', sharedRepos: [], awards: [] } as unknown as ActivityMember)
const record = (id: string, attendance: StudyRecord['attendance']) => ({ id, attendance } as StudyRecord)
const mount = () => render(<MemoryRouter><LeaderboardPage /></MemoryRouter>)
beforeEach(() => {
  vi.mocked(usersApi.getUsers).mockResolvedValue([member('1', '가람'), member('2', '나래'), member('3', '다온')])
})
it('ranks confirmed attendance instead of directory order and excludes absences', async () => {
  vi.mocked(loadRecentAttendanceRecords).mockResolvedValue([
    record('1', [{ userId: '1', name: '가람', status: 'absent' }, { userId: '2', name: '나래', status: 'present' }, { userId: '3', name: '다온', status: 'present' }]),
    record('2', [{ userId: '3', name: '다온', status: 'present' }]),
  ])
  mount()
  const region = await screen.findByRole('region', { name: '출석 우수 멤버' })
  const cards = within(region).getAllByRole('link', { name: /프로필$/ })
  expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual(['다온 프로필', '나래 프로필'])
})
it('shows an empty attendance state without presenting arbitrary members as leaders', async () => {
  vi.mocked(loadRecentAttendanceRecords).mockResolvedValue([])
  mount()
  expect(await screen.findByText('최근 30일간 확인된 출석 기록이 없습니다.')).toBeTruthy()
  expect(within(screen.getByRole('region', { name: '출석 우수 멤버' })).queryByRole('link', { name: /프로필$/ })).toBeNull()
})

it('distinguishes a failed read from an empty directory and supports retry', async () => {
  vi.mocked(loadRecentAttendanceRecords).mockResolvedValue([])
  vi.mocked(usersApi.getUsers).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([])
  mount()
  await screen.findByRole('alert')
  expect(screen.queryByText('전체 멤버')).toBeNull()
  expect(screen.queryByRole('region', { name: '전체 유저 목록' })).toBeNull()
  expect(screen.queryByText('멤버 0명')).toBeNull()
  expect(screen.queryByText('조건에 맞는 유저가 없습니다.')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))
  await screen.findByText('멤버 0명')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByText('조건에 맞는 유저가 없습니다.')).toBeTruthy()
})
