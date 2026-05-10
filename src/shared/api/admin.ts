import client from './client'
import type { UserData } from './auth'
import type { BoardData, CreateBoardRequest, UpdateBoardRequest } from './boards'
import type { PostListItem } from './posts'
import type {
  ApplyStatus,
  InstanceApplication,
  InstanceApplyPayload,
  MemberService,
  MemberServicePayload,
  ServiceInquiry,
} from './services'

export type AdminUserRole = 'USER' | 'STAFF' | 'SUPER_ADMIN'

export type AdminPostStatus =
  | 'ACTIVE'
  | 'HIDDEN'
  | 'DELETED'
  | 'ADMIN_DELETED'
  | 'BLOCKED'
  | 'PENDING'

export type AdminReportStatus = 'PENDING' | 'AUTO_HIDDEN' | 'ACCEPTED' | 'REJECTED'

export type AdminReport = {
  id: number
  reporterId: number
  targetType: 'POST' | 'COMMENT' | 'USER'
  targetId: number
  reasonType: string
  reasonDetail?: string | null
  status: AdminReportStatus
  createdAt: string
  handledAt?: string | null
}

export type AdminActionLog = {
  id: number
  adminId: number
  adminName: string
  targetType: 'POST' | 'COMMENT' | 'USER' | string
  targetId: number
  action: string
  reason?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: string
}

export type AdminUserSanctionType =
  | 'WARNING'
  | 'POST_RESTRICTED'
  | 'COMMENT_RESTRICTED'
  | 'TEMP_SUSPENDED'
  | 'ACCOUNT_SUSPENDED'
  | 'PERMANENT_BANNED'

export type AdminUserSanctionRequest = {
  userId: number
  type: AdminUserSanctionType
  reason: string
  startAt?: string | null
  endAt?: string | null
}

export const adminApi = {
  getUsers: () => client.get<UserData[]>('/api/admin/users').then((r) => r.data),

  updateUserRole: (userId: number, role: AdminUserRole) =>
    client.patch<UserData>(`/api/admin/users/${userId}/role`, { role }).then((r) => r.data),

  sanctionUser: (data: AdminUserSanctionRequest) =>
    client.post<void>('/api/admin/moderation/sanctions', data).then((r) => r.data),

  getBoards: () => client.get<BoardData[]>('/api/boards').then((r) => r.data),

  createBoard: (data: CreateBoardRequest) =>
    client.post('/api/boards', data).then((r) => r.data),

  updateBoard: (boardId: number, data: UpdateBoardRequest) =>
    client.patch(`/api/boards/${boardId}`, data).then((r) => r.data),

  deleteBoard: (boardId: number) => client.delete<void>(`/api/boards/${boardId}`).then((r) => r.data),

  getPosts: (status?: AdminPostStatus | 'ALL') =>
    client
      .get<PostListItem[]>('/api/admin/posts', {
        params: status && status !== 'ALL' ? { status } : undefined,
      })
      .then((r) => r.data),

  hidePost: (postId: number, reason: string) =>
    client.post<void>(`/api/admin/moderation/posts/${postId}/hide`, { reason }).then((r) => r.data),

  restorePost: (postId: number, reason: string) =>
    client.post<void>(`/api/admin/moderation/posts/${postId}/restore`, { reason }).then((r) => r.data),

  deletePost: (postId: number, reason: string) =>
    client.post<void>(`/api/admin/moderation/posts/${postId}/delete`, { reason }).then((r) => r.data),

  lockPost: (postId: number, reason: string) =>
    client.post<void>(`/api/admin/moderation/posts/${postId}/lock`, { reason }).then((r) => r.data),

  unlockPost: (postId: number, reason: string) =>
    client.post<void>(`/api/admin/moderation/posts/${postId}/unlock`, { reason }).then((r) => r.data),

  getReports: (status: AdminReportStatus = 'PENDING') =>
    client.get<AdminReport[]>('/api/admin/moderation/reports', { params: { status } }).then((r) => r.data),

  handleReport: (reportId: number, status: AdminReportStatus, reason: string) =>
    client
      .patch<AdminReport>(`/api/admin/moderation/reports/${reportId}`, { status, reason })
      .then((r) => r.data),

  getAuditLogs: () => client.get<AdminActionLog[]>('/api/admin/audit-logs').then((r) => r.data),

  getMemberServices: () => client.get<MemberService[]>('/api/services').then((r) => r.data),

  createMemberService: (data: MemberServicePayload) =>
    client.post<MemberService>('/api/services', data).then((r) => r.data),

  updateMemberService: (serviceId: string, data: MemberServicePayload) =>
    client.patch<MemberService>(`/api/services/${serviceId}`, data).then((r) => r.data),

  retireMemberService: (serviceId: string) =>
    client.delete<void>(`/api/services/${serviceId}`).then((r) => r.data),

  getInstanceApplications: () =>
    client.get<InstanceApplication[]>('/api/services/instances/applications').then((r) => r.data),

  updateInstanceApplication: (
    applicationId: string,
    data: Partial<InstanceApplyPayload> & { status?: ApplyStatus; adminNote?: string },
  ) =>
    client
      .patch<InstanceApplication>(`/api/services/instances/applications/${applicationId}`, data)
      .then((r) => r.data),

  getInstanceInquiries: () =>
    client.get<ServiceInquiry[]>('/api/services/instances/inquiries').then((r) => r.data),
}
