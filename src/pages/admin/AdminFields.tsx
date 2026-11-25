import type { ReactNode } from 'react'
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner'

export function AdminField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="admin-field"><span>{label}</span>{children}</label>
}

export function AdminLoadState({ loading, error, onRetry }: {
  loading: boolean; error: string; onRetry: () => void
}) {
  if (loading) return <LoadingSpinner label="불러오는 중..." />
  if (!error) return null
  return <div className="admin-error" role="alert"><p>{error}</p>
    <button type="button" className="admin-ghost-button retry-button" onClick={onRetry}>다시 불러오기</button>
  </div>
}
