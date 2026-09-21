import type { AdminActionLog } from '../../shared/api/admin'
import { Icon } from '../../shared/ui/Icon'

export type AdminDestination = 'stats' | 'users' | 'posts' | 'reports' | 'services' | 'instances' | 'about'

export function AdminOverview({ counts, logs, onNavigate }: {
  counts: { users: number | null; posts: number | null; services: number | null; reports: number | null; instances: number | null }
  logs: AdminActionLog[]
  onNavigate: (tab: AdminDestination) => void
}) {
  return <div className="admin-overview">
    <section className="admin-work-queue" aria-labelledby="admin-queue-title">
      <h3 id="admin-queue-title">처리할 일</h3>
      <div className="admin-queue-list">
        {([
          { key: 'reports', label: '미처리 신고', icon: 'bell', value: counts.reports },
          { key: 'instances', label: '인스턴스 승인 대기', icon: 'layout', value: counts.instances },
        ] as const).map((item) => <button type="button" key={item.key} onClick={() => onNavigate(item.key)}>
          <Icon name={item.icon} size={20} /><span>{item.label}</span>
          <strong>{item.value ?? '-'}</strong><Icon name="chevron-right" size={18} />
        </button>)}
      </div>
    </section>
    <section className="admin-summary-band" aria-label="운영 현황">
      {([
        { key: 'users', label: '회원', value: counts.users },
        { key: 'posts', label: '게시글', value: counts.posts },
        { key: 'services', label: '운영 서비스', value: counts.services },
      ] as const).map((item) => <button type="button" key={item.key} onClick={() => onNavigate(item.key)}>
        <span>{item.label}</span><strong>{item.value ?? '-'}</strong><Icon name="chevron-right" size={16} />
      </button>)}
    </section>
    <section className="admin-recent-actions">
      <h3>최근 관리자 작업</h3>
      {logs.length === 0 ? <p className="admin-empty">표시할 작업이 없습니다.</p> : <ul>
        {logs.slice(0, 8).map((log) => <li key={log.id}>
          <div><strong>{log.adminName}</strong><span>{actionLabel(log.action)}</span>
            <small>{log.targetType} #{log.targetId}</small></div>
          <time dateTime={log.createdAt}>{new Date(log.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
        </li>)}
      </ul>}
    </section>
  </div>
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    UPDATE_USER_PROFILE: '회원정보 수정', UPDATE_USER_ROLE: '권한 변경', SANCTION_USER: '회원 제재',
    HANDLE_REPORT: '신고 처리', HIDE_POST: '게시글 숨김', RESTORE_POST: '게시글 복원',
    DELETE_POST: '게시글 삭제', LOCK_POST: '게시글 잠금', UNLOCK_POST: '게시글 잠금 해제',
    HIDE_COMMENT: '댓글 숨김', RESTORE_COMMENT: '댓글 복원', DELETE_COMMENT: '댓글 삭제',
  }
  return labels[action] ?? action
}
