import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminEducationApi } from '../../shared/api/adminEducation'
import type { EducationSubject, EducationCourse } from '../../shared/api/education'
import { AdminEducationPanel } from './AdminEducationPanel'
import { AdminEducationEditor } from './AdminEducationEditor'
import { AdminSeedPanel } from './AdminSeedPanel'

vi.mock('../../shared/api/adminEducation', () => ({ adminEducationApi: { subjects: vi.fn(), courses: vi.fn(), challenges: vi.fn(), course: vi.fn(), challenge: vi.fn(), seed: vi.fn(), install: vi.fn(), save: vi.fn(), upload: vi.fn() } }))
const subjects: EducationSubject[] = [{ id: 'hacking', name: '해킹', topics: '보안', courseCount: 10, published: true, sortOrder: 0, version: 0 }, { id: 'algorithms', name: '알고리즘', topics: '문제 해결', courseCount: 0, published: true, sortOrder: 1, version: 0 }]
beforeEach(() => {
  vi.mocked(adminEducationApi.subjects).mockResolvedValue(subjects)
  vi.mocked(adminEducationApi.courses).mockResolvedValue([])
  vi.mocked(adminEducationApi.challenges).mockResolvedValue([])
  vi.mocked(adminEducationApi.save).mockReset().mockResolvedValue({ id: 'saved', version: 0 })
  vi.mocked(adminEducationApi.seed).mockReset().mockResolvedValue({ available: true, challenges: 120, courses: 10, assets: 104, missingChallenges: 120, missingCourses: 10, missingAssets: 104 })
  vi.mocked(adminEducationApi.install).mockReset().mockResolvedValue({ subjectsCreated: 0, challengesCreated: 120, coursesCreated: 10, assetsCreated: 104, skipped: 2 })
})
afterEach(cleanup)
describe('education administrator workflows', () => {
  it('defaults new courses to the selected subject and never requires lesson JSON', async () => {
    render(<AdminEducationPanel />)
    await screen.findByRole('button', { name: '해킹 편집' })
    fireEvent.click(screen.getByRole('button', { name: '과정 · 문서' }))
    fireEvent.change(screen.getByLabelText('분야 필터'), { target: { value: 'algorithms' } })
    fireEvent.click(screen.getByRole('button', { name: '새 항목' }))
    expect((screen.getByLabelText('교육 분야') as HTMLSelectElement).value).toBe('algorithms')
    expect(screen.queryByLabelText('단원 JSON')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '단원 추가' }))
    expect(screen.getByLabelText('단원 1 제목')).toBeTruthy()
    expect(screen.queryByText('연결 문제')).toBeNull()
  })
  it('saves new subjects through the backend with generated IDs', async () => {
    render(<AdminEducationPanel />)
    await screen.findByRole('button', { name: '해킹 편집' })
    fireEvent.click(screen.getByRole('button', { name: '새 항목' }))
    fireEvent.change(screen.getByLabelText('이름 · 제목'), { target: { value: '데이터 과학' } })
    fireEvent.change(screen.getByLabelText('분야 소개'), { target: { value: '분석 · 모델링' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(adminEducationApi.save).toHaveBeenCalledWith('subjects', expect.stringMatching(/^subject-/), expect.objectContaining({ name: '데이터 과학', version: null, published: false })))
    await screen.findByText('저장했습니다.')
  })
  it('uses the current version for edits and keeps drafts after failed saves', async () => {
    vi.mocked(adminEducationApi.save).mockRejectedValue(new Error('unavailable'))
    render(<AdminEducationPanel />)
    fireEvent.click(await screen.findByRole('button', { name: '해킹 편집' }))
    fireEvent.change(screen.getByLabelText('이름 · 제목'), { target: { value: '정보보안' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await screen.findByRole('alert')
    expect(adminEducationApi.save).toHaveBeenCalledWith('subjects', 'hacking', expect.objectContaining({ name: '정보보안', version: 0 }))
    expect((screen.getByLabelText('이름 · 제목') as HTMLInputElement).value).toBe('정보보안')
  })
  it('requires confirmation for one-click bootstrap and refreshes the registered counts', async () => {
    render(<AdminSeedPanel />)
    await screen.findByText('120')
    fireEvent.click(screen.getByRole('button', { name: '미등록 데이터 등록' }))
    expect(adminEducationApi.install).not.toHaveBeenCalled()
    const confirmation = screen.getByRole('alertdialog', { name: '기본 교육팩 등록 확인' })
    fireEvent.click(within(confirmation).getByRole('button', { name: '등록' }))
    await screen.findByText('등록 완료 · 문제 120 · 과정 10 · 첨부 104')
    expect(adminEducationApi.install).toHaveBeenCalledTimes(1)
  })
  it('does not offer fabricated seed data or an enabled install button when key configuration is missing', async () => {
    vi.mocked(adminEducationApi.seed).mockResolvedValue({ available: false, reason: 'KEY_NOT_CONFIGURED' })
    render(<AdminSeedPanel />)
    await screen.findByText('서버 설정 필요')
    expect((screen.getByRole('button', { name: '미등록 데이터 등록' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByText('120')).toBeNull()
  })
  it('edits lesson structure while preserving stable lesson IDs', async () => {
    const course: EducationCourse = { id: 'course-one', subjectId: 'hacking', slug: 'course-one', title: '기존 과정', description: '', content: '', level: 'beginner', kind: 'COURSE', weeks: [{ id: 'w01', title: '기존 단원', goals: [], tools: [], challenges: [], homework: '' }], completedLessons: [], sortOrder: 0, published: true, version: 4 }
    const saved = vi.fn().mockResolvedValue(undefined)
    render(<AdminEducationEditor kind="courses" subjectId="hacking" initial={course} subjects={subjects} challenges={[]} onSaved={saved} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '단원 추가' }))
    fireEvent.change(screen.getByLabelText('단원 2 제목'), { target: { value: '다음 단원' } })
    expect(screen.getByLabelText('단원 2 제목').closest('details')?.open).toBe(true)
    fireEvent.change(screen.getByLabelText('단원 2 학습 목표'), { target: { value: '목표 하나\n\n목표 둘' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(adminEducationApi.save).toHaveBeenCalled())
    const payload = vi.mocked(adminEducationApi.save).mock.calls[0][2] as { weeks: EducationCourse['weeks']; version: number }
    expect(payload.version).toBe(4)
    expect(payload.weeks[0].id).toBe('w01')
    expect(payload.weeks[1].id).toMatch(/^lesson-/)
    expect(payload.weeks[1].goals).toEqual(['목표 하나', '목표 둘'])
  })
})
