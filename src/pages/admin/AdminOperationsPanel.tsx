import { AdminSearch } from './AdminSearch'
import { useCallback, useState } from 'react'
import client from '../../shared/api/client'
import { useApiResource } from '../../shared/hooks/useApiResource'
import { AdminLoadState } from './AdminFields'
import { AdminSeedPanel } from './AdminSeedPanel'
import { adminDestinations, type AdminDestination } from './adminSections'
import { Icon } from '../../shared/ui/Icon'
import { adminEducationApi } from '../../shared/api/adminEducation'

export function AdminOperationsPanel({ onNavigate }: { onNavigate: (destination: AdminDestination) => void }) {
  const [revision, setRevision] = useState(0)
  const load = useCallback(async (signal: AbortSignal) => (await client.get<{ counts: Record<string, number | null> }>('/api/admin/operations', { signal })).data, [])
  const resource = useApiResource(load, revision, 10000)
  const counts = resource.data?.counts
  const countKeys: Partial<Record<AdminDestination, string>> = { users: 'members', posts: 'posts', comments: 'comments', boards: 'boards', activity: 'records', archive: 'archives', education: 'challenges', employment: 'reviews' }
  return <div className="admin-operations"><AdminSeedPanel onInstalled={() => setRevision((value) => value + 1)} />
    <section className="admin-workspace-directory"><div className="admin-section-heading"><h3>관리 영역</h3></div><AdminLoadState loading={resource.loading} error={resource.error ?? ''} onRetry={() => setRevision((value) => value + 1)} />
      <div className="admin-directory-list">{adminDestinations.filter((item) => item.id !== 'stats').map((item) => <button type="button" key={item.id} onClick={() => onNavigate(item.id)}><Icon name={item.icon} size={17} /><span>{item.label}</span><small>{counts && countKeys[item.id] ? counts[countKeys[item.id]!] ?? '-' : item.group}</small><Icon name="chevron-right" size={14} /></button>)}</div>
    </section></div>
}
export function AdminAuditPanel() {
  const [revision, setRevision] = useState(0)
  const [query, setQuery] = useState('')
  const load = useCallback(async (signal: AbortSignal) => (await client.get<import('../../shared/api/admin').AdminActionLog[]>('/api/admin/audit-logs', { signal })).data, [])
  const resource = useApiResource(load, revision, 10000)
  const rows = resource.data?.filter((row) => `${row.adminName} ${row.action} ${row.targetType} ${row.reason ?? ''}`.toLowerCase().includes(query.toLowerCase())) ?? []
  return <section><div className="admin-toolbar"><AdminSearch><label className="admin-member-search"><Icon name="search" size={16} /><input aria-label="작업 기록 검색" placeholder="작업 기록 검색" value={query} onChange={(event) => setQuery(event.target.value)} /></label></AdminSearch></div><AdminLoadState loading={resource.loading} error={resource.error ?? ''} onRetry={() => setRevision((value) => value + 1)} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>시간</th><th>관리자</th><th>작업</th><th>대상</th><th>사유 · 참조</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{new Date(row.createdAt).toLocaleString('ko-KR')}</td><td>{row.adminName}</td><td>{row.action}</td><td>{row.targetType} {row.targetId || ''}</td><td>{row.reason}</td></tr>)}</tbody></table></div>{resource.data && rows.length === 0 && <p className="admin-empty">작업 기록이 없습니다.</p>}
  </section>
}
export function AdminEducationActivity({ mode }: { mode: 'learners' | 'instances' }) {
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [stopId, setStopId] = useState<string | null>(null)
  const learners = useApiResource(adminEducationApi.learners, revision, 10000)
  const instances = useApiResource(adminEducationApi.instances, revision, 10000)
  const runtime = useApiResource(adminEducationApi.runtime, revision, 10000)
  const stop = async () => { if (!stopId || busy) return; setBusy(stopId); try { await adminEducationApi.stop(stopId); setStopId(null); setRevision((value) => value + 1) } catch { setError('실습 환경을 종료하지 못했습니다.') } finally { setBusy(null) } }
  const resource = mode === 'learners' ? learners : instances
  return <section><div className="admin-section-heading"><h3>{mode === 'learners' ? '학습 현황' : '실행 환경'}</h3><button type="button" className="admin-icon-button" aria-label="학습 현황 새로고침" title="새로고침" onClick={() => setRevision((value) => value + 1)}><Icon name="refresh" size={16} /></button></div>
    {mode === 'instances' && <p className="admin-state">{runtime.loading ? '실행 서버 확인 중' : !runtime.data?.configured ? '실행 서버 설정 안 됨' : !runtime.data.available ? '실행 서버 연결 실패' : runtime.data.dryRun ? '개발 모드' : '실행 서버 정상'}</p>}
    <AdminLoadState loading={resource.loading} error={resource.error ?? ''} onRetry={() => setRevision((value) => value + 1)} />{error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-table-wrap"><table className="admin-table">{mode === 'learners' ? <><thead><tr><th>회원</th><th>제출</th><th>해결</th><th>점수</th><th>완료 단원</th></tr></thead><tbody>{learners.data?.map((row) => <tr key={row.userId}><td>{row.nickname} <small>#{row.userId}</small></td><td>{row.submissions}</td><td>{row.solved}</td><td>{row.points}</td><td>{row.completedLessons}</td></tr>)}</tbody></> : <><thead><tr><th>회원</th><th>문제</th><th>만료</th><th>상태</th><th>관리</th></tr></thead><tbody>{instances.data?.map((row) => <tr key={row.id}><td>{row.nickname}</td><td>{row.challengeId}</td><td>{row.expiresAt.replace('T', ' ')}</td><td>{row.instance.dry_run ? '개발 모드' : '실행 중'}</td><td><button type="button" className="admin-icon-button" aria-label={`${row.challengeId} 환경 종료`} title="환경 종료" disabled={!!busy} onClick={() => setStopId(row.id)}><Icon name="stop-color" size={16} /></button></td></tr>)}</tbody></>}</table></div>
    {resource.data && resource.data.length === 0 && <p className="admin-empty">표시할 항목이 없습니다.</p>}
    {stopId && <div className="admin-confirm" role="alertdialog" aria-label="실습 종료 확인"><p>이 실습 환경을 종료할까요?</p><div className="admin-row-actions"><button type="button" disabled={!!busy} onClick={() => setStopId(null)}>취소</button><button type="button" className="admin-danger-button" disabled={!!busy} onClick={() => void stop()}>종료</button></div></div>}
  </section>
}
