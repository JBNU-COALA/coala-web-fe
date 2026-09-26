import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { StudyActivityPage } from './StudyActivityPage'
import { loadActivityData, loadActivityEditorData } from '../../shared/activityRepository'
import type { ActivityData } from '../../shared/activity'

vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 7 }, isLoggedIn: true }) }))
vi.mock('../../shared/auth/RequireAuth', () => ({ RequireAuth: ({ children }: { children: ReactNode }) => children }))
vi.mock('../../shared/activityRepository', () => ({ loadActivityData: vi.fn(), loadActivityEditorData: vi.fn(), saveActivityRecord: vi.fn() }))
vi.mock('./ParticipantPicker', () => ({ ParticipantPicker: () => null }))
vi.mock('./ActivityPhotos', () => ({ ActivityPhotos: () => null, ActivityPhotoPreview: () => null }))
vi.mock('./ActivityCalendar', () => ({ ActivityCalendar: ({ onSelect }: { onSelect: (date: string) => void }) =>
  <button type="button" onClick={() => onSelect('2026-09-15')}>Select next day</button> }))
vi.mock('@uiw/react-md-editor/nohighlight', () => ({ default: { Markdown: () => null } }))

const data: ActivityData = { groups: [{ id: '3', name: 'Study group', canManage: true, members: [{ userId: '7', name: 'Member' }] }], records: [] }
afterEach(cleanup)
beforeEach(() => vi.resetAllMocks())
describe('activity loading and navigation', () => {
  it('waits for group data before initializing a new attendance form', async () => {
    let complete!: (value: ActivityData) => void
    vi.mocked(loadActivityEditorData).mockImplementation(() => new Promise((resolve) => { complete = resolve }))
    render(<MemoryRouter initialEntries={['/community/activity/records/new?group=3']}><StudyActivityPage mode="new" /></MemoryRouter>)
    expect(screen.getByRole('status').textContent).toContain('불러오는 중')
    expect(screen.queryByLabelText('제목')).toBeNull()
    await act(async () => complete(data))
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('3')
    expect(screen.getByRole('radio', { name: '미확인' })).toBeTruthy()
  })
  it('does not silently create standalone attendance for an unavailable group', async () => {
    vi.mocked(loadActivityEditorData).mockResolvedValue(data)
    render(<MemoryRouter initialEntries={['/community/activity/records/new?group=missing']}><StudyActivityPage mode="new" /></MemoryRouter>)
    await screen.findByRole('alert')
    expect(screen.queryByLabelText('제목')).toBeNull()
  })
  it('reuses loaded records when changing dates within a calendar month', async () => {
    vi.mocked(loadActivityData).mockResolvedValue(data)
    render(<MemoryRouter initialEntries={['/community/activity?layout=calendar&day=2026-09-14']}><StudyActivityPage /></MemoryRouter>)
    await screen.findByRole('button', { name: 'Select next day' })
    fireEvent.click(screen.getByRole('button', { name: 'Select next day' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /9\. 15\./ })).toBeTruthy())
    expect(loadActivityData).toHaveBeenCalledTimes(1)
    expect(loadActivityData).toHaveBeenCalledWith('2026-09-01', undefined, expect.any(AbortSignal))
  })
})
