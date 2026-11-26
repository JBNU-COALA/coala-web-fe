import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Keep content mounted until the closing animation finishes. */
export function AdminDetail({ children, onClose, busy = false }: { children: ReactNode; onClose: () => void; busy?: boolean }) {
  const [closing, setClosing] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  function close() {
    if (busy || closing) return
    setClosing(true)
    timer.current = setTimeout(onClose, window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 260)
  }
  return <div className={`admin-detail-motion${closing ? ' is-closing' : ''}`}><div inert={closing}>
    <button type="button" className="admin-ghost-button admin-detail-close" disabled={busy} onClick={close}>닫기</button>
    {children}
  </div></div>
}
