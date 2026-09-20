import { useEffect, useId, useState } from 'react'
import type { ActivityMemberOption, StudyMember } from '../../shared/activity'
import { searchActivityMembers } from '../../shared/activityRepository'
import { CharacterAvatar } from '../../shared/ui/CharacterAvatar'
import { Icon } from '../../shared/ui/Icon'

export function ParticipantPicker({ selected, onAdd }: {
  selected: StudyMember[]
  onAdd: (member: StudyMember) => void
}) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<{ query: string; members: ActivityMemberOption[]; error?: string } | null>(null)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      searchActivityMembers(query.trim(), controller.signal)
        .then((members) => { if (!controller.signal.aborted) setResult({ query, members }) })
        .catch(() => { if (!controller.signal.aborted) setResult({ query, members: [], error: '회원을 불러오지 못했습니다.' }) })
    }, 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [query, open, retry])
  const current = result?.query === query ? result : null
  return <div className="participant-picker" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }}>
    <label htmlFor={id}>참여자 추가</label>
    <div className="participant-search">
      <Icon name="search" size={17} />
      <input id={id} type="search" autoComplete="off" maxLength={80} value={query}
        placeholder="이름 또는 GitHub 아이디 검색" aria-controls={open ? id + '-results' : undefined}
        onFocus={() => setOpen(true)} onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
          if (event.key === 'Enter') event.preventDefault()
        }}
        onChange={(event) => { setQuery(event.target.value); setOpen(true) }} />
    </div>
    {open && <div id={id + '-results'} className="participant-results" aria-label="참여자 검색 결과">
      {!current ? <p role="status">검색 중...</p>
        : current.error ? <p role="alert">{current.error}<button type="button" className="study-text-button"
          onClick={() => { setResult(null); setRetry((value) => value + 1) }}>다시 시도</button></p>
        : !current.members.length ? <p role="status">검색 결과가 없습니다.</p>
        : <ul>{current.members.map((member) => {
          const added = selected.some((item) => item.userId === member.userId)
          return <li key={member.userId}><button type="button" disabled={added || selected.length >= 200}
            aria-label={`${member.name} (${member.githubId}) ${added ? '추가됨' : '추가'}`}
            onClick={() => onAdd({ userId: member.userId, name: member.name })}>
            <CharacterAvatar name={member.name} seed={member.userId} size="sm" />
            <span><strong>{member.name}</strong><small>@{member.githubId} · {member.department}</small></span>
            {added ? <small>추가됨</small> : <Icon name="plus" size={18} />}
          </button></li>
        })}</ul>}
    </div>}
    {selected.length >= 200 && <p role="status" className="study-unchecked">참여자는 최대 200명까지 추가할 수 있습니다.</p>}
  </div>
}
