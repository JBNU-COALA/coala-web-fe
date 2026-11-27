import { useId, useState } from 'react'
import { availableTechNames, TechLogo } from './TechLogo'
import './techStackPicker.css'

export function TechStackPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = value.split(',').map((name) => name.trim()).filter(Boolean)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState<string[]>([])
  const id = useId()
  const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^spring$/, 'springboot').replace(/^vue$/, 'vuejs')
  const matches = query.trim() ? availableTechNames.filter((name) => key(name).includes(key(query)) && !selected.some((item) => key(item) === key(name))) : []
  function add(name: string) {
    const clean = name.trim().replace(/,/g, '')
    if (clean && !selected.some((item) => key(item) === key(clean))) onChange([...selected, clean].join(', '))
    setQuery(''); setOpen(false)
  }
  return <div className="jcloud-field recruit-write-wide tech-stack-search" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <label className="jcloud-label" htmlFor={id}>기술 스택 (선택)</label>
    <input id={id} className="jcloud-input" autoComplete="off" value={query} onFocus={() => setOpen(true)}
      onChange={(event) => { setQuery(event.target.value); setOpen(true) }} placeholder="기술 이름 검색 (예: React)"
      onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); if (event.key === 'Enter' && query.trim()) { event.preventDefault(); add(matches[0] ?? query) } }} />
    {open && query.trim() && <div className="tech-stack-results" aria-label="기술 검색 결과">
      {matches.map((name) => <button type="button" key={name} onClick={() => add(name)}><TechLogo name={name} />{name}</button>)}
      {!matches.length && <button type="button" onClick={() => add(query)}>‘{query.trim()}’ 추가</button>}
    </div>}
    {selected.length > 0 && <div className="tech-stack-picker" aria-label="선택한 기술 스택">
      {selected.map((name) => <button type="button" key={name} className={removing.includes(name) ? 'is-removing' : ''} disabled={removing.includes(name)} aria-label={`${name} 제거`} onClick={() => setRemoving((items) => [...items, name])}
        onAnimationEnd={() => { if (removing.includes(name)) { onChange(selected.filter((item) => item !== name).join(', ')); setRemoving((items) => items.filter((item) => item !== name)) } }}><TechLogo name={name} /><span>{name}</span><span aria-hidden="true">×</span></button>)}
    </div>}
  </div>
}
