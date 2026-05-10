import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import {
  adminApi,
  defaultHomeDesign,
  type AdminHomeDesignConfig,
  type AdminOverview,
  type AdminResource,
} from '../../shared/api/admin'
import type { UserData } from '../../shared/api/auth'
import type { BoardData, BoardType } from '../../shared/api/boards'
import type { PostListItem } from '../../shared/api/posts'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { useAuth } from '../../shared/auth/AuthContext'
import { Icon, type IconName } from '../../shared/ui/Icon'
import { resourceCards } from '../../dummy/infoData'
import { communityPosts } from '../../dummy/postsData'
import { recruitItems } from '../../dummy/recruitData'
import { mockApplications } from '../../dummy/serviceData'
import type { ApplyStatus, JcloudApplication } from '../service/serviceData'
import './admin.css'

type AdminTab = 'home-design' | 'stats' | 'users' | 'content' | 'services'
type ContentTab = 'boards' | 'posts' | 'info' | 'recruit' | 'resources'

type AdminInfoItem = {
  id: number
  title: string
  tag: string
  source: string
  visible: boolean
}

type AdminRecruitItem = {
  id: string
  title: string
  category: string
  status: string
  members: string
  visible: boolean
}

const adminTabs: { id: AdminTab; label: string; icon: IconName }[] = [
  { id: 'home-design', label: '홈/디자인 관리', icon: 'palette' },
  { id: 'stats', label: '통계', icon: 'chart' },
  { id: 'users', label: '유저관리', icon: 'users' },
  { id: 'content', label: '게시판/정보공유/모집관리', icon: 'list' },
  { id: 'services', label: '서비스관리', icon: 'network' },
]

const contentTabs: { id: ContentTab; label: string }[] = [
  { id: 'boards', label: '게시판' },
  { id: 'posts', label: '게시글' },
  { id: 'info', label: '정보공유' },
  { id: 'recruit', label: '모집' },
  { id: 'resources', label: '리소스' },
]

const localDesignKey = 'coala-admin-home-design'

const fallbackBoards: BoardData[] = [
  {
    boardId: 1,
    boardName: '공지',
    boardType: 'NORMAL',
    description: '운영진 공지와 온보딩 안내',
    isActive: true,
    createdAt: '2026-05-01T09:00:00',
    updatedAt: '2026-05-01T09:00:00',
  },
  {
    boardId: 2,
    boardName: '자유',
    boardType: 'NORMAL',
    description: '자유로운 커뮤니티 대화',
    isActive: true,
    createdAt: '2026-05-01T09:00:00',
    updatedAt: '2026-05-01T09:00:00',
  },
  {
    boardId: 3,
    boardName: '모집',
    boardType: 'RECRUIT',
    description: '스터디와 프로젝트 모집',
    isActive: true,
    createdAt: '2026-05-01T09:00:00',
    updatedAt: '2026-05-01T09:00:00',
  },
]

const fallbackResources: AdminResource[] = [
  {
    resourceId: 1,
    postId: 1,
    fileName: 'coala-onboarding.pdf',
    fileUrl: '#',
    fileType: 'PDF',
    fileSize: 1320000,
    createdAt: '2026-05-02T11:00:00',
  },
]

function getStoredDesign() {
  if (typeof window === 'undefined') return defaultHomeDesign
  const raw = window.localStorage.getItem(localDesignKey)
  if (!raw) return defaultHomeDesign

  try {
    return { ...defaultHomeDesign, ...JSON.parse(raw) } as AdminHomeDesignConfig
  } catch {
    return defaultHomeDesign
  }
}

function saveStoredDesign(config: AdminHomeDesignConfig) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(localDesignKey, JSON.stringify(config))
}

function toFallbackPosts(): PostListItem[] {
  return communityPosts.map((post, index) => ({
    postId: index + 1,
    boardId: post.category === 'notice' ? 1 : 2,
    boardName: post.category === 'notice' ? '공지' : '자유',
    userId: index + 1,
    authorName: post.author,
    title: post.title,
    content: post.excerpt,
    viewCount: Number(post.views.replace(/[^0-9]/g, '')) || 0,
    commentCount: post.comments,
    likeCount: index * 3,
    createdAt: '2026-05-02T11:00:00',
    updatedAt: '2026-05-02T11:00:00',
  }))
}

