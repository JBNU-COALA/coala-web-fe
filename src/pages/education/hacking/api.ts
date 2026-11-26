import client, { resolveApiAssetUrl } from '../../../shared/api/client'
import { featureError } from '../../../shared/api/featureError'
import type { CtfChallenge, CtfChallengeDetail, CtfInstance, CtfScore, CtfTrack } from './types'

export class CtfApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
const base = '/api/education/hacking'
export function createCtfApi() {
  async function get<T>(path: string, signal?: AbortSignal) { return (await client.get<T>(`${base}${path}`, { signal, timeout: 30000 })).data }
  async function post<T>(path: string, body: unknown) { return (await client.post<T>(`${base}${path}`, body, { timeout: 125000 })).data }
  return {
    challenges: (signal?: AbortSignal) => get<{ challenges: CtfChallenge[]; count: number }>('/challenges', signal),
    challenge: (id: string, signal?: AbortSignal) => get<{ challenge: CtfChallengeDetail; instance: CtfInstance | null }>(`/challenges/${encodeURIComponent(id)}`, signal),
    curriculum: (signal?: AbortSignal) => get<{ tracks: CtfTrack[] }>('/curriculum', signal),
    scoreboard: (signal?: AbortSignal) => get<{ scoreboard: CtfScore[] }>('/scoreboard', signal),
    instances: (signal?: AbortSignal) => get<{ instances: CtfInstance[] }>('/instances', signal),
    submit: (id: string, flag: string) => post<{ correct: boolean; solved?: boolean; already_solved?: boolean }>('/submit', { challenge_id: id, flag }),
    launch: (id: string) => post<{ instance: CtfInstance }>(`/launch/${encodeURIComponent(id)}`, {}),
    stop: (id: string) => post<{ ok: boolean }>(`/stop/${encodeURIComponent(id)}`, {}),
  }
}
export type CtfApi = ReturnType<typeof createCtfApi>
export function ctfErrorMessage(error: unknown) { return error instanceof CtfApiError ? error.message : featureError(error) }
export function ctfFileUrl(path: string): string | null {
  if (!path.startsWith('/files/') || /[\\?#%]/.test(path) || path.split('/').slice(2).some((part) => !part || part === '..' || part === '.')) return null
  return resolveApiAssetUrl(`/api/education/hacking${path}`)
}
export function ctfInstanceHref(instance: CtfInstance): string | null {
  if (instance.dry_run || instance.kind !== 'http' || !instance.url) return null
  try {
    const url = new URL(instance.url)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch { return null }
}
