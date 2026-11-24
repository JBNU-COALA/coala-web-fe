import { useEffect, useRef } from 'react'
import './scroll-reveal.css'

export function useScrollReveal() {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = root.current
    if (!container || typeof IntersectionObserver === 'undefined' || typeof window.matchMedia !== 'function') return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return
    const selector = '.jungle-intro-grid, .jungle-section-heading, .jungle-activity, .showcase-heading, .showcase-card, .culture-heading, .culture-course, .achievement-heading, .achievement-year, .alumni-heading, .alumni-window, .jungle-join > h2, .jungle-join > p, .jungle-join > a, .jungle-members > div, .recruiting-heading, .recruiting-filters, .recruiting-steps article, .recruiting-questions > h2, .recruiting-questions > details'
    const elements = Array.from(container.querySelectorAll<HTMLElement>(selector))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0, rootMargin: '0px 0px -35px 0px' })
    elements.forEach((element) => {
      const bounds = element.getBoundingClientRect()
      // Keep initially visible content and horizontal carousel items accessible.
      if (bounds.top < window.innerHeight && bounds.bottom > 0) return
      element.classList.add('scroll-reveal')
      const siblings = element.parentElement ? Array.from(element.parentElement.children) : []
      element.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(element) % 3, 2) * 70}ms`)
      observer.observe(element)
    })
    const revealFocused = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return
      const element = event.target.closest('.scroll-reveal')
      element?.classList.add('is-revealed')
    }
    const revealAll = () => {
      if (!reducedMotion.matches) return
      observer.disconnect()
      elements.forEach((element) => element.classList.add('is-revealed'))
    }
    container.addEventListener('focusin', revealFocused)
    reducedMotion.addEventListener('change', revealAll)
    return () => {
      observer.disconnect()
      container.removeEventListener('focusin', revealFocused)
      reducedMotion.removeEventListener('change', revealAll)
      elements.forEach((element) => { element.classList.remove('scroll-reveal', 'is-revealed'); element.style.removeProperty('--reveal-delay') })
    }
  }, [])
  return root
}
