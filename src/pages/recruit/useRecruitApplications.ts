import { useEffect, useState } from 'react'
import client from '../../shared/api/client'
import type { RecruitApplication } from '../../shared/api/recruits'
import { useAuth } from '../../shared/auth/AuthContext'

export const applicationStatusLabel = (status: string) => ({
  submitted: '검토 중', accepted: '승인', rejected: '미선정',
}[status] ?? status)

export function useRecruitApplications() {
  const { user, isLoggedIn } = useAuth()
  const [revision, setRevision] = useState(0)
  const key = `${isLoggedIn ? user?.id : 'guest'}:${revision}`
  const [result, setResult] = useState<{ key: string; items: RecruitApplication[]; error?: string }>()
  useEffect(() => {
    if (!isLoggedIn) return
    const controller = new AbortController()
    client.get<RecruitApplication[]>('/api/recruits/applications/me', { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setResult({ key, items: data }) })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, items: [], error: '지원 내역을 불러오지 못했습니다.' })
      })
    return () => controller.abort()
  }, [key, isLoggedIn])
  const current = isLoggedIn && result?.key === key ? result : undefined
  return { items: current?.items ?? [], loading: isLoggedIn && !current, error: current?.error,
    retry: () => setRevision((value) => value + 1) }
}
