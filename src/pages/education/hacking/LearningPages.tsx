import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { routes } from '../../../shared/routes'
import { Icon } from '../../../shared/ui/Icon'
import { Pagination } from '../../../shared/ui/Pagination'
import { FilterTabs } from '../../../shared/ui/FilterTabs'
import { usePagination } from '../../../shared/ui/usePagination'
import type { CtfWorkspace } from './HackingPage'
import { ctfErrorMessage } from './api'
import { CtfInstancePanel, CtfResourceState } from './CtfUi'
import { useCtfResource } from './useCtfResource'
import { EducationEmptyState } from '../EducationEmptyState'
import { educationApi } from '../../../shared/api/education'
import { CourseLinks } from '../CoursePages'

export function CurriculumPage({ api, session }: CtfWorkspace) {
  const [revision, setRevision] = useState(0)
  const resource = useCtfResource(api.curriculum, revision)
  const challenges = useCtfResource(api.challenges)
  const loadCourses = useCallback((signal: AbortSignal) => educationApi.courses('hacking', signal), [])
  const courses = useCtfResource(loadCourses, revision)
  const [params, setParams] = useSearchParams()
  const tracks = resource.data?.tracks ?? []
  const track = tracks.find((item) => item.slug === params.get('track')) ?? tracks[0]
  const challengeById = new Map(challenges.data?.challenges.map((item) => [item.id, item]) ?? [])
  return <>
    <div className="ctf-view-heading"><h2>커리큘럼</h2>{track && <span>{track.weeks.length}주</span>}</div>
    <CtfResourceState {...resource} retry={() => setRevision((value) => value + 1)} />
    {resource.data && <>
      <FilterTabs className="ctf-track-options" ariaLabel="커리큘럼 트랙" value={track?.slug ?? ''} options={tracks.map((item) => ({ id: item.slug, label: item.title, icon: 'book' as const }))} onChange={(slug) => setParams({ track: slug }, { replace: true })} />
      {track && <Link className="education-text-link" to={`/education/courses/${encodeURIComponent(track.id)}`}>과정 문서 · 학습 기록</Link>}
      {track ? <div className="ctf-weeks">{track.weeks.map((week, index) => <details className="ctf-week" key={`${track.slug}:${week.id}`} open={index === 0 ? true : undefined}>
        <summary><span className="ctf-week-number">{String(index + 1).padStart(2, '0')}</span><strong>{week.title}</strong><span>{week.challenges.length ? (session ? `${week.done.length} / ${week.challenges.length} 해결` : `${week.challenges.length}문제`) : '이론 학습'}</span><Icon name="chevron-down" size={14} /></summary>
        <div className="ctf-week-content">
          {week.goals.length > 0 && <><h3>학습 목표</h3><ul>{week.goals.map((goal) => <li key={goal}>{goal}</li>)}</ul></>}
          {week.tools.length > 0 && <p><strong>도구</strong> {week.tools.join(' · ')}</p>}
          {week.challenges.length > 0 && <><h3>실습 문제</h3><ul className="ctf-curriculum-challenges">{week.challenges.map((id) => <li key={id}><Link to={routes.education.hacking.challenge(id)}>{challengeById.get(id)?.title ?? id}</Link>{session && <span>{week.done.includes(id) ? '해결' : '미해결'}</span>}</li>)}</ul></>}
          {week.homework && <div className="ctf-homework"><h3>과제</h3><p>{week.homework}</p></div>}
        </div>
      </details>)}</div> : <EducationEmptyState title="등록된 커리큘럼이 없습니다." />}
    </>}
    <h2 className="ctf-section-title">교육 · 진로 자료</h2>
    <CtfResourceState {...courses} retry={() => setRevision((value) => value + 1)} />
    {courses.data && <CourseLinks courses={courses.data.filter((item) => item.kind === 'GUIDE')} />}
  </>
}

export function CtfScoreboard({ api, session }: CtfWorkspace) {
  const [revision, setRevision] = useState(0)
  const resource = useCtfResource(api.scoreboard, revision)
  const entries = resource.data?.scoreboard ?? []
  const pagination = usePagination(entries, String(revision), 30)
  return <>
    <div className="ctf-view-heading"><h2>스코어보드</h2><button className="education-icon-button" type="button" aria-label="스코어보드 새로고침" title="새로고침" onClick={() => setRevision((value) => value + 1)}><Icon name="refresh" size={18} /></button></div>
    <CtfResourceState {...resource} retry={() => setRevision((value) => value + 1)} />
    {resource.data && (entries.length ? <><div className="ctf-table-scroll"><table className="ctf-table"><thead><tr><th>순위</th><th>실습 아이디</th><th>점수</th><th>해결한 문제</th></tr></thead><tbody>{pagination.pageItems.map((entry) => <tr key={entry.username} className={entry.username === session?.user.username ? 'is-self' : undefined}><td>{entry.rank}</td><td>{entry.username}{entry.username === session?.user.username && <span className="ctf-status">나</span>}</td><td>{entry.points.toLocaleString()}</td><td>{entry.solved}</td></tr>)}</tbody></table></div><Pagination {...pagination} onChange={pagination.setPage} /></> : <EducationEmptyState icon="chart" title="아직 참여자가 없습니다." />)}
  </>
}

export function CtfInstances(props: CtfWorkspace) {
  if (!props.session) return <><h2 className="ctf-section-title">내 실습 환경</h2><EducationEmptyState icon="user" title="실습 계정에 로그인해 주세요." /></>
  return <AuthenticatedInstances {...props} />
}

function AuthenticatedInstances({ api }: CtfWorkspace) {
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resource = useCtfResource(api.instances, revision)
  const stop = async (id: string) => {
    if (busy) return
    setBusy(id); setError(null)
    try { await api.stop(id); setRevision((value) => value + 1) }
    catch (error) { setError(ctfErrorMessage(error)) }
    finally { setBusy(null) }
  }
  return <>
    <div className="ctf-view-heading"><h2>내 실습 환경</h2><button type="button" className="education-icon-button" aria-label="실습 환경 새로고침" title="새로고침" onClick={() => setRevision((value) => value + 1)}><Icon name="refresh" size={18} /></button></div>
    {error && <p role="alert" className="education-message">{error}</p>}
    <CtfResourceState {...resource} retry={() => setRevision((value) => value + 1)} />
    {resource.data && (resource.data.instances.length ? <ul className="ctf-instance-list">{resource.data.instances.map((instance) => <li key={instance.id}>
      <Link to={routes.education.hacking.challenge(instance.challenge_id)}>{instance.challenge_id}</Link><CtfInstancePanel instance={instance} />
      <button type="button" className="education-button" disabled={!!busy} onClick={() => stop(instance.challenge_id)}><Icon name="close" size={16} />{busy === instance.challenge_id ? '종료 중...' : '환경 종료'}</button>
    </li>)}</ul> : <EducationEmptyState icon="server" title="실행 중인 실습 환경이 없습니다." />)}
  </>
}
