import { useState } from 'react'

export function TagInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState('')
  const tags = value.split(',').map((tag) => tag.trim()).filter(Boolean)
  function commit(text: string) {
    const next = text.split(',').map((tag) => tag.trim().replace(/^#+/, '')).filter(Boolean)
    onChange([...new Set([...tags, ...next])].join(', '))
    setDraft('')
  }
  return <div className="writer-tag-input">
    {tags.map((tag) => <span className="writer-tag-chip" key={tag}>#{tag}<button type="button" aria-label={`${tag} 태그 삭제`} onClick={() => onChange(tags.filter((item) => item !== tag).join(', '))}>×</button></span>)}
    <input className="writer-tag-text-input" aria-label="태그 입력" value={draft} placeholder={tags.length ? '태그 추가' : '입력 후 쉼표 또는 Enter'}
      onChange={(event) => { const text = event.target.value; if (text.includes(',') && !(event.nativeEvent as InputEvent).isComposing) commit(text); else setDraft(text) }}
      onBlur={() => { if (draft.trim()) commit(draft) }}
      onKeyDown={(event) => { if (event.nativeEvent.isComposing || event.keyCode === 229) return; if (event.key === 'Enter') { event.preventDefault(); commit(draft) } }} />
  </div>
}
