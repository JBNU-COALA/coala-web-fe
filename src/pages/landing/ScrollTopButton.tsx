import { useEffect, useState } from 'react'
import './scroll-top-button.css'

const SHOW_AFTER = 360

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const scrollToTop = () => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })
  }

  return <button type="button" className="scroll-top-button" data-visible={visible} aria-label="맨 위로 이동" aria-hidden={!visible} tabIndex={visible ? 0 : -1} onClick={scrollToTop}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </button>
}
