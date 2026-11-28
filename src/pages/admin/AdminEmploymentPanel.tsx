import { AdminSearch } from './AdminSearch'
import { useCallback, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { employmentApi, type EmploymentList, type EmploymentReview, type EmploymentReviewInput } from '../../shared/api/employment'
import { SectionNav } from '../../shared/ui/SectionNav'
import { Pagination } from '../../shared/ui/Pagination'
import { Icon } from '../../shared/ui/Icon'
import client from '../../shared/api/client'
import type { EmploymentOptions, EmploymentOption } from '../../shared/api/employment'
import { featureError } from '../../shared/api/featureError'
import { useApiResource as useCtfResource } from '../../shared/hooks/useApiResource'
import { AdminField, AdminLoadState } from './AdminFields'
import { useAdminEditorFocus } from './useAdminEditorFocus'

const empty = (): EmploymentOption => ({ id: '', kind: 'INDUSTRY', label: '', sortOrder: 0, published: true, version: 0 })
export function AdminEmploymentPanel() {
  const [view, setView] = useState('reviews')
  return <div><SectionNav label="취업 관리 메뉴" value={view} items={[{ id: 'reviews', label: '취업 후기', icon: 'file' }, { id: 'options', label: '계열 · 직무', icon: 'list' }]} onChange={setView} />{view === 'reviews' ? <EmploymentReviewsEditor /> : <EmploymentOptionsEditor />}</div>
}
function EmploymentOptionsEditor() {
  const [revision, setRevision] = useState(0)
  const [draft, setDraft] = useState(empty)
  const [existing, setExisting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const load = useCallback(async (signal: AbortSignal) => (await client.get<EmploymentOptions>('/api/admin/employment/options', { signal })).data, [])
  const resource = useCtfResource(load, revision)
  const submit = async (event: FormEvent) => { event.preventDefault(); if (busy) return; setBusy(true); setMessage(''); try { await client.put(`/api/admin/employment/options/${encodeURIComponent(draft.id)}`, { ...draft, version: existing ? draft.version : null }); setDraft(empty()); setExisting(false); setRevision((value) => value + 1); setMessage('저장했습니다.') } catch (cause) { setMessage(featureError(cause)) } finally { setBusy(false) } }
  return <div className="admin-panel"><div className="admin-panel-header"><h3>취업 후기 분류</h3></div><AdminLoadState loading={resource.loading} error={resource.error ?? ''} onRetry={() => setRevision((value) => value + 1)} />
    {message && <p role="status">{message}</p>}
    <AdminField label="기존 분류"><select value={existing ? draft.id : ''} disabled={busy} onChange={(event) => { const row = resource.data?.options.find((item) => item.id === event.target.value); setDraft(row ?? empty()); setExisting(!!row) }}><option value="">새 분류</option>{resource.data?.options.map((item) => <option key={item.id} value={item.id}>{item.kind === 'INDUSTRY' ? '계열' : '직무'} · {item.label}{!item.published ? ' (비공개)' : ''}</option>)}</select></AdminField>
    <form onSubmit={submit}><fieldset className="admin-content-fieldset" disabled={busy}><div className="admin-form-grid">
      <AdminField label="ID"><input required pattern="[a-z][a-z0-9-]+" maxLength={80} disabled={existing} value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} /></AdminField>
      <AdminField label="종류"><select disabled={existing} value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as EmploymentOption['kind'] })}><option value="INDUSTRY">계열</option><option value="ROLE">직무</option></select></AdminField>
      <AdminField label="이름"><input required maxLength={100} value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} /></AdminField>
      <AdminField label="정렬 순서"><input type="number" min={0} max={10000} value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })} /></AdminField>
    </div><label><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} />공개</label><div className="admin-row-actions"><button className="admin-primary-button" disabled={busy}>{busy ? '저장 중...' : '저장'}</button></div></fieldset></form>
  </div>
}

