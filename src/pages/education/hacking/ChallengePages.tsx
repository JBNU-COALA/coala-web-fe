import { useCallback, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { routes } from '../../../shared/routes'
import { Icon } from '../../../shared/ui/Icon'
import { SearchField } from '../../../shared/ui/SearchField'
import { ListingControls } from '../../../shared/ui/ListingControls'
import { SelectControl } from '../../../shared/ui/SelectControl'
import { Pagination } from '../../../shared/ui/Pagination'
import { usePagination } from '../../../shared/ui/usePagination'
import type { CtfWorkspace } from './HackingPage'
import { ctfErrorMessage, ctfFileUrl } from './api'
import { CtfInstancePanel, CtfResourceState } from './CtfUi'
import { categoryLabels, difficultyLabels } from './labels'
import { useCtfResource } from './useCtfResource'
import { EducationEmptyState } from '../EducationEmptyState'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { CtfHint } from './CtfHint'
import { useScrollReveal } from '../../landing/useScrollReveal'

export function ChallengeList({ api, session }: CtfWorkspace) {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const category = params.get('category') ?? 'all'
  const difficulty = params.get('difficulty') ?? 'all'
  const solved = params.get('solved') ?? 'all'
  const [revision, setRevision] = useState(0)
  const resource = useCtfResource(api.challenges, revision)
  const updateFilter = (key: string, value: string) => setParams((current) => {
    const next = new URLSearchParams(current)
    if (!value || value === 'all') next.delete(key); else next.set(key, value)
    return next
  }, { replace: true })
  const all = resource.data?.challenges ?? []
  const visible = all.filter((item) => (category === 'all' || item.category === category) &&
    (difficulty === 'all' || item.difficulty === difficulty) &&
    (!session || solved === 'all' || (solved === 'solved' ? item.solved : !item.solved)) &&
    `${item.title} ${item.id} ${categoryLabels[item.category] ?? item.category}`.toLowerCase().includes(query.trim().toLowerCase()))
  const pagination = usePagination(visible, params.toString(), 20)
  const revealRef = useScrollReveal(`${pagination.page}:${params.toString()}:${pagination.pageItems.map(item => item.id).join(',')}`, '.ctf-challenge-row')
  return <>
    <div className="ctf-view-heading"><h2>CTF 문제</h2></div>
    <div className="ctf-challenge-banner">
      <img src="/coala-ctf-banner.png" alt="Coala CTF — 코알라 해커룸" width={1672} height={941} />
    </div>
    <ListingControls label="CTF 문제 검색" search={<SearchField value={query} onChange={(value) => updateFilter('q', value)} placeholder="문제 이름 검색" />}>
      <SelectControl value={category} onChange={(value) => updateFilter('category', value)} label="문제 분야" options={[{ value: 'all', label: '전체 분야' }, ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))]} />
      <SelectControl value={difficulty} onChange={(value) => updateFilter('difficulty', value)} label="난이도" options={[{ value: 'all', label: '전체 난이도' }, ...Object.entries(difficultyLabels).map(([value, label]) => ({ value, label }))]} />
      {session && <SelectControl value={solved} onChange={(value) => updateFilter('solved', value)} label="해결 상태" options={[{ value: 'all', label: '전체 상태' }, { value: 'solved', label: '해결' }, { value: 'unsolved', label: '미해결' }]} />}
    </ListingControls>
    <CtfResourceState {...resource} retry={() => setRevision((value) => value + 1)} />
    {resource.data && <>
      {visible.length ? <div ref={revealRef} className="ctf-table-scroll"><table className="ctf-table"><thead><tr><th>문제</th><th>분야</th><th>난이도</th><th>점수</th><th>유형</th><th>상태</th></tr></thead><tbody key={pagination.page} className="ctf-challenge-page">
        {pagination.pageItems.map((challenge) => <tr key={challenge.id} className="ctf-challenge-row">
          <td><Link to={routes.education.hacking.challenge(challenge.id)}>{challenge.title}</Link></td>
          <td>{categoryLabels[challenge.category] ?? challenge.category}</td><td>{difficultyLabels[challenge.difficulty] ?? challenge.difficulty}</td><td>{challenge.points}</td><td>{challenge.type === 'dynamic' ? '인스턴스' : '정적'}</td><td><span className={challenge.solved ? 'ctf-status is-solved' : 'ctf-status'}>{challenge.solved ? '해결' : session ? '미해결' : '—'}</span></td>
        </tr>)}
      </tbody></table></div> : <EducationEmptyState icon="search" title={all.length ? '조건에 맞는 문제가 없습니다.' : '등록된 문제가 없습니다.'} />}
      <Pagination {...pagination} onChange={pagination.setPage} />
    </>}
  </>
}

export function ChallengeDetail(props: CtfWorkspace) {
  const { challengeId = '' } = useParams()
  return <ChallengeDetailContent key={challengeId} {...props} id={challengeId} />
}

