import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../shared/ui/Icon'
import { managementGenerations, type ManagementGeneration } from './managementData'
import './management.css'

function externalProfile(url?: string) {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' ? parsed.href : undefined
  } catch { return undefined }
}

export function ManagementPage({ generations = managementGenerations }: { generations?: ManagementGeneration[] }) {
  const [selectedId, setSelectedId] = useState(generations[0]?.id ?? '')
  const selected = generations.find((generation) => generation.id === selectedId) ?? generations[0]
  const selectedIndex = selected ? generations.indexOf(selected) : -1
  const generationListRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const list = generationListRef.current
    const current = list?.querySelector<HTMLButtonElement>('[aria-current="page"]')
    if (!list || !current) return
    const listBounds = list.getBoundingClientRect()
    const buttonBounds = current.getBoundingClientRect()
    list.scrollLeft += buttonBounds.left - listBounds.left - (list.clientWidth - current.offsetWidth) / 2
  }, [selected?.id])
  return <section className="coala-content management-page" aria-labelledby="management-title">
    <header className="management-heading">
      <h1 id="management-title">임원진</h1>
      <span>함께 배우고 성장하는 코알라를 만들어가는 사람들입니다.</span>
    </header>
    {selected && <nav className="management-generations" aria-label="임원진 기수 선택">
      <button className="management-arrow" type="button" aria-label="더 최근 기수" disabled={selectedIndex <= 0} onClick={() => setSelectedId(generations[selectedIndex - 1].id)}><Icon name="chevron-left" size={16} /></button>
      <div ref={generationListRef} className="management-generation-list">
        {generations.map((generation) => <button key={generation.id} type="button" aria-current={generation.id === selected.id ? 'page' : undefined} onClick={() => setSelectedId(generation.id)}>{generation.label}</button>)}
      </div>
      <button className="management-arrow" type="button" aria-label="이전 기수" disabled={selectedIndex >= generations.length - 1} onClick={() => setSelectedId(generations[selectedIndex + 1].id)}><Icon name="chevron-right" size={16} /></button>
    </nav>}
    {selected?.term && <p className="management-term">{selected.term}</p>}
    {selected?.members.length ? <div className="management-grid" key={selected.id}>
      {selected.members.map((member) => <article className="management-card" key={member.id}>
        <svg className="management-vine" viewBox="0 0 120 240" aria-hidden="true" focusable="false">
          <path d="M112-10C32 40 116 92 57 145S46 210 12 250" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <g fill="currentColor">
            <path d="M78 36Q38 34 42 3Q74 8 78 36ZM77 58Q111 45 110 23Q83 25 77 58ZM80 91Q42 84 43 59Q72 62 80 91ZM67 128Q105 123 106 96Q78 98 67 128ZM48 156Q13 144 20 118Q46 126 48 156ZM39 192Q77 188 80 162Q50 163 39 192ZM28 219Q-3 205 3 182Q28 189 28 219Z" />
          </g>
        </svg>
        <img className="management-avatar" src={member.photoUrl || '/koala-avatar-plush-male.png'} alt="" loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/koala-avatar-plush-male.png' }} />
        {member.role && <span className="management-role">{member.role}</span>}
        <h2>{member.name}</h2>
        {member.introduction && <p>{member.introduction}</p>}
        <div className="management-links">
          {externalProfile(member.githubUrl) && <a href={externalProfile(member.githubUrl)} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} GitHub (새 탭)`}><Icon name="github" size={17} /></a>}
          {externalProfile(member.linkedinUrl) && <a href={externalProfile(member.linkedinUrl)} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} LinkedIn (새 탭)`}><Icon name="linkedin" size={17} /></a>}
        </div>
      </article>)}
    </div> : <div className="management-empty">
      <img src="/coala-mascot-plush.png" alt="" />
      <h2>임원진 정보를 준비 중입니다.</h2>
      <p>기수별 임원진 소개는 업데이트 후 확인할 수 있어요.</p>
    </div>}
  </section>
}
