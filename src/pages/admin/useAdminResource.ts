import { useCallback, useEffect, useState } from 'react'

export function useAdminResource<T>(loader: () => Promise<T>, refreshKey = 0) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    let current = true
    // A refresh invalidates the editor until the requested server state arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError('')
    loader().then((result) => { if (current) setData(result) })
      .catch(() => { if (current) setError('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.') })
      .finally(() => { if (current) setLoading(false) })
    let polling = false
    const timer = window.setInterval(async () => {
      if (polling || !current || document.activeElement?.matches('input, textarea, select')) return
      polling = true
      try { const result = await loader(); if (current) { setData(result); setError('') } }
      catch { /* Preserve the last successful data on transient polling errors. */ }
      finally { polling = false }
    }, 10000)
    return () => { current = false; window.clearInterval(timer) }
  }, [loader, refreshKey, revision])

  return { data, setData, loading, error, reload }
}
