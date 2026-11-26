import { useCallback, useState, type FormEvent } from 'react'
import client from '../../shared/api/client'
import type { EmploymentOptions, EmploymentOption } from '../../shared/api/employment'
import { featureError } from '../../shared/api/featureError'
import { useApiResource as useCtfResource } from '../../shared/hooks/useApiResource'
import { AdminField, AdminLoadState } from './AdminFields'

const empty = (): EmploymentOption => ({ id: '', kind: 'INDUSTRY', label: '', sortOrder: 0, published: true, version: 0 })
export function AdminEmploymentPanel() {
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
