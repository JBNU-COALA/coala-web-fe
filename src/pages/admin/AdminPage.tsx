import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  adminApi,
  type AdminActionLog,
  type AdminPostStatus,
  type AdminReport,
  type AdminReportStatus,
  type AdminUserRole,
  type AdminUserSanctionType,
} from '../../shared/api/admin'
import type { UserData } from '../../shared/api/auth'
import type { BoardData, BoardType } from '../../shared/api/boards'
import type { PostListItem } from '../../shared/api/posts'
import { siteApi, type SiteAboutContent } from '../../shared/api/site'
import type { ApplyStatus, InstanceApplication, MemberService, MemberServicePayload, ServiceInquiry } from '../../shared/api/services'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { useAuth } from '../../shared/auth/AuthContext'
import { routes } from '../../shared/routes'
import { Icon, type IconName } from '../../shared/ui/Icon'
import './admin.css'

type AdminTab = 'stats' | 'users' | 'posts' | 'services' | 'instances' | 'about'

type ServiceDraft = {
  title: string
  category: string
  summary: string
  url: string
  tagsText: string
}

type InstanceDraft = {
  instanceType: string
  duration: string
  purpose: string
  status: ApplyStatus
  adminNote: string
}

type AboutDraft = {
  title: string
  description: string
  chipsText: string
}

const adminTabs: { id: AdminTab; label: string; icon: IconName }[] = [
  { id: 'stats', label: '통계', icon: 'chart' },
  { id: 'users', label: '유저 관리', icon: 'users' },
  { id: 'posts', label: '게시글 관리', icon: 'message' },
  { id: 'services', label: '서비스 관리', icon: 'network' },
  { id: 'instances', label: '인스턴스 관리', icon: 'settings' },
  { id: 'about', label: '소개 관리', icon: 'edit' },
]

const roleOptions: { value: AdminUserRole; label: string }[] = [
  { value: 'USER', label: '일반' },
  { value: 'STAFF', label: '운영진' },
  { value: 'SUPER_ADMIN', label: '최고관리자' },
]

const postStatusOptions: { value: AdminPostStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: '정상' },
  { value: 'HIDDEN', label: '숨김' },
  { value: 'DELETED', label: '삭제됨' },
  { value: 'ADMIN_DELETED', label: '관리자 삭제' },
  { value: 'BLOCKED', label: '차단' },
  { value: 'PENDING', label: '대기' },
]

const reportStatusOptions: { value: AdminReportStatus; label: string }[] = [
  { value: 'PENDING', label: '미처리' },
  { value: 'AUTO_HIDDEN', label: '자동 숨김' },
  { value: 'ACCEPTED', label: '처리 완료' },
  { value: 'REJECTED', label: '반려' },
]

const sanctionOptions: { value: AdminUserSanctionType; label: string }[] = [
  { value: 'WARNING', label: '경고' },
  { value: 'POST_RESTRICTED', label: '글쓰기 제한' },
  { value: 'COMMENT_RESTRICTED', label: '댓글 제한' },
  { value: 'TEMP_SUSPENDED', label: '임시 정지' },
  { value: 'ACCOUNT_SUSPENDED', label: '계정 정지' },
  { value: 'PERMANENT_BANNED', label: '영구 정지' },
]

const academicStatusLabel: Record<UserData['academicStatus'], string> = {
  PROFESSOR: '교수',
  ASSISTANT: '조교',
  ENROLLED: '재학생',
  ON_LEAVE: '휴학생',
  GRADUATED: '졸업생',
  GENERAL: '일반',
}

const emptyServiceDraft: ServiceDraft = {
  title: '',
  category: 'productivity',
  summary: '',
  url: '',
  tagsText: '',
}

