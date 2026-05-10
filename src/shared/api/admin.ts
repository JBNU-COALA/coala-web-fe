import client from './client'
import type { UserData } from './auth'
import type { BoardData, CreateBoardRequest, UpdateBoardRequest } from './boards'
import type { PostListItem } from './posts'

export type AdminHomeDesignConfig = {
  siteTitle: string
  heroTitle: string
  heroSubtitle: string
  announcement: string
  accentColor: string
  showRecruitBanner: boolean
}

export type AdminRecentContent = {
  id: number
  title: string
  boardName: string
  authorName: string
  viewCount: number
  createdAt: string
}

export type AdminOverview = {
  userCount: number
  boardCount: number
  activeBoardCount: number
  postCount: number
  resourceCount: number
  totalViewCount: number
  recentPosts: AdminRecentContent[]
}

export type AdminUserUpdateRequest = {
  name: string
  nickname: string | null
  department: string
  studentId: string
  grade: number | null
  academicStatus: UserData['academicStatus']
}

export type AdminPostUpdateRequest = {
  title: string
  content: string
}

export type AdminResource = {
  resourceId: number
  postId: number
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  createdAt: string
}

export const defaultHomeDesign: AdminHomeDesignConfig = {
  siteTitle: '코알라',
  heroTitle: '코알라 커뮤니티 운영 포털',
  heroSubtitle: '동아리 소식, 게시판, 모집, 서비스를 한 곳에서 관리합니다.',
  announcement: '신규 부원 온보딩과 서비스 신청을 확인하세요.',
  accentColor: '#2f8f6f',
  showRecruitBanner: true,
}

export const adminApi = {
  getOverview: () => client.get<AdminOverview>('/api/admin/overview').then((r) => r.data),

  getHomeDesign: () =>
    client.get<AdminHomeDesignConfig>('/api/admin/home-design').then((r) => r.data),

  updateHomeDesign: (data: AdminHomeDesignConfig) =>
    client.patch<AdminHomeDesignConfig>('/api/admin/home-design', data).then((r) => r.data),

  getUsers: () => client.get<UserData[]>('/api/admin/users').then((r) => r.data),

  updateUser: (userId: number, data: AdminUserUpdateRequest) =>
    client.patch<UserData>(`/api/admin/users/${userId}`, data).then((r) => r.data),

  deleteUser: (userId: number) => client.delete(`/api/admin/users/${userId}`),

  getBoards: () => client.get<BoardData[]>('/api/admin/boards').then((r) => r.data),

  createBoard: (data: CreateBoardRequest) =>
    client.post<BoardData>('/api/admin/boards', data).then((r) => r.data),

  updateBoard: (boardId: number, data: UpdateBoardRequest) =>
    client.patch<BoardData>(`/api/admin/boards/${boardId}`, data).then((r) => r.data),

  deleteBoard: (boardId: number) => client.delete(`/api/admin/boards/${boardId}`),

  getPosts: () => client.get<PostListItem[]>('/api/admin/posts').then((r) => r.data),

  updatePost: (postId: number, data: AdminPostUpdateRequest) =>
    client.patch<PostListItem>(`/api/admin/posts/${postId}`, data).then((r) => r.data),

  deletePost: (postId: number) => client.delete(`/api/admin/posts/${postId}`),

  getResources: () => client.get<AdminResource[]>('/api/admin/resources').then((r) => r.data),

  deleteResource: (resourceId: number) => client.delete(`/api/admin/resources/${resourceId}`),
}
