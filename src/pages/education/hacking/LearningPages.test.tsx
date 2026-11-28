import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { createCtfApi } from './api'
import { CtfScoreboard } from './LearningPages'

it('uses the current account name by user ID and renders podium ranks', async () => {
  const api = createCtfApi()
  vi.spyOn(api, 'scoreboard').mockResolvedValue({ scoreboard: [
    { userId: 12, rank: 1, username: '학습자 12', points: 100, solved: 3 },
    { userId: 13, rank: 2, username: '최홍석', points: 70, solved: 2 },
    { userId: 14, rank: 3, username: '코알라', points: 30, solved: 1 },
  ] })
  render(<MemoryRouter><CtfScoreboard api={api} session={{ user: { id: 12, username: '최홍석', is_admin: false } }} /></MemoryRouter>)
  const table = await screen.findByRole('table')
  expect(screen.queryByText('학습자 12')).toBeNull()
  expect(within(table).getAllByText('나')).toHaveLength(1)
  const podium = screen.getByLabelText('상위 3명')
  expect(within(podium).getAllByRole('article')).toHaveLength(3)
  expect(within(podium).getByText('1위')).toBeTruthy()
  expect(within(podium).getByText('2위')).toBeTruthy()
  expect(within(podium).getByText('3위')).toBeTruthy()
  fireEvent.change(screen.getByPlaceholderText('참여자 이름 검색'), { target: { value: '코알라' } })
  expect(within(table).queryByText('최홍석')).toBeNull()
  expect(within(table).getByText('코알라')).toBeTruthy()
})

it('shows empty podium places without inventing participants', async () => {
  const api = createCtfApi()
  vi.spyOn(api, 'scoreboard').mockResolvedValue({ scoreboard: [{ userId: 12, rank: 1, username: '코알라', points: 30, solved: 1 }] })
  render(<MemoryRouter><CtfScoreboard api={api} session={null} /></MemoryRouter>)
  await screen.findByRole('table')
  expect(screen.getAllByText('다음 주인공을 기다려요')).toHaveLength(2)
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2)
})
