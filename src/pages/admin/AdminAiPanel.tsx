import { useCallback, useEffect, useRef, useState } from 'react'
import client from '../../shared/api/client'
import './admin-ai.css'

type Edit = { before: string; after: string; reason: string }
type Review = {
  id: string; kind: string; targetId: string; title: string; sourceHash: string
  status: string; managed: boolean; stale: boolean; createdAt: string
  review: {
    summary?: string
    issues?: { type: string; quote: string; detail: string }[]
    patch?: { before?: string; after?: string }; reply?: string
    editorial?: { edits: Edit[]; verification?: { approved: boolean; reason: string } }
  }
  receipt?: { reason?: string }
}
const statuses = [
  ['PENDING', '검토 대기'], ['CHECKED', '문제 없음'], ['APPLIED', '처리 완료'],
  ['DISMISSED', '검토 종료'], ['STALE', '재검수 필요'],
] as const
const kinds: Record<string, string> = { INFO: '정보 글', POST: '게시글', COMMENT: '댓글', RECRUIT: '모집 글', RECRUIT_COMMENT: '모집 댓글' }

export function AdminAiPanel() {
  const [status, setStatus] = useState('PENDING')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [reason, setReason] = useState<Record<string, string>>({})
  const version = useRef(0)
  const load = useCallback(async () => {
    const current = ++version.current
    setLoading(true); setError('')
    try {
      const response = await client.get<Review[]>('/api/admin/ai-maintenance/reviews', { params: { status, page } })
      if (version.current === current) setRows(response.data)
    } catch { if (version.current === current) setError('검수 결과를 불러오지 못했습니다. 다시 시도해 주세요.') }
    finally { if (version.current === current) setLoading(false) }
  }, [status, page])
  useEffect(() => { void load(); return () => { version.current++ } }, [load])

  async function refresh() {
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await client.post<{ imported: number }>('/api/admin/ai-maintenance/refresh')
      setMessage(`새 검수 결과 ${response.data.imported}건을 가져왔습니다.`)
      await load()
    } catch { setError('새 검수 결과를 가져오지 못했습니다.') }
    finally { setBusy(false) }
  }
  async function dismiss(row: Review) {
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await client.post<{ status: string }>(`/api/admin/ai-maintenance/reviews/${row.id}/decision`, {
        action: 'DISMISS', expectedHash: row.sourceHash, reason: reason[row.id]?.trim(),
      })
      setMessage(response.data.status === 'STALE' ? '원문이 바뀌어 재검수 항목으로 옮겼습니다.' : '검토를 종료했습니다. 원문은 그대로 유지됩니다.')
      await load()
    } catch { setError('처리하지 못했습니다. 내용을 새로 불러온 뒤 다시 시도해 주세요.') }
    finally { setBusy(false) }
  }

  return <section className="admin-panel admin-ai" aria-labelledby="ai-heading">
    <div className="admin-panel-header"><h3 id="ai-heading">에이전트 검수</h3>
      <button type="button" onClick={() => void refresh()} disabled={busy || loading}>새 결과 가져오기</button>
    </div>
    <p>글과 댓글에서 발견한 문제와 수정 제안을 확인합니다. 검수 결과만으로 원문이 수정되거나 삭제되지 않습니다.</p>
    <p>사람이 작성하거나 직접 수정한 글은 윤문 대상에서 제외됩니다.</p>
    <div className="admin-ai-filters" aria-label="검수 상태">
      {statuses.map(([value, label]) => <button type="button" key={value} aria-pressed={status === value} disabled={busy}
        onClick={() => { setStatus(value); setPage(0); setMessage('') }}>{label}</button>)}
    </div>
    {error && <p className="admin-error" role="alert">{error} <button type="button" onClick={() => void load()}>다시 불러오기</button></p>}
    {message && <p role="status">{message}</p>}
    {loading ? <p role="status">검수 결과를 불러오는 중입니다.</p> : <>
      {rows.length === 0 && !error && <p>이 상태에 해당하는 검수 결과가 없습니다.</p>}
      {rows.map(row => {
        const proposal = row.review.editorial
        const edits = proposal?.edits ?? (row.review.patch?.before ? [{ before: row.review.patch.before, after: row.review.patch.after ?? '', reason: '수정 제안' }] : [])
        return <details className="admin-ai-item" key={row.id}>
          <summary><span>{kinds[row.kind] ?? '콘텐츠'} #{row.targetId} · {row.title}</span>
            <small>{row.managed ? '코라봇 관리 글' : '읽기 전용'}{row.stale ? ' · 원문 변경됨' : ''}</small>
          </summary>
          <p>{row.review.summary}</p>
          {row.stale && <p>검수 이후 원문이 바뀌었습니다. 아래 제안은 이전 내용을 기준으로 합니다.</p>}
          {row.review.issues?.map((issue, index) => <div className="admin-ai-issue" key={index}>
            <blockquote>{issue.quote}</blockquote><p>{issue.detail}</p>
          </div>)}
          {edits.map((edit, index) => <div className="admin-ai-edit" key={index}>
            <p>{edit.reason}</p><div className="admin-ai-compare">
              <div><strong>기존 표현</strong><pre>{edit.before}</pre></div>
              <div><strong>제안 표현</strong><pre>{edit.after || '(삭제 제안)'}</pre></div>
            </div>
          </div>)}
          {proposal?.verification && <p>{proposal.verification.approved ? '의미 대조 검사 통과' : '추가 검토 필요'}: {proposal.verification.reason}</p>}
          {row.review.reply && <div><strong>답글 초안</strong><pre>{row.review.reply}</pre></div>}
          {row.receipt?.reason && <p>처리 기록: {row.receipt.reason}</p>}
          {row.status === 'PENDING' && <form className="admin-ai-close" onSubmit={event => { event.preventDefault(); void dismiss(row) }}>
            <label htmlFor={`reason-${row.id}`}>검토 종료 사유</label>
            <input id={`reason-${row.id}`} value={reason[row.id] ?? ''} minLength={3} maxLength={500} required disabled={busy}
              onChange={event => setReason(current => ({ ...current, [row.id]: event.target.value }))} />
            <button type="submit" disabled={busy || (reason[row.id]?.trim().length ?? 0) < 3}>원문 유지하고 검토 종료</button>
          </form>}
        </details>
      })}
      <div className="admin-ai-filters"><button type="button" disabled={page === 0 || busy} onClick={() => setPage(page - 1)}>이전</button>
        <span>{page + 1}페이지</span><button type="button" disabled={rows.length < 50 || busy} onClick={() => setPage(page + 1)}>다음</button></div>
    </>}
  </section>
}
