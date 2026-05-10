import client from './client'

export type ServiceCategory = 'productivity' | 'ai' | 'community' | 'learning' | string
export type MemberServiceStatus = '운영중' | '운영중지' | '운영종료' | string

export type MemberService = {
  id: string
  title: string
  category: ServiceCategory
  owner: string
  summary: string
  url: string
  githubUrl: string
  imageUrl: string
  tags: string[]
  status: MemberServiceStatus
  audience: string
  visibility: string
  period: string
  description: string
  features: string[]
  stack: string[]
}

export type MemberServicePayload = {
  title: string
  category: string
  summary: string
  url: string
  tags: string[]
}

export type InstanceApplyPayload = {
  applicantName: string
  studentId: string
  keyEmail: string
  instanceType: string
  duration: string
  purpose: string
}

export type ApplyStatus = 'pending' | 'approved' | 'rejected'

export type InstanceApplication = {
  id: string
  applicantName: string
  studentId: string
  keyEmail?: string
  instanceType: 'micro' | 'medium' | string
  purpose: string
  duration: string
  requestedAt: string
  approvedAt?: string | null
  status: ApplyStatus
  adminNote?: string | null
  attachedFiles?: { name: string; size: string; uploadedAt: string }[]
  specs: { cpu: string; ram: string; disk: string }
}

export type ServiceInquiry = {
  id: string
  title: string
  summary: string
  author: string
  createdAt: string
  status: string
  statusClass: string
}

export const servicesApi = {
  getMemberServices: () =>
    client.get<MemberService[]>('/api/services').then((response) => response.data),

  getMemberService: (serviceId: string) =>
    client.get<MemberService>(`/api/services/${serviceId}`).then((response) => response.data),

  createMemberService: (data: MemberServicePayload) =>
    client.post<MemberService>('/api/services', data).then((response) => response.data),

  getInstanceApplications: () =>
    client.get<InstanceApplication[]>('/api/services/instances/applications').then((response) => response.data),

  createInstanceApplication: (data: InstanceApplyPayload) =>
    client.post<InstanceApplication>('/api/services/instances/applications', data).then((response) => response.data),

  updateInstanceApplication: (applicationId: string, data: Partial<InstanceApplyPayload> & { status?: ApplyStatus; adminNote?: string }) =>
    client.patch<InstanceApplication>(`/api/services/instances/applications/${applicationId}`, data).then((response) => response.data),

  getInquiries: () =>
    client.get<ServiceInquiry[]>('/api/services/instances/inquiries').then((response) => response.data),

  createInquiry: (data: { title: string; content: string; author?: string }) =>
    client.post<ServiceInquiry>('/api/services/instances/inquiries', data).then((response) => response.data),
}
