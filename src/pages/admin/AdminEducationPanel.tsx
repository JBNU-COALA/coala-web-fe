import { useCallback, useState, type FormEvent } from 'react'
import client from '../../shared/api/client'
import { featureError } from '../../shared/api/featureError'
import type { EducationSubject, EducationCourse } from '../../shared/api/education'
import { Icon } from '../../shared/ui/Icon'
import { AdminField, AdminLoadState } from './AdminFields'
import { useApiResource as useCtfResource } from '../../shared/hooks/useApiResource'

type Kind = 'subjects' | 'courses' | 'challenges'
type Draft = { id: string; title: string; topics: string; subjectId: string; slug: string; description: string; content: string; level: string; courseKind: string; weeks: string; sortOrder: number; published: boolean; version: number | null; category: string; difficulty: string; points: number; type: string; answer: string; author: string; hints: string; files: string; port: number; runtimeKind: string; ttl: number }
const blank = (): Draft => ({ id: '', title: '', topics: '', subjectId: 'hacking', slug: '', description: '', content: '', level: 'beginner', courseKind: 'COURSE', weeks: '[]', sortOrder: 0, published: false, version: null, category: 'misc', difficulty: 'easy', points: 50, type: 'static', answer: '', author: '', hints: '', files: '[]', port: 8080, runtimeKind: 'http', ttl: 30 })
const base = '/api/admin/education'
type Choice = { id: string; title: string }
export function AdminEducationPanel() {
  const [kind, setKind] = useState<Kind>('subjects')
  const [subjectId, setSubjectId] = useState('hacking')
  const [revision, setRevision] = useState(0)
  const [draft, setDraft] = useState<Draft>(blank)
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const loadSubjects = useCallback(async (signal: AbortSignal) => (await client.get<EducationSubject[]>(`${base}/subjects`, { signal })).data, [])
  const subjects = useCtfResource(loadSubjects, revision)
  const loadRows = useCallback(async (signal: AbortSignal): Promise<Choice[]> => {
    const path = kind === 'courses' ? `subjects/${encodeURIComponent(subjectId)}/courses` : kind
    const data = (await client.get<Array<{ id: string; name?: string; title?: string }>>(`${base}/${path}`, { signal })).data
    return data.map((row) => ({ id: row.id, title: row.title ?? row.name ?? row.id }))
  }, [kind, subjectId])
  const rows = useCtfResource(loadRows, revision)
  const field = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const reset = (nextSubject = subjectId) => { setSelected(null); setDraft({ ...blank(), subjectId: nextSubject }); setError(''); setNotice('') }
  const choose = async (id: string) => {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      if (kind === 'subjects') {
        const row = subjects.data?.find((item) => item.id === id)
        if (!row) throw new Error('Missing subject')
        setDraft({ ...blank(), id, title: row.name, topics: row.topics, sortOrder: row.sortOrder, published: row.published, version: row.version })
      } else if (kind === 'courses') {
        const row = (await client.get<EducationCourse>(`${base}/courses/${encodeURIComponent(id)}`)).data
        setDraft({ ...blank(), ...row, courseKind: row.kind, weeks: JSON.stringify(row.weeks, null, 2), version: row.version })
      } else {
        const { challenge: row } = (await client.get<{ challenge: { id: string; title: string; category: string; difficulty: string; points: number; type: string; description: string; author: string; hints: string[]; files: unknown[]; instance: { port: number; kind: string; ttl_minutes: number }; published: boolean; version: number } }>(`${base}/challenges/${encodeURIComponent(id)}`)).data
        setDraft({ ...blank(), ...row, hints: row.hints.join('\n'), files: JSON.stringify(row.files, null, 2), port: row.instance.port ?? 8080, runtimeKind: row.instance.kind ?? 'http', ttl: row.instance.ttl_minutes ?? 30, answer: '' })
      }
      setSelected(id)
    } catch (cause) { setError(featureError(cause)) } finally { setBusy(false) }
  }
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const common = { published: draft.published, version: draft.version }
      const payload = kind === 'subjects' ? { id: draft.id, name: draft.title, topics: draft.topics, sortOrder: draft.sortOrder, ...common }
        : kind === 'courses' ? { id: draft.id, subjectId: draft.subjectId, slug: draft.slug, title: draft.title, description: draft.description, content: draft.content, level: draft.level, kind: draft.courseKind, weeks: JSON.parse(draft.weeks), sortOrder: draft.sortOrder, ...common }
          : { challenge: { id: draft.id, title: draft.title, category: draft.category, difficulty: draft.difficulty, points: draft.points, type: draft.type, description: draft.description, author: draft.author, hints: draft.hints.split('\n').filter(Boolean), files: JSON.parse(draft.files), instance: { required: draft.type === 'dynamic', port: draft.type === 'dynamic' ? draft.port : null, kind: draft.type === 'dynamic' ? draft.runtimeKind : null, ttl_minutes: draft.type === 'dynamic' ? draft.ttl : null } }, answer: draft.answer || null, ...common }
      const { data } = await client.put<{ version: number }>(`${base}/${kind}/${encodeURIComponent(draft.id)}`, payload)
      setSelected(draft.id); setDraft((current) => ({ ...current, version: data.version, answer: '' })); setRevision((value) => value + 1); setNotice('저장했습니다.')
    } catch (cause) { setError(cause instanceof SyntaxError ? '단원 또는 첨부 파일 JSON 형식을 확인해 주세요.' : featureError(cause)) } finally { setBusy(false) }
  }
  const importBundle = async () => {
    if (!importFile || busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      if (importFile.size > 8 * 1024 * 1024) throw new Error('Too large')
      const payload: unknown = JSON.parse(await importFile.text())
      const { data } = await client.post<{ subjectsCreated: number; challengesCreated: number; coursesCreated: number; skipped: number }>(`${base}/import`, payload, { timeout: 120000 })
      setNotice(`등록: 분야 ${data.subjectsCreated} · 문제 ${data.challengesCreated} · 과정 ${data.coursesCreated} / 기존 항목 ${data.skipped}개 유지`); setImportFile(null); setRevision((value) => value + 1)
    } catch (cause) { setError(cause instanceof SyntaxError ? '가져올 JSON 파일을 확인해 주세요.' : featureError(cause)) } finally { setBusy(false) }
  }
  return <div className="admin-panel"><div className="admin-panel-header"><h3>교육 콘텐츠</h3><button className="admin-ghost-button" type="button" disabled={busy} onClick={() => reset()}><Icon name="plus" size={14} />새 항목</button></div>
    <AdminLoadState loading={rows.loading || subjects.loading} error={rows.error ?? subjects.error ?? ''} onRetry={() => setRevision((value) => value + 1)} />
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <div className="admin-form-grid"><AdminField label="콘텐츠 종류"><select value={kind} disabled={busy} onChange={(event) => { setKind(event.target.value as Kind); reset() }}><option value="subjects">교육 분야</option><option value="courses">과정 · 문서</option><option value="challenges">CTF 문제</option></select></AdminField>
      {kind === 'courses' && <AdminField label="분야 필터"><select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); reset(event.target.value) }}>{subjects.data?.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></AdminField>}
      <AdminField label="기존 항목"><select value={selected ?? ''} disabled={busy} onChange={(event) => event.target.value ? void choose(event.target.value) : reset()}><option value="">새 항목</option>{rows.data?.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</select></AdminField>
    </div>
    <form onSubmit={save}><fieldset className="admin-content-fieldset" disabled={busy}>
      <div className="admin-form-grid"><AdminField label="ID"><input value={draft.id} disabled={selected !== null} pattern="[a-z][a-z0-9-]+" required maxLength={kind === 'subjects' ? 40 : 80} onChange={(event) => field('id', event.target.value)} /></AdminField><AdminField label="이름 · 제목"><input required maxLength={kind === 'subjects' ? 100 : 150} value={draft.title} onChange={(event) => field('title', event.target.value)} /></AdminField></div>
      {kind === 'subjects' && <AdminField label="분야 소개"><textarea rows={3} required maxLength={500} value={draft.topics} onChange={(event) => field('topics', event.target.value)} /></AdminField>}
      {kind === 'courses' && <><div className="admin-form-grid"><AdminField label="교육 분야"><select disabled={selected !== null} value={draft.subjectId} onChange={(event) => field('subjectId', event.target.value)}>{subjects.data?.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></AdminField><AdminField label="과정 경로"><input value={draft.slug} required maxLength={60} onChange={(event) => field('slug', event.target.value)} /></AdminField><AdminField label="분류"><select value={draft.courseKind} onChange={(event) => field('courseKind', event.target.value)}><option value="COURSE">교육 과정</option><option value="TRACK">CTF 트랙</option><option value="GUIDE">자료 문서</option></select></AdminField><AdminField label="수준"><input value={draft.level} maxLength={30} onChange={(event) => field('level', event.target.value)} /></AdminField></div><AdminField label="과정 본문"><textarea rows={12} value={draft.content} onChange={(event) => field('content', event.target.value)} /></AdminField><AdminField label="단원 JSON"><textarea rows={8} value={draft.weeks} onChange={(event) => field('weeks', event.target.value)} /></AdminField></>}
      {kind !== 'subjects' && <AdminField label={kind === 'challenges' ? '문제 본문' : '요약'}><textarea rows={kind === 'challenges' ? 8 : 3} required value={draft.description} onChange={(event) => field('description', event.target.value)} /></AdminField>}
      {kind === 'challenges' && <><div className="admin-form-grid"><AdminField label="카테고리"><select value={draft.category} onChange={(event) => field('category', event.target.value)}>{['crypto', 'misc', 'forensics', 'rev', 'web', 'pwn'].map((value) => <option key={value}>{value}</option>)}</select></AdminField><AdminField label="난이도"><select value={draft.difficulty} onChange={(event) => field('difficulty', event.target.value)}>{['easy', 'medium', 'hard'].map((value) => <option key={value}>{value}</option>)}</select></AdminField><AdminField label="점수"><input type="number" min={1} max={100000} value={draft.points} onChange={(event) => field('points', Number(event.target.value))} /></AdminField><AdminField label="실습 방식"><select value={draft.type} onChange={(event) => field('type', event.target.value)}><option value="static">정적 문제</option><option value="dynamic">실행 환경 필요</option></select></AdminField><AdminField label="출제자"><input value={draft.author} onChange={(event) => field('author', event.target.value)} /></AdminField></div>
        {draft.type === 'static' ? <AdminField label={selected ? '정답 변경 (비워두면 유지)' : '정답'}><input type="password" autoComplete="new-password" required={!selected} value={draft.answer} maxLength={4096} onChange={(event) => field('answer', event.target.value)} /></AdminField> : <div className="admin-form-grid"><AdminField label="포트"><input type="number" min={1} max={65535} value={draft.port} onChange={(event) => field('port', Number(event.target.value))} /></AdminField><AdminField label="프로토콜"><select value={draft.runtimeKind} onChange={(event) => field('runtimeKind', event.target.value)}><option value="http">HTTP</option><option value="tcp">TCP</option></select></AdminField><AdminField label="제한 시간 (분)"><input type="number" min={1} max={1440} value={draft.ttl} onChange={(event) => field('ttl', Number(event.target.value))} /></AdminField></div>}
        <AdminField label="힌트 (줄별)"><textarea rows={3} value={draft.hints} onChange={(event) => field('hints', event.target.value)} /></AdminField><AdminField label="첨부 파일 메타데이터 JSON"><textarea rows={3} value={draft.files} onChange={(event) => field('files', event.target.value)} /></AdminField>
      </>}
      {kind !== 'challenges' && <AdminField label="정렬 순서"><input type="number" min={0} value={draft.sortOrder} onChange={(event) => field('sortOrder', Number(event.target.value))} /></AdminField>}
      <label><input type="checkbox" checked={draft.published} onChange={(event) => field('published', event.target.checked)} />공개</label>
      <div className="admin-row-actions"><button className="admin-primary-button" disabled={busy}><Icon name="edit" size={14} />{busy ? '저장 중...' : '저장'}</button></div>
    </fieldset></form>
    <section className="admin-import-section"><h3>일괄 가져오기</h3><input type="file" accept=".json,application/json" disabled={busy} onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} /><button type="button" className="admin-ghost-button" disabled={busy || !importFile} onClick={() => void importBundle()}>새 데이터 등록</button></section>
  </div>
}
