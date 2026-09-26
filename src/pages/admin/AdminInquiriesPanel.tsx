import { useState, type FormEvent } from 'react'
import { adminApi, type AdminInquiryStatus, type AdminServiceInquiry } from '../../shared/api/admin'
import { AdminField as Field, AdminLoadState } from './AdminFields'
import { useAdminResource } from './useAdminResource'

const labels: Record<AdminInquiryStatus, string> = { open: '검토 중', answered: '답변 완료', closed: '종료' }
function inquiryStatus(inquiry: AdminServiceInquiry): AdminInquiryStatus {
  if (inquiry.status === 'closed') return 'closed'
  if (inquiry.status === 'answered' || inquiry.status === '답변 완료') return 'answered'
  return 'open'
}

export function AdminInquiriesPanel({ kind, refreshKey }: { kind: 'instances' | 'domains'; refreshKey: number }) {
  const resource = useAdminResource(kind === 'instances' ? adminApi.getInstanceInquiries : adminApi.getDomainInquiries, refreshKey)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const selected = resource.data?.find((item) => item.id === selectedId)
  const filtered = resource.data?.filter((item) => filter === 'all' || inquiryStatus(item) === filter) ?? []
  return <section className="admin-inquiries-section">
    <div className="admin-panel-header"><h3>{kind === 'instances' ? '인스턴스 문의' : '도메인 문의'}</h3>
      <select className="admin-inline-select" aria-label="문의 상태 필터" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">전체 상태</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    </div>
    <AdminLoadState {...resource} onRetry={resource.reload} />
    {!resource.loading && !resource.error && resource.data && <div className="admin-two-column">
      <div className="admin-list">{filtered.map((item) => <button type="button" className={`admin-list-row${item.id === selectedId ? ' is-active' : ''}`} aria-pressed={item.id === selectedId} key={item.id} disabled={busy} onClick={() => setSelectedId(item.id)}>
        <span>{item.title}</span><small>{item.author} · {item.createdAt}</small><b>{labels[inquiryStatus(item)]}</b>
      </button>)}{!filtered.length && <p className="admin-empty">조건에 맞는 문의가 없습니다.</p>}</div>
      {selected ? <InquiryEditor key={selected.id} kind={kind} inquiry={selected} onBusy={setBusy} onSave={(saved) => resource.setData((items) => items?.map((item) => item.id === saved.id ? saved : item) ?? [])} /> : <p className="admin-empty">문의를 선택하세요.</p>}
    </div>}
  </section>
}

function InquiryEditor({ kind, inquiry, onBusy, onSave }: {
  kind: 'instances' | 'domains'; inquiry: AdminServiceInquiry; onBusy: (busy: boolean) => void; onSave: (saved: AdminServiceInquiry) => void
}) {
  const [status, setStatus] = useState(() => inquiryStatus(inquiry))
  const [reply, setReply] = useState(inquiry.reply ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const valid = status !== 'answered' || reply.trim().length > 0
  async function save(event: FormEvent) {
    event.preventDefault()
    if (saving || !valid) return
    setSaving(true); onBusy(true); setMessage('')
    try {
      const saved = await adminApi.updateInquiry(kind, inquiry.id, { status, reply: reply.trim() })
      setStatus(inquiryStatus(saved)); setReply(saved.reply ?? ''); onSave(saved); setMessage('문의 답변과 상태를 저장했습니다.')
    } catch { setMessage('문의 저장에 실패했습니다. 답변은 유지됩니다. 잠시 후 다시 시도해 주세요.') }
    finally { setSaving(false); onBusy(false) }
  }
  return <form className="admin-panel admin-form" onSubmit={(event) => void save(event)}>
    <div className="admin-panel-header"><h3>{inquiry.title}</h3></div>
    <p className="admin-inquiry-content">{inquiry.content ?? inquiry.summary}</p>
    {inquiry.answeredAt && <small>최근 답변: {new Date(inquiry.answeredAt).toLocaleString('ko-KR')}</small>}
    <fieldset className="admin-fieldset" disabled={saving}>
      <Field label="문의 처리 상태"><select value={status} onChange={(event) => setStatus(event.target.value as AdminInquiryStatus)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label="관리자 답변"><textarea rows={7} maxLength={5000} required={status === 'answered'} value={reply} onChange={(event) => setReply(event.target.value)} /></Field>
      {!valid && <p className="admin-error">답변 완료로 처리하려면 답변을 입력하세요.</p>}
      <button className="admin-primary-button" type="submit" disabled={!valid}>{saving ? '저장 중...' : '문의 답변 저장'}</button>
    </fieldset>
    <p className="admin-feedback" role="status">{message}</p>
  </form>
}
