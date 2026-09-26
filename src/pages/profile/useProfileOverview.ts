import { useEffect, useState } from 'react'
import client from '../../shared/api/client'
import type { ProfileOverview } from './profileOverview'

export function useProfileOverview(userId: string, viewerId?: number | string) {
  const [revision, setRevision] = useState(0)
  const key = `${viewerId ?? ''}:${userId}:${revision}`
  const [result, setResult] = useState<{ key: string; data?: ProfileOverview; error?: string }>()
  useEffect(() => {
    if (!viewerId || !userId) return
    const controller = new AbortController()
    client.get<ProfileOverview>(`/api/users/${encodeURIComponent(userId)}/overview`, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setResult({ key, data })
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, error: '활동 요약을 불러오지 못했습니다.' })
      })
    return () => controller.abort()
  }, [key, userId, viewerId])
  return {
    data: result?.key === key ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: Boolean(viewerId && userId && result?.key !== key),
    retry: () => setRevision((value) => value + 1),
  }
}
