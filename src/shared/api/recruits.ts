import client from './client'

export type RecruitStatus = 'open' | 'closed' | 'closing-soon'
export type RecruitCategory = 'study' | 'project' | 'tutoring'
export type RecruitAvatarTone = 'mint' | 'sky' | 'amber' | 'slate' | 'sand' | 'rose'
export type RecruitFilterId = 'all' | 'open' | 'closing-soon'

export type RecruitRole = {
  label: string
  current: number
  max: number
}

export type RecruitComment = {
  id: string
  author: string
  authorInitials: string
  authorTone: RecruitAvatarTone
  timeLabel: string
  content: string
  createdAt?: string
}

export type RecruitItem = {
  id: string
  title: string
  shortDesc: string
  category: RecruitCategory
  status: RecruitStatus
  currentMembers: number
  maxMembers: number
  host: string
  hostInitials: string
  hostTone: RecruitAvatarTone
  hostRole: string
  trustScore: number
  tags: string[]
  techStack: string[]
  roles: RecruitRole[]
  meetingType: string
  expectedDuration: string
  detailContent: string[]
  processList: string[]
  comments: RecruitComment[]
  createdAt: string
  views: number
  bookmarks: number
}

export type RecruitPostPayload = {
  title: string
  shortDesc: string
  category: RecruitCategory
  roles: { label: string; max: number }[]
  techStack: string[]
  meetingType: string
  expectedDuration: string
  tags: string[]
  detailContent: string[]
  processList: string[]
}

export type RecruitApplication = {
  id: number
  recruitId: string
  recruitTitle: string
  role: string
  body: string
  submittedAt: string
  status: string
}

export const recruitsApi = {
  getRecruits: (params?: { category?: RecruitCategory | 'all'; status?: RecruitFilterId; query?: string; sort?: 'latest' | 'popular' }) =>
    client.get<RecruitItem[]>('/api/recruits', { params }).then((response) => response.data),

  getRecruit: (recruitId: string) =>
    client.get<RecruitItem>(`/api/recruits/${recruitId}`).then((response) => response.data),

  createRecruit: (data: RecruitPostPayload) =>
    client.post<RecruitItem>('/api/recruits', data).then((response) => response.data),

  getComments: (recruitId: string) =>
    client.get<RecruitComment[]>(`/api/recruits/${recruitId}/comments`).then((response) => response.data),

  createComment: (recruitId: string, content: string) =>
    client.post<RecruitComment>(`/api/recruits/${recruitId}/comments`, { content }).then((response) => response.data),

  apply: (recruitId: string, data: { role: string; body: string }) =>
    client.post<RecruitApplication>(`/api/recruits/${recruitId}/applications`, data).then((response) => response.data),

  getMyApplications: () =>
    client.get<RecruitApplication[]>('/api/recruits/applications/me').then((response) => response.data),

  bookmark: (recruitId: string) =>
    client.post<RecruitItem>(`/api/recruits/${recruitId}/bookmarks`).then((response) => response.data),
}
