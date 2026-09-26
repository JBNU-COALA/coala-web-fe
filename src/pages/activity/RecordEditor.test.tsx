import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RecordEditor } from './RecordEditor'
import { activityToday, shiftDate, type StudyGroup, type StudyRecord } from '../../shared/activity'

vi.mock('./ParticipantPicker', () => ({ ParticipantPicker: () => null }))
vi.mock('./ActivityPhotos', () => ({ ActivityPhotos: () => null }))
afterEach(cleanup)
const group: StudyGroup = { id: '3', name: 'Study group', canManage: true, members: [{ userId: '7', name: 'Member' }] }
const record: StudyRecord = { id: 'record-1', groupId: null, title: 'Standalone', date: activityToday(), content: 'Notes', attendance: [], updatedAt: '', version: 2 }

describe('attendance editor context', () => {
  it('initializes the selected group, roster and past date', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const date = shiftDate(activityToday(), -7)
    const { container } = render(<MemoryRouter><RecordEditor data={{ groups: [group], records: [] }} initialGroup="3"
      initialDate={date} back="/community/activity" onSave={save} /></MemoryRouter>)
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('3')
    expect((screen.getByLabelText('날짜') as HTMLInputElement).value).toBe(date)
    expect(screen.getByRole('radio', { name: '미확인' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: 'Weekly notes' } })
    fireEvent.change(screen.getByLabelText('오늘 어떤 활동을 했나요?'), { target: { value: 'Study notes' } })
    fireEvent.click(screen.getByRole('radio', { name: '출석' }))
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({
      groupId: '3', date, attendance: [{ userId: '7', name: 'Member', status: 'present' }],
    })))
  })
  it('does not silently attach a standalone record to the group filter', () => {
    render(<MemoryRouter><RecordEditor data={{ groups: [group], records: [record] }} record={record}
      initialGroup="3" back="/community/activity" onSave={vi.fn()} /></MemoryRouter>)
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('')
    expect(screen.queryByRole('radio')).toBeNull()
  })
  it('uses today instead of preselecting a future attendance date', () => {
    render(<MemoryRouter><RecordEditor data={{ groups: [], records: [] }} initialGroup="all"
      initialDate={shiftDate(activityToday(), 7)} back="/community/activity" onSave={vi.fn()} /></MemoryRouter>)
    expect((screen.getByLabelText('날짜') as HTMLInputElement).value).toBe(activityToday())
  })
  it('retains content and attendance when saving fails', async () => {
    const { container } = render(<MemoryRouter><RecordEditor data={{ groups: [], records: [record] }} record={record}
      initialGroup="all" back="/community/activity" onSave={vi.fn().mockRejectedValue(new Error('Conflict'))} /></MemoryRouter>)
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Conflict'))
    expect((screen.getByLabelText('제목') as HTMLInputElement).value).toBe('Standalone')
    expect((screen.getByLabelText('오늘 어떤 활동을 했나요?') as HTMLTextAreaElement).value).toBe('Notes')
    expect((screen.getByRole('button', { name: '저장' }) as HTMLButtonElement).disabled).toBe(false)
  })
})
