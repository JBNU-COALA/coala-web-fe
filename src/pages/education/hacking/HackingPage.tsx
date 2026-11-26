import { useMemo } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { routes } from '../../../shared/routes'
import { useAuth } from '../../../shared/auth/AuthContext'
import { Icon } from '../../../shared/ui/Icon'
import { SectionNav } from '../../../shared/ui/SectionNav'
import { createCtfApi, type CtfApi } from './api'
import type { CtfSession } from './types'
import { ChallengeList, ChallengeDetail } from './ChallengePages'
import { CurriculumPage, CtfScoreboard, CtfInstances } from './LearningPages'
import './hacking.css'

export type CtfWorkspace = { api: CtfApi; session: CtfSession | null }
export function HackingPage() {
  const { user, isLoggedIn } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const api = useMemo(() => createCtfApi(), [])
  const session: CtfSession | null = isLoggedIn && user ? { user: { id: user.id, username: user.nickname || `학습자 ${user.id}`, is_admin: user.role !== 'USER' } } : null
  const sections = [
    { id: routes.education.hacking.challenges, label: 'CTF 문제', icon: 'file' as const },
    { id: routes.education.hacking.curriculum, label: '커리큘럼', icon: 'book' as const },
    { id: routes.education.hacking.scoreboard, label: '스코어보드', icon: 'chart' as const },
    { id: routes.education.hacking.instances, label: '내 실습 환경', icon: 'server' as const },
  ]
  const active = sections.find((item) => pathname === item.id || pathname.startsWith(`${item.id}/`))?.id ?? sections[0].id
  return <section aria-label="해킹 실습">
    <div className="ctf-account-bar">{session ? <span><Icon name="user" size={16} /><strong>{session.user.username}</strong></span> : <Link className="education-text-link" to="/login" state={{ from: pathname }}><Icon name="user" size={16} />로그인</Link>}</div>
    <SectionNav className="ctf-section-nav" label="해킹 교육 메뉴" items={sections} value={active} onChange={(path) => navigate(path)} />
    <div key={session?.user.id ?? 'guest'}><Routes>
      <Route index element={<Navigate to={routes.education.hacking.challenges} replace />} />
      <Route path="challenges" element={<ChallengeList api={api} session={session} />} />
      <Route path="challenges/:challengeId" element={<ChallengeDetail api={api} session={session} />} />
      <Route path="curriculum" element={<CurriculumPage api={api} session={session} />} />
      <Route path="scoreboard" element={<CtfScoreboard api={api} session={session} />} />
      <Route path="instances" element={<CtfInstances api={api} session={session} />} />
      <Route path="*" element={<Navigate to={routes.education.hacking.challenges} replace />} />
    </Routes></div>
  </section>
}
