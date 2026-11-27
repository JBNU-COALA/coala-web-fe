import { useEffect, useRef } from 'react'

export function useAdminEditorFocus(key: string | number | null) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (key !== null && window.matchMedia?.('(max-width: 1200px)').matches) {
      ref.current?.scrollIntoView?.({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }
  }, [key])
  return ref
}
