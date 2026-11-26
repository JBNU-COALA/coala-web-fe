import { useEffect, useState } from 'react'
import { featureError } from '../api/featureError'

export function useApiResource<T>(load: (signal: AbortSignal) => Promise<T>, revision = 0) {
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
    return () => controller.abort()
  }, [load, revision])
  return state
}
