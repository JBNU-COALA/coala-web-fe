import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { usersApi } from '../../shared/api/users'
import { LeaderboardPage } from './LeaderboardPage'

vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 } }) }))
vi.mock('../../shared/api/users', () => ({ usersApi: { getUsers: vi.fn() } }))

describe('member directory states', () => {
  it('distinguishes a failed read from an empty directory and supports retry', async () => {
    vi.mocked(usersApi.getUsers).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([])
    render(<MemoryRouter><LeaderboardPage /></MemoryRouter>)
    await screen.findByRole('alert')
    expect(screen.queryByText('멤버 0명')).toBeNull()
    expect(screen.queryByText('조건에 맞는 유저가 없습니다.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))
    await screen.findByText('멤버 0명')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText('조건에 맞는 유저가 없습니다.')).toBeTruthy()
  })
})