function toFallbackInfo(): AdminInfoItem[] {
  return resourceCards.map((item) => ({
    id: item.id,
    title: item.title,
    tag: item.tag,
    source: item.source,
    visible: true,
  }))
}

function toFallbackRecruit(): AdminRecruitItem[] {
  return recruitItems.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    status: item.status,
    members: `${item.currentMembers}/${item.maxMembers}`,
    visible: true,
  }))
}

function buildFallbackOverview(users: UserData[], boards: BoardData[], posts: PostListItem[]): AdminOverview {
  return {
    userCount: users.length,
    boardCount: boards.length,
    activeBoardCount: boards.filter((board) => board.isActive).length,
    postCount: posts.length,
    resourceCount: fallbackResources.length,
    totalViewCount: posts.reduce((sum, post) => sum + post.viewCount, 0),
    recentPosts: posts.slice(0, 5).map((post) => ({
      id: post.postId,
      title: post.title,
      boardName: post.boardName ?? `게시판 ${post.boardId}`,
      authorName: post.authorName ?? `유저 ${post.userId}`,
      viewCount: post.viewCount,
      createdAt: post.createdAt,
    })),
  }
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatSize(size: number) {
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${Math.round(size / 1024)} KB`
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function AdminPage() {
  const { user } = useAuth()
  const hasAdminAccess = isAdminUser(user)
  const [activeTab, setActiveTab] = useState<AdminTab>('home-design')
  const [contentTab, setContentTab] = useState<ContentTab>('boards')
  const [homeDesign, setHomeDesign] = useState<AdminHomeDesignConfig>(getStoredDesign)
  const [overview, setOverview] = useState<AdminOverview>(() => buildFallbackOverview([], fallbackBoards, toFallbackPosts()))
  const [users, setUsers] = useState<UserData[]>(() => (user ? [user] : []))
  const [boards, setBoards] = useState<BoardData[]>(fallbackBoards)
  const [posts, setPosts] = useState<PostListItem[]>(toFallbackPosts)
  const [resources, setResources] = useState<AdminResource[]>(fallbackResources)
  const [infoItems, setInfoItems] = useState<AdminInfoItem[]>(toFallbackInfo)
  const [recruits, setRecruits] = useState<AdminRecruitItem[]>(toFallbackRecruit)
  const [services, setServices] = useState<JcloudApplication[]>(mockApplications)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [boardDraft, setBoardDraft] = useState({
    boardName: '',
    description: '',
    boardType: 'NORMAL' as BoardType,
  })
  const [statusMessage, setStatusMessage] = useState('관리 데이터 로딩 중')

  useEffect(() => {
    if (!hasAdminAccess) return

    const load = async () => {
      const [
        overviewResult,
        designResult,
        usersResult,
        boardsResult,
        postsResult,
        resourcesResult,
      ] = await Promise.allSettled([
        adminApi.getOverview(),
        adminApi.getHomeDesign(),
        adminApi.getUsers(),
        adminApi.getBoards(),
        adminApi.getPosts(),
        adminApi.getResources(),
      ])

      const nextUsers = usersResult.status === 'fulfilled' ? usersResult.value : user ? [user] : []
      const nextBoards = boardsResult.status === 'fulfilled' ? boardsResult.value : fallbackBoards
      const nextPosts = postsResult.status === 'fulfilled' ? postsResult.value : toFallbackPosts()

      setUsers(nextUsers)
      setBoards(nextBoards)
      setPosts(nextPosts)
      setResources(resourcesResult.status === 'fulfilled' ? resourcesResult.value : fallbackResources)
      if (designResult.status === 'fulfilled') {
        setHomeDesign(designResult.value)
        saveStoredDesign(designResult.value)
      }
      setOverview(
        overviewResult.status === 'fulfilled'
          ? overviewResult.value
          : buildFallbackOverview(nextUsers, nextBoards, nextPosts),
      )
      setSelectedUserId(nextUsers[0]?.id ?? null)
      setSelectedPostId(nextPosts[0]?.postId ?? null)
      setStatusMessage(
        overviewResult.status === 'fulfilled'
          ? '백엔드 관리자 API와 연결됨'
          : '백엔드 응답이 없어 로컬 미리보기 데이터 사용 중',
      )
    }

    void load()
  }, [hasAdminAccess, user])

  const selectedUser = users.find((item) => item.id === selectedUserId) ?? null
  const selectedPost = posts.find((item) => item.postId === selectedPostId) ?? null

  const contentStats = useMemo(
    () => [
      { label: '활성 게시판', value: boards.filter((board) => board.isActive).length },
      { label: '게시글', value: posts.length },
      { label: '정보공유', value: infoItems.filter((item) => item.visible).length },
      { label: '모집', value: recruits.filter((item) => item.visible).length },
    ],
    [boards, infoItems, posts, recruits],
  )

  if (!user) return <Navigate to="/login" replace />

  if (!hasAdminAccess) {
    return (
      <section className="admin-access-denied">
        <Icon name="settings" size={32} />
        <h1>관리자 권한이 필요합니다.</h1>
        <p>관리자 계정으로 다시 로그인하면 대시보드에 접근할 수 있습니다.</p>
      </section>
    )
  }

  const saveHomeDesign = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const saved = await adminApi.updateHomeDesign(homeDesign)
      setHomeDesign(saved)
      saveStoredDesign(saved)
      setStatusMessage('홈/디자인 설정을 저장했습니다.')
    } catch {
      saveStoredDesign(homeDesign)
      setStatusMessage('백엔드 저장 실패로 브라우저에 임시 저장했습니다.')
    }
  }

  const updateSelectedUser = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedUser) return

    try {
      const updated = await adminApi.updateUser(selectedUser.id, {
        name: selectedUser.name,
        nickname: selectedUser.nickname,
        department: selectedUser.department,
        studentId: selectedUser.studentId,
        grade: selectedUser.grade,
        academicStatus: selectedUser.academicStatus,
      })
      setUsers((items) => items.map((item) => (item.id === updated.id ? updated : item)))
      setStatusMessage('유저 정보를 저장했습니다.')
    } catch {
      setStatusMessage('백엔드 저장 실패로 현재 화면에만 반영했습니다.')
    }
  }

  const patchSelectedUser = (patch: Partial<UserData>) => {
    if (!selectedUser) return
    setUsers((items) => items.map((item) => (item.id === selectedUser.id ? { ...item, ...patch } : item)))
  }

  const deleteSelectedUser = async () => {
    if (!selectedUser) return
    if (!window.confirm(`${selectedUser.name} 유저를 삭제할까요?`)) return

    try {
      await adminApi.deleteUser(selectedUser.id)
      setStatusMessage('유저를 삭제했습니다.')
    } catch {
      setStatusMessage('백엔드 삭제 실패로 현재 화면에서만 제거했습니다.')
    }
    setUsers((items) => items.filter((item) => item.id !== selectedUser.id))
    setSelectedUserId(users.find((item) => item.id !== selectedUser.id)?.id ?? null)
  }

  const createBoard = async (event: FormEvent) => {
    event.preventDefault()
    if (!boardDraft.boardName.trim()) return

    const optimistic: BoardData = {
      boardId: Math.max(0, ...boards.map((board) => board.boardId)) + 1,
      boardName: boardDraft.boardName.trim(),
      boardType: boardDraft.boardType,
      description: boardDraft.description.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      const created = await adminApi.createBoard(boardDraft)
      setBoards((items) => [created, ...items])
      setStatusMessage('게시판을 생성했습니다.')
    } catch {
      setBoards((items) => [optimistic, ...items])
      setStatusMessage('백엔드 생성 실패로 현재 화면에만 추가했습니다.')
    }
    setBoardDraft({ boardName: '', description: '', boardType: 'NORMAL' })
  }

  const updateBoard = async (board: BoardData, patch: Partial<BoardData>) => {
    const next = { ...board, ...patch, updatedAt: new Date().toISOString() }
    setBoards((items) => items.map((item) => (item.boardId === board.boardId ? next : item)))
    try {
      await adminApi.updateBoard(board.boardId, {
        boardName: next.boardName,
        description: next.description,
        isActive: next.isActive,
      })
      setStatusMessage('게시판 설정을 저장했습니다.')
    } catch {
      setStatusMessage('게시판 변경을 현재 화면에만 반영했습니다.')
    }
  }

  const deleteBoard = async (boardId: number) => {
    if (!window.confirm('게시판을 삭제할까요? 연결된 게시글이 있으면 서버에서 거절될 수 있습니다.')) return
    try {
      await adminApi.deleteBoard(boardId)
      setStatusMessage('게시판을 삭제했습니다.')
    } catch {
      setStatusMessage('백엔드 삭제 실패로 현재 화면에서만 제거했습니다.')
    }
    setBoards((items) => items.filter((item) => item.boardId !== boardId))
  }

  const updateSelectedPost = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedPost) return

    try {
      const updated = await adminApi.updatePost(selectedPost.postId, {
        title: selectedPost.title,
        content: selectedPost.content,
      })
      setPosts((items) => items.map((item) => (item.postId === updated.postId ? updated : item)))
      setStatusMessage('게시글을 저장했습니다.')
    } catch {
      setStatusMessage('게시글 변경을 현재 화면에만 반영했습니다.')
    }
  }

  const patchSelectedPost = (patch: Partial<PostListItem>) => {
    if (!selectedPost) return
    setPosts((items) => items.map((item) => (item.postId === selectedPost.postId ? { ...item, ...patch } : item)))
  }

  const deleteSelectedPost = async () => {
    if (!selectedPost) return
    if (!window.confirm('게시글을 삭제할까요?')) return

    try {
      await adminApi.deletePost(selectedPost.postId)
      setStatusMessage('게시글을 삭제했습니다.')
    } catch {
      setStatusMessage('백엔드 삭제 실패로 현재 화면에서만 제거했습니다.')
    }
    setPosts((items) => items.filter((item) => item.postId !== selectedPost.postId))
    setSelectedPostId(posts.find((item) => item.postId !== selectedPost.postId)?.postId ?? null)
  }

  const deleteResource = async (resourceId: number) => {
    try {
      await adminApi.deleteResource(resourceId)
      setStatusMessage('리소스를 삭제했습니다.')
    } catch {
      setStatusMessage('리소스를 현재 화면에서만 제거했습니다.')
    }
    setResources((items) => items.filter((item) => item.resourceId !== resourceId))
  }

  const updateServiceStatus = (serviceId: string, status: ApplyStatus) => {
    setServices((items) =>
      items.map((item) =>
        item.id === serviceId
          ? { ...item, status, approvedAt: new Date().toISOString().slice(0, 10) }
          : item,
      ),
    )
    setStatusMessage('서비스 신청 상태를 변경했습니다.')
  }

  return (
    <section className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-kicker">Admin</span>
          <h1>대시보드</h1>
          <p>{user.name} · {user.role ?? 'ADMIN'}</p>
        </div>
        <nav className="admin-tab-list" aria-label="관리자 메뉴">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'admin-tab is-active' : 'admin-tab'}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">관리자 콘솔</span>
            <h2>{adminTabs.find((tab) => tab.id === activeTab)?.label}</h2>
          </div>
          <p className="admin-status">{statusMessage}</p>
        </header>

        {activeTab === 'home-design' ? (
          <div className="admin-two-column">
            <form className="admin-panel admin-form" onSubmit={saveHomeDesign}>
              <Field label="사이트 이름">
                <input
                  value={homeDesign.siteTitle}
                  onChange={(event) => setHomeDesign({ ...homeDesign, siteTitle: event.target.value })}
                />
              </Field>
              <Field label="홈 히어로 제목">
                <input
                  value={homeDesign.heroTitle}
                  onChange={(event) => setHomeDesign({ ...homeDesign, heroTitle: event.target.value })}
                />
              </Field>
              <Field label="홈 히어로 설명">
                <textarea
                  rows={3}
                  value={homeDesign.heroSubtitle}
                  onChange={(event) => setHomeDesign({ ...homeDesign, heroSubtitle: event.target.value })}
                />
              </Field>
              <Field label="상단 공지">
                <input
                  value={homeDesign.announcement}
                  onChange={(event) => setHomeDesign({ ...homeDesign, announcement: event.target.value })}
                />
              </Field>
              <div className="admin-field-row">
                <Field label="강조 색상">
                  <input
                    type="color"
                    value={homeDesign.accentColor}
                    onChange={(event) => setHomeDesign({ ...homeDesign, accentColor: event.target.value })}
                  />
                </Field>
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={homeDesign.showRecruitBanner}
                    onChange={(event) =>
                      setHomeDesign({ ...homeDesign, showRecruitBanner: event.target.checked })
                    }
                  />
                  <span>모집 배너 표시</span>
                </label>
              </div>
              <button type="submit" className="admin-primary-button">
                <Icon name="edit" size={15} />
                저장
              </button>
            </form>

            <div className="admin-home-preview" style={{ borderColor: homeDesign.accentColor }}>
              <span style={{ color: homeDesign.accentColor }}>{homeDesign.siteTitle}</span>
              <h3>{homeDesign.heroTitle}</h3>
              <p>{homeDesign.heroSubtitle}</p>
              <strong>{homeDesign.announcement}</strong>
              {homeDesign.showRecruitBanner ? <small>모집 배너 노출 중</small> : <small>모집 배너 숨김</small>}
            </div>
          </div>
        ) : null}

        {activeTab === 'stats' ? (
          <div className="admin-stack">
            <div className="admin-metric-grid">
              <Metric label="유저" value={overview.userCount} icon="users" />
              <Metric label="게시판" value={overview.boardCount} icon="layout" />
              <Metric label="게시글" value={overview.postCount} icon="message" />
              <Metric label="총 조회수" value={overview.totalViewCount} icon="eye" />
            </div>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>콘텐츠 구성</h3>
              </div>
              <div className="admin-bar-list">
                {contentStats.map((item) => (
                  <div key={item.label} className="admin-bar-row">
                    <span>{item.label}</span>
                    <div className="admin-bar-track">
                      <i style={{ width: `${Math.min(100, item.value * 12)}%` }} />
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>최근 게시글</h3>
              </div>
              <DataTable
                headers={['제목', '게시판', '작성자', '조회', '작성일']}
                rows={overview.recentPosts.map((post) => [
                  post.title,
                  post.boardName,
                  post.authorName,
                  String(post.viewCount),
                  formatDate(post.createdAt),
                ])}
              />
            </div>
          </div>
        ) : null}

        {activeTab === 'users' ? (
          <div className="admin-two-column admin-two-column--wide-left">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>유저 목록</h3>
                <span>{users.length}명</span>
              </div>
              <div className="admin-list">
                {users.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={selectedUserId === item.id ? 'admin-list-row is-active' : 'admin-list-row'}
                    onClick={() => setSelectedUserId(item.id)}
                  >
                    <span>{item.name}</span>
                    <small>{item.email}</small>
                    <b>{item.role ?? 'USER'}</b>
                  </button>
                ))}
              </div>
            </div>
            <form className="admin-panel admin-form" onSubmit={updateSelectedUser}>
              <div className="admin-panel-header">
                <h3>유저 상세</h3>
                {selectedUser ? (
                  <button type="button" className="admin-danger-button" onClick={deleteSelectedUser}>
                    삭제
                  </button>
                ) : null}
              </div>
              {selectedUser ? (
                <>
                  <Field label="이름">
                    <input
                      value={selectedUser.name}
                      onChange={(event) => patchSelectedUser({ name: event.target.value })}
                    />
                  </Field>
                  <Field label="닉네임">
                    <input
                      value={selectedUser.nickname ?? ''}
                      onChange={(event) => patchSelectedUser({ nickname: event.target.value || null })}
                    />
                  </Field>
                  <Field label="학과">
                    <input
                      value={selectedUser.department}
                      onChange={(event) => patchSelectedUser({ department: event.target.value })}
                    />
                  </Field>
                  <div className="admin-field-row">
                    <Field label="학번">
                      <input
                        value={selectedUser.studentId}
                        onChange={(event) => patchSelectedUser({ studentId: event.target.value })}
                      />
                    </Field>
                    <Field label="학년">
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={selectedUser.grade ?? ''}
                        onChange={(event) =>
                          patchSelectedUser({ grade: event.target.value ? Number(event.target.value) : null })
                        }
                      />
                    </Field>
                  </div>
                  <Field label="학적 상태">
                    <select
                      value={selectedUser.academicStatus}
                      onChange={(event) =>
                        patchSelectedUser({
                          academicStatus: event.target.value as UserData['academicStatus'],
                        })
                      }
                    >
                      <option value="ENROLLED">재학</option>
                      <option value="ON_LEAVE">휴학</option>
                      <option value="GRADUATED">졸업</option>
                    </select>
                  </Field>
                  <button type="submit" className="admin-primary-button">
                    <Icon name="edit" size={15} />
                    유저 저장
                  </button>
                </>
              ) : (
                <p className="admin-empty">선택된 유저가 없습니다.</p>
              )}
            </form>
          </div>
        ) : null}

        {activeTab === 'content' ? (
          <div className="admin-stack">
            <div className="admin-segmented" role="tablist" aria-label="콘텐츠 관리">
              {contentTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  className={contentTab === tab.id ? 'is-active' : ''}
                  onClick={() => setContentTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {contentTab === 'boards' ? (
              <div className="admin-two-column admin-two-column--wide-left">
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h3>게시판</h3>
                    <span>{boards.length}개</span>
                  </div>
                  <div className="admin-list">
                    {boards.map((board) => (
                      <div key={board.boardId} className="admin-manage-row">
                        <div>
                          <strong>{board.boardName}</strong>
                          <small>{board.description || board.boardType}</small>
                        </div>
                        <button
                          type="button"
                          className={board.isActive ? 'admin-chip is-on' : 'admin-chip'}
                          onClick={() => updateBoard(board, { isActive: !board.isActive })}
                        >
                          {board.isActive ? '활성' : '숨김'}
                        </button>
                        <button type="button" className="admin-ghost-button" onClick={() => deleteBoard(board.boardId)}>
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <form className="admin-panel admin-form" onSubmit={createBoard}>
                  <div className="admin-panel-header">
                    <h3>게시판 생성</h3>
                  </div>
                  <Field label="게시판 이름">
                    <input
                      value={boardDraft.boardName}
                      onChange={(event) => setBoardDraft({ ...boardDraft, boardName: event.target.value })}
                    />
                  </Field>
                  <Field label="설명">
                    <textarea
                      rows={3}
                      value={boardDraft.description}
                      onChange={(event) => setBoardDraft({ ...boardDraft, description: event.target.value })}
                    />
                  </Field>
                  <Field label="유형">
                    <select
                      value={boardDraft.boardType}
                      onChange={(event) =>
                        setBoardDraft({ ...boardDraft, boardType: event.target.value as BoardType })
                      }
                    >
                      <option value="NORMAL">일반</option>
                      <option value="RECRUIT">모집</option>
                    </select>
                  </Field>
                  <button type="submit" className="admin-primary-button">
                    <Icon name="plus" size={15} />
                    생성
                  </button>
                </form>
              </div>
            ) : null}

            {contentTab === 'posts' ? (
              <div className="admin-two-column admin-two-column--wide-left">
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h3>게시글</h3>
                    <span>{posts.length}개</span>
                  </div>
                  <div className="admin-list">
                    {posts.map((post) => (
                      <button
                        key={post.postId}
                        type="button"
                        className={selectedPostId === post.postId ? 'admin-list-row is-active' : 'admin-list-row'}
                        onClick={() => setSelectedPostId(post.postId)}
                      >
                        <span>{post.title}</span>
                        <small>{post.authorName ?? `유저 ${post.userId}`} · 조회 {post.viewCount}</small>
                      </button>
                    ))}
                  </div>
                </div>
                <form className="admin-panel admin-form" onSubmit={updateSelectedPost}>
                  <div className="admin-panel-header">
                    <h3>게시글 상세</h3>
                    {selectedPost ? (
                      <button type="button" className="admin-danger-button" onClick={deleteSelectedPost}>
                        삭제
                      </button>
                    ) : null}
                  </div>
                  {selectedPost ? (
                    <>
                      <Field label="제목">
                        <input
                          value={selectedPost.title}
                          onChange={(event) => patchSelectedPost({ title: event.target.value })}
                        />
                      </Field>
                      <Field label="본문">
                        <textarea
                          rows={8}
                          value={selectedPost.content}
                          onChange={(event) => patchSelectedPost({ content: event.target.value })}
                        />
                      </Field>
                      <button type="submit" className="admin-primary-button">
                        <Icon name="edit" size={15} />
                        게시글 저장
                      </button>
                    </>
                  ) : (
                    <p className="admin-empty">선택된 게시글이 없습니다.</p>
                  )}
                </form>
              </div>
            ) : null}

            {contentTab === 'info' ? (
              <LocalListPanel
                title="정보공유"
                items={infoItems.map((item) => ({
                  id: String(item.id),
                  title: item.title,
                  meta: `${item.tag} · ${item.source}`,
                  visible: item.visible,
                }))}
                onToggle={(id) =>
                  setInfoItems((items) =>
                    items.map((item) => (String(item.id) === id ? { ...item, visible: !item.visible } : item)),
                  )
                }
                onDelete={(id) => setInfoItems((items) => items.filter((item) => String(item.id) !== id))}
              />
            ) : null}

            {contentTab === 'recruit' ? (
              <LocalListPanel
                title="모집"
                items={recruits.map((item) => ({
                  id: item.id,
                  title: item.title,
                  meta: `${item.category} · ${item.status} · ${item.members}`,
                  visible: item.visible,
                }))}
                onToggle={(id) =>
                  setRecruits((items) =>
                    items.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)),
                  )
                }
                onDelete={(id) => setRecruits((items) => items.filter((item) => item.id !== id))}
              />
            ) : null}

            {contentTab === 'resources' ? (
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h3>리소스</h3>
                  <span>{resources.length}개</span>
                </div>
                <DataTable
                  headers={['파일', '게시글', '유형', '크기', '등록일', '']}
                  rows={resources.map((resource) => [
                    resource.fileName,
                    String(resource.postId),
                    resource.fileType,
                    formatSize(resource.fileSize),
                    formatDate(resource.createdAt),
                    <button
                      key={resource.resourceId}
                      type="button"
                      className="admin-ghost-button"
                      onClick={() => deleteResource(resource.resourceId)}
                    >
                      삭제
                    </button>,
                  ])}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'services' ? (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3>인스턴스 신청 관리</h3>
              <span>{services.length}건</span>
            </div>
            <div className="admin-service-list">
              {services.map((service) => (
                <div key={service.id} className="admin-service-row">
                  <div>
                    <span className={`admin-service-status is-${service.status}`}>{service.status}</span>
                    <strong>{service.applicantName}</strong>
                    <p>{service.purpose}</p>
                    <small>{service.instanceType} · {service.duration} · {service.requestedAt}</small>
                  </div>
                  <div className="admin-row-actions">
                    <button type="button" onClick={() => updateServiceStatus(service.id, 'approved')}>
                      승인
                    </button>
                    <button type="button" onClick={() => updateServiceStatus(service.id, 'rejected')}>
                      반려
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Metric({ label, value, icon }: { label: string; value: number; icon: IconName }) {
  return (
    <div className="admin-metric">
      <Icon name={icon} size={18} />
      <span>{label}</span>
      <strong>{value.toLocaleString('ko-KR')}</strong>
    </div>
  )
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: Array<Array<ReactNode>>
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LocalListPanel({
  title,
  items,
  onToggle,
  onDelete,
}: {
  title: string
  items: { id: string; title: string; meta: string; visible: boolean }[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h3>{title}</h3>
        <span>{items.length}개</span>
      </div>
      <div className="admin-list">
        {items.map((item) => (
          <div key={item.id} className="admin-manage-row">
            <div>
              <strong>{item.title}</strong>
              <small>{item.meta}</small>
            </div>
            <button
              type="button"
              className={item.visible ? 'admin-chip is-on' : 'admin-chip'}
              onClick={() => onToggle(item.id)}
            >
              {item.visible ? '노출' : '숨김'}
            </button>
            <button type="button" className="admin-ghost-button" onClick={() => onDelete(item.id)}>
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
