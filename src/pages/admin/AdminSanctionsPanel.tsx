import { useCallback, useState, type FormEvent } from 'react'
import client from '../../shared/api/client'
import { featureError } from '../../shared/api/featureError'
import { useApiResource } from '../../shared/hooks/useApiResource'
import { AdminField, AdminLoadState } from './AdminFields'

type Sanction = { id: number; type: string; reason: string; startAt: string; endAt: string | null; active: boolean; canRevoke: boolean }
const labels: Record<string, string> = { WARNING: '경고', POST_RESTRICTED: '게시글 제한', COMMENT_RESTRICTED: '댓글 제한', TEMP_SUSPENDED: '일시 정지', ACCOUNT_SUSPENDED: '계정 정지', PERMANENT_BANNED: '영구 정지' }
export function AdminSanctionsPanel({ userId, refreshKey, canRevoke }: { userId: number; refreshKey: number; canRevoke: boolean }) {
  const [revision, setRevision] = useState(0)
  const [selected, setSelected] = useState<Sanction | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const load = useCallback(async(signal: AbortSignal) => (await client.get<Sanction[]>('/api/admin/moderation/sanctions', { params: { targetUserId: userId }, signal })).data, [userId])
  const resource = useApiResource(load, refreshKey + revision)
  const revoke = async (event: FormEvent) => {
    event.preventDefault(); if (!selected || busy || !reason.trim()) return; setBusy(true)
    try { await client.post(`/api/admin/moderation/sanctions/${selected.id}/revoke`, { reason: reason.trim() }); setSelected(null); setReason(''); setRevision((value) => value + 1); setMessage('제재를 해제했습니다.') }
    catch (cause) { setMessage(featureError(cause)) } finally { setBusy(false) }
  }
  return <section className="admin-panel"><div className="admin-panel-header"><h3>제재 이력</h3></div><AdminLoadState loading={resource.loading} error={resource.error ?? ''} onRetry={() => setRevision((value) => value + 1)} />{message && <p className="admin-feedback" role="status">{message}</p>}
    {resource.data?.map((row) => <div key={row.id} className="admin-sanction-row"><div><strong>{labels[row.type] ?? row.type} · {row.active ? '적용 중' : row.canRevoke ? '예약' : '종료'}</strong><p>{row.reason}</p><small>{row.startAt.replace('T', ' ')} ~ {row.endAt?.replace('T', ' ') ?? '기한 없음'}</small></div>{canRevoke && row.canRevoke && <button type="button" className="admin-ghost-button" disabled={busy} onClick={() => { setSelected(row); setReason('') }}>해제</button>}</div>)}
    {resource.data?.length === 0 && <p className="admin-empty">제재 이력이 없습니다.</p>}
    {selected && <form className="admin-confirm" role="alertdialog" aria-label="제재 해제 확인" onSubmit={revoke}><h4>{labels[selected.type] ?? selected.type} 해제</h4><AdminField label="제재 해제 사유"><textarea required maxLength={450} rows={3} disabled={busy} value={reason} onChange={(event) => setReason(event.target.value)} /></AdminField><div className="admin-row-actions"><button type="button" disabled={busy} onClick={() => setSelected(null)}>취소</button><button type="submit" className="admin-primary-button" disabled={busy || !reason.trim()}>해제 확인</button></div></form>}
  </section>
}
