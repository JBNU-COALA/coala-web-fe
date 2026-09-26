import { useState, type FormEvent } from 'react'
import { adminApi } from '../../shared/api/admin'
import type { ApplyStatus, DomainApplication } from '../../shared/api/services'
import { AdminField as Field, AdminLoadState } from './AdminFields'
import { useAdminResource } from './useAdminResource'
import { AdminInquiriesPanel } from './AdminInquiriesPanel'

const statuses: Record<ApplyStatus, string> = { pending: '승인 대기', approved: '승인', rejected: '반려' }

export function AdminDomainsPanel({ refreshKey }: { refreshKey: number }) {
  const applications = useAdminResource(adminApi.getDomainApplications, refreshKey)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [status, setStatus] = useState('pending')
  const [busy, setBusy] = useState(false)
  const filtered = applications.data?.filter((item) => status === 'all' || item.status === status) ?? []
  const selected = applications.data?.find((item) => item.id === selectedId)
  return <div className="admin-stack">
    <AdminLoadState {...applications} onRetry={applications.reload} />
    {!applications.loading && !applications.error && applications.data && <div className="admin-two-column">
      <section className="admin-panel"><div className="admin-panel-header"><h3>도메인 신청</h3><select className="admin-inline-select" aria-label="도메인 신청 상태" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">전체</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        <div className="admin-list">{filtered.map((item) => <button type="button" key={item.id} disabled={busy} className={`admin-list-row${selectedId === item.id ? ' is-active' : ''}`} onClick={() => setSelectedId(item.id)} aria-pressed={selectedId === item.id}><span>{item.serviceName}</span><small>{item.applicantName} · {item.requestedDomain}</small><b>{statuses[item.status]}</b></button>)}{!filtered.length && <p className="admin-empty">해당 상태의 신청이 없습니다.</p>}</div>
      </section>
      {selected ? <DomainEditor key={selected.id} application={selected} onBusy={setBusy} onSave={(saved) => applications.setData((items) => items?.map((item) => item.id === saved.id ? saved : item) ?? [])} /> : <p className="admin-empty">신청을 선택하세요.</p>}
    </div>}
    <AdminInquiriesPanel kind="domains" refreshKey={refreshKey} />
  </div>
}

function DomainEditor({ application, onSave, onBusy }: { application: DomainApplication; onSave: (saved: DomainApplication) => void; onBusy: (value: boolean) => void }) {
  const [status, setStatus] = useState(application.status)
  const [note, setNote] = useState(application.adminNote ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  async function save(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true); onBusy(true); setMessage('')
    try { onSave(await adminApi.updateDomainApplication(application.id, { status, adminNote: note.trim() })); setMessage('신청 처리를 저장했습니다.') }
    catch { setMessage('신청 처리에 실패했습니다. 입력 내용은 유지됩니다.') }
    finally { setSaving(false); onBusy(false) }
  }
  return <form className="admin-panel admin-form" onSubmit={(event) => void save(event)}>
    <div className="admin-panel-header"><h3>{application.serviceName}</h3></div>
    <dl className="admin-description-list">{[
      ['신청자', `${application.applicantName} · ${application.studentId}`], ['연락 이메일', application.contactEmail], ['신청 도메인', application.requestedDomain],
      ['연결 주소', application.targetUrl || '-'], ['저장소', application.repositoryUrl], ['신청일', application.requestedAt], ['목적', application.purpose],
    ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <fieldset className="admin-fieldset" disabled={saving}>
      <Field label="처리 상태"><select value={status} onChange={(e) => setStatus(e.target.value as ApplyStatus)}>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
      <Field label="관리자 메모"><textarea rows={4} maxLength={5000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <button type="submit" className="admin-primary-button">{saving ? '저장 중...' : '신청 처리 저장'}</button>
    </fieldset><p className="admin-feedback" role="status">{message}</p>
  </form>
}
