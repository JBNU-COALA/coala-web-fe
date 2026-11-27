import { AdminSearch } from './AdminSearch'
import { useCallback, useState } from 'react'
import { adminEducationApi, type ManagedChallenge } from '../../shared/api/adminEducation'
import { featureError } from '../../shared/api/featureError'
import { useApiResource } from '../../shared/hooks/useApiResource'
import { SectionNav } from '../../shared/ui/SectionNav'
import { Icon } from '../../shared/ui/Icon'
import { Pagination } from '../../shared/ui/Pagination'
import { usePagination } from '../../shared/ui/usePagination'
import { AdminEducationEditor, type EducationKind, type EducationRecord } from './AdminEducationEditor'
import { AdminLoadState } from './AdminFields'
import { AdminSeedPanel } from './AdminSeedPanel'
import { AdminEducationActivity } from './AdminOperationsPanel'

const sections = [{ id: 'subjects', label: '교육 분야', icon: 'layout' }, { id: 'courses', label: '과정 · 문서', icon: 'book' }, { id: 'challenges', label: 'CTF 문제', icon: 'file' }, { id: 'learners', label: '학습 현황', icon: 'users' }, { id: 'instances', label: '실습 환경', icon: 'server' }] as const
type View = typeof sections[number]['id']
export function AdminEducationPanel() {
  const [view, setView] = useState<View>('subjects')
  const [revision, setRevision] = useState(0)
  const [subject, setSubject] = useState('hacking')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<{ row?: EducationRecord; key: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const subjects = useApiResource(adminEducationApi.subjects, revision, 10000)
  const challenges = useApiResource(adminEducationApi.challenges, revision, 10000)
  const loadCourses = useCallback((signal: AbortSignal) => adminEducationApi.courses(subject, signal), [subject])
  const courses = useApiResource(loadCourses, revision, 10000)
  const [showSeed, setShowSeed] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const kind: EducationKind = view === 'courses' ? 'courses' : view === 'challenges' ? 'challenges' : 'subjects'
  const resource = kind === 'subjects' ? subjects : kind === 'courses' ? courses : challenges
  const rows = (resource.data ?? []).filter((row) => `${'name' in row ? row.name : row.title} ${row.id}`.toLowerCase().includes(query.toLowerCase()))
  const pages = usePagination<EducationRecord>(rows, `${view}:${subject}:${query}`, 15)
  const choose = async (row: EducationRecord) => {
    setBusy(true); setError(''); setMessage('')
    try { const full = kind === 'challenges' ? await adminEducationApi.challenge(row.id) : kind === 'courses' ? await adminEducationApi.course(row.id) : row; setEditing({ row: full, key: `${row.id}:${crypto.randomUUID()}` }) }
    catch (cause) { setError(featureError(cause)) } finally { setBusy(false) }
  }
  const saved = async (id: string) => { const full = kind === 'challenges' ? await adminEducationApi.challenge(id) : kind === 'courses' ? await adminEducationApi.course(id) : (await adminEducationApi.subjects()).find((row) => row.id === id); setEditing({ row: full, key: `${id}:${crypto.randomUUID()}` }); setRevision((value) => value + 1); setMessage('저장했습니다.') }
  const importBundle = async () => { if (!importFile || busy) return; setBusy(true); setError(''); try { if (importFile.size > 8 * 1024 * 1024) throw new Error('Too large'); const result = await adminEducationApi.import(JSON.parse(await importFile.text())); setMessage(`등록 완료 · 문제 ${result.challengesCreated} · 과정 ${result.coursesCreated}`); setRevision((value) => value + 1); setImportFile(null) } catch (cause) { setError(featureError(cause)) } finally { setBusy(false) } }
  return <div className="admin-education-workspace"><SectionNav label="교육 관리 메뉴" items={[...sections]} value={view} onChange={(id) => { setView(id as View); setEditing(null); setQuery(''); setMessage(''); setError('') }} />
    <div className="admin-section-heading"><h3>{sections.find((item) => item.id === view)?.label}</h3><div className="admin-row-actions"><button type="button" className="admin-ghost-button" onClick={() => setShowSeed(!showSeed)}><Icon name="book" size={15} />기본 교육팩</button>{view !== 'learners' && view !== 'instances' && <button type="button" className="admin-primary-button" disabled={busy || !subjects.data} onClick={() => { setEditing({ key: crypto.randomUUID() }); setError(''); setMessage('') }}><Icon name="plus" size={15} />새 항목</button>}</div></div>
    {showSeed && <AdminSeedPanel onInstalled={() => setRevision((value) => value + 1)} />}
    {message && <p className="admin-feedback" role="status">{message}</p>}{error && <p className="admin-error" role="alert">{error}</p>}
    {view === 'learners' || view === 'instances' ? <AdminEducationActivity key={view} mode={view} /> : <>
      <div className="admin-toolbar"><AdminSearch><label className="admin-member-search"><Icon name="search" size={16} /><input aria-label="교육 콘텐츠 검색" placeholder="이름 · ID 검색" value={query} onChange={(event) => setQuery(event.target.value)} /></label></AdminSearch>{view === 'courses' && <select className="admin-inline-select" aria-label="분야 필터" value={subject} onChange={(event) => { setSubject(event.target.value); setEditing(null) }}>{subjects.data?.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select>}</div>
      <AdminLoadState loading={resource.loading} error={resource.error ?? ''} onRetry={() => setRevision((value) => value + 1)} />
      <div className={`admin-catalog-layout${editing ? ' has-editor' : ''}`}><div className="admin-catalog-list"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>이름</th><th>상태</th><th>{view === 'challenges' ? '점수' : '분류'}</th><th><span className="sr-only">편집</span></th></tr></thead><tbody>{pages.pageItems.map((row) => <tr className={editing?.row?.id === row.id ? 'is-selected' : ''} key={row.id}><td><button type="button" className="admin-record-link" disabled={busy} onClick={() => void choose(row)}>{'name' in row ? row.name : row.title}</button><small className="admin-record-id">{row.id}</small></td><td><span className={`admin-state ${row.published ? 'is-ready' : ''}`}>{row.published ? '공개' : '비공개'}</span></td><td>{'points' in row ? (row as ManagedChallenge).points : 'kind' in row ? row.kind === 'GUIDE' ? '문서' : row.kind === 'TRACK' ? '트랙' : '과정' : 'courseCount' in row ? `${row.courseCount}개 과정` : '-'}</td><td><button type="button" className="admin-icon-button" aria-label={`${'name' in row ? row.name : row.title} 편집`} title="편집" disabled={busy} onClick={() => void choose(row)}><Icon name="edit" size={15} /></button></td></tr>)}</tbody></table></div>{resource.data && rows.length === 0 && <p className="admin-empty">등록된 항목이 없습니다.</p>}<Pagination {...pages} onChange={pages.setPage} /></div>
        {editing && <AdminEducationEditor key={editing.key} kind={kind} subjectId={subject} initial={editing.row} subjects={subjects.data ?? []} challenges={challenges.data ?? []} onSaved={saved} onClose={() => setEditing(null)} />}
      </div>
    </>}
    <details className="admin-advanced"><summary>외부 데이터 가져오기</summary><div className="admin-toolbar"><input type="file" aria-label="교육 데이터 파일" accept=".json,application/json" disabled={busy} onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} /><button className="admin-ghost-button" type="button" disabled={busy || !importFile} onClick={() => void importBundle()}>일괄 등록</button></div></details>
  </div>
}