function ChallengeDetailContent({ api, session, id }: CtfWorkspace & { id: string }) {
  const [revision, setRevision] = useState(0)
  const load = useCallback((signal: AbortSignal) => api.challenge(id, signal), [api, id])
  const resource = useCtfResource(load, revision)
  const [flag, setFlag] = useState('')
  const [busy, setBusy] = useState<'submit' | 'launch' | 'stop' | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; correct?: boolean } | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const [solved, setSolved] = useState(false)
  const challenge = resource.data?.challenge
  const instance = resource.data?.instance
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session || busy || !flag.trim()) return
    setBusy('submit'); setFeedback(null); setResultOpen(false)
    try {
      const result = await api.submit(id, flag.trim())
      setFeedback({ correct: Boolean(result.correct || result.already_solved), message: result.already_solved ? '이미 해결한 문제입니다.' : result.correct ? '정답입니다. 문제를 해결했습니다.' : '정답이 아닙니다. 플래그를 다시 확인해 주세요.' })
      setResultOpen(true)
      if (result.correct || result.already_solved) { setSolved(true); setFlag(''); setRevision((value) => value + 1) }
    } catch (error) { setFeedback({ message: ctfErrorMessage(error) }) }
    finally { setBusy(null) }
  }
  const controlInstance = async (action: 'launch' | 'stop') => {
    if (!session || busy) return
    setBusy(action); setFeedback(null)
    try { await api[action](id); setRevision((value) => value + 1) }
    catch (error) { setFeedback({ message: ctfErrorMessage(error) }) }
    finally { setBusy(null) }
  }
  return <>
    <Link className="education-back" to={routes.education.hacking.challenges}><Icon name="chevron-left" size={16} />문제 목록</Link>
    <CtfResourceState {...resource} retry={() => setRevision((value) => value + 1)} />
    {feedback && feedback.correct === undefined && !resultOpen && <p className="education-message" role="status">{feedback.message}</p>}
    <ConfirmDialog open={resultOpen} title={feedback?.correct ? '플래그 해독 성공!' : '다시 도전해 보세요'}
      description={feedback?.message ?? ''} confirmLabel="확인" cancelLabel="닫기" hideCancel
      className={`ctf-result-dialog ${feedback?.correct ? 'is-correct' : 'is-incorrect'}`}
      onConfirm={() => setResultOpen(false)} onCancel={() => setResultOpen(false)}>
      <div className="ctf-result-character" aria-hidden="true"><div className="ctf-result-portrait" /><span className="ctf-result-symbol">{feedback?.correct ? '✓' : '?'}</span></div>
    </ConfirmDialog>
    {challenge && <article className="ctf-challenge-detail">
      <div className="ctf-view-heading"><h2>{challenge.title}</h2><span>{challenge.solved || solved ? '해결 완료' : `${challenge.points}점`}</span></div>
      <dl className="ctf-metadata"><div><dt>분야</dt><dd>{categoryLabels[challenge.category] ?? challenge.category}</dd></div><div><dt>난이도</dt><dd>{difficultyLabels[challenge.difficulty] ?? challenge.difficulty}</dd></div><div><dt>출제</dt><dd>{challenge.author}</dd></div><div><dt>해결</dt><dd>{challenge.solve_count}명</dd></div></dl>
      <section className="ctf-detail-section"><h3>문제</h3><div className="ctf-description">{challenge.description}</div></section>
      {challenge.files.length > 0 && <section className="ctf-detail-section"><h3>첨부 파일</h3><ul className="ctf-file-list">{challenge.files.map((file) => {
        const href = ctfFileUrl(file.url)
        return <li key={file.name}>{href ? <a href={href} download rel="noreferrer"><Icon name="file-color" size={16} />{file.name}</a> : <span>{file.name} · 다운로드 경로 확인 필요</span>}<span>{(file.size / 1024).toFixed(1)} KB</span></li>
      })}</ul></section>}
      {challenge.hints.length > 0 && <section className="ctf-detail-section"><h3>힌트</h3>{challenge.hints.map((hint, index) => <CtfHint key={index} hint={hint} number={index + 1} />)}</section>}
      {challenge.instance.required && <section className="ctf-detail-section"><h3>실습 환경</h3>
        {instance ? <CtfInstancePanel instance={instance} /> : <p className="education-muted">실행 중인 환경이 없습니다.{challenge.instance.ttl_minutes ? ` · 사용 시간 ${challenge.instance.ttl_minutes}분` : ''}</p>}
        <div className="ctf-actions"><button className="education-button is-primary" type="button" disabled={!session || !!busy} onClick={() => controlInstance('launch')}><Icon name="play" size={16} />{busy === 'launch' ? '시작 중...' : instance ? '환경 확인 / 재시작' : '환경 시작'}</button>
          {instance && <button type="button" className="education-button" disabled={!session || !!busy} onClick={() => controlInstance('stop')}><Icon name="close" size={16} />{busy === 'stop' ? '종료 중...' : '환경 종료'}</button>}</div>
      </section>}
      <section className="ctf-detail-section"><h3>{challenge.solved || solved ? '해결 완료' : '플래그 제출'}</h3>
        {challenge.solved || solved ? <div className="ctf-solved-card">
          <div className="ctf-solved-character" role="img" aria-label="어나니머스 가면을 쓴 코알라 해커" />
          <div className="ctf-solved-copy"><span className="ctf-solved-terminal">coala@ctf:~$ <span>flag verified</span></span><strong>플래그 해독 완료.</strong><span>이 문제의 보안을 돌파했습니다.</span><Link to={routes.education.hacking.challenges}>다른 문제 풀기 <span aria-hidden="true">→</span></Link></div>
          <div className="ctf-solved-points"><span>획득 점수</span><strong>{challenge.points}<small>PT</small></strong></div>
        </div> : session ? <form className="ctf-submit-form" onSubmit={submit}><label className="sr-only" htmlFor="ctf-flag">플래그</label><input id="ctf-flag" value={flag} onChange={(event) => setFlag(event.target.value)} placeholder="school{...}" autoComplete="off" spellCheck={false} maxLength={4096} required disabled={!!busy} /><button className="education-button is-primary" disabled={!!busy || !flag.trim()}>{busy === 'submit' ? '채점 중...' : '제출'}</button></form> : <p className="education-muted">문제 제출과 실습 환경 실행에는 실습 계정 로그인이 필요합니다.</p>}
      </section>
    </article>}
  </>
}
