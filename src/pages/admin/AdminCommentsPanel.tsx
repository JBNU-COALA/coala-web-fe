import { AdminSearch } from './AdminSearch'
import { useCallback, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminCommentsApi, type CommentAction, type ManagedComment } from '../../shared/api/adminComments'
import { featureError } from '../../shared/api/featureError'
import { useApiResource } from '../../shared/hooks/useApiResource'
import { routes } from '../../shared/routes'
import { Icon } from '../../shared/ui/Icon'
import { Pagination } from '../../shared/ui/Pagination'
import { AdminField, AdminLoadState } from './AdminFields'

const labels: Record<ManagedComment['status'], string> = { ACTIVE: '공개', HIDDEN: '숨김', DELETED: '작성자 삭제', ADMIN_DELETED: '관리자 삭제', BLOCKED: '차단' }
const actionLabels = { hide: '숨김', restore: '복구', delete: '관리자 삭제' }
export function AdminCommentsPanel() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState(() => searchParams.get('q')?.slice(0, 100) ?? '')
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [pending, setPending] = useState<{ row: ManagedComment; action: CommentAction } | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const load = useCallback((signal: AbortSignal) => adminCommentsApi.list(status, query, page, signal), [status, query, page])
  const resource = useApiResource(load, revision, 10000)
  const act = async (event: FormEvent) => {
    event.preventDefault(); if (!pending || busy || !reason.trim()) return; setBusy(true)
    try { await adminCommentsApi.act(pending.row.id, pending.action, reason.trim()); setMessage(`댓글 ${actionLabels[pending.action]} 처리를 완료했습니다.`); setPending(null); setReason(''); setRevision((value) => value + 1) }
    catch (cause) { setMessage(featureError(cause)) } finally { setBusy(false) }
  }
  return <section><div className="admin-toolbar"><AdminSearch><label className="admin-member-search"><Icon name="search" size={16} /><input aria-label="댓글 검색" placeholder="댓글 내용 · #번호 검색" maxLength={100} value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} /></label></AdminSearch><select className="admin-inline-select" aria-label="댓글 상태" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0) }}><option value="">전체 상태</option>{Object.entries(labels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
    <AdminLoadState loading={resource.loading} error={resource.error ?? ''} onRetry={() => setRevision((value) => value + 1)} />{message && <p className="admin-feedback" role="status">{message}</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>댓글</th><th>원문</th><th>상태</th><th>관리</th></tr></thead><tbody>{resource.data?.comments.map((row) => <tr key={row.id}><td><small>#{row.id}{row.reply ? ' · 답글' : ''}</small><p className="admin-comment-content">{row.content}</p></td><td><Link className="admin-text-link" to={routes.community.boardPost(row.boardId, row.postId)}>{row.postTitle}</Link></td><td>{labels[row.status]}</td><td><div className="admin-row-actions">{(['hide', 'restore', 'delete'] as const).filter((action) => action === 'restore' ? row.status !== 'ACTIVE' : action === 'hide' ? row.status === 'ACTIVE' : row.status !== 'ADMIN_DELETED').map((action) => <button key={action} type="button" disabled={busy} onClick={() => { setPending({ row, action }); setReason(''); setMessage('') }}>{actionLabels[action]}</button>)}</div></td></tr>)}</tbody></table></div>
    {resource.data?.comments.length === 0 && <p className="admin-empty">조건에 맞는 댓글이 없습니다.</p>}<Pagination page={page + 1} pageCount={resource.data?.totalPages ?? 0} onChange={(value) => setPage(value - 1)} />
    {pending && <form className="admin-confirm" role="alertdialog" aria-label="댓글 관리 확인" onSubmit={act}><h4>댓글 #{pending.row.id} {actionLabels[pending.action]}</h4><AdminField label="댓글 조치 사유"><textarea required maxLength={500} rows={3} disabled={busy} value={reason} onChange={(event) => setReason(event.target.value)} /></AdminField><div className="admin-row-actions"><button type="button" disabled={busy} onClick={() => setPending(null)}>취소</button><button className="admin-primary-button" type="submit" disabled={busy || !reason.trim()}>확인</button></div></form>}
  </section>
}
