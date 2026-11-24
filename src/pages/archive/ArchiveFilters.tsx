import { useEffect, useRef } from 'react'
import { Icon } from '../../shared/ui/Icon'

type Props = {
  options: { id: string; label: string }[]
  value: string
  onChange: (value: string) => void
  hasCalendar: boolean
  showCalendar: boolean
  onCalendarChange: (value: boolean) => void
}

export function ArchiveFilters({ options, value, onChange, hasCalendar, showCalendar, onCalendarChange }: Props) {
  const root = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) root.current.open = false
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])
  const active = value !== 'all' || (hasCalendar && showCalendar)
  return <details className="archive-filters" ref={root}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false }}
    onKeyDown={(event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.currentTarget.open = false
        event.currentTarget.querySelector('summary')?.focus()
      }
    }}>
    <summary aria-label={active ? '필터 설정 (적용 중)' : '필터 설정'} title="필터 설정">
      <Icon name="filter" size={18} />{active && <span className="archive-filter-dot" />}
    </summary>
    <div className="archive-filter-popover" role="group" aria-label="자료 필터">
      <div className="archive-filter-heading"><strong>필터</strong><button type="button" onClick={() => { onChange('all'); onCalendarChange(false) }}>초기화</button></div>
      <p>자료 분류</p>
      <div className="archive-filter-options">
        {options.map((option) => <button key={option.id} type="button" aria-pressed={value === option.id} onClick={() => onChange(option.id)}>{option.label}</button>)}
      </div>
      {hasCalendar && <label className="archive-filter-calendar"><span>캘린더 표시</span><input type="checkbox" checked={showCalendar} onChange={(event) => onCalendarChange(event.target.checked)} /></label>}
    </div>
  </details>
}
