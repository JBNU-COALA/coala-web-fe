import client from './client'

export type EmploymentOutcome = 'ACCEPTED' | 'REJECTED'
export type EmploymentOption = { id: string; kind: 'INDUSTRY' | 'ROLE'; label: string; sortOrder: number; published: boolean; version: number }
export type EmploymentOptions = { options: EmploymentOption[]; companies: string[] }
export type EmploymentReview = {
  id: number; company: string; industryId: string; industry: string; roleId: string; role: string
  outcome: EmploymentOutcome; stage: string; recruitmentYear: number; title: string; content: string
  author: string; createdAt: string; updatedAt: string; canManage: boolean; version: number
}
export type EmploymentReviewInput = Pick<EmploymentReview, 'company' | 'industryId' | 'roleId' | 'outcome' | 'stage' | 'recruitmentYear' | 'title' | 'content'> & { version: number | null }
export type EmploymentList = { reviews: EmploymentReview[]; page: number; totalPages: number; totalElements: number }
export type EmploymentFilters = { outcome: EmploymentOutcome; industry?: string; role?: string; company?: string; q?: string; page: number }
const base = '/api/employment'
export const employmentApi = {
  options: async (signal?: AbortSignal) => (await client.get<EmploymentOptions>(`${base}/options`, { signal })).data,
  list: async (params: EmploymentFilters, signal?: AbortSignal) => (await client.get<EmploymentList>(`${base}/reviews`, { params, signal })).data,
  detail: async (id: string, signal?: AbortSignal) => (await client.get<EmploymentReview>(`${base}/reviews/${encodeURIComponent(id)}`, { signal })).data,
  save: async (input: EmploymentReviewInput, id?: number) => {
    const { company, industryId, roleId, outcome, stage, recruitmentYear, title, content, version } = input
    const payload = { company, industryId, roleId, outcome, stage, recruitmentYear, title, content, version }
    return (id ? await client.put<EmploymentReview>(`${base}/reviews/${id}`, payload) : await client.post<EmploymentReview>(`${base}/reviews`, payload)).data
  },
  delete: async (id: number) => client.delete(`${base}/reviews/${id}`),
}
