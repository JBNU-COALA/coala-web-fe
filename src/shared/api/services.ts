import client from './client'

export type MemberServicePayload = {
  title: string
  category: string
  summary: string
  url: string
  tags: string[]
}

export type InstanceApplyPayload = {
  instanceType: string
  duration: string
  purpose: string
}

export const servicesApi = {
  getMemberServices: () =>
    client.get('/api/services').then((response) => response.data),

  createMemberService: (data: MemberServicePayload) =>
    client.post('/api/services', data).then((response) => response.data),

  getInstanceApplications: () =>
    client.get('/api/services/instances/applications').then((response) => response.data),

  createInstanceApplication: (data: InstanceApplyPayload) =>
    client.post('/api/services/instances/applications', data).then((response) => response.data),

  updateInstanceApplication: (applicationId: string, data: Partial<InstanceApplyPayload>) =>
    client.patch(`/api/services/instances/applications/${applicationId}`, data).then((response) => response.data),
}
