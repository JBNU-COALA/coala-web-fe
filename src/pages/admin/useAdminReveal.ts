import { useEffect, useRef } from 'react'

export function useAdminReveal() {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = root.current
    if (!container || typeof IntersectionObserver === 'undefined' || typeof window.matchMedia !== 'function') return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const seen = new Set<Element>()
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('admin-reveal-pending')
        observer.unobserve(entry.target)
      }
    }), { threshold: 0, rootMargin: '0px 0px -20px 0px' })
    const scan = () => container.querySelectorAll('.admin-panel, .admin-recent-actions, .admin-summary-band').forEach(element => {
      if (seen.has(element)) return
      seen.add(element)
      if (!motion.matches && element.getBoundingClientRect().top >= window.innerHeight) {
        element.classList.add('admin-reveal-pending')
        observer.observe(element)
      }
    })
    const revealFocused = (event: FocusEvent) => {
      if (event.target instanceof Element) event.target.closest('.admin-reveal-pending')?.classList.remove('admin-reveal-pending')
    }
    scan()
    const mutations = new MutationObserver(scan)
    mutations.observe(container, { childList: true, subtree: true })
    container.addEventListener('focusin', revealFocused)
    return () => { observer.disconnect(); mutations.disconnect(); container.removeEventListener('focusin', revealFocused); seen.forEach(element => element.classList.remove('admin-reveal-pending')) }
  }, [])
  return root
}
