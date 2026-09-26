import type { ReactNode } from 'react'

export function AdminField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="admin-field"><span>{label}</span>{children}</label>
}

export function AdminLoadState({ loading, error, onRetry }: {
  loading: boolean; error: string; onRetry: () => void
}) {
  if (loading) return <p className="admin-empty" role="status">불러오는 중...</p>
  if (!error) return null
  return <div className="admin-error" role="alert"><p>{error}</p>
    <button type="button" className="admin-ghost-button" onClick={onRetry}>다시 불러오기</button>
  </div>
}
