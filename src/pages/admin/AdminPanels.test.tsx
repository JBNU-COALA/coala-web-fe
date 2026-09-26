// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { adminApi } from '../../shared/api/admin'
import { siteApi, type SiteBanner } from '../../shared/api/site'
import type { MemberService } from '../../shared/api/services'
import { AdminAboutPanel } from './AdminAboutPanel'
import { AdminActivityPanel } from './AdminActivityPanel'
import { AdminBannersPanel } from './AdminBannersPanel'
import { AdminBoardsPanel } from './AdminBoardsPanel'
import { AdminDomainsPanel } from './AdminDomainsPanel'
import { AdminServicesPanel } from './AdminServicesPanel'
import { AdminInquiriesPanel } from './AdminInquiriesPanel'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('admin management panels', () => {
  it.each(['instances', 'domains'] as const)('reads full %s inquiries and saves a required answer through the matching API', async (kind) => {
    const inquiry = { id: 'inq-test', title: '문의 테스트', summary: '짧은 요약', content: '전체 문의 내용입니다. 요약에서 잘리지 않은 상세 요청입니다.', author: '회원', createdAt: '2026-09-26', status: '검토 중', statusClass: 'status--pending', reply: '', answeredAt: null }
    vi.spyOn(adminApi, kind === 'instances' ? 'getInstanceInquiries' : 'getDomainInquiries').mockResolvedValue([inquiry])
    const save = vi.spyOn(adminApi, 'updateInquiry').mockImplementation(async (_kind, _id, data) => ({ ...inquiry, ...data }))
    render(<AdminInquiriesPanel kind={kind} refreshKey={0} />)
    fireEvent.click(await screen.findByRole('button', { name: /문의 테스트/ }))
    expect(screen.getByText(inquiry.content)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('문의 처리 상태'), { target: { value: 'answered' } })
    expect((screen.getByRole('button', { name: '문의 답변 저장' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('관리자 답변'), { target: { value: '확인 후 처리했습니다.' } })
    fireEvent.click(screen.getByRole('button', { name: '문의 답변 저장' }))
    await screen.findByText('문의 답변과 상태를 저장했습니다.')
    expect(save).toHaveBeenCalledWith(kind, 'inq-test', { status: 'answered', reply: '확인 후 처리했습니다.' })
  })

  it('preserves inquiry replies after API failure', async () => {
    vi.spyOn(adminApi, 'getInstanceInquiries').mockResolvedValue([{ id: 'inq-failure', title: '문의 실패', summary: '요약', author: '회원', createdAt: '', status: 'open', statusClass: '' }])
    vi.spyOn(adminApi, 'updateInquiry').mockRejectedValue(new Error('unavailable'))
    render(<AdminInquiriesPanel kind="instances" refreshKey={0} />)
    fireEvent.click(await screen.findByRole('button', { name: /문의 실패/ }))
    fireEvent.change(screen.getByLabelText('관리자 답변'), { target: { value: '작성 중인 답변' } })
    fireEvent.click(screen.getByRole('button', { name: '문의 답변 저장' }))
    await screen.findByText('문의 저장에 실패했습니다. 답변은 유지됩니다. 잠시 후 다시 시도해 주세요.')
    expect((screen.getByLabelText('관리자 답변') as HTMLTextAreaElement).value).toBe('작성 중인 답변')
  })

  it('does not replace failed about reads with editable defaults, and supports retry', async () => {
    const get = vi.spyOn(siteApi, 'getAbout').mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue({ title: '소개', description: '내용', chips: [] })
    render(<MemoryRouter><AdminAboutPanel refreshKey={0} /></MemoryRouter>)
    await screen.findByRole('alert')
    expect(screen.queryByRole('button', { name: '소개 저장' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))
    await screen.findByRole('button', { name: '소개 저장' })
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('persists the existing about contract and preserves text on failed saves', async () => {
    vi.spyOn(siteApi, 'getAbout').mockResolvedValue({ title: '소개', description: '내용', chips: ['스터디'] })
    const save = vi.spyOn(siteApi, 'updateAbout').mockRejectedValue(new Error('offline'))
    render(<MemoryRouter><AdminAboutPanel refreshKey={0} /></MemoryRouter>)
    await screen.findByRole('button', { name: '소개 저장' })
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '새 소개' } })
    fireEvent.change(screen.getByLabelText('키워드 (쉼표 구분)'), { target: { value: '스터디, 프로젝트' } })
    fireEvent.click(screen.getByRole('button', { name: '소개 저장' }))
    await screen.findByText('소개 저장에 실패했습니다. 입력 내용은 유지됩니다.')
    expect(save).toHaveBeenCalledWith({ title: '새 소개', description: '내용', chips: ['스터디', '프로젝트'] })
    expect((screen.getByLabelText('제목') as HTMLInputElement).value).toBe('새 소개')
  })

  it('creates banners using the full payload, rejects unsafe targets and locks duplicate saves', async () => {
    vi.spyOn(adminApi, 'getBanners').mockResolvedValue([])
    let finish: (banner: SiteBanner) => void = () => {}
    const create = vi.spyOn(adminApi, 'createBanner').mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    render(<AdminBannersPanel refreshKey={0} />)
    await screen.findByText('등록된 배너가 없습니다.')
    fireEvent.change(screen.getByLabelText('제목'), { target: { value: '신규 배너' } })
    fireEvent.change(screen.getByLabelText('이동 경로'), { target: { value: '/%252fexample.com' } })
    expect((screen.getByRole('button', { name: '배너 저장' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('이동 경로'), { target: { value: '/about' } })
    fireEvent.click(screen.getByRole('button', { name: '배너 저장' }))
    fireEvent.click(screen.getByRole('button', { name: '저장 중...' }))
    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith({ title: '신규 배너', eyebrow: '', description: '', imageUrl: '', targetPath: '/about', actionLabel: '자세히 보기', tone: 'green', sortOrder: 0, enabled: false })
    finish({ id: 1, ...create.mock.calls[0][0] })
    await screen.findByRole('heading', { name: '배너 수정' })
  })

  it('edits order and visibility and deletes only after confirmation', async () => {
    const banner: SiteBanner = { id: 3, title: '기존 배너', eyebrow: '', description: '', imageUrl: '', targetPath: '/about', actionLabel: '보기', tone: 'blue', sortOrder: 5, enabled: true }
    vi.spyOn(adminApi, 'getBanners').mockResolvedValue([banner])
    const update = vi.spyOn(adminApi, 'updateBanner').mockImplementation(async (id, payload) => ({ id, ...payload }))
    const remove = vi.spyOn(adminApi, 'deleteBanner').mockResolvedValue(undefined)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<AdminBannersPanel refreshKey={0} />)
    fireEvent.click(await screen.findByRole('button', { name: /기존 배너/ }))
    fireEvent.change(screen.getByLabelText('노출 순서'), { target: { value: '2' } })
    fireEvent.click(screen.getByLabelText('홈에 공개'))
    fireEvent.click(screen.getByRole('button', { name: '배너 저장' }))
    await screen.findByText('배너를 저장했습니다.')
    expect(update).toHaveBeenCalledWith(3, expect.objectContaining({ sortOrder: 2, enabled: false, tone: 'blue' }))
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    expect(remove).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    await screen.findByText('등록된 배너가 없습니다.')
    expect(remove).toHaveBeenCalledWith(3)
  })

  it('updates board name and description without attempting to change the immutable type', async () => {
    const update = vi.spyOn(adminApi, 'updateBoard').mockResolvedValue({ boardId: 4, status: 'updated' })
    const onChange = vi.fn()
    render(<AdminBoardsPanel boards={[{ boardId: 4, boardName: '공지', categoryKey: 'notice', description: '기존', boardType: 'NORMAL', isActive: true, createdAt: '', updatedAt: '' }]} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('게시판 이름'), { target: { value: '새 이름' } })
    fireEvent.change(screen.getByLabelText('설명'), { target: { value: '새 설명' } })
    fireEvent.click(screen.getByRole('button', { name: '게시판 저장' }))
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(update).toHaveBeenCalledWith(4, { boardName: '새 이름', description: '새 설명', isActive: true })
    expect((screen.getByLabelText('유형') as HTMLSelectElement).disabled).toBe(true)
    expect((screen.getByLabelText('분류') as HTMLSelectElement).disabled).toBe(true)
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ boardName: '새 이름', categoryKey: 'notice' })])
  })

  it('creates NORMAL boards with explicit classification', async () => {
    const create = vi.spyOn(adminApi, 'createBoard').mockResolvedValue({ boardId: 9, boardName: '새 공지', createdAt: '2026-09-26' })
    const onChange = vi.fn()
    render(<AdminBoardsPanel boards={[]} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('게시판 이름'), { target: { value: '새 공지' } })
    fireEvent.change(screen.getByLabelText('분류'), { target: { value: 'notice' } })
    fireEvent.click(screen.getByRole('button', { name: '게시판 저장' }))
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(create).toHaveBeenCalledWith({ boardName: '새 공지', boardType: 'NORMAL', description: '', categoryKey: 'notice' })
  })

  it('omits categoryKey for non-NORMAL board creation', async () => {
    const create = vi.spyOn(adminApi, 'createBoard').mockResolvedValue({ boardId: 10, boardName: '익명', createdAt: '2026-09-26' })
    const onChange = vi.fn()
    render(<AdminBoardsPanel boards={[]} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('게시판 이름'), { target: { value: '익명' } })
    fireEvent.change(screen.getByLabelText('유형'), { target: { value: 'ANONYMOUS' } })
    fireEvent.click(screen.getByRole('button', { name: '게시판 저장' }))
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(create).toHaveBeenCalledWith({ boardName: '익명', boardType: 'ANONYMOUS', description: '' })
  })

  it('retains service media, owner and completed status when saving', async () => {
    const service: MemberService = { id: 'svc-1', title: '서비스', category: 'learning', owner: '운영자', summary: '요약', url: 'https://example.com', githubUrl: 'https://github.com/example/service', imageUrl: '/service.png', additionalImageUrls: ['/second.png'], tags: ['학습'], status: '운영완료', audience: '', visibility: '', period: '', description: '', features: [], stack: [] }
    const update = vi.spyOn(adminApi, 'updateMemberService').mockResolvedValue(service)
    render(<AdminServicesPanel services={[service]} onChange={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('요약'), { target: { value: '바뀐 요약' } })
    fireEvent.click(screen.getByRole('button', { name: '서비스 저장' }))
    await screen.findByText('서비스를 저장했습니다.')
    expect(update).toHaveBeenCalledWith('svc-1', expect.objectContaining({ summary: '바뀐 요약', owner: '운영자', status: '운영완료', githubUrl: service.githubUrl, imageUrl: '/service.png', additionalImageUrls: ['/second.png'] }))
  })

  it('requests a bounded activity month and provides group, record and editor links', async () => {
    vi.spyOn(adminApi, 'getStudyGroups').mockResolvedValue([{ id: '4', name: '스터디 A', members: [{ userId: '2', name: '참여자' }], canManage: true }])
    const records = vi.spyOn(adminApi, 'getStudyRecords').mockResolvedValue([{ id: '7', groupId: '4', title: '활동 기록 A', date: '2026-09-01', content: '내용', attendance: [{ userId: '2', name: '참여자', status: 'present' }], updatedAt: '', canManage: true }])
    render(<MemoryRouter><AdminActivityPanel refreshKey={0} /></MemoryRouter>)
    await screen.findByRole('link', { name: '활동 기록 A' })
    fireEvent.change(screen.getByLabelText('활동 조회 월'), { target: { value: '2026-02' } })
    await waitFor(() => expect(records).toHaveBeenLastCalledWith('2026-02-01', '2026-02-28'))
    await screen.findByRole('link', { name: '기록 수정' })
    expect(screen.getByRole('link', { name: /스터디 A/ }).getAttribute('href')).toBe('/community/activity?group=4')
    expect(screen.getByRole('link', { name: '기록 수정' }).getAttribute('href')).toBe('/community/activity/records/7/editor')
  })

  it('saves domain approvals and notes through the existing service API', async () => {
    const application = { id: 'd-1', applicantName: '신청자', studentId: '20260001', contactEmail: 'test@example.com', serviceName: '테스트 도메인', desiredAddress: 'test', requestedDomain: 'test.example.com', repositoryUrl: '', purpose: '테스트', requestedAt: '2026-09-01', status: 'pending' as const }
    vi.spyOn(adminApi, 'getDomainApplications').mockResolvedValue([application])
    vi.spyOn(adminApi, 'getDomainInquiries').mockResolvedValue([])
    const update = vi.spyOn(adminApi, 'updateDomainApplication').mockResolvedValue({ ...application, status: 'approved' })
    render(<AdminDomainsPanel refreshKey={0} />)
    fireEvent.click(await screen.findByRole('button', { name: /테스트 도메인/ }))
    fireEvent.change(screen.getByLabelText('처리 상태'), { target: { value: 'approved' } })
    fireEvent.change(screen.getByLabelText('관리자 메모'), { target: { value: '승인 메모' } })
    fireEvent.click(screen.getByRole('button', { name: '신청 처리 저장' }))
    await screen.findByText('신청 처리를 저장했습니다.')
    expect(update).toHaveBeenCalledWith('d-1', { status: 'approved', adminNote: '승인 메모' })
    expect(screen.queryByRole('button', { name: /테스트 도메인/ })).toBeNull()
  })
})
