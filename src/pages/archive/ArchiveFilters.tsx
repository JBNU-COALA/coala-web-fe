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
}

export function ArchiveFilters({ options, value, onChange, hasCalendar, showCalendar, onCalendarChange, inline = false }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])
  const active = value !== 'all' || (hasCalendar && showCalendar)
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
      <div className="archive-filter-heading"><strong>필터</strong><button type="button" onClick={() => { onChange('all'); onCalendarChange(false) }}>초기화</button></div>
      <div className="archive-filter-options">
        {options.map((option) => <button key={option.id} type="button" aria-pressed={value === option.id} onClick={() => onChange(option.id)}>{option.label}</button>)}
      </div>
      {hasCalendar && <label className="archive-filter-calendar"><span>캘린더 표시</span><input type="checkbox" checked={showCalendar} onChange={(event) => onCalendarChange(event.target.checked)} /></label>}
    </div>
  </div>
}
