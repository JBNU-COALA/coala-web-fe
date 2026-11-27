import { useMemo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { routes } from '../../../shared/routes'
import { useAuth } from '../../../shared/auth/AuthContext'
import { LoginRequiredState } from '../../../shared/ui/LoginRequiredState'
import { createCtfApi, type CtfApi } from './api'
import type { CtfSession } from './types'
import { ChallengeList, ChallengeDetail } from './ChallengePages'
import { CurriculumPage, CtfScoreboard, CtfInstances } from './LearningPages'
import './hacking.css'

export type CtfWorkspace = { api: CtfApi; session: CtfSession | null }
export function HackingPage() {
  const { user, isLoggedIn } = useAuth()
  const api = useMemo(() => createCtfApi(), [])
  const session: CtfSession | null = isLoggedIn && user ? { user: { id: user.id, username: user.nickname?.trim() || user.name, is_admin: user.role !== 'USER' } } : null
  return <section className="ctf-workspace" aria-label="해킹 실습">
    <div key={session?.user.id ?? 'guest'}><Routes>
      <Route index element={<Navigate to={routes.education.hacking.challenges} replace />} />
      <Route path="challenges" element={<ChallengeList api={api} session={session} />} />
      <Route path="challenges/:challengeId" element={<ChallengeDetail api={api} session={session} />} />
      <Route path="curriculum" element={<CurriculumPage api={api} session={session} />} />
      <Route path="scoreboard" element={<CtfScoreboard api={api} session={session} />} />
      <Route path="instances" element={session ? <CtfInstances api={api} session={session} /> : <LoginRequiredState />} />
      <Route path="*" element={<Navigate to={routes.education.hacking.challenges} replace />} />
    </Routes></div>
  </section>
}
