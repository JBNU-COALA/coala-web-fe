import client from './client'
import type { EducationSubject, EducationCourse } from './education'
import type { CtfChallengeDetail, CtfInstance } from '../../pages/education/hacking/types'

export type ManagedChallenge = CtfChallengeDetail & { published: boolean; version: number }
export type SeedStatus = { available: boolean; reason?: string; challenges?: number; courses?: number; assets?: number; missingChallenges?: number; missingCourses?: number; missingAssets?: number }
export type SeedResult = { subjectsCreated: number; challengesCreated: number; coursesCreated: number; assetsCreated?: number; skipped: number }
export type LearnerRow = { userId: number; nickname: string; solved: number; submissions: number; points: number; completedLessons: number }
export type InstanceRow = { id: string; userId: number; nickname: string; challengeId: string; expiresAt: string; instance: CtfInstance }
export type RuntimeStatus = { configured: boolean; available: boolean; dryRun?: boolean; challenges?: number }
const base = '/api/admin/education'
export const adminEducationApi = {
  subjects: async (signal?: AbortSignal) => (await client.get<EducationSubject[]>(`${base}/subjects`, { signal })).data,
  courses: async (subject: string, signal?: AbortSignal) => (await client.get<EducationCourse[]>(`${base}/subjects/${encodeURIComponent(subject)}/courses`, { signal })).data,
  challenges: async (signal?: AbortSignal) => (await client.get<ManagedChallenge[]>(`${base}/challenges`, { signal })).data,
  course: async (id: string) => (await client.get<EducationCourse>(`${base}/courses/${encodeURIComponent(id)}`)).data,
  challenge: async (id: string) => (await client.get<{ challenge: ManagedChallenge }>(`${base}/challenges/${encodeURIComponent(id)}`)).data.challenge,
  save: async (kind: 'subjects' | 'courses' | 'challenges', id: string, input: unknown) => (await client.put<{ id: string; version: number }>(`${base}/${kind}/${encodeURIComponent(id)}`, input)).data,
  seed: async (signal?: AbortSignal) => (await client.get<SeedStatus>(`${base}/seed`, { signal })).data,
  install: async () => (await client.post<SeedResult>(`${base}/seed`, {}, { timeout: 180000 })).data,
  import: async (input: unknown) => (await client.post<SeedResult>(`${base}/import`, input, { timeout: 180000 })).data,
  learners: async (signal?: AbortSignal) => (await client.get<LearnerRow[]>(`${base}/learners`, { signal })).data,
  instances: async (signal?: AbortSignal) => (await client.get<InstanceRow[]>(`${base}/instances`, { signal })).data,
  runtime: async (signal?: AbortSignal) => (await client.get<RuntimeStatus>(`${base}/runtime`, { signal, timeout: 10000 })).data,
  stop: async (id: string) => client.post(`${base}/instances/${encodeURIComponent(id)}/stop`, {}),
  upload: async (id: string, file: File, version: number) => { const body = new FormData(); body.append('file', file); body.append('name', `files/${file.name}`); body.append('version', String(version)); return (await client.post<{ version: number }>(`${base}/challenges/${encodeURIComponent(id)}/files`, body)).data },
}
