import { useEffect, useRef } from 'react'

export function useAdminReveal(tab: string) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root || typeof IntersectionObserver === 'undefined' || typeof matchMedia !== 'function') return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) return
    const seen = new WeakSet<Element>()
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.remove('admin-scroll-pending')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0, rootMargin: '0px 0px -16px 0px' })
    const scan = () => root.querySelectorAll('.admin-panel, .admin-recent-actions, .admin-summary-band').forEach(element => {
      if (seen.has(element)) return
      seen.add(element)
      if (element.getBoundingClientRect().top < window.innerHeight) return
      element.classList.add('admin-scroll-pending')
      observer.observe(element)
    })
    const revealFocused = (event: FocusEvent) => {
      if (event.target instanceof Element) event.target.closest('.admin-scroll-pending')?.classList.remove('admin-scroll-pending')
    }
    const revealAll = () => root.querySelectorAll('.admin-scroll-pending').forEach(element => element.classList.remove('admin-scroll-pending'))
    scan()
    const mutations = new MutationObserver(scan)
    mutations.observe(root, { childList: true, subtree: true })
    root.addEventListener('focusin', revealFocused)
    motion.addEventListener('change', revealAll)
    return () => { observer.disconnect(); mutations.disconnect(); root.removeEventListener('focusin', revealFocused); motion.removeEventListener('change', revealAll); revealAll() }
  }, [tab])
  return ref
}
