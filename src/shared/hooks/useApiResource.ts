import { useEffect, useState } from 'react'
import { featureError } from '../api/featureError'

export function useApiResource<T>(load: (signal: AbortSignal) => Promise<T>, revision = 0, pollMs = 0) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null })
  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) setState({ data: null, loading: true, error: null })
      return load(controller.signal)
    }).then((data) => {
      if (!controller.signal.aborted) setState({ data, loading: false, error: null })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ data: null, loading: false, error: featureError(error) })
    })
    let polling = false
    const timer = pollMs ? window.setInterval(async () => {
      if (polling || controller.signal.aborted || document.activeElement?.matches('input, textarea, select')) return
      polling = true
      try {
        const data = await load(controller.signal)
        if (!controller.signal.aborted) setState({ data, loading: false, error: null })
      } catch { /* Keep the last successful data during a background refresh. */ }
      finally { polling = false }
    }, pollMs) : undefined
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [load, revision, pollMs])
  return state
}