const defaultAboutContent: SiteAboutContent = {
  title: '함께 만들고 운영하는 개발 동아리',
  description: '코알라는 프로젝트, 스터디, 서비스 운영을 통해 개발 경험을 쌓는 전북대학교 개발 동아리입니다.',
  chips: ['프로젝트', '스터디', '서비스 운영', '커뮤니티'],
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatNumber(value: number) {
  return value.toLocaleString('ko-KR')
}

function normalizeRole(role?: string | null): AdminUserRole {
  const upper = role?.replace(/^ROLE_/, '').toUpperCase()
  if (upper === 'SUPER_ADMIN' || upper === 'STAFF') return upper
  return 'USER'
}

function roleLabel(role?: string | null) {
  const normalized = normalizeRole(role)
  return roleOptions.find((option) => option.value === normalized)?.label ?? normalized
}

function cssToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function toServicePayload(draft: ServiceDraft): MemberServicePayload {
  return {
    title: draft.title.trim(),
    category: draft.category.trim(),
    summary: draft.summary.trim(),
    url: draft.url.trim(),
    tags: draft.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  }
}

function serviceToDraft(service: MemberService): ServiceDraft {
  return {
    title: service.title,
    category: service.category,
    summary: service.summary,
    url: service.url,
    tagsText: service.tags.join(', '),
  }
}

function aboutToDraft(content: SiteAboutContent): AboutDraft {
  return {
    title: content.title,
    description: content.description,
    chipsText: content.chips.join(', '),
  }
}

function instanceToDraft(instance: InstanceApplication): InstanceDraft {
  return {
    instanceType: instance.instanceType,
    duration: instance.duration,
    purpose: instance.purpose,
    status: instance.status,
    adminNote: instance.adminNote ?? '',
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
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
  const [activeTab, setActiveTab] = useState<AdminTab>('stats')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('관리자 데이터를 불러오는 중입니다.')
  const [users, setUsers] = useState<UserData[]>([])
  const [boards, setBoards] = useState<BoardData[]>([])
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [auditLogs, setAuditLogs] = useState<AdminActionLog[]>([])
  const [memberServices, setMemberServices] = useState<MemberService[]>([])
  const [instanceApplications, setInstanceApplications] = useState<InstanceApplication[]>([])
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([])
  const [aboutContent, setAboutContent] = useState<SiteAboutContent>(defaultAboutContent)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const [postStatus, setPostStatus] = useState<AdminPostStatus | 'ALL'>('ALL')
  const [reportStatus, setReportStatus] = useState<AdminReportStatus>('PENDING')
  const [boardDraft, setBoardDraft] = useState({
    boardName: '',
    description: '',
    boardType: 'NORMAL' as BoardType,
  })
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft>(emptyServiceDraft)
  const [sanctionDraft, setSanctionDraft] = useState({
    type: 'WARNING' as AdminUserSanctionType,
    reason: '',
    endAt: '',
  })
  const [instanceDraft, setInstanceDraft] = useState<InstanceDraft>({
    instanceType: '',
    duration: '',
    purpose: '',
    status: 'pending',
    adminNote: '',
  })
  const [aboutDraft, setAboutDraft] = useState<AboutDraft>(() => aboutToDraft(defaultAboutContent))

  const selectedUser = users.find((item) => item.id === selectedUserId) ?? null
  const selectedPost = posts.find((item) => item.postId === selectedPostId) ?? null
  const selectedService = memberServices.find((item) => item.id === selectedServiceId) ?? null
  const selectedInstance = instanceApplications.find((item) => item.id === selectedInstanceId) ?? null

  const stats = useMemo(() => {
    const visiblePosts = posts.filter((post) => post.status === 'ACTIVE' || !post.status).length
    return {
      userCount: users.length,
      staffCount: users.filter((item) => normalizeRole(item.role) !== 'USER').length,
      boardCount: boards.length,
      activeBoardCount: boards.filter((board) => board.isActive).length,
      postCount: posts.length,
      visiblePosts,
      pendingReports: reports.filter((report) => report.status === 'PENDING').length,
      activeServices: memberServices.filter((service) => service.status !== '운영중지' && service.status !== '운영종료').length,
      pendingInstances: instanceApplications.filter((instance) => instance.status === 'pending').length,
      totalViews: posts.reduce((sum, post) => sum + post.viewCount, 0),
    }
  }, [boards, instanceApplications, memberServices, posts, reports, users])

  const postBreakdown = useMemo(
    () => postStatusOptions
      .filter((option) => option.value !== 'ALL')
      .map((option) => ({
        label: option.label,
        value: posts.filter((post) => post.status === option.value).length,
      })),
    [posts],
  )

  const roleBreakdown = useMemo(
    () => roleOptions.map((option) => ({
      label: option.label,
      value: users.filter((item) => normalizeRole(item.role) === option.value).length,
    })),
    [users],
  )

  const serviceBreakdown = useMemo(() => {
    const labels = ['운영중', '운영중지', '운영종료']
    return labels.map((label) => ({
      label,
      value: memberServices.filter((service) => service.status === label).length,
    }))
  }, [memberServices])

  const instanceBreakdown = useMemo(() => {
    const labels: { id: ApplyStatus; label: string }[] = [
      { id: 'pending', label: '대기' },
      { id: 'approved', label: '승인' },
      { id: 'rejected', label: '반려' },
    ]
    return labels.map((label) => ({
      label: label.label,
      value: instanceApplications.filter((instance) => instance.status === label.id).length,
    }))
  }, [instanceApplications])

  const loadAdminData = async () => {
    if (!hasAdminAccess) return
    setIsLoading(true)

    const [
      usersResult,
      boardsResult,
      postsResult,
      reportsResult,
      logsResult,
      servicesResult,
      instancesResult,
      inquiriesResult,
      aboutResult,
    ] = await Promise.allSettled([
      adminApi.getUsers(),
      adminApi.getBoards(),
      adminApi.getPosts(postStatus),
      adminApi.getReports(reportStatus),
      adminApi.getAuditLogs(),
      adminApi.getMemberServices(),
      adminApi.getInstanceApplications(),
      adminApi.getInstanceInquiries(),
      siteApi.getAbout(),
    ])

    const failures = [
      usersResult,
      boardsResult,
      postsResult,
      reportsResult,
      logsResult,
      servicesResult,
      instancesResult,
      inquiriesResult,
      aboutResult,
    ].filter((result) => result.status === 'rejected').length

    if (usersResult.status === 'fulfilled') {
      setUsers(usersResult.value)
      setSelectedUserId((current) => current ?? usersResult.value[0]?.id ?? null)
    }
    if (boardsResult.status === 'fulfilled') setBoards(boardsResult.value)
    if (postsResult.status === 'fulfilled') {
      setPosts(postsResult.value)
      setSelectedPostId((current) => current ?? postsResult.value[0]?.postId ?? null)
    }
    if (reportsResult.status === 'fulfilled') setReports(reportsResult.value)
    if (logsResult.status === 'fulfilled') setAuditLogs(logsResult.value)
    if (servicesResult.status === 'fulfilled') {
      setMemberServices(servicesResult.value)
      setSelectedServiceId((current) => current ?? servicesResult.value[0]?.id ?? null)
    }
    if (instancesResult.status === 'fulfilled') {
      setInstanceApplications(instancesResult.value)
      setSelectedInstanceId((current) => current ?? instancesResult.value[0]?.id ?? null)
    }
    if (inquiriesResult.status === 'fulfilled') setInquiries(inquiriesResult.value)
    if (aboutResult.status === 'fulfilled') {
      setAboutContent(aboutResult.value)
      setAboutDraft(aboutToDraft(aboutResult.value))
    }

    setStatusMessage(
      failures === 0
        ? '백엔드 관리자 API와 연결되었습니다.'
        : `관리자 데이터 일부를 불러오지 못했습니다. 실패 API ${failures}개`,
    )
    setIsLoading(false)
  }

  useEffect(() => {
    void loadAdminData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAdminAccess, postStatus, reportStatus])

  useEffect(() => {
    setServiceDraft(selectedService ? serviceToDraft(selectedService) : emptyServiceDraft)
  }, [selectedService])

  useEffect(() => {
    if (selectedInstance) setInstanceDraft(instanceToDraft(selectedInstance))
  }, [selectedInstance])

  if (!user) return <Navigate to="/login" replace />

  if (!hasAdminAccess) {
    return (
      <section className="admin-access-denied">
        <Icon name="settings" size={32} />
        <h1>관리자 권한이 필요합니다.</h1>
        <p>운영진 또는 최고관리자 계정으로 다시 로그인하세요.</p>
      </section>
    )
  }

  const askReason = (label: string) => {
    const reason = window.prompt(`${label} 사유를 입력하세요.`)
    if (!reason?.trim()) {
      setStatusMessage('관리자 조치 사유가 필요합니다.')
      return null
    }
    return reason.trim()
  }

  const refreshAuditLogs = async () => {
    const logs = await adminApi.getAuditLogs().catch(() => null)
    if (logs) setAuditLogs(logs)
  }

  const updateSelectedUserRole = async (role: AdminUserRole) => {
    if (!selectedUser) return
    try {
      const updated = await adminApi.updateUserRole(selectedUser.id, role)
      setUsers((items) => items.map((item) => (item.id === updated.id ? updated : item)))
      setStatusMessage('유저 권한을 변경했습니다.')
      await refreshAuditLogs()
    } catch {
      setStatusMessage('유저 권한 변경에 실패했습니다. 최고관리자 권한이 필요한 작업일 수 있습니다.')
    }
  }

  const sanctionSelectedUser = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedUser || !sanctionDraft.reason.trim()) return
    try {
      await adminApi.sanctionUser({
        userId: selectedUser.id,
        type: sanctionDraft.type,
        reason: sanctionDraft.reason.trim(),
        endAt: sanctionDraft.endAt ? new Date(sanctionDraft.endAt).toISOString() : null,
      })
      setSanctionDraft({ type: 'WARNING', reason: '', endAt: '' })
      setStatusMessage('유저 제재를 등록했습니다.')
      await refreshAuditLogs()
    } catch {
      setStatusMessage('유저 제재 등록에 실패했습니다.')
    }
  }

  const createBoard = async (event: FormEvent) => {
    event.preventDefault()
    if (!boardDraft.boardName.trim()) return
    try {
      await adminApi.createBoard({
        boardName: boardDraft.boardName.trim(),
        description: boardDraft.description.trim(),
        boardType: boardDraft.boardType,
      })
      setBoards(await adminApi.getBoards())
      setBoardDraft({ boardName: '', description: '', boardType: 'NORMAL' })
      setStatusMessage('게시판을 생성했습니다.')
    } catch {
      setStatusMessage('게시판 생성에 실패했습니다.')
    }
  }

  const updateBoardActive = async (board: BoardData, isActive: boolean) => {
    try {
      await adminApi.updateBoard(board.boardId, {
        boardName: board.boardName,
        description: board.description,
        isActive,
      })
      setBoards((items) => items.map((item) => (item.boardId === board.boardId ? { ...item, isActive } : item)))
      setStatusMessage('게시판 상태를 변경했습니다.')
    } catch {
      setStatusMessage('게시판 상태 변경에 실패했습니다.')
    }
  }

  const deleteBoard = async (board: BoardData) => {
    const reason = window.confirm(`${board.boardName} 게시판을 비활성화할까요?`)
    if (!reason) return
    try {
      await adminApi.deleteBoard(board.boardId)
      setBoards((items) => items.map((item) => (item.boardId === board.boardId ? { ...item, isActive: false } : item)))
      setStatusMessage('게시판을 비활성화했습니다.')
    } catch {
      setStatusMessage('게시판 비활성화에 실패했습니다.')
    }
  }

  const runPostAction = async (action: 'hide' | 'restore' | 'delete' | 'lock' | 'unlock') => {
    if (!selectedPost) return
    const actionLabel = {
      hide: '게시글 숨김',
      restore: '게시글 복구',
      delete: '게시글 관리자 삭제',
      lock: '게시글 잠금',
      unlock: '게시글 잠금 해제',
    }[action]
    const reason = askReason(actionLabel)
    if (!reason) return

    try {
      if (action === 'hide') await adminApi.hidePost(selectedPost.postId, reason)
      if (action === 'restore') await adminApi.restorePost(selectedPost.postId, reason)
      if (action === 'delete') await adminApi.deletePost(selectedPost.postId, reason)
      if (action === 'lock') await adminApi.lockPost(selectedPost.postId, reason)
      if (action === 'unlock') await adminApi.unlockPost(selectedPost.postId, reason)
      setPosts(await adminApi.getPosts(postStatus))
      setStatusMessage(`${actionLabel} 처리를 완료했습니다.`)
      await refreshAuditLogs()
    } catch {
      setStatusMessage(`${actionLabel} 처리에 실패했습니다.`)
    }
  }

  const handleReport = async (report: AdminReport, status: AdminReportStatus) => {
    const reason = askReason(`신고 ${status === 'ACCEPTED' ? '처리' : '상태 변경'}`)
    if (!reason) return
    try {
      const updated = await adminApi.handleReport(report.id, status, reason)
      setReports((items) => items.map((item) => (item.id === updated.id ? updated : item)))
      setStatusMessage('신고 상태를 변경했습니다.')
      await refreshAuditLogs()
    } catch {
      setStatusMessage('신고 처리에 실패했습니다.')
    }
  }

  const saveService = async (event: FormEvent) => {
    event.preventDefault()
    const payload = toServicePayload(serviceDraft)
    if (!payload.title || !payload.category || !payload.summary || !payload.url || payload.tags.length === 0) return
    try {
      const saved = selectedService
        ? await adminApi.updateMemberService(selectedService.id, payload)
        : await adminApi.createMemberService(payload)
      setMemberServices((items) => {
        const exists = items.some((item) => item.id === saved.id)
        return exists ? items.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...items]
      })
      setSelectedServiceId(saved.id)
      setStatusMessage(selectedService ? '서비스 정보를 저장했습니다.' : '서비스를 등록했습니다.')
    } catch {
      setStatusMessage('서비스 저장에 실패했습니다.')
    }
  }

  const retireService = async () => {
    if (!selectedService || !window.confirm(`${selectedService.title} 서비스를 운영 중지할까요?`)) return
    try {
      await adminApi.retireMemberService(selectedService.id)
      const services = await adminApi.getMemberServices()
      setMemberServices(services)
      setStatusMessage('서비스를 운영 중지했습니다.')
    } catch {
      setStatusMessage('서비스 운영 중지에 실패했습니다.')
    }
  }

  const saveInstance = async (nextStatus?: ApplyStatus) => {
    if (!selectedInstance) return
    try {
      const saved = await adminApi.updateInstanceApplication(selectedInstance.id, {
        instanceType: instanceDraft.instanceType,
        duration: instanceDraft.duration,
        purpose: instanceDraft.purpose,
        status: nextStatus ?? instanceDraft.status,
        adminNote: instanceDraft.adminNote,
      })
      setInstanceApplications((items) => items.map((item) => (item.id === saved.id ? saved : item)))
      setStatusMessage('인스턴스 신청을 저장했습니다.')
    } catch {
      setStatusMessage('인스턴스 신청 저장에 실패했습니다.')
    }
  }

  const saveAbout = async (event: FormEvent) => {
    event.preventDefault()
    if (!aboutDraft.title.trim() || !aboutDraft.description.trim()) return
    try {
      const saved = await siteApi.updateAbout({
        title: aboutDraft.title.trim(),
        description: aboutDraft.description.trim(),
        chips: aboutDraft.chipsText.split(',').map((chip) => chip.trim()).filter(Boolean),
      })
      setAboutContent(saved)
      setAboutDraft(aboutToDraft(saved))
      setStatusMessage('소개 페이지를 저장했습니다.')
    } catch {
      setStatusMessage('소개 페이지 저장에 실패했습니다.')
    }
  }

  return (
    <section className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-kicker">Admin</span>
          <h1>관리자 대시보드</h1>
          <p>{user.name} · {roleLabel(user.role)}</p>
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
        <Link className="admin-home-link" to={routes.home}>
          <Icon name="chevron-left" size={15} />
          홈으로
        </Link>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">관리자 콘솔</span>
            <h2>{adminTabs.find((tab) => tab.id === activeTab)?.label}</h2>
          </div>
          <div className="admin-row-actions">
            <p className="admin-status">{isLoading ? '불러오는 중...' : statusMessage}</p>
            <button type="button" className="admin-ghost-button" onClick={() => void loadAdminData()}>
              새로고침
            </button>
          </div>
        </header>

        {activeTab === 'stats' ? (
          <div className="admin-stack">
            <div className="admin-metric-grid">
              <Metric label="유저" value={stats.userCount} icon="users" />
              <Metric label="운영 권한" value={stats.staffCount} icon="settings" />
              <Metric label="게시글" value={stats.postCount} icon="message" />
              <Metric label="미처리 신고" value={stats.pendingReports} icon="bell" />
              <Metric label="서비스" value={stats.activeServices} icon="network" />
              <Metric label="인스턴스 대기" value={stats.pendingInstances} icon="layout" />
            </div>
            <div className="admin-chart-grid">
              <DonutChart
                label="운영 권한 비율"
                value={stats.staffCount}
                total={stats.userCount}
                detail={`운영진 ${formatNumber(stats.staffCount)}명`}
              />
              <DonutChart
                label="공개 게시글 비율"
                value={stats.visiblePosts}
                total={stats.postCount}
                detail={`공개 ${formatNumber(stats.visiblePosts)}개`}
                accent="#456fa8"
              />
              <MiniBarChart title="유저 권한" items={roleBreakdown} total={stats.userCount} />
              <MiniBarChart title="인스턴스 상태" items={instanceBreakdown} total={instanceApplications.length} />
              <MiniBarChart title="서비스 상태" items={serviceBreakdown} total={memberServices.length} />
            </div>
            <div className="admin-two-column">
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h3>게시글 상태</h3>
                  <span>조회수 {formatNumber(stats.totalViews)}</span>
                </div>
                <div className="admin-bar-list">
                  {postBreakdown.map((item) => (
                    <div key={item.label} className="admin-bar-row">
                      <span>{item.label}</span>
                      <div className="admin-bar-track">
                        <i style={{ width: `${stats.postCount ? Math.max(8, (item.value / stats.postCount) * 100) : 0}%` }} />
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h3>최근 감사 로그</h3>
                  <span>{auditLogs.length}건</span>
                </div>
                <DataTable
                  headers={['관리자', '작업', '대상', '사유', '시각']}
                  rows={auditLogs.slice(0, 6).map((log) => [
                    log.adminName,
                    log.action,
                    `${log.targetType} #${log.targetId}`,
                    log.reason || '-',
                    formatDate(log.createdAt),
                  ])}
                  empty="감사 로그가 없습니다."
                />
              </div>
            </div>
            <ReportsPanel
              reports={reports}
              reportStatus={reportStatus}
              onStatusChange={setReportStatus}
              onHandle={handleReport}
            />
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
                    <b>{roleLabel(item.role)}</b>
                  </button>
                ))}
              </div>
            </div>
            <div className="admin-stack">
              <div className="admin-panel admin-form">
                <div className="admin-panel-header">
                  <h3>유저 상세</h3>
                  {selectedUser ? <span>ID {selectedUser.id}</span> : null}
                </div>
                {selectedUser ? (
                  <>
                    <div className="admin-detail-grid">
                      <Detail label="이름" value={selectedUser.name} />
                      <Detail label="이메일" value={selectedUser.email} />
                      <Detail label="닉네임" value={selectedUser.nickname ?? '-'} />
                      <Detail label="소속" value={selectedUser.department || '-'} />
                      <Detail label="연구실" value={selectedUser.lab || '-'} />
                      <Detail label="학적" value={academicStatusLabel[selectedUser.academicStatus]} />
                      <Detail label="학번" value={selectedUser.studentId || '-'} />
                      <Detail label="GitHub" value={selectedUser.githubId || '-'} />
                      <Detail label="이메일 인증" value={selectedUser.verified ? '완료' : '미완료'} />
                      <Detail label="가입일" value={formatDate(selectedUser.createdAt)} />
                    </div>
                    <Field label="권한">
                      <select
                        value={normalizeRole(selectedUser.role)}
                        onChange={(event) => void updateSelectedUserRole(event.target.value as AdminUserRole)}
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </Field>
                  </>
                ) : (
                  <p className="admin-empty">선택된 유저가 없습니다.</p>
                )}
              </div>
              <form className="admin-panel admin-form" onSubmit={sanctionSelectedUser}>
                <div className="admin-panel-header">
                  <h3>제재 등록</h3>
                  {selectedUser ? <span>{selectedUser.name}</span> : null}
                </div>
                <Field label="제재 유형">
                  <select
                    value={sanctionDraft.type}
                    onChange={(event) =>
                      setSanctionDraft((current) => ({ ...current, type: event.target.value as AdminUserSanctionType }))
                    }
                    disabled={!selectedUser}
                  >
                    {sanctionOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="종료 시각">
                  <input
                    type="datetime-local"
                    value={sanctionDraft.endAt}
                    disabled={!selectedUser}
                    onChange={(event) => setSanctionDraft((current) => ({ ...current, endAt: event.target.value }))}
                  />
                </Field>
                <Field label="사유">
                  <textarea
                    rows={3}
                    value={sanctionDraft.reason}
                    disabled={!selectedUser}
                    onChange={(event) => setSanctionDraft((current) => ({ ...current, reason: event.target.value }))}
                  />
                </Field>
                <button type="submit" className="admin-primary-button" disabled={!selectedUser || !sanctionDraft.reason.trim()}>
                  <Icon name="bell" size={15} />
                  제재 저장
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {activeTab === 'posts' ? (
          <div className="admin-stack">
            <div className="admin-two-column">
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h3>게시판</h3>
                  <span>{stats.activeBoardCount}/{stats.boardCount} 활성</span>
                </div>
                <div className="admin-list">
                  {boards.map((board) => (
                    <div key={board.boardId} className="admin-manage-row">
                      <div>
                        <strong>{board.boardName}</strong>
                        <small>
                          {board.description || board.boardType}
                          {board.boardName === '공지' ? ' · 운영진 작성' : ''}
                        </small>
                      </div>
                      <button
                        type="button"
                        className={board.isActive ? 'admin-chip is-on' : 'admin-chip'}
                        onClick={() => void updateBoardActive(board, !board.isActive)}
                      >
                        {board.isActive ? '활성' : '숨김'}
                      </button>
                      <button type="button" className="admin-ghost-button" onClick={() => void deleteBoard(board)}>
                        비활성화
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
                    onChange={(event) => setBoardDraft((current) => ({ ...current, boardName: event.target.value }))}
                  />
                </Field>
                <Field label="설명">
                  <textarea
                    rows={3}
                    value={boardDraft.description}
                    onChange={(event) => setBoardDraft((current) => ({ ...current, description: event.target.value }))}
                  />
                </Field>
                <Field label="유형">
                  <select
                    value={boardDraft.boardType}
                    onChange={(event) => setBoardDraft((current) => ({ ...current, boardType: event.target.value as BoardType }))}
                  >
                    <option value="NORMAL">일반</option>
                    <option value="RECRUIT">모집</option>
                  </select>
                </Field>
                <button type="submit" className="admin-primary-button" disabled={!boardDraft.boardName.trim()}>
                  <Icon name="plus" size={15} />
                  게시판 생성
                </button>
              </form>
            </div>

            <div className="admin-two-column admin-two-column--wide-left">
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h3>게시글</h3>
                  <select
                    className="admin-inline-select"
                    value={postStatus}
                    onChange={(event) => setPostStatus(event.target.value as AdminPostStatus | 'ALL')}
                  >
                    {postStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
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
                      <small>{post.boardName ?? `게시판 ${post.boardId}`} · {post.authorName ?? `유저 ${post.userId}`}</small>
                      <b>{post.status ?? 'ACTIVE'}</b>
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-panel admin-form">
                <div className="admin-panel-header">
                  <h3>게시글 조치</h3>
                  {selectedPost ? <span>#{selectedPost.postId}</span> : null}
                </div>
                {selectedPost ? (
                  <>
                    <div className="admin-detail-grid">
                      <Detail label="제목" value={selectedPost.title} />
                      <Detail label="게시판" value={selectedPost.boardName ?? String(selectedPost.boardId)} />
                      <Detail label="작성자" value={selectedPost.authorName ?? `유저 ${selectedPost.userId}`} />
                      <Detail label="상태" value={selectedPost.status ?? 'ACTIVE'} />
                      <Detail label="잠금" value={selectedPost.locked ? '잠김' : '열림'} />
                      <Detail label="조회" value={formatNumber(selectedPost.viewCount)} />
                    </div>
                    <div className="admin-row-actions admin-row-actions--wrap">
                      <button type="button" onClick={() => void runPostAction('hide')}>숨김</button>
                      <button type="button" onClick={() => void runPostAction('restore')}>복구</button>
                      <button type="button" onClick={() => void runPostAction(selectedPost.locked ? 'unlock' : 'lock')}>
                        {selectedPost.locked ? '잠금 해제' : '잠금'}
                      </button>
                      <button type="button" className="admin-danger-button" onClick={() => void runPostAction('delete')}>
                        관리자 삭제
                      </button>
                    </div>
                    <div className="admin-post-preview">
                      {selectedPost.content}
                    </div>
                  </>
                ) : (
                  <p className="admin-empty">선택된 게시글이 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'services' ? (
          <div className="admin-two-column admin-two-column--wide-left">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>유저 서비스</h3>
                <span>{memberServices.length}개</span>
              </div>
              <div className="admin-list">
                {memberServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className={selectedServiceId === service.id ? 'admin-list-row is-active' : 'admin-list-row'}
                    onClick={() => setSelectedServiceId(service.id)}
                  >
                    <span>{service.title}</span>
                    <small>{service.category} · {service.owner}</small>
                    <b>{service.status}</b>
                  </button>
                ))}
              </div>
            </div>
            <form className="admin-panel admin-form" onSubmit={saveService}>
              <div className="admin-panel-header">
                <h3>{selectedService ? '서비스 상세' : '서비스 등록'}</h3>
                <div className="admin-row-actions">
                  {selectedService ? (
                    <button type="button" className="admin-danger-button" onClick={() => void retireService()}>
                      운영 중지
                    </button>
                  ) : null}
                  <button type="button" className="admin-ghost-button" onClick={() => setSelectedServiceId(null)}>
                    신규
                  </button>
                </div>
              </div>
              <Field label="서비스 이름">
                <input
                  value={serviceDraft.title}
                  onChange={(event) => setServiceDraft((current) => ({ ...current, title: event.target.value }))}
                />
              </Field>
              <Field label="카테고리">
                <input
                  value={serviceDraft.category}
                  onChange={(event) => setServiceDraft((current) => ({ ...current, category: event.target.value }))}
                />
              </Field>
              <Field label="요약">
                <textarea
                  rows={3}
                  value={serviceDraft.summary}
                  onChange={(event) => setServiceDraft((current) => ({ ...current, summary: event.target.value }))}
                />
              </Field>
              <Field label="URL">
                <input
                  value={serviceDraft.url}
                  onChange={(event) => setServiceDraft((current) => ({ ...current, url: event.target.value }))}
                />
              </Field>
              <Field label="태그">
                <input
                  value={serviceDraft.tagsText}
                  onChange={(event) => setServiceDraft((current) => ({ ...current, tagsText: event.target.value }))}
                />
              </Field>
              <button type="submit" className="admin-primary-button">
                <Icon name="edit" size={15} />
                서비스 저장
              </button>
            </form>
          </div>
        ) : null}

        {activeTab === 'instances' ? (
          <div className="admin-stack">
            <div className="admin-two-column admin-two-column--wide-left">
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h3>인스턴스 신청</h3>
                  <span>{instanceApplications.length}건</span>
                </div>
                <div className="admin-service-list">
                  {instanceApplications.map((instance) => (
                    <button
                      key={instance.id}
                      type="button"
                      className={selectedInstanceId === instance.id ? 'admin-list-row is-active' : 'admin-list-row'}
                      onClick={() => setSelectedInstanceId(instance.id)}
                    >
                      <span>{instance.applicantName}</span>
                      <small>{instance.instanceType} · {instance.duration} · {instance.requestedAt}</small>
                      <b>{instance.status}</b>
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-panel admin-form">
                <div className="admin-panel-header">
                  <h3>신청 상세</h3>
                  {selectedInstance ? <span>{selectedInstance.keyEmail}</span> : null}
                </div>
                {selectedInstance ? (
                  <>
                    <div className="admin-detail-grid">
                      <Detail label="신청자" value={selectedInstance.applicantName} />
                      <Detail label="학번" value={selectedInstance.studentId} />
                      <Detail label="키 이메일" value={selectedInstance.keyEmail ?? '-'} />
                      <Detail label="스펙" value={`${selectedInstance.specs.cpu} / ${selectedInstance.specs.ram} / ${selectedInstance.specs.disk}`} />
                    </div>
                    <div className="admin-field-row">
                      <Field label="인스턴스 유형">
                        <input
                          value={instanceDraft.instanceType}
                          onChange={(event) => setInstanceDraft((current) => ({ ...current, instanceType: event.target.value }))}
                        />
                      </Field>
                      <Field label="기간">
                        <input
                          value={instanceDraft.duration}
                          onChange={(event) => setInstanceDraft((current) => ({ ...current, duration: event.target.value }))}
                        />
                      </Field>
                    </div>
                    <Field label="상태">
                      <select
                        value={instanceDraft.status}
                        onChange={(event) => setInstanceDraft((current) => ({ ...current, status: event.target.value as ApplyStatus }))}
                      >
                        <option value="pending">대기</option>
                        <option value="approved">승인</option>
                        <option value="rejected">반려</option>
                      </select>
                    </Field>
                    <Field label="목적">
                      <textarea
                        rows={4}
                        value={instanceDraft.purpose}
                        onChange={(event) => setInstanceDraft((current) => ({ ...current, purpose: event.target.value }))}
                      />
                    </Field>
                    <Field label="관리자 메모">
                      <textarea
                        rows={3}
                        value={instanceDraft.adminNote}
                        onChange={(event) => setInstanceDraft((current) => ({ ...current, adminNote: event.target.value }))}
                      />
                    </Field>
                    <div className="admin-row-actions admin-row-actions--wrap">
                      <button type="button" onClick={() => void saveInstance('approved')}>승인</button>
                      <button type="button" onClick={() => void saveInstance('rejected')}>반려</button>
                      <button type="button" className="admin-primary-button" onClick={() => void saveInstance()}>
                        저장
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="admin-empty">선택된 신청이 없습니다.</p>
                )}
              </div>
            </div>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>인스턴스 문의</h3>
                <span>{inquiries.length}건</span>
              </div>
              <DataTable
                headers={['제목', '작성자', '상태', '요약', '작성일']}
                rows={inquiries.map((inquiry) => [
                  inquiry.title,
                  inquiry.author,
                  inquiry.status,
                  inquiry.summary,
                  formatDate(inquiry.createdAt),
                ])}
                empty="인스턴스 문의가 없습니다."
              />
            </div>
          </div>
        ) : null}

        {activeTab === 'about' ? (
          <div className="admin-two-column admin-two-column--wide-left">
            <form className="admin-panel admin-form" onSubmit={saveAbout}>
              <div className="admin-panel-header">
                <h3>소개 페이지 수정</h3>
                <span>동아리 소개</span>
              </div>
              <Field label="제목">
                <input
                  value={aboutDraft.title}
                  onChange={(event) => setAboutDraft((current) => ({ ...current, title: event.target.value }))}
                />
              </Field>
              <Field label="소개 문구">
                <textarea
                  rows={5}
                  value={aboutDraft.description}
                  onChange={(event) => setAboutDraft((current) => ({ ...current, description: event.target.value }))}
                />
              </Field>
              <Field label="키워드">
                <input
                  value={aboutDraft.chipsText}
                  onChange={(event) => setAboutDraft((current) => ({ ...current, chipsText: event.target.value }))}
                />
              </Field>
              <button type="submit" className="admin-primary-button">
                <Icon name="edit" size={15} />
                소개 저장
              </button>
            </form>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>현재 소개</h3>
                <span>미리보기</span>
              </div>
              <div className="admin-about-preview">
                <p className="admin-kicker">COALA</p>
                <h3>{aboutContent.title}</h3>
                <p>{aboutContent.description}</p>
                <div className="admin-about-chips">
                  {aboutContent.chips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function DonutChart({
  label,
  value,
  total,
  detail,
  accent = '#1f6b4a',
}: {
  label: string
  value: number
  total: number
  detail: string
  accent?: string
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div className="admin-chart-card admin-chart-card--donut">
      <div
        className="admin-donut"
        style={{
          '--chart-percent': `${percent}%`,
          '--chart-accent': accent,
        } as CSSProperties}
      >
        <strong>{percent}%</strong>
      </div>
      <div>
        <h3>{label}</h3>
        <p>{detail}</p>
        <span>{formatNumber(value)} / {formatNumber(total)}</span>
      </div>
    </div>
  )
}

function MiniBarChart({
  title,
  items,
  total,
}: {
  title: string
  items: { label: string; value: number }[]
  total: number
}) {
  return (
    <div className="admin-chart-card">
      <div className="admin-chart-title">
        <h3>{title}</h3>
        <span>{formatNumber(total)}건</span>
      </div>
      <div className="admin-mini-bar-list">
        {items.map((item) => {
          const percent = total > 0 ? Math.max(3, (item.value / total) * 100) : 0

          return (
            <div key={item.label} className="admin-mini-bar-row">
              <span>{item.label}</span>
              <div className="admin-mini-bar-track">
                <i style={{ width: `${percent}%` }} />
              </div>
              <strong>{formatNumber(item.value)}</strong>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Metric({ label, value, icon }: { label: string; value: number; icon: IconName }) {
  return (
    <div className="admin-metric">
      <Icon name={icon} size={18} />
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="admin-detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DataTable({
  headers,
  rows,
  empty,
}: {
  headers: string[]
  rows: Array<Array<ReactNode>>
  empty: string
}) {
  if (rows.length === 0) return <p className="admin-empty">{empty}</p>

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

function ReportsPanel({
  reports,
  reportStatus,
  onStatusChange,
  onHandle,
}: {
  reports: AdminReport[]
  reportStatus: AdminReportStatus
  onStatusChange: (status: AdminReportStatus) => void
  onHandle: (report: AdminReport, status: AdminReportStatus) => void
}) {
  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h3>신고 관리</h3>
        <select
          className="admin-inline-select"
          value={reportStatus}
          onChange={(event) => onStatusChange(event.target.value as AdminReportStatus)}
        >
          {reportStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <DataTable
        headers={['대상', '사유', '상태', '신고자', '시각', '']}
        rows={reports.map((report) => [
          `${report.targetType} #${report.targetId}`,
          <span key={report.id} className={`admin-chip admin-chip--${cssToken(report.reasonType)}`}>
            {report.reasonType}
          </span>,
          report.status,
          String(report.reporterId),
          formatDate(report.createdAt),
          <div key={`${report.id}-actions`} className="admin-row-actions">
            <button type="button" onClick={() => onHandle(report, 'ACCEPTED')}>처리</button>
            <button type="button" onClick={() => onHandle(report, 'REJECTED')}>반려</button>
          </div>,
        ])}
        empty="선택한 상태의 신고가 없습니다."
      />
    </div>
  )
}
