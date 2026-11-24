import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { recruitsApi, type RecruitItem, type RecruitCategory } from '../../shared/api/recruits'
import { routes } from '../../shared/routes'
import { PublicFooter } from './PublicFooter'
import './recruiting.css'
import { useScrollReveal } from './useScrollReveal'

const categories: { id: RecruitCategory | 'all'; label: string }[] = [
  { id: 'all', label: '전체' }, { id: 'study', label: '스터디' },
  { id: 'project', label: '프로젝트' }, { id: 'tutoring', label: '멘토링' },
]
const questions = [
  ['어떤 활동에 지원할 수 있나요?', '스터디, 프로젝트, 멘토링 모집 공고를 확인할 수 있습니다. 모집 분야와 지원 자격은 각 공고에서 확인해 주세요.'],
  ['지원은 어떻게 하나요?', '모집 중인 공고를 선택한 후 상세 페이지에서 지원할 수 있습니다. 지원서 제출에는 로그인이 필요합니다.'],
  ['모집 기간과 활동 일정은 어디서 확인하나요?', '각 공고의 상세 내용에서 확인할 수 있습니다. 공고에 일정이 없다면 해당 공고의 댓글로 문의해 주세요.'],
  ['지원 결과는 어디서 확인하나요?', '로그인 후 모집 게시판의 지원 내역에서 확인할 수 있습니다.'],
]

export function RecruitingPage() {
  const revealRoot = useScrollReveal()
  const [items, setItems] = useState<RecruitItem[]>([])
  const [category, setCategory] = useState<RecruitCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    recruitsApi.getRecruits({ status: 'open', sort: 'latest' }).then((data) => {
      if (active) { setItems(data.filter((item) => item.status !== 'closed')); setError(false) }
    }).catch(() => { if (active) setError(true) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt])
  const visibleItems = items.filter((item) => category === 'all' || item.category === category)
  return <div ref={revealRoot} className="recruiting-site">
    <header className="recruiting-header"><Link to="/" className="recruiting-brand" aria-label="코알라 홈"><img className="public-header-symbol" src="/coala-logo.svg" alt="" /><img src="/coala-wordmark.svg" alt="Coala" /></Link><nav aria-label="주요 메뉴"><Link to="/">MAIN</Link><Link to="/recruiting" aria-current="page">RECRUITING</Link></nav></header>
    <main>
      <section className="recruiting-hero"><div><p>전북대학교 개발 동아리</p><h1>코알라<br />모집 안내</h1><a href="#recruiting-openings" className="recruiting-primary">모집 공고 확인하기</a></div><img src="/coala-logo.svg" alt="" className="recruiting-hero-logo" /><div className="recruiting-orbit" aria-hidden="true" /></section>
      <section id="recruiting-openings" className="recruiting-section"><div className="recruiting-heading"><h2>모집 중인 활동</h2><Link to={routes.community.recruit}>전체 공고 보기</Link></div><div className="recruiting-filters" role="group" aria-label="모집 분야">{categories.map((item) => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div>
        <div className="recruiting-list" aria-live="polite" aria-busy={loading}>
          {loading ? <p className="recruiting-state">모집 공고를 불러오는 중입니다.</p> : error ? <div className="recruiting-state"><p>모집 공고를 불러오지 못했습니다.</p><button type="button" onClick={() => { setLoading(true); setAttempt((value) => value + 1) }}>다시 불러오기</button></div> : visibleItems.length === 0 ? <p className="recruiting-state">현재 모집 중인 공고가 없습니다.</p> : visibleItems.map((item) => <Link key={item.id} to={routes.community.recruitNotice(item.id)} className="recruiting-opening"><div><span>{categories.find((entry) => entry.id === item.category)?.label}</span><h3>{item.title}</h3><p>{item.shortDesc}</p></div><strong>{item.status === 'closing-soon' ? '마감 임박' : '모집 중'}</strong></Link>)}
        </div>
      </section>
      <section className="recruiting-process"><div className="recruiting-section"><h2>지원 방법</h2><div className="recruiting-steps"><article><span>01</span><h3>공고 확인</h3><p>모집 분야와 지원 자격,<br />활동 내용을 확인합니다.</p></article><article><span>02</span><h3>지원서 작성</h3><p>로그인 후 희망하는 공고에<br />지원서를 작성합니다.</p></article><article><span>03</span><h3>지원 내역 확인</h3><p>제출한 지원서와 처리 상태를<br />지원 내역에서 확인합니다.</p></article></div><p className="recruiting-note">세부 선발 절차와 일정은 공고별로 다를 수 있습니다.</p></div></section>
      <section className="recruiting-section recruiting-questions"><h2>자주 묻는 질문</h2>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</section>
    </main><PublicFooter />
  </div>
}
