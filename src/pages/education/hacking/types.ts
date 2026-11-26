export type CtfUser = { id: number; username: string; is_admin: boolean }
export type CtfSession = { user: CtfUser }
export type CtfChallenge = {
  id: string; title: string; category: string; difficulty: string; points: number
  type: 'static' | 'dynamic'; solved: boolean
}
export type CtfInstance = {
  id: string; challenge_id: string; host: string; port: number; kind: 'http' | 'tcp'
  url: string | null; expires_at: string; dry_run: boolean
}
export type CtfChallengeDetail = CtfChallenge & {
  description: string; author: string; hints: string[]; solve_count: number
  files: { name: string; size: number; url: string }[]
  instance: { required: boolean; port: number | null; kind: string | null; ttl_minutes: number | null }
}
export type CtfWeek = {
  id: string; title: string; goals: string[]; tools: string[]; challenges: string[]; done: string[]; homework: string | null
}
export type CtfTrack = { id: string; slug: string; title: string; weeks: CtfWeek[] }
export type CtfScore = { userId: number; rank: number; username: string; points: number; solved: number }
