import { AdminOverview, type AdminDestination } from './AdminOverview'
import { AdminUserEditor } from './AdminUserEditor'
import { AdminAboutPanel } from './AdminAboutPanel'
import { AdminActivityPanel } from './AdminActivityPanel'
import { AdminBannersPanel } from './AdminBannersPanel'
import { AdminBoardsPanel } from './AdminBoardsPanel'
import { AdminDomainsPanel } from './AdminDomainsPanel'
import { AdminInquiriesPanel } from './AdminInquiriesPanel'
import { AdminServicesPanel } from './AdminServicesPanel'
import { AdminField as Field } from './AdminFields'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import {
  adminApi,
  type AdminActionLog,
  type AdminContentItem,
  type AdminPostStatus,
  type AdminReport,
  type AdminReportStatus,
  type AdminUserRole,
  type AdminUserSanctionType,
} from '../../shared/api/admin'
import type { UserData } from '../../shared/api/auth'
import type { BoardData } from '../../shared/api/boards'
import type { InfoArticle, InfoArticlePayload, InfoFilterId } from '../../shared/api/info'
import type { RecruitCategory, RecruitItem, RecruitPostPayload, RecruitStatus } from '../../shared/api/recruits'
import type { ApplyStatus, InstanceApplication, MemberService } from '../../shared/api/services'
import { isAdminUser } from '../../shared/auth/adminAccess'
import { useAuth } from '../../shared/auth/AuthContext'
import { routes } from '../../shared/routes'
import { Icon, type IconName } from '../../shared/ui/Icon'
import './admin.css'

type AdminTab = AdminDestination

type InfoEditDraft = {
  title: string
  filter: InfoFilterId
  tag: string
  meta: string
  sourceName: string
  sourceDate: string
  content: string
  imageUrl: string
}

type RecruitEditDraft = {
  title: string
  category: RecruitCategory
  status: RecruitStatus
  shortDesc: string
  rolesText: string
  techStackText: string
  meetingType: string
  expectedDuration: string
  tagsText: string
  detailContentText: string
  processListText: string
}

type InstanceDraft = {
  instanceType: string
  duration: string
  purpose: string
  status: ApplyStatus
  adminNote: string
}

