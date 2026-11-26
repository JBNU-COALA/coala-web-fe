import './public-header.css'
import { useEffect, useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../../shared/ui/Icon'
import { PublicFooter } from './PublicFooter'
import './recruiting.css'
import { useScrollReveal } from './useScrollReveal'
import { RecruitingPositionIcon } from './RecruitingPositionIcon'
import { ScrollTopButton } from './ScrollTopButton'

import { positions } from './recruitingPositions'
import briefcaseIcon from '../../assets/briefcase.png'
import targetIcon from '../../assets/target.png'
import calendarIcon from '../../assets/calendar.png'
import questionIcon from '../../assets/question.png'

const values = [
  ['꾸준한', '하루에 조금씩이라도 계속 배우고 기록합니다. 작은 반복이 쌓여 실력이 된다고 믿어요.'],
  ['함께 성장하는', '혼자 아는 것보다 같이 아는 것을 좋아합니다. 막힌 부분을 묻고, 알게 된 것을 나눠요.'],
  ['끝까지 만드는', '아이디어에서 멈추지 않고 직접 만들어 봅니다. 완성한 결과물로 경험을 증명해요.'],
] as const
const journey = [
  ['서류 접수', '관심 포지션을 고르고, 나의 경험과 지원 동기를 지원서에 담아 주세요.'],
  ['결과 발표', '서류 전형 결과를 확인해 주세요. 합격한 분께는 온라인 면접을 안내해 드려요.'],
  ['온라인 면접', '온라인으로 만나 관심 분야와 경험, 함께 만들어 가고 싶은 이야기를 나눠요.'],
  ['최종 발표', '최종 합격 여부를 안내해 드려요. 코알라의 동료로 함께할 시작을 준비해 주세요.'],
] as const
const questions = [
  ['동아리 회비가 있나요?', '네, 동아리 회비는 10,000원입니다.'],
  ['면접은 얼마나 걸리나요?', '면접은 약 10~20분 정도 진행됩니다.'],
  ['어떤 개발 분야가 있나요?', '프론트엔드, 백엔드, iOS, Android, AI / ML, DevOps 분야를 소개하고 있어요. 실제 모집 분야는 모집 시기의 공식 안내를 확인해 주세요.'],
  ['지원은 어떻게 하나요?', '페이지 하단의 코알라 공식 채널에서 모집 안내를 확인해 주세요. 지원 방법과 일정은 해당 안내를 통해 확인할 수 있어요.'],
  ['어떤 내용을 준비하면 좋을까요?', '관심 있는 개발 분야와 배우고 싶은 것, 함께 만들어 보고 싶은 것을 생각해 보세요. 진행한 프로젝트나 학습 기록이 있다면 경험을 정리해 두는 것도 좋아요.'],
  ['모집 기간과 활동 일정은 어디서 확인하나요?', '코알라 공식 채널의 모집 안내를 참고해 주세요. 궁금한 점은 공식 채널로 문의해 주세요.'],
] as const

function Chevron() {
  return <svg className="rc-chevron" viewBox="0 0 14 8" aria-hidden="true"><path d="M1 1l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function ValueIllustration({ index }: { index: number }) {
  return <span className="rc-value-art" aria-hidden="true"><svg viewBox="0 0 40 40">
    {index === 0 && <>
      <rect x="7" y="31" width="26" height="4" rx="2" className="rc-art-deep" />
      <path d="M20 31V18" fill="none" strokeWidth="2.4" strokeLinecap="round" className="rc-art-stroke" />
      <path d="M20 23c-1-6-6-9.5-12-8.5 0 6.2 5 9.7 12 8.5Z" className="rc-art-soft" />
      <path d="M20 19c.4-7.2 5.6-10.8 12.2-10.2.2 7.2-5 11-12.2 10.2Z" className="rc-art-deep" />
    </>}
    {index === 1 && <>
      <circle cx="26" cy="13" r="5" className="rc-art-soft" />
      <path d="M16 33c0-6 4.4-10.5 10-10.5S36 27 36 33Z" className="rc-art-soft" />
      <circle cx="15" cy="15.5" r="5.5" className="rc-art-deep" />
      <path d="M4 35c0-6.6 4.9-11.5 11-11.5S26 28.4 26 35Z" className="rc-art-deep" />
    </>}
    {index === 2 && <>
      <path d="M3 35 15.5 15 28 35Z" className="rc-art-soft" />
      <path d="M13 35 25 18l12 17Z" className="rc-art-deep" />
      <path d="M25 18V5" fill="none" strokeWidth="2" strokeLinecap="round" className="rc-art-stroke" />
      <path d="M25 5h9l-2.6 3.2L34 11.4h-9Z" className="rc-art-flag" />
    </>}
  </svg></span>
}

function JourneyIllustration({ index }: { index: number }) {
  return <span className="rc-value-art" aria-hidden="true"><svg viewBox="0 0 40 40">
    {index === 0 && <>
      <path d="M9 7a3 3 0 0 1 3-3h12l8 8v21a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3Z" className="rc-art-soft" />
      <path d="M24 4v6a2 2 0 0 0 2 2h6Z" className="rc-art-deep" />
      <rect x="14" y="18" width="13" height="3" rx="1.5" className="rc-art-deep" />
      <rect x="14" y="25" width="9" height="3" rx="1.5" className="rc-art-deep" />
    </>}
    {index === 1 && <>
      <path d="M20 5c-6 0-10 4.6-10 10.5v7L6.5 28.3A1.8 1.8 0 0 0 8 31h24a1.8 1.8 0 0 0 1.5-2.7L30 22.5v-7C30 9.6 26 5 20 5Z" className="rc-art-deep" />
      <path d="M15.5 33a4.5 4.5 0 0 0 9 0Z" className="rc-art-soft" />
      <circle cx="30" cy="9" r="4.5" className="rc-art-flag" />
    </>}
    {index === 2 && <>
      <path d="M17 10h16a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-1v5l-6-5h-9a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3Z" className="rc-art-soft" />
      <path d="M7 5h16a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-9l-6 5v-5H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z" className="rc-art-deep" />
      <circle cx="10" cy="13" r="1.8" fill="#fff" /><circle cx="15" cy="13" r="1.8" fill="#fff" /><circle cx="20" cy="13" r="1.8" fill="#fff" />
    </>}
    {index === 3 && <>
      <path d="M12 5h16v9a8 8 0 0 1-16 0Z" className="rc-art-deep" />
      <path d="M12 8H7v3a6 6 0 0 0 5.5 6M28 8h5v3a6 6 0 0 1-5.5 6" fill="none" strokeWidth="2.4" strokeLinecap="round" className="rc-art-stroke" />
      <rect x="17.5" y="21" width="5" height="7" className="rc-art-soft" />
      <rect x="11" y="28" width="18" height="6" rx="2" className="rc-art-soft" />
      <path d="m20 8.5 1.3 2.7 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4Z" fill="#fff" />
    </>}
  </svg></span>
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return <div className="rc-faq-item" data-open={open}>
    <h3><button type="button" className="rc-faq-trigger" id={`${id}-trigger`} aria-expanded={open} aria-controls={`${id}-answer`} onClick={() => setOpen((value) => !value)}>
      <span><Icon name="help-circle" size={15} />{question}</span><Chevron />
    </button></h3>
    <div className="rc-faq-answer" id={`${id}-answer`} role="region" aria-labelledby={`${id}-trigger`} aria-hidden={!open} inert={!open}>
      <div className="rc-faq-answer-inner"><p>{answer}</p></div>
    </div>
  </div>
}

function PositionDetail({ position }: { position: (typeof positions)[number] | undefined }) {
  if (!position) return <main className="rc-section"><h1>포지션을 찾을 수 없어요</h1><Link to="/recruiting">모집 페이지로 돌아가기</Link></main>

  return <main className="rc-detail">
    <header className="rc-detail-heading">
      <Link to="/recruiting" className="rc-back"><Icon name="chevron-left" size={16} />모든 포지션</Link>
      <p>{position.description}</p>
      <div><h1>{position.title}</h1><RecruitingPositionIcon name={position.icon} /></div>
    </header>
    <div className="rc-detail-layout">
      <div className="rc-detail-content">
        <section className="rc-detail-panel">
          <h2>합류할 팀에 대해 소개할게요</h2>
          <h3>우리가 바라보는 방향</h3><p>{position.vision}</p>
          <h3>함께 할 일</h3><ul>{position.work.map((line) => <li key={line}>{line}</li>)}</ul>
          <h3>함께 성장하는 방법</h3><p>작은 기능부터 직접 만들고, 코드와 경험을 공유해요. 다른 포지션의 동료들과 협업하며 하나의 서비스를 완성하는 과정을 경험해요.</p>
        </section>
        <section className="rc-detail-panel"><h2>이런 팀원을 찾고 있어요</h2><ul>{position.lookingFor.map((line) => <li key={line}>{line}</li>)}</ul></section>
        <section className="rc-detail-panel"><p className="rc-detail-caption">모두 갖추지 않아도 괜찮아요</p><h2>이런 경험이 있다면 더 좋아요</h2><ul>{position.plus.map((line) => <li key={line}>{line}</li>)}</ul></section>
        <section className="rc-detail-panel"><h2>코알라 {position.title}팀은 이런 기술을 사용해요</h2><ul>{position.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul></section>
        <section className="rc-detail-panel"><h2>합류 여정</h2>
          <ol className="rc-detail-timeline">{journey.map(([title, body], index) => <li key={title}><span className="rc-timeline-marker">{index + 1}</span><div><h3>{title}</h3><p>{body}</p>{index === 2 && <small>면접 소요 시간 · 약 10~20분</small>}</div></li>)}</ol>
        </section>
        <section className="rc-detail-message"><h2>지원을 고민하는 분께</h2><p>처음부터 모든 것을 잘할 필요는 없어요. 궁금한 것을 묻고, 배운 것을 나누며, 함께 완성해 가고 싶은 마음을 들려주세요.</p></section>
        <section id="position-faq" className="rc-detail-panel rc-faq"><h2>{position.title} FAQ</h2>
          <FaqItem question={`${position.title} 팀에서는 어떤 활동을 하나요?`} answer={`${position.vision} ${position.work.join(' ')}`} />
          <FaqItem question="개발 경험이 적어도 괜찮을까요?" answer={`네! ${position.title} 분야에 관심이 있고, 직접 배우고 만들어 보려는 마음이 있다면 좋아요. 작은 기능부터 구현하고 팀원들과 코드와 학습 내용을 나누며 함께 성장해요. 완성된 결과물뿐 아니라 지금까지의 학습 과정과 앞으로 해 보고 싶은 것을 들려주세요.`} />
          <FaqItem question={position.question} answer={position.answer} />
        </section>
      </div>
      <aside className="rc-detail-sidebar" aria-label="포지션 및 지원 안내">
        <nav className="rc-detail-panel" aria-label="다른 포지션"><h2>TEAM</h2>{positions.map((entry) => <Link key={entry.slug} to={`/recruiting/${entry.slug}`} aria-current={entry.slug === position.slug ? 'page' : undefined}><Icon name="chevron-left" size={13} />{entry.title}</Link>)}</nav>
        <a className="rc-detail-cta" href="https://www.instagram.com/coala_jbnu/" target="_blank" rel="noopener noreferrer">접수 기간이 아닙니다</a>
        <div className="rc-detail-shortcuts"><Link to="/recruiting#recruiting-faq"><span>FAQ 모아보기</span><img src="/recruiting/koala-faq.png" alt="" width={90} height={90} loading="lazy" /></Link><a href="https://open.kakao.com/o/sJTIwj1f" target="_blank" rel="noopener noreferrer"><span>문의하기</span><img src="/recruiting/koala-contact.png" alt="" width={90} height={90} loading="lazy" /></a></div>
      </aside>
    </div>
  </main>
}

export function RecruitingPage() {
  const { pathname, hash } = useLocation()
  const slug = pathname.replace(/\/$/, '').split('/')[2]
  const position = positions.find((entry) => entry.slug === slug)
  // Scroll first so the reveal hook measures elements at their final position.
  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  const revealRoot = useScrollReveal(pathname)

  return <div ref={revealRoot} className="recruiting-site">
    <header className="recruiting-header"><Link to="/" className="recruiting-brand" aria-label="코알라 홈"><img className="public-header-symbol" src="/coala-logo.svg" alt="" /><img src="/coala-wordmark.svg" alt="Coala" /></Link><nav aria-label="주요 메뉴"><Link to="/">HOME</Link><Link to="/portal">MAIN</Link><Link to="/about/management">MANAGEMENT</Link><Link to="/recruiting" aria-current="page">RECRUITING</Link></nav></header>
      <section className="rc-hero" aria-labelledby="rc-hero-title">
        {slug ? <h2 id="rc-hero-title">27-1 코알라 정기 리크루팅</h2> : <h1 id="rc-hero-title">27-1 코알라 정기 리크루팅</h1>}
        <p className="rc-hero-copy">처음이어도 괜찮아요. 함께 성장하고 싶은 마음이면 충분합니다!</p>
      </section>
    {slug ? <PositionDetail key={slug} position={position} /> : <main>
      <section id="recruiting-openings" className="rc-section" aria-labelledby="rc-openings-title">
        <div className="recruiting-heading rc-heading"><div><p className="rc-eyebrow">함께 만들고 성장할 개발자를 기다려요</p><h2 id="rc-openings-title">함께할 개발 포지션을 소개해요</h2></div><img className="rc-section-icon" src={briefcaseIcon} alt="" /></div>
        <div className="rc-grid">
          {positions.map((position) => <Link key={position.title} to={`/recruiting/${position.slug}`} className="rc-position">
            <div><h3>{position.title}</h3><p>{position.description}</p></div>
            <RecruitingPositionIcon name={position.icon} />
          </Link>)}
        </div>
      </section>

      <section className="rc-band" aria-labelledby="rc-values-title">
        <div className="rc-section">
          <div className="rc-heading"><div><p className="rc-eyebrow">함께 배우며 더 멀리 나아가는 우리</p><h2 id="rc-values-title">이런 사람과 함께하고 싶어요</h2></div><img className="rc-section-icon" src={targetIcon} alt="" /></div>
          <div className="rc-values">{values.map(([title, body], index) => <article key={title} className="rc-value" data-tone={index}><h3><ValueIllustration index={index} />{title}</h3><p>{body}</p></article>)}</div>
        </div>
      </section>

      <section className="rc-section" aria-labelledby="rc-journey-title">
        <div className="rc-heading"><div><p className="rc-eyebrow">코알라에 지원하면 다음 과정을 거쳐 함께하게 돼요</p><h2 id="rc-journey-title">합류 여정</h2></div><img className="rc-section-icon" src={calendarIcon} alt="" /></div>
        <ol className="rc-journey">{journey.map(([title, body], index) => <li key={title} className="rc-step" data-tone={index}><div className="rc-step-label"><JourneyIllustration index={index} />{title}</div><div className="rc-step-body"><h3><span>{index + 1}</span>{title}</h3><p>{body}</p></div></li>)}</ol>
        <p className="rc-note">세부 일정은 코알라 공식 채널의 모집 안내를 확인해 주세요.</p>
      </section>

      <section id="recruiting-faq" className="rc-band" aria-labelledby="rc-faq-title">
        <div className="rc-section rc-faq recruiting-questions">
          <div className="rc-heading"><div><p className="rc-eyebrow">코알라에 대해 궁금한 점이 있나요?</p><h2 id="rc-faq-title">자주 묻는 질문</h2></div><img className="rc-section-icon" src={questionIcon} alt="" /></div>
          {questions.map(([question, answer]) => <FaqItem key={question} question={question} answer={answer} />)}
        </div>
      </section>
    </main>}<PublicFooter /><ScrollTopButton />
  </div>
}
