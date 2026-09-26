import { useCallback, useEffect, useRef } from 'react'

// A request belongs to one committed mount, including StrictMode effect replays.
export function useRequestScope() {
  const generation = useRef(0)

  useEffect(() => {
    generation.current += 1
    return () => { generation.current += 1 }
  }, [])

  return useCallback(() => {
    const startedIn = generation.current
    return () => generation.current === startedIn
  }, [])
}