const adminTabs: { id: AdminTab; label: string; icon: IconName }[] = [
  { id: 'stats', label: '운영 현황', icon: 'chart' },
  { id: 'users', label: '회원 관리', icon: 'users' },
  { id: 'banners', label: '배너 관리', icon: 'image' },
  { id: 'about', label: '소개 관리', icon: 'edit' },
  { id: 'boards', label: '게시판 관리', icon: 'layout' },
  { id: 'posts', label: '게시글 관리', icon: 'message' },
  { id: 'activity', label: '활동 관리', icon: 'calendar' },
  { id: 'reports', label: '신고 처리', icon: 'bell' },
  { id: 'services', label: '서비스 관리', icon: 'network' },
  { id: 'instances', label: '인스턴스 관리', icon: 'settings' },
  { id: 'domains', label: '도메인 관리', icon: 'link' },
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

const contentTypeLabel: Record<AdminContentItem['contentType'], string> = {
  POST: '게시판',
  INFO: '정보공유',
  RECRUIT: '모집',
}

const infoFilterOptions: { value: InfoFilterId; label: string }[] = [
  { value: 'news', label: '소식' },
  { value: 'contest', label: '대회' },
  { value: 'lab', label: '연구실' },
  { value: 'resource', label: '자료' },
]

const recruitCategoryOptions: { value: RecruitCategory; label: string }[] = [
  { value: 'study', label: '스터디' },
  { value: 'project', label: '프로젝트' },
  { value: 'tutoring', label: '멘토링' },
]

const recruitStatusOptions: { value: RecruitStatus; label: string }[] = [
  { value: 'open', label: '모집중' },
  { value: 'closing-soon', label: '마감 임박' },
  { value: 'closed', label: '마감' },
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

const emptyInfoDraft: InfoEditDraft = {
  title: '',
  filter: 'news',
  tag: '소식',
  meta: '',
  sourceName: '',
  sourceDate: new Date().toISOString().slice(0, 10),
  content: '',
  imageUrl: '',
}

const emptyRecruitDraft: RecruitEditDraft = {
  title: '',
  category: 'project',
  status: 'open',
  shortDesc: '',
  rolesText: '',
  techStackText: '',
  meetingType: '',
  expectedDuration: '',
  tagsText: '',
  detailContentText: '',
  processListText: '',
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

function listFromText(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function paragraphListFromText(value: string) {
  return value
    .split(/\n{2,}|\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseRecruitRoles(value: string) {
  const roles = value
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const matched = line.match(/^(.+?)[\s:：/]+(\d+)$/)
      if (!matched) return { label: line, max: 1 }
      return { label: matched[1].trim(), max: Number(matched[2]) || 1 }
    })

  return roles.length > 0 ? roles : [{ label: '팀원', max: 1 }]
}

function infoToDraft(article: InfoArticle): InfoEditDraft {
  return {
    title: article.title,
    filter: article.filter,
    tag: article.tag,
    meta: article.meta,
    sourceName: article.sourceName,
    sourceDate: article.sourceDate,
    content: article.content,
    imageUrl: article.imageUrl,
  }
}

function toInfoPayload(draft: InfoEditDraft): InfoArticlePayload {
  const fallbackLabel = infoFilterOptions.find((option) => option.value === draft.filter)?.label ?? '소식'
  return {
    filter: draft.filter,
    tag: draft.tag.trim() || fallbackLabel,
    title: draft.title.trim(),
    meta: draft.meta.trim() || fallbackLabel,
    sourceName: draft.sourceName.trim() || '코알라',
    sourceDate: draft.sourceDate || new Date().toISOString().slice(0, 10),
    content: draft.content.trim(),
    imageUrl: draft.imageUrl.trim(),
  }
}

function recruitToDraft(recruit: RecruitItem): RecruitEditDraft {
  return {
    title: recruit.title,
    category: recruit.category,
    status: recruit.status,
    shortDesc: recruit.shortDesc,
    rolesText: recruit.roles.map((role) => `${role.label}:${role.max}`).join('\n'),
    techStackText: recruit.techStack.join(', '),
    meetingType: recruit.meetingType,
    expectedDuration: recruit.expectedDuration,
    tagsText: recruit.tags.join(', '),
    detailContentText: recruit.detailContent.join('\n\n'),
    processListText: recruit.processList.join('\n'),
  }
}

function toRecruitPayload(draft: RecruitEditDraft): RecruitPostPayload {
  const techStack = listFromText(draft.techStackText)
  const detailContent = paragraphListFromText(draft.detailContentText)
  const processList = paragraphListFromText(draft.processListText)
  return {
    title: draft.title.trim(),
    shortDesc: draft.shortDesc.trim(),
    category: draft.category,
    status: draft.status,
    roles: parseRecruitRoles(draft.rolesText),
    techStack: techStack.length > 0 ? techStack : ['협업'],
    meetingType: draft.meetingType.trim() || '협의 후 결정',
    expectedDuration: draft.expectedDuration.trim() || '협의 후 결정',
    tags: listFromText(draft.tagsText),
    detailContent: detailContent.length > 0 ? detailContent : [draft.shortDesc.trim()],
    processList: processList.length > 0 ? processList : ['지원자 확인'],
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

export function AdminPage() {
  const { user, updateUser } = useAuth()
  const hasAdminAccess = isAdminUser(user)
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeTab: AdminTab = adminTabs.find((tab) => tab.id === requestedTab)?.id ?? 'stats'
  const setActiveTab = (tab: AdminTab) => setSearchParams({ tab })
  const [refreshKey, setRefreshKey] = useState(0)
  const [postQuery, setPostQuery] = useState('')
  const [contentType, setContentType] = useState('ALL')
  const [userQuery, setUserQuery] = useState('')
  const [pendingReportCount, setPendingReportCount] = useState<number | null>(null)
  const [loadFailures, setLoadFailures] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const loadSequence = useRef(0)
  const [statusMessage, setStatusMessage] = useState('관리자 데이터를 불러오는 중입니다.')
  const [users, setUsers] = useState<UserData[]>([])
  const [boards, setBoards] = useState<BoardData[]>([])
  const [posts, setPosts] = useState<AdminContentItem[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [auditLogs, setAuditLogs] = useState<AdminActionLog[]>([])
  const [memberServices, setMemberServices] = useState<MemberService[]>([])
  const [instanceApplications, setInstanceApplications] = useState<InstanceApplication[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedContentKey, setSelectedContentKey] = useState<string | null>(null)
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const [postStatus, setPostStatus] = useState<AdminPostStatus | 'ALL'>('ALL')
  const [reportStatus, setReportStatus] = useState<AdminReportStatus>('PENDING')
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
  const [infoDraft, setInfoDraft] = useState<InfoEditDraft>(emptyInfoDraft)
  const [recruitDraft, setRecruitDraft] = useState<RecruitEditDraft>(emptyRecruitDraft)
  const [isContentDraftLoading, setIsContentDraftLoading] = useState(false)
  const [hasContentDraftError, setHasContentDraftError] = useState(false)

  const selectedUser = users.find((item) => item.id === selectedUserId) ?? null
  const selectedPost = posts.find((item) => item.contentKey === selectedContentKey) ?? null
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
      activeServices: memberServices.filter((service) => !['운영중지', '운영종료', '운영완료'].includes(service.status)).length,
      pendingInstances: instanceApplications.filter((instance) => instance.status === 'pending').length,
      totalViews: posts.reduce((sum, post) => sum + post.viewCount, 0),
    }
  }, [boards, instanceApplications, memberServices, posts, reports, users])

  const filteredUsers = users.filter((item) =>
    `${item.name} ${item.email} ${item.studentId} ${item.department}`.toLowerCase().includes(userQuery.trim().toLowerCase()))
  const filteredPosts = posts.filter((post) => (postStatus === 'ALL' || post.status === postStatus) &&
    (contentType === 'ALL' || post.contentType === contentType) &&
    `${post.title} ${post.authorName ?? ''} ${post.boardName ?? ''}`.toLowerCase().includes(postQuery.trim().toLowerCase()))

  const loadAdminData = async () => {
    if (!hasAdminAccess) return
    const sequence = ++loadSequence.current
    setIsLoading(true)

    const [
      usersResult,
      boardsResult,
      postsResult,
      reportsResult,
      logsResult,
      servicesResult,
      instancesResult,
      pendingReportsResult,
    ] = await Promise.allSettled([
      adminApi.getUsers(),
      adminApi.getBoards(),
      adminApi.getPosts('ALL'),
      adminApi.getReports(reportStatus),
      adminApi.getAuditLogs(),
      adminApi.getMemberServices(),
      adminApi.getInstanceApplications(),
      adminApi.getReports('PENDING'),
    ])

    if (sequence !== loadSequence.current) return

    const failures = [
      usersResult,
      boardsResult,
      postsResult,
      reportsResult,
      logsResult,
      servicesResult,
      instancesResult,
      pendingReportsResult,
    ].filter((result) => result.status === 'rejected').length

    setLoadFailures([
      usersResult.status === 'rejected' ? 'users' : '',
      boardsResult.status === 'rejected' ? 'boards' : '',
      reportsResult.status === 'rejected' ? 'reports' : '',
      postsResult.status === 'rejected' ? 'posts' : '',
      servicesResult.status === 'rejected' ? 'services' : '',
      instancesResult.status === 'rejected' ? 'instances' : '',
      logsResult.status === 'rejected' ? 'logs' : '',
    ].filter(Boolean))
    setPendingReportCount(pendingReportsResult.status === 'fulfilled' ? pendingReportsResult.value.length : null)
    if (usersResult.status === 'fulfilled') {
      setUsers(usersResult.value)
      setSelectedUserId((current) => usersResult.value.some((item) => item.id === current) ? current : usersResult.value[0]?.id ?? null)
    }
    if (boardsResult.status === 'fulfilled') setBoards(boardsResult.value)
    if (postsResult.status === 'fulfilled') {
      setPosts(postsResult.value)
      setSelectedContentKey((current) =>
        postsResult.value.some((item) => item.contentKey === current)
          ? current
          : postsResult.value[0]?.contentKey ?? null,
      )
    }
    if (reportsResult.status === 'fulfilled') setReports(reportsResult.value)
    if (logsResult.status === 'fulfilled') setAuditLogs(logsResult.value)
    if (servicesResult.status === 'fulfilled') {
      setMemberServices(servicesResult.value)
    }
    if (instancesResult.status === 'fulfilled') {
      setInstanceApplications(instancesResult.value)
      setSelectedInstanceId((current) => instancesResult.value.some((item) => item.id === current) ? current : instancesResult.value[0]?.id ?? null)
    }
    setStatusMessage(
      failures === 0 && pendingReportsResult.status === 'fulfilled'
        ? '최신 상태입니다.'
        : `관리자 데이터 일부를 불러오지 못했습니다. 실패 API ${failures}개`,
    )
    setIsLoading(false)
  }

  useEffect(() => {
    // Server refresh hydrates the selected records and their controlled drafts.
    void loadAdminData()
    return () => { loadSequence.current += 1 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAdminAccess, reportStatus])

  useEffect(() => {
    if (selectedInstance) setInstanceDraft(instanceToDraft(selectedInstance))
  }, [selectedInstance])

  useEffect(() => {
    setHasContentDraftError(false)
    if (!selectedPost) {
      setInfoDraft(emptyInfoDraft)
      setRecruitDraft(emptyRecruitDraft)
      return
    }

    let isCurrent = true
    if (selectedPost.contentType === 'INFO' && selectedPost.postId) {
      setIsContentDraftLoading(true)
      adminApi.getInfoArticle(selectedPost.postId)
        .then((article) => {
          if (isCurrent) setInfoDraft(infoToDraft(article))
        })
        .catch(() => {
          if (isCurrent) {
            setHasContentDraftError(true)
            setStatusMessage('정보공유 상세를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.')
          }
        })
        .finally(() => {
          if (isCurrent) setIsContentDraftLoading(false)
        })
    } else if (selectedPost.contentType === 'RECRUIT' && selectedPost.externalId) {
      setIsContentDraftLoading(true)
      adminApi.getRecruit(selectedPost.externalId)
        .then((recruit) => {
          if (isCurrent) setRecruitDraft(recruitToDraft(recruit))
        })
        .catch(() => {
          if (isCurrent) {
            setHasContentDraftError(true)
            setStatusMessage('모집 상세를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.')
          }
        })
        .finally(() => {
          if (isCurrent) setIsContentDraftLoading(false)
        })
    } else {
      setIsContentDraftLoading(false)
    }

    return () => {
      isCurrent = false
    }
  }, [selectedPost])

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
      if (updated.id === user.id) updateUser(updated)
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

  const runPostAction = async (action: 'hide' | 'restore' | 'delete' | 'lock' | 'unlock') => {
    if (!selectedPost) return
    if (selectedPost.contentType !== 'POST' || !selectedPost.postId) {
      setStatusMessage('일반 게시판 글만 숨김/잠금 조치를 사용할 수 있습니다.')
      return
    }
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
      setPosts(await adminApi.getPosts('ALL'))
      setStatusMessage(`${actionLabel} 처리를 완료했습니다.`)
      await refreshAuditLogs()
    } catch {
      setStatusMessage(`${actionLabel} 처리에 실패했습니다.`)
    }
  }

  const saveInfoContent = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedPost?.postId || selectedPost.contentType !== 'INFO' || hasContentDraftError || isContentDraftLoading) return
    const payload = toInfoPayload(infoDraft)
    if (!payload.title || !payload.content) return
    try {
      const saved = await adminApi.updateInfoArticle(selectedPost.postId, payload)
      setInfoDraft(infoToDraft(saved))
      setPosts(await adminApi.getPosts('ALL'))
      setSelectedContentKey(`info-${saved.id}`)
      setStatusMessage('정보공유 글을 수정했습니다.')
    } catch {
      setStatusMessage('정보공유 글 수정에 실패했습니다.')
    }
  }

  const saveRecruitContent = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedPost?.externalId || selectedPost.contentType !== 'RECRUIT' || hasContentDraftError || isContentDraftLoading) return
    const payload = toRecruitPayload(recruitDraft)
    if (!payload.title || !payload.shortDesc || payload.techStack.length === 0 || payload.detailContent.length === 0) return
    try {
      const saved = await adminApi.updateRecruit(selectedPost.externalId, payload)
      setRecruitDraft(recruitToDraft(saved))
      setPosts(await adminApi.getPosts('ALL'))
      setSelectedContentKey(`recruit-${saved.id}`)
      setStatusMessage('모집 공고를 수정했습니다.')
    } catch {
      setStatusMessage('모집 공고 수정에 실패했습니다.')
    }
  }

  const deleteSelectedExternalContent = async () => {
    if (!selectedPost || selectedPost.contentType === 'POST') return
    if (!window.confirm(`${contentTypeLabel[selectedPost.contentType]} 글을 삭제할까요?`)) return

    try {
      if (selectedPost.contentType === 'INFO' && selectedPost.postId) {
        await adminApi.deleteInfoArticle(selectedPost.postId)
      }
      if (selectedPost.contentType === 'RECRUIT' && selectedPost.externalId) {
        await adminApi.deleteRecruit(selectedPost.externalId)
      }
      const nextPosts = await adminApi.getPosts('ALL')
      setPosts(nextPosts)
      setSelectedContentKey(nextPosts[0]?.contentKey ?? null)
      setStatusMessage(`${contentTypeLabel[selectedPost.contentType]} 글을 삭제했습니다.`)
    } catch {
      setStatusMessage(`${contentTypeLabel[selectedPost.contentType]} 글 삭제에 실패했습니다.`)
    }
  }

  const handleReport = async (report: AdminReport, status: AdminReportStatus) => {
    const reason = askReason(`신고 ${status === 'ACCEPTED' ? '처리' : '상태 변경'}`)
    if (!reason) return
    try {
      const updated = await adminApi.handleReport(report.id, status, reason)
      setReports((items) => items.map((item) => (item.id === updated.id ? updated : item)).filter((item) => item.status === reportStatus))
      setPendingReportCount((await adminApi.getReports('PENDING')).length)
      setStatusMessage('신고 상태를 변경했습니다.')
      await refreshAuditLogs()
    } catch {
      setStatusMessage('신고 처리에 실패했습니다.')
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
              aria-current={activeTab === tab.id ? 'page' : undefined}
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
            <p className="admin-status" role="status">{isLoading ? '불러오는 중...' : statusMessage}</p>
            <button type="button" className="admin-ghost-button" title="새로고침" aria-label="새로고침" disabled={isLoading} onClick={() => { setRefreshKey((value) => value + 1); void loadAdminData() }}>
              새로고침
            </button>
          </div>
        </header>

        {loadFailures.includes(activeTab) && <p className="admin-error" role="alert">이 항목을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>}
        {activeTab === 'banners' && <AdminBannersPanel refreshKey={refreshKey} />}
        {activeTab === 'about' && <AdminAboutPanel refreshKey={refreshKey} />}
        {activeTab === 'activity' && <AdminActivityPanel refreshKey={refreshKey} />}
        {activeTab === 'domains' && <AdminDomainsPanel refreshKey={refreshKey} />}
        {activeTab === 'boards' && !isLoading && !loadFailures.includes('boards') && <AdminBoardsPanel boards={boards} onChange={setBoards} />}
        {activeTab === 'services' && !isLoading && !loadFailures.includes('services') && <AdminServicesPanel services={memberServices} onChange={setMemberServices} />}

        {activeTab === 'stats' && <AdminOverview counts={{
          users: isLoading || loadFailures.includes('users') ? null : stats.userCount,
          posts: isLoading || loadFailures.includes('posts') ? null : stats.postCount,
          services: isLoading || loadFailures.includes('services') ? null : stats.activeServices,
          reports: isLoading ? null : pendingReportCount,
          instances: isLoading || loadFailures.includes('instances') ? null : stats.pendingInstances,
        }} logs={auditLogs} logsUnavailable={loadFailures.includes('logs')} onNavigate={setActiveTab} />}
        {activeTab === 'reports' && !isLoading && !loadFailures.includes('reports') && <ReportsPanel reports={reports} reportStatus={reportStatus}
          onStatusChange={setReportStatus} onHandle={handleReport} />}

        {activeTab === 'users' && !isLoading && !loadFailures.includes('users') ? (
          <div className="admin-two-column admin-two-column--wide-left">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h3>회원 목록</h3>
                <span>{users.length}명</span>
              </div>
              <label className="admin-member-search"><Icon name="search" size={16} />
                <input aria-label="회원 검색" placeholder="이름, 이메일, 학번, 학과 검색" value={userQuery} onChange={(event) => setUserQuery(event.target.value)} />
              </label>
              <div className="admin-list">
                {filteredUsers.length === 0 && <p className="admin-empty">검색 결과가 없습니다.</p>}
                {filteredUsers.map((item) => (
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
                  <h3>회원정보</h3>
                  {selectedUser ? <span>ID {selectedUser.id}</span> : null}
                </div>
                {selectedUser ? (
                  <>
                    <div className="admin-detail-grid">
                      <Detail label="이메일 인증" value={selectedUser.verified ? '완료' : '미완료'} />
                      <Detail label="가입일" value={formatDate(selectedUser.createdAt)} />
                    </div>
                    <AdminUserEditor key={selectedUser.id} user={selectedUser} onSave={(saved) => {
                      setUsers((items) => items.map((item) => item.id === saved.id ? saved : item))
                      if (saved.id === user.id) updateUser(saved)
                      void refreshAuditLogs()
                    }} />
                    <Field label="권한">
                      <select
                        disabled={normalizeRole(user.role) !== 'SUPER_ADMIN'}
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

        {activeTab === 'posts' && !isLoading && !loadFailures.includes('posts') ? (
          <div className="admin-stack">
            <div className="admin-two-column admin-two-column--wide-left">
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h3>게시글</h3>
                  <select
                    aria-label="게시글 상태"
                    className="admin-inline-select"
                    value={postStatus}
                    onChange={(event) => setPostStatus(event.target.value as AdminPostStatus | 'ALL')}
                  >
                    {postStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <label className="admin-member-search"><Icon name="search" size={16} /><input aria-label="게시글 검색" placeholder="제목, 작성자, 게시판 검색" value={postQuery} onChange={(event) => setPostQuery(event.target.value)} /></label>
                <select className="admin-inline-select" aria-label="게시글 유형" value={contentType} onChange={(event) => setContentType(event.target.value)}>
                  <option value="ALL">전체 유형</option><option value="POST">게시판</option><option value="INFO">정보공유</option><option value="RECRUIT">모집</option>
                </select>
                <div className="admin-list">
                  {filteredPosts.length === 0 && <p className="admin-empty">조건에 맞는 게시글이 없습니다.</p>}
                  {filteredPosts.map((post) => (
                    <button
                      key={post.contentKey}
                      type="button"
                      className={selectedContentKey === post.contentKey ? 'admin-list-row is-active' : 'admin-list-row'}
                      onClick={() => setSelectedContentKey(post.contentKey)}
                    >
                      <span>{post.title}</span>
                      <small>
                        {post.boardName ?? `게시판 ${post.boardId ?? '-'}`} · {post.authorName ?? `유저 ${post.userId ?? '-'}`}
                      </small>
                      <b>{contentTypeLabel[post.contentType]}</b>
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-panel admin-form">
                <div className="admin-panel-header">
                  <h3>게시글 조치/수정</h3>
                  {selectedPost ? <span>{selectedPost.contentKey}</span> : null}
                </div>
                {selectedPost ? (
                  <>
                    <div className="admin-detail-grid">
                      <Detail label="유형" value={contentTypeLabel[selectedPost.contentType]} />
                      <Detail label="제목" value={selectedPost.title} />
                      <Detail label="분류" value={selectedPost.boardName ?? String(selectedPost.boardId ?? '-')} />
                      <Detail label="작성자" value={selectedPost.authorName ?? `유저 ${selectedPost.userId ?? '-'}`} />
                      <Detail label="상태" value={selectedPost.status ?? 'ACTIVE'} />
                      <Detail label="잠금" value={selectedPost.locked ? '잠김' : '열림'} />
                      <Detail label="조회" value={formatNumber(selectedPost.viewCount)} />
                    </div>
                    {selectedPost.contentType === 'POST' ? (
                      <>
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
                    ) : null}
                    {selectedPost.contentType === 'INFO' ? (
                      <form className="admin-content-edit-form" onSubmit={saveInfoContent}>
                        {hasContentDraftError && <p className="admin-error" role="alert">상세 조회에 실패하여 편집할 수 없습니다. 새로고침해 주세요.</p>}
                        <div className="admin-panel-subhead">
                          <strong>정보공유 수정</strong>
                          <button type="button" className="admin-danger-button" onClick={() => void deleteSelectedExternalContent()}>
                            삭제
                          </button>
                        </div>
                        <div className="admin-field-row">
                          <Field label="분류">
                            <select
                              value={infoDraft.filter}
                              disabled={isContentDraftLoading}
                              onChange={(event) => setInfoDraft((current) => ({ ...current, filter: event.target.value as InfoFilterId }))}
                            >
                              {infoFilterOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </Field>
                          <Field label="출처 날짜">
                            <input
                              type="date"
                              value={infoDraft.sourceDate}
                              disabled={isContentDraftLoading}
                              onChange={(event) => setInfoDraft((current) => ({ ...current, sourceDate: event.target.value }))}
                            />
                          </Field>
                        </div>
                        <Field label="제목">
                          <input
                            value={infoDraft.title}
                            disabled={isContentDraftLoading}
                            onChange={(event) => setInfoDraft((current) => ({ ...current, title: event.target.value }))}
                          />
                        </Field>
                        <div className="admin-field-row">
                          <Field label="태그">
                            <input
                              value={infoDraft.tag}
                              disabled={isContentDraftLoading}
                              onChange={(event) => setInfoDraft((current) => ({ ...current, tag: event.target.value }))}
                            />
                          </Field>
                          <Field label="작성자 표시">
                            <input
                              value={infoDraft.sourceName}
                              disabled={isContentDraftLoading}
                              onChange={(event) => setInfoDraft((current) => ({ ...current, sourceName: event.target.value }))}
                            />
                          </Field>
                        </div>
                        <Field label="요약">
                          <input
                            value={infoDraft.meta}
                            disabled={isContentDraftLoading}
                            onChange={(event) => setInfoDraft((current) => ({ ...current, meta: event.target.value }))}
                          />
                        </Field>
                        <Field label="대표 이미지 URL">
                          <input
                            value={infoDraft.imageUrl}
                            disabled={isContentDraftLoading}
                            onChange={(event) => setInfoDraft((current) => ({ ...current, imageUrl: event.target.value }))}
                          />
                        </Field>
                        <Field label="본문">
                          <textarea
                            rows={8}
                            value={infoDraft.content}
                            disabled={isContentDraftLoading}
                            onChange={(event) => setInfoDraft((current) => ({ ...current, content: event.target.value }))}
                          />
                        </Field>
                        <button type="submit" className="admin-primary-button" disabled={isContentDraftLoading || hasContentDraftError || !infoDraft.title.trim() || !infoDraft.content.trim()}>
                          정보공유 저장
                        </button>
                      </form>
                    ) : null}
                    {selectedPost.contentType === 'RECRUIT' ? (
                      <form className="admin-content-edit-form" onSubmit={saveRecruitContent}>
                        {hasContentDraftError && <p className="admin-error" role="alert">상세 조회에 실패하여 편집할 수 없습니다. 새로고침해 주세요.</p>}
                        <div className="admin-panel-subhead">
                          <strong>모집 수정</strong>
                          <button type="button" className="admin-danger-button" onClick={() => void deleteSelectedExternalContent()}>
                            삭제
                          </button>
                        </div>
                        <div className="admin-field-row">
                          <Field label="분류">
                            <select
                              value={recruitDraft.category}
                              disabled={isContentDraftLoading}
                              onChange={(event) => setRecruitDraft((current) => ({ ...current, category: event.target.value as RecruitCategory }))}
                            >
                              {recruitCategoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </Field>
                          <Field label="상태">
                            <select
                              value={recruitDraft.status}
                              disabled={isContentDraftLoading}
                              onChange={(event) => setRecruitDraft((current) => ({ ...current, status: event.target.value as RecruitStatus }))}
                            >
                              {recruitStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </Field>
                        </div>
                        <Field label="제목">
                          <input
                            value={recruitDraft.title}
                            disabled={isContentDraftLoading}
                            onChange={(event) => setRecruitDraft((current) => ({ ...current, title: event.target.value }))}
                          />
                        </Field>
                        <Field label="한 줄 소개">
                          <textarea
                            rows={3}
                            value={recruitDraft.shortDesc}
                            disabled={isContentDraftLoading}
                            onChange={(event) => setRecruitDraft((current) => ({ ...current, shortDesc: event.target.value }))}
                          />
                        </Field>
                        <div className="admin-field-row">
                          <Field label="역할/인원">
                            <textarea
                              rows={4}
                              value={recruitDraft.rolesText}
                              disabled={isContentDraftLoading}
                              onChange={(event) => setRecruitDraft((current) => ({ ...current, rolesText: event.target.value }))}
                            />
                          </Field>
                          <Field label="기술 스택">
                            <textarea
                              rows={4}
                              value={recruitDraft.techStackText}
                              disabled={isContentDraftLoading}
                              onChange={(event) => setRecruitDraft((current) => ({ ...current, techStackText: event.target.value }))}
                            />
                          </Field>
                        </div>
                        <div className="admin-field-row">
                          <Field label="진행 방식">
                            <input
                              value={recruitDraft.meetingType}
                              disabled={isContentDraftLoading}
                              onChange={(event) => setRecruitDraft((current) => ({ ...current, meetingType: event.target.value }))}
                            />
                          </Field>
                          <Field label="예상 기간">
                            <input
                              value={recruitDraft.expectedDuration}
                              disabled={isContentDraftLoading}
                              onChange={(event) => setRecruitDraft((current) => ({ ...current, expectedDuration: event.target.value }))}
                            />
                          </Field>
                        </div>
                        <Field label="태그">
                          <input
                            value={recruitDraft.tagsText}
                            disabled={isContentDraftLoading}
                            onChange={(event) => setRecruitDraft((current) => ({ ...current, tagsText: event.target.value }))}
                          />
                        </Field>
                        <Field label="본문">
                          <textarea
                            rows={8}
                            value={recruitDraft.detailContentText}
                            disabled={isContentDraftLoading}
                            onChange={(event) => setRecruitDraft((current) => ({ ...current, detailContentText: event.target.value }))}
                          />
                        </Field>
                        <Field label="진행 프로세스">
                          <textarea
                            rows={4}
                            value={recruitDraft.processListText}
                            disabled={isContentDraftLoading}
                            onChange={(event) => setRecruitDraft((current) => ({ ...current, processListText: event.target.value }))}
                          />
                        </Field>
                        <button type="submit" className="admin-primary-button" disabled={isContentDraftLoading || hasContentDraftError || !recruitDraft.title.trim() || !recruitDraft.shortDesc.trim()}>
                          모집 저장
                        </button>
                      </form>
                    ) : null}
                  </>
                ) : (
                  <p className="admin-empty">선택된 게시글이 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'instances' && !isLoading && !loadFailures.includes('instances') ? (
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
          </div>
        ) : null}

        {activeTab === 'instances' && <AdminInquiriesPanel kind="instances" refreshKey={refreshKey} />}
      </div>
    </section>
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
          aria-label="신고 상태"
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
