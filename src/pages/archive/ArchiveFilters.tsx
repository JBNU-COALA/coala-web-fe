import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../shared/ui/Icon'

type Props = {
  options: { id: string; label: string }[]
  value: string
  onChange: (value: string) => void
  hasCalendar: boolean
  showCalendar: boolean
  onCalendarChange: (value: boolean) => void
  inline?: boolean
  labFilter?: { options: string[]; value: string; onChange: (value: string) => void }
}

export function ArchiveFilters({ options, value, onChange, hasCalendar, showCalendar, onCalendarChange, inline = false, labFilter }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; x: number; scroll: number; moved: boolean; lastX: number; time: number; velocity: number } | null>(null)
  const animation = useRef(0)
  const suppressClick = useRef(false)
  const [open, setOpen] = useState(false)
  useEffect(() => () => cancelAnimationFrame(animation.current), [open])
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])
  const active = value !== 'all' || (hasCalendar && showCalendar) || (!!labFilter && labFilter.value !== 'all')
  return <div className={`archive-filters${inline ? ' archive-filters--inline' : ''}`} ref={root}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}
    onKeyDown={(event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        event.currentTarget.querySelector('button')?.focus()
      }
    }}>
    {!inline && <button type="button" className="archive-filter-trigger" aria-expanded={open} onClick={() => setOpen(!open)} aria-label={active ? '필터 설정 (적용 중)' : '필터 설정'} title="필터 설정">
      <Icon name="filter" size={18} />{active && <span className="archive-filter-dot" />}
    </button>}
    <div className={`archive-filter-popover${open || inline ? ' is-open' : ''}`} inert={!open && !inline} aria-hidden={!open && !inline} role="group" aria-label="자료 필터">
      <div className="archive-filter-heading"><strong>필터</strong><button type="button" onClick={() => { onChange('all'); onCalendarChange(false); labFilter?.onChange('all') }}>초기화</button></div>
      <div className="archive-filter-options"
        onPointerDown={(event) => {
          cancelAnimationFrame(animation.current)
          suppressClick.current = false
          if (event.pointerType !== 'mouse' || event.button !== 0) return
          drag.current = { id: event.pointerId, x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false, lastX: event.clientX, time: performance.now(), velocity: 0 }
        }}
        onPointerMove={(event) => {
          const state = drag.current
          if (!state || state.id !== event.pointerId) return
          const distance = event.clientX - state.x
          if (!state.moved && Math.abs(distance) < 5) return
          state.moved = true
          const now = performance.now()
          state.velocity = (state.lastX - event.clientX) / Math.max(1, now - state.time)
          state.lastX = event.clientX
          state.time = now
          suppressClick.current = true
          event.currentTarget.setPointerCapture(event.pointerId)
          event.currentTarget.dataset.dragging = 'true'
          event.currentTarget.scrollLeft = state.scroll - distance
          event.preventDefault()
        }}
        onPointerUp={(event) => {
          const state = drag.current
          const element = event.currentTarget
          if (state?.moved && performance.now() - state.time < 80 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            let velocity = Math.max(-2, Math.min(2, state.velocity))
            let previous = performance.now()
            const glide = (now: number) => {
              const elapsed = Math.min(32, now - previous)
              previous = now
              const before = element.scrollLeft
              element.scrollLeft += velocity * elapsed
              velocity *= Math.exp(-elapsed / 140)
              if (Math.abs(velocity) > .02 && element.scrollLeft !== before) animation.current = requestAnimationFrame(glide)
            }
            animation.current = requestAnimationFrame(glide)
          }
          drag.current = null
          delete event.currentTarget.dataset.dragging
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={(event) => { drag.current = null; delete event.currentTarget.dataset.dragging }}
        onLostPointerCapture={(event) => { drag.current = null; delete event.currentTarget.dataset.dragging }}
        onPointerLeave={() => { if (!drag.current?.moved) drag.current = null }}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            event.preventDefault()
            event.stopPropagation()
            suppressClick.current = false
          }
        }}>
        {options.map((option) => <button key={option.id} type="button" aria-pressed={value === option.id} onClick={() => onChange(option.id)}>{option.label}</button>)}
      </div>
      {labFilter && <label className="archive-filter-lab"><span>연구실</span>
        <select value={labFilter.value} onChange={event => labFilter.onChange(event.target.value)}>
          <option value="all">전체 연구실</option>
          {labFilter.options.map(lab => <option key={lab} value={lab}>{lab}</option>)}
        </select>
      </label>}
      {hasCalendar && <label className="archive-filter-calendar"><span>캘린더 표시</span><input type="checkbox" checked={showCalendar} onChange={(event) => onCalendarChange(event.target.checked)} /></label>}
    </div>
  </div>
}
