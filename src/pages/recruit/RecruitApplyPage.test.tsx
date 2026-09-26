import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RecruitApplyPage } from './RecruitApplyPage'
import { recruitsApi, type RecruitApplication, type RecruitItem } from '../../shared/api/recruits'
import { useRecruitApplications } from './useRecruitApplications'

vi.mock('../../shared/auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 7 }, isLoggedIn: true }) }))
vi.mock('./useRecruitApplications', () => ({ useRecruitApplications: vi.fn(), applicationStatusLabel: (status: string) => status }))
vi.mock('../../shared/api/recruits', () => ({ recruitsApi: { getRecruit: vi.fn(), apply: vi.fn() } }))
vi.mock('../../shared/markdownImages', () => ({
  createMarkdownImageCommand: () => ({}), insertMarkdownBlockAtRange: vi.fn(),
  readMarkdownImagesFromClipboard: vi.fn(), readMarkdownImagesFromDrop: vi.fn(),
}))
vi.mock('@uiw/react-md-editor/nohighlight', () => ({
  commands: {},
  default: ({ value, onChange, textareaProps }: {
    value: string; onChange: (value: string) => void; textareaProps: { disabled: boolean; 'aria-label': string }
  }) => <textarea {...textareaProps} value={value} onChange={(event) => onChange(event.target.value)} />,
}))

const recruit = { id: 'study-1', title: 'Study', status: 'open', roles: [{ label: 'Backend', current: 0, max: 2 }, { label: 'Frontend', current: 0, max: 2 }] } as RecruitItem
const application: RecruitApplication = { id: 3, recruitId: 'study-1', recruitTitle: 'Study', role: 'Frontend', body: 'Previously submitted content', submittedAt: '', status: 'submitted' }
const show = () => render(<MemoryRouter initialEntries={['/community/recruit/applications/new?id=study-1']}><RecruitApplyPage /></MemoryRouter>)
afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(recruitsApi.getRecruit).mockResolvedValue(recruit)
  vi.mocked(useRecruitApplications).mockReturnValue({ items: [application], loading: false, error: undefined, retry: vi.fn() })
})

describe('recruit application editor', () => {
  it('restores the submitted body and role rather than replacing them with a template', async () => {
    show()
    await waitFor(() => expect((screen.getByLabelText('지원 역할') as HTMLSelectElement).value).toBe('Frontend'))
    expect((screen.getByLabelText('지원 내용') as HTMLTextAreaElement).value).toBe('Previously submitted content')
    expect(screen.getAllByRole('option').map((option) => option.getAttribute('value'))).toEqual(['', 'Backend', 'Frontend'])
  })
  it('prevents changes to an accepted application', async () => {
    vi.mocked(useRecruitApplications).mockReturnValue({ items: [{ ...application, status: 'accepted' }], loading: false, error: undefined, retry: vi.fn() })
    const { container } = show()
    await waitFor(() => expect(screen.getByText('승인된 지원서는 수정할 수 없습니다.')).toBeTruthy())
    fireEvent.submit(container.querySelector('form')!)
    expect(recruitsApi.apply).not.toHaveBeenCalled()
    expect((screen.getByRole('button', { name: '지원서 수정' }) as HTMLButtonElement).disabled).toBe(true)
  })
  it('retains an edited draft after a failed submission', async () => {
    vi.mocked(recruitsApi.apply).mockRejectedValue(new Error('offline'))
    const { container } = show()
    await screen.findByLabelText('지원 내용')
    fireEvent.change(screen.getByLabelText('지원 내용'), { target: { value: 'Keep this new draft' } })
    fireEvent.submit(container.querySelector('form')!)
    await screen.findByRole('alert')
    expect((screen.getByLabelText('지원 내용') as HTMLTextAreaElement).value).toBe('Keep this new draft')
    expect((screen.getByRole('button', { name: '지원서 수정' }) as HTMLButtonElement).disabled).toBe(false)
  })
  it('does not turn an application lookup failure into a new blank application', async () => {
    vi.mocked(useRecruitApplications).mockReturnValue({ items: [], loading: false, error: 'Lookup unavailable', retry: vi.fn() })
    show()
    await screen.findByText('Lookup unavailable')
    expect(screen.queryByLabelText('지원 내용')).toBeNull()
    expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeTruthy()
  })
})
