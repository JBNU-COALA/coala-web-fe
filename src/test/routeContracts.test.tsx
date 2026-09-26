import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

// Contract fixtures are test-only and are never imported by the application.
const mock = vi.hoisted(() => ({ get: vi.fn(), updateUser: vi.fn(), logout: vi.fn(), loggedIn: true }))
vi.mock('../shared/auth/AuthContext', () => ({ useAuth: () => ({
  isLoggedIn: mock.loggedIn, user: mock.loggedIn ? { id: 7, name: '레이아웃 테스트', email: 'layout@example.invalid', role: 'SUPER_ADMIN', verified: true, grade: 3, academicStatus: 'ENROLLED', department: '컴퓨터인공지능학부' } : null,
  updateUser: mock.updateUser, logout: mock.logout,
}) }))
vi.mock('../shared/api/client', async (original) => ({
  ...await original<typeof import('../shared/api/client')>(),
  default: { get: mock.get, post: vi.fn().mockRejectedValue(new Error('Writes disabled in layout tests')), patch: vi.fn().mockRejectedValue(new Error('Writes disabled in layout tests')), delete: vi.fn().mockRejectedValue(new Error('Writes disabled in layout tests')) },
}))

const board = { boardId: 2, boardName: '자유', categoryKey: 'free', boardType: 'NORMAL', description: '', isActive: true, createdAt: '', updatedAt: '' }
const post = { boardId: 2, postId: 1, userId: 7, authorName: '레이아웃 테스트', title: '함께 만드는 프로젝트, 이번 주에 나눈 이야기와 다음에 해보고 싶은 일', content: '레이아웃 검증용 콘텐츠입니다. 긴 제목과 여러 줄 본문에서도 영역이 겹치지 않는지 확인합니다.', viewCount: 12, commentCount: 3, likeCount: 2, createdAt: '2026-09-26T10:00:00' }
const info = { id: 1, filter: 'news', title: '함께 배우고 만드는 개발 이야기', content: '모바일에서도 이미지와 본문이 자연스럽게 연결되는지 확인하는 테스트 게시글입니다.', meta: '소식', source: '코알라', sourceName: '코알라', sourceDate: '2026-09-26', tag: '개발', imageUrl: '/coala-card-placeholder.png', authorId: 7, authorName: '레이아웃 테스트', viewCount: 12, bookmarkCount: 2 }
const group = { id: '3', name: '웹 개발 스터디', recruitId: '1', canManage: true, members: [{ userId: '7', name: '레이아웃 테스트' }] }
const member = { id: 7, name: '레이아웃 테스트', initials: '테', tone: 'mint', role: '일반', grade: '3학년', lab: '컴퓨터인공지능학부', githubHandle: '', githubUrl: '', focus: '웹 개발', bio: '함께 배우고, 만들고, 기록합니다.', activityNote: '', awardNote: '', recentCommit: '', sharedRepos: [], logs: [], solvedHandle: '', solvedTier: 'unrated', solvedCount: 0, githubCommits: 0, totalPoints: 0, awards: [], customization: { avatarTone: 'mint', headline: '함께 만드는 개발', profileImageUrl: '', links: [] } }
const overview = { isSelf: true, items: [{ id: 'post:1', kind: 'board', label: '게시판', title: post.title, excerpt: post.content, boardId: 2, postId: 1, createdAt: post.createdAt }], counts: { studyGroups: 1, studyRecords: 4, authoredPosts: 3, infoArticles: 2, recruits: 1, services: 1, recruitApplications: 2, pendingRecruitApplications: 1, savedRecruits: 3, instanceApplications: 1, domainApplications: 0 } }
const recruit = { id: '1', title: '웹 서비스를 함께 만들어 볼 팀원을 모집합니다', shortDesc: '기획부터 배포까지 함께해요.', category: 'project', status: 'open', currentMembers: 2, maxMembers: 4, host: '레이아웃 테스트', authorId: 7, authorName: '레이아웃 테스트', hostInitials: '테', hostTone: 'mint', hostRole: '팀장', trustScore: 0, tags: ['React', 'Spring'], techStack: ['React', 'TypeScript'], roles: [{ label: '개발자', current: 2, max: 4 }], meetingType: '온라인', expectedDuration: '8주', detailContent: ['팀 프로젝트 테스트'], processList: [], comments: [], createdAt: '2026-09-26', views: 12, bookmarks: 3 }

