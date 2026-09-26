import type { UserDetailsPayload } from './userDetails'
import client from './client'
import type { UserData } from './auth'
import { boardsApi } from './boards'
import { infoApi } from './info'
import type { PostListItem } from './posts'
import { recruitsApi } from './recruits'
import type { SiteBanner, SiteBannerPayload } from './site'
import type { StudyGroup, StudyRecord } from '../activity'
import {
  servicesApi,
  type MemberService,
  type MemberServicePayload,
  type ServiceInquiry,
} from './services'

export type AdminUserRole = 'USER' | 'STAFF' | 'SUPER_ADMIN'

export type AdminServicePayload = MemberServicePayload & {
  owner: string
  status: '운영중' | '운영중지' | '운영완료'
}

export type AdminInquiryStatus = 'open' | 'answered' | 'closed'
export type AdminServiceInquiry = ServiceInquiry & {
  content?: string
  reply?: string
  answeredAt?: string | null
  authorId?: number | null
}

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

export type AdminContentType = 'POST' | 'INFO' | 'RECRUIT'

export type AdminContentItem = Omit<PostListItem, 'postId' | 'boardId' | 'userId'> & {
  contentType: AdminContentType
  contentKey: string
  postId: number | null
  boardId: number | null
  userId: number | null
  externalId?: string | null
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
  getBanners: () => client.get<SiteBanner[]>('/api/admin/banners').then((r) => r.data),
  createBanner: (data: SiteBannerPayload) =>
    client.post<SiteBanner>('/api/admin/banners', data).then((r) => r.data),
  updateBanner: (id: number, data: SiteBannerPayload) =>
    client.patch<SiteBanner>(`/api/admin/banners/${id}`, data).then((r) => r.data),
  deleteBanner: (id: number) => client.delete<void>(`/api/admin/banners/${id}`).then((r) => r.data),

  getStudyGroups: () => client.get<StudyGroup[]>('/api/study/groups').then((r) => r.data),
  getStudyRecords: (from: string, to: string) =>
    client.get<StudyRecord[]>('/api/study/records', { params: { from, to } }).then((r) => r.data),

  getDomainApplications: servicesApi.getDomainApplications,
  updateDomainApplication: servicesApi.updateDomainApplication,
  getDomainInquiries: () =>
    client.get<AdminServiceInquiry[]>('/api/services/domains/inquiries').then((r) => r.data),
  updateInquiry: (kind: 'instances' | 'domains', id: string, data: { status: AdminInquiryStatus; reply: string }) =>
    client.patch<AdminServiceInquiry>(`/api/services/${kind}/inquiries/${encodeURIComponent(id)}`, data).then((r) => r.data),
  updateUserProfile: (userId: number, data: UserDetailsPayload) =>
    client.patch<UserData>(`/api/admin/users/${userId}/profile`, data).then((r) => r.data),
  getUsers: () => client.get<UserData[]>('/api/admin/users').then((r) => r.data),

  updateUserRole: (userId: number, role: AdminUserRole) =>
    client.patch<UserData>(`/api/admin/users/${userId}/role`, { role }).then((r) => r.data),

  sanctionUser: (data: AdminUserSanctionRequest) =>
    client.post<void>('/api/admin/moderation/sanctions', data).then((r) => r.data),

  getBoards: boardsApi.getBoards,
  createBoard: boardsApi.createBoard,
  updateBoard: boardsApi.updateBoard,
  deleteBoard: (boardId: number) => boardsApi.deleteBoard(boardId).then(() => undefined),

  getPosts: (status?: AdminPostStatus | 'ALL') =>
    client
      .get<AdminContentItem[]>('/api/admin/posts', {
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

  getInfoArticle: infoApi.getArticle,
  updateInfoArticle: infoApi.updateArticle,
  deleteInfoArticle: (articleId: number) => infoApi.deleteArticle(articleId).then(() => undefined),

  getRecruit: recruitsApi.getRecruit,
  updateRecruit: recruitsApi.updateRecruit,
  deleteRecruit: recruitsApi.deleteRecruit,

  getReports: (status: AdminReportStatus = 'PENDING') =>
    client.get<AdminReport[]>('/api/admin/moderation/reports', { params: { status } }).then((r) => r.data),

  handleReport: (reportId: number, status: AdminReportStatus, reason: string) =>
    client
      .patch<AdminReport>(`/api/admin/moderation/reports/${reportId}`, { status, reason })
      .then((r) => r.data),

  getAuditLogs: () => client.get<AdminActionLog[]>('/api/admin/audit-logs').then((r) => r.data),

  getMemberServices: servicesApi.getMemberServices,

  createMemberService: (data: AdminServicePayload) =>
    client.post<MemberService>('/api/services', data).then((r) => r.data),

  updateMemberService: (serviceId: string, data: AdminServicePayload) =>
    client.patch<MemberService>(`/api/services/${serviceId}`, data).then((r) => r.data),

  retireMemberService: servicesApi.retireMemberService,
  getInstanceApplications: servicesApi.getInstanceApplications,
  updateInstanceApplication: servicesApi.updateInstanceApplication,

  getInstanceInquiries: () =>
    client.get<AdminServiceInquiry[]>('/api/services/instances/inquiries').then((r) => r.data),
}
