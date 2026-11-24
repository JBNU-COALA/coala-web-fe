import { useLayoutEffect, useRef } from 'react'

const keyframesByVariant: Record<'rise' | 'fade', Keyframe[]> = {
  rise: [
    { opacity: 0, transform: 'translateY(14px)' },
    { opacity: 1, transform: 'none' },
  ],
  // Opacity only: safe for pages with fixed-position layers (e.g. the landing intro curtain).
  fade: [{ opacity: 0 }, { opacity: 1 }],
}

/**
 * Replays a short enter animation on the referenced element whenever `pageKey` changes.
 * Uses the Web Animations API without fill so no transform lingers afterwards
 * (a persistent transform would break `position: fixed` descendants such as modals).
 */
export function usePageTransition<T extends HTMLElement>(pageKey: string, variant: 'rise' | 'fade' = 'rise') {
  const ref = useRef<T | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || typeof element.animate !== 'function') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const animation = element.animate(keyframesByVariant[variant], { duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)' })
    return () => animation.cancel()
  }, [pageKey, variant])

  return ref
}
