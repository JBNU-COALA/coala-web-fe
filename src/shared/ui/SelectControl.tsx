import { Icon } from './Icon'
import { useEffect, useId, useRef, useState } from 'react'
import './selectControl.css'

export type SelectControlOption<T extends string> = {
  value: T
  label: string
}

type SelectControlProps<T extends string> = {
  value: T
  options: SelectControlOption<T>[]
  onChange: (value: T) => void
  label: string
  disabled?: boolean
  className?: string
  iconOnly?: boolean
}

export function SelectControl<T extends string>({
  value,
  options,
  onChange,
  label,
  className = '',
  disabled = false,
  iconOnly = false,
}: SelectControlProps<T>) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const selectedIndex = options.findIndex((option) => option.value === value)
  const close = () => { setOpen(false); triggerRef.current?.focus() }
  const choose = (index: number) => {
    if (options[index]) onChange(options[index].value)
    close()
  }
  const show = () => { setActiveIndex(Math.max(0, selectedIndex)); setOpen(true) }

  useEffect(() => {
    if (!open) return
    listRef.current?.focus()
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  useEffect(() => {
    if (open) listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  return (
    <div ref={rootRef} className={`select-control custom-select ${iconOnly ? 'select-control--icon-only' : ''} ${className}`.trim()}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <button ref={triggerRef} disabled={disabled} type="button" className="select-control-trigger"
        aria-label={`${label}: ${options[selectedIndex]?.label ?? ''}`}
        title={iconOnly ? `${label}: ${options[selectedIndex]?.label ?? ''}` : undefined}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
        onClick={() => open ? setOpen(false) : show()}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show() }
        }}
      >
        {iconOnly ? <Icon name="filter" size={16} /> : <><span>{options[selectedIndex]?.label ?? label}</span><Icon name="chevron-down" size={14} /></>}
      </button>
      <div ref={listRef} id={id} role="listbox" aria-label={label} tabIndex={-1}
        aria-hidden={!open} inert={!open}
        aria-activedescendant={options[activeIndex] ? `${id}-${activeIndex}` : undefined}
        className={`select-control-menu${open ? ' is-open' : ''}`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() }
          else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(activeIndex) }
          else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault()
            setActiveIndex((index) => event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
              : Math.max(0, Math.min(options.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))))
          }
        }}>
        {options.map((option, index) => <div key={option.value} id={`${id}-${index}`}
          role="option" aria-selected={option.value === value}
          className={`select-control-option${index === activeIndex ? ' is-highlighted' : ''}`}
          onPointerMove={() => setActiveIndex(index)} onClick={() => choose(index)}>
          <span>{option.label}</span>
        </div>)}
      </div>
    </div>
  )
}
