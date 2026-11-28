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
import { isSameUserId } from '../../../shared/auth/userIdentity'
import { CharacterAvatar } from '../../../shared/ui/CharacterAvatar'
import { SearchField } from '../../../shared/ui/SearchField'

export function CurriculumPage({ api, session }: CtfWorkspace) {
  const [revision, setRevision] = useState(0)
  const resource = useCtfResource(api.curriculum, revision)
  const challenges = useCtfResource(api.challenges, revision)
  const loadCourses = useCallback((signal: AbortSignal) => educationApi.courses('hacking', signal), [])
  const courses = useCtfResource(loadCourses, revision)
  const [params, setParams] = useSearchParams()
  const tracks = resource.data?.tracks ?? []
  const track = tracks.find((item) => item.slug === params.get('track')) ?? tracks[0]
  const challengeById = new Map(challenges.data?.challenges.map((item) => [item.id, item]) ?? [])
  return <>
    <div className="ctf-view-heading"><h2>커리큘럼</h2>{track && <span>{track.weeks.length}주</span>}</div>
    <CtfResourceState loading={resource.loading || courses.loading || challenges.loading} error={resource.error ?? courses.error ?? challenges.error} retry={() => setRevision((value) => value + 1)} />
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
    {courses.data && <><h2 className="ctf-section-title">교육 · 진로 자료</h2><CourseLinks courses={courses.data.filter((item) => item.kind === 'GUIDE')} /></>}
  </>
}

export function CtfScoreboard({ api, session }: CtfWorkspace) {
  const [revision, setRevision] = useState(0)
  const [query, setQuery] = useState('')
  const resource = useCtfResource(api.scoreboard, revision)
  const entries = resource.data?.scoreboard ?? []
  const displayName = (entry: (typeof entries)[number]) => isSameUserId(entry.userId, session?.user.id) ? session!.user.username : entry.username
  const rankedEntries = [...entries].sort((left, right) => left.rank - right.rank)
  const filteredEntries = rankedEntries.filter((entry) => displayName(entry).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const pagination = usePagination(filteredEntries, `${revision}:${query}`, 30)
  return <>
    <div className="ctf-view-heading"><h2>스코어보드</h2><button className="education-icon-button" type="button" aria-label="스코어보드 새로고침" title="새로고침" onClick={() => setRevision((value) => value + 1)}><Icon name="refresh" size={18} /></button></div>
    <CtfResourceState {...resource} retry={() => setRevision((value) => value + 1)} />
    {entries.length > 0 && <>
      <div className="ctf-podium" aria-label="상위 3명">
        {[0, 1, 2].map((index) => {
          const entry = rankedEntries[index]
          const rank = entry?.rank ?? index + 1
          const name = entry ? displayName(entry) : '다음 주인공을 기다려요'
          return <article key={entry?.userId ?? `empty-${index}`} className={`ctf-podium-card ctf-podium-card--${Math.min(rank, 3)}${entry ? '' : ' is-empty'}`}>
            <span className="ctf-podium-ribbon">{rank}위</span>
            {entry ? <CharacterAvatar name={name} seed={entry.userId} size="xl" /> : <span className="ctf-podium-empty-avatar" aria-hidden="true"><Icon name="award-color" size={34} /></span>}
            <h3>{name}{entry && isSameUserId(entry.userId, session?.user.id) && <span className="ctf-self-badge">나</span>}</h3>
            {entry ? <div className="ctf-podium-stats"><div><strong>{entry.points.toLocaleString()}</strong><span>점수</span></div><div><strong>{entry.solved}</strong><span>해결한 문제</span></div></div> : <p>문제를 풀고 순위에 올라보세요.</p>}
          </article>
        })}
      </div>
      <div className="ctf-score-toolbar"><SearchField value={query} onChange={setQuery} placeholder="참여자 이름 검색" /></div>
    </>}
    {resource.data && (entries.length ? <><div className="ctf-table-scroll"><table className="ctf-table ctf-scoreboard"><thead><tr><th>순위</th><th>참여자</th><th>점수</th><th>해결한 문제</th></tr></thead><tbody>{pagination.pageItems.map((entry) => {
      const isSelf = isSameUserId(entry.userId, session?.user.id)
      return <tr key={entry.userId} className={isSelf ? 'is-self' : undefined}>
        <td>{entry.rank <= 3 && entry.rank >= 1 ? <span className={`ctf-rank-trophy ctf-rank-trophy--${entry.rank}`} aria-label={`${entry.rank}위`}>
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M8 6H4v4c0 4 3 6 7 6M24 6h4v4c0 4-3 6-7 6" fill="none" stroke="currentColor" strokeWidth="2.5" /><path d="M8 3h16v9a8 8 0 0 1-16 0Z" fill="currentColor" /><path d="M14 19h4v6h-4zM10 25h12v4H10z" fill="currentColor" /><path d="m16 6 1.4 2.8 3.1.5-2.2 2.2.5 3.1-2.8-1.5-2.8 1.5.5-3.1-2.2-2.2 3.1-.5Z" fill="#fff" opacity=".85" /></svg>
          <strong aria-hidden="true">{entry.rank}</strong>
        </span> : <span className="ctf-rank-number">{entry.rank}</span>}</td>
        <td><span className="ctf-score-name"><CharacterAvatar name={displayName(entry)} seed={entry.userId} size="sm" />{displayName(entry)}{isSelf && <span className="ctf-self-badge">나</span>}</span></td>
        <td className="ctf-score-points">{entry.points.toLocaleString()}<small>점</small></td><td>{entry.solved}</td>
      </tr>
    })}{filteredEntries.length === 0 && <tr><td colSpan={4}>검색 결과가 없습니다.</td></tr>}</tbody></table></div><Pagination {...pagination} onChange={pagination.setPage} /></> : <EducationEmptyState icon="chart" title="아직 참여자가 없습니다." />)}
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
