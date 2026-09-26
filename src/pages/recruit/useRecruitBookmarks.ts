import { useEffect, useRef, useState } from 'react'
import client from '../../shared/api/client'
import { recruitsApi, type RecruitItem } from '../../shared/api/recruits'
import { useAuth } from '../../shared/auth/AuthContext'

export function useRecruitBookmarks() {
  const { user, isLoggedIn } = useAuth()
  const [revision, setRevision] = useState(0)
  const key = `${isLoggedIn ? user?.id : 'guest'}:${revision}`
  const [result, setResult] = useState<{ key: string; items: RecruitItem[]; error?: string }>()
  const [pending, setPending] = useState<Set<string>>(new Set())
  const busy = useRef(new Set<string>())
  useEffect(() => {
    if (!isLoggedIn) return
    const controller = new AbortController()
    client.get<RecruitItem[]>('/api/recruits/bookmarks/me', { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setResult({ key, items: data }) })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, items: [], error: '관심 공고를 불러오지 못했습니다.' })
      })
    return () => controller.abort()
  }, [isLoggedIn, key])
  const current = isLoggedIn && result?.key === key ? result : undefined
  const savedIds = new Set(current?.items.map((item) => item.id) ?? [])
  const toggle = async (id: string) => {
    if (!isLoggedIn) throw new Error('관심 공고 저장은 로그인 후 가능합니다.')
    if (!current || current.error) throw new Error('관심 공고를 먼저 불러와 주세요.')
    const operationKey = `${key}:${id}`
    if (busy.current.has(operationKey)) return
    busy.current.add(operationKey)
    setPending((value) => new Set(value).add(operationKey))
    try {
      const saved = savedIds.has(id)
      let updated: RecruitItem | null = null
      if (saved) await client.delete(`/api/recruits/${encodeURIComponent(id)}/bookmarks`)
      else updated = await recruitsApi.bookmark(id)
      setResult((value) => value?.key === key ? {
        key, items: updated ? [updated, ...value.items.filter((item) => item.id !== id)] : value.items.filter((item) => item.id !== id),
      } : value)
      return { saved: !saved, item: updated }
    } catch {
      throw new Error('관심 공고를 변경하지 못했습니다. 다시 시도해 주세요.')
    } finally {
      busy.current.delete(operationKey)
      setPending((value) => { const next = new Set(value); next.delete(operationKey); return next })
    }
  }
  return {
    savedIds,
    items: current?.items ?? [],
    loading: isLoggedIn && !current,
    error: current?.error,
    isPending: (id: string) => pending.has(`${key}:${id}`),
    retry: () => setRevision((value) => value + 1),
    toggle,
  }
}