function EmploymentReviewsEditor() {
  const [outcome, setOutcome] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [selected, setSelected] = useState<EmploymentReview | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [confirm, setConfirm] = useState(false)
  const editorRef = useAdminEditorFocus(selected?.id ?? null)
  const load = useCallback(async (signal: AbortSignal) => (await client.get<EmploymentList>('/api/admin/employment/reviews', { params: { outcome: outcome || undefined, q: query, page }, signal })).data, [outcome, query, page])
  const resource = useCtfResource(load, revision)
  const options = useCtfResource(employmentApi.options, revision)
  const choose = async (id: number) => { setBusy(true); setMessage(''); try { setSelected(await employmentApi.detail(String(id))); setConfirm(false) } catch (cause) { setMessage(featureError(cause)) } finally { setBusy(false) } }
  const save = async (event: FormEvent) => { event.preventDefault(); if (!selected || busy) return; setBusy(true); try { const saved = await employmentApi.save(selected as EmploymentReviewInput, selected.id); setSelected(saved); setRevision((value) => value + 1); setMessage('후기를 저장했습니다.') } catch (cause) { setMessage(featureError(cause)) } finally { setBusy(false) } }
  const remove = async () => { if (!selected || busy) return; setBusy(true); try { await employmentApi.delete(selected.id); setSelected(null); setConfirm(false); setRevision((value) => value + 1); setMessage('후기를 삭제했습니다.') } catch (cause) { setMessage(featureError(cause)) } finally { setBusy(false) } }
  return <section><div className="admin-toolbar"><AdminSearch><label className="admin-member-search"><Icon name="search" size={16} /><input aria-label="취업 후기 검색" placeholder="회사 · 제목 검색" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} maxLength={100} /></label></AdminSearch><select className="admin-inline-select" aria-label="채용 결과 필터" value={outcome} onChange={(event) => { setOutcome(event.target.value); setPage(0) }}><option value="">전체 결과</option><option value="ACCEPTED">합격</option><option value="REJECTED">불합격</option></select></div>
    <AdminLoadState loading={resource.loading} error={resource.error ?? ''} onRetry={() => setRevision((value) => value + 1)} />{message && <p role="status" className="admin-feedback">{message}</p>}
    <div className={`admin-catalog-layout${selected ? ' has-editor' : ''}`}><div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>후기</th><th>회사 · 직무</th><th>결과</th><th>작성자</th></tr></thead><tbody>{resource.data?.reviews.map((row) => <tr key={row.id}><td><button type="button" className="admin-record-link" disabled={busy} onClick={() => void choose(row.id)}>{row.title}</button></td><td>{row.company}<small className="admin-record-id">{row.role}</small></td><td><span className={`admin-state ${row.outcome === 'ACCEPTED' ? 'is-ready' : ''}`}>{row.outcome === 'ACCEPTED' ? '합격' : '불합격'}</span></td><td>{row.author}</td></tr>)}</tbody></table></div>{resource.data?.reviews.length === 0 && <p className="admin-empty">등록된 후기가 없습니다.</p>}<Pagination page={page + 1} pageCount={resource.data?.totalPages ?? 0} onChange={(value) => setPage(value - 1)} /></div>
    {selected && <section ref={editorRef} className="admin-record-editor"><div className="admin-section-heading"><h3>후기 수정</h3><button type="button" className="admin-icon-button" disabled={busy} aria-label="후기 편집 닫기" title="닫기" onClick={() => setSelected(null)}><Icon name="close" size={16} /></button></div><form onSubmit={save}><fieldset className="admin-content-fieldset" disabled={busy}>
      <AdminField label="제목"><input required maxLength={150} value={selected.title} onChange={(event) => setSelected({ ...selected, title: event.target.value })} /></AdminField><AdminField label="회사"><input required maxLength={120} value={selected.company} onChange={(event) => setSelected({ ...selected, company: event.target.value })} /></AdminField>
      <div className="admin-form-grid">{(['INDUSTRY', 'ROLE'] as const).map((kind) => { const key = kind === 'INDUSTRY' ? 'industryId' : 'roleId'; return <AdminField key={kind} label={kind === 'INDUSTRY' ? '계열' : '직무'}><select value={selected[key]} onChange={(event) => setSelected({ ...selected, [key]: event.target.value })}>{!options.data?.options.some((row) => row.id === selected[key]) && <option value={selected[key]}>{kind === 'INDUSTRY' ? selected.industry : selected.role}</option>}{options.data?.options.filter((row) => row.kind === kind).map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}</select></AdminField> })}<AdminField label="결과"><select value={selected.outcome} onChange={(event) => setSelected({ ...selected, outcome: event.target.value as EmploymentReview['outcome'] })}><option value="ACCEPTED">합격</option><option value="REJECTED">불합격</option></select></AdminField><AdminField label="채용 연도"><input type="number" min={2000} max={2100} value={selected.recruitmentYear} onChange={(event) => setSelected({ ...selected, recruitmentYear: Number(event.target.value) })} /></AdminField><AdminField label="전형"><select value={selected.stage} onChange={(event) => setSelected({ ...selected, stage: event.target.value })}>{Object.entries({ DOCUMENT: '서류', ASSIGNMENT: '과제', CODING: '코딩 테스트', INTERVIEW: '면접', FINAL: '최종' }).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></AdminField></div>
      <AdminField label="후기 본문"><textarea rows={12} required maxLength={30000} value={selected.content} onChange={(event) => setSelected({ ...selected, content: event.target.value })} /></AdminField><div className="admin-editor-footer"><Link className="admin-text-link" to={`/community/employment/${selected.id}`}>원문 보기</Link><button type="button" className="admin-icon-button" aria-label="후기 삭제" title="삭제" onClick={() => setConfirm(true)}><Icon name="trash-color" size={16} /></button><button className="admin-primary-button" disabled={busy}>저장</button></div>
    </fieldset></form>{confirm && <div className="admin-confirm" role="alertdialog" aria-label="후기 삭제 확인"><p>이 후기를 삭제할까요?</p><div className="admin-row-actions"><button type="button" disabled={busy} onClick={() => setConfirm(false)}>취소</button><button className="admin-danger-button" type="button" disabled={busy} onClick={() => void remove()}>삭제</button></div></div>}</section>}
    </div>
  </section>
}