beforeEach(() => {
  mock.loggedIn = true
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  mock.get.mockImplementation(async (path: string) => {
    const fixed: Record<string, unknown> = {
      '/api/boards': [board], '/api/boards/2/posts': [post],
      '/api/info': [info, { ...info, id: 2, filter: 'contest', title: '새로운 도전을 위한 개발 대회' }, { ...info, id: 3, filter: 'lab' }],
      '/api/site/banners': [{ id: 1, title: 'COALA Developer Club', eyebrow: 'TOGETHER WE BUILD', description: '함께 만들고 운영하는 개발 동아리', imageUrl: '', targetPath: '/about', actionLabel: '동아리 소개', tone: 'green', sortOrder: 0, enabled: true }, { id: 2, title: '배우고, 나누고, 함께.', eyebrow: 'COMMUNITY', description: '새로운 이야기와 함께할 사람들을 만나보세요.', imageUrl: '', targetPath: '/community/board', actionLabel: '커뮤니티', tone: 'blue', sortOrder: 1, enabled: true }],
      '/api/site/about': { title: '함께 만들고 운영하는 개발 동아리', description: '코알라', chips: [] },
      '/api/services': [], '/api/notifications': [], '/api/notifications/unread-count': { count: 0 },
      '/api/recruits': [recruit], '/api/recruits/applications/me': [], '/api/recruits/bookmarks/me': [],
      '/api/archive': [{ id: 1, category: 'labs', title: '웹 개발 연구 세미나', summary: '레이아웃 테스트용 연구 자료입니다.', labName: '개발 연구실', materialType: 'SEMINAR', content: '', sourceUrl: '', repositoryUrl: '', tags: ['웹', '세미나'], ownerId: 7, ownerName: '레이아웃 테스트' }],
      '/api/users/7': member, '/api/users/7/overview': overview, '/api/users/me/account': { id: 7, name: member.name, role: 'SUPER_ADMIN', verified: true },
      '/api/study/groups': [group], '/api/study/records': [],
      '/api/info/bookmarks/me': [],
    }
    if (path in fixed) return { data: fixed[path] }
    if (path.startsWith('/api/services/') && /applications|inquiries/.test(path)) return { data: [] }
    throw new Error(`Unmocked layout read: ${path}`)
  })
})
afterEach(cleanup)

describe('route layout contracts', () => {
  it('protects the user directory with the same authentication policy as profiles', async () => {
    mock.loggedIn = false
    render(<MemoryRouter initialEntries={['/users']}><App /></MemoryRouter>)
    await screen.findByRole('heading', { name: '로그인' }, { timeout: 15000 })
    expect(mock.get.mock.calls.some(([path]) => path === '/api/users')).toBe(false)
  })
  it.each([
    ['home', '/', 'COALA Developer Club'],
    ['board', '/community/board', '게시판'],
    ['info', '/community/info', '정보공유'],
    ['archive', '/archive/labs', '연구실 자료'],
    ['profile', '/users/7', '마이페이지'],
    ['activity', '/community/activity', '활동'],
    ['recruit', '/community/recruit', '모집'],
  ])('renders %s without real API requests', async (_name, path, heading) => {
    const { container } = render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
    await screen.findByRole('heading', { name: heading }, { timeout: 15000 })
    await waitFor(() => expect(container.textContent).not.toContain('불러오는 중'), { timeout: 15000 })
    expect(container.querySelector('main')).toBeTruthy()
  }, 20000)
})
