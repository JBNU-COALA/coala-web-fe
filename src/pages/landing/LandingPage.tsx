import './public-header.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import './landing.css'
import './hero-art-colors.css'
import { PublicFooter } from './PublicFooter'
import { ProjectShowcase } from './ProjectShowcase'
import { AlumniShowcase } from './AlumniShowcase'
import { AchievementTimeline } from './AchievementTimeline'
import { CultureSection } from './CultureSection'
import { useScrollReveal } from './useScrollReveal'
import { KoalaPaw } from './KoalaIntro'

function JungleLeaves({ side }: { side: 'left' | 'right' }) {
  return <div className={`jungle-leaves jungle-leaves--${side}`} aria-hidden="true">
    {Array.from({ length: 7 }, (_, index) => <i key={index} style={{ '--leaf': index } as React.CSSProperties} />)}
  </div>
}

export function LandingPage() {
  const revealRoot = useScrollReveal()
  const [introFinished, setIntroFinished] = useState(false)
  return <div ref={revealRoot} className={`jungle-site jungle-reveal${introFinished ? ' jungle-reveal--finished' : ''}`}>
    <a className="jungle-skip" href="#jungle-activities">본문으로 건너뛰기</a>
    <header className="jungle-header">
      <Link className="jungle-logo" to="/" aria-label="코알라 홈"><img className="public-header-symbol" src="/coala-logo.svg" alt="" /><img className="jungle-brand-image" src="/coala-wordmark.svg" alt="Coala" /></Link>
      <nav aria-label="동아리 소개 메뉴">
        <Link to="/" aria-current="page">MAIN</Link><Link to="/about/management">MANAGEMENT</Link><Link to="/recruiting">RECRUITING</Link>
      </nav>
    </header>

    <main>
      <section className="jungle-hero" aria-labelledby="jungle-title">
        <div className="jungle-canopy" aria-hidden="true" />
        <div className="jungle-intro" aria-hidden="true" onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) setIntroFinished(true)
        }}>
          {(['left', 'right'] as const).map((side) => <div key={side} className={`jungle-curtain jungle-curtain--${side}`}>
            <svg viewBox="0 0 700 1000" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id={`leaf-${side}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#426c3b" /><stop offset=".45" stopColor="#1e442c" /><stop offset="1" stopColor="#091d13" /></linearGradient>
                <g id={`frond-${side}`}>
                  <path d="M0 0Q130-120 390-70Q270 100 0 0Z" fill={`url(#leaf-${side})`} stroke="#6c925333" />
                  <path d="M0 0Q170-25 374-67" fill="none" stroke="#a0b87955" strokeWidth="2" />
                  {[60, 110, 160, 210, 260, 310].map((x) => <path key={x} d={`M${x} ${-x * .13}q20-32 45-58M${x} ${-x * .13}q35 20 67 12`} fill="none" stroke="#86a86922" />)}
                </g>
              </defs>
              <path d="M-80 1100Q360 550 220-120" stroke="#152f1d" strokeWidth="22" fill="none" />
              <path d="M-76 1100Q366 550 225-120" stroke="#5c774a" strokeOpacity=".4" strokeWidth="4" fill="none" />
              {Array.from({ length: 9 }, (_, i) => <g key={i} transform={`translate(${185 + Math.sin(i * .5) * 75} ${i * 128 - 5})`}>
                <g transform={`rotate(${35 - i * 7}) scale(${1.25 - i * .025})`}>
                  <use href={`#frond-${side}`} />
                  {i === 5 && <KoalaPaw />}
                </g>
                <use href={`#frond-${side}`} transform={`rotate(${170 + i * 5}) scale(.95)`} />
              </g>)}
            </svg>
          </div>)}
        </div>
        <JungleLeaves side="left" /><JungleLeaves side="right" />
        <div className="jungle-fireflies" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 8) % 100}%`, top: `${(i * 23 + 17) % 90}%`, animationDelay: `${i * .37}s` }} />)}</div>
        <div className="jungle-hero-stage">
          <h1 id="jungle-title" className="jungle-accessible-title">전북대학교 개발 동아리 코알라</h1>
          <div className="jungle-mascot jungle-mascot--logo"><img src="/coala-logo.svg" alt="COALA 로고" fetchPriority="high" /></div>
        </div>
      </section>

      <section id="jungle-activities" className="jungle-activities jungle-section">
        <div className="jungle-section-heading"><div><p className="section-eyebrow">Activity</p><h2>코알라에서는 이렇게 활동해요</h2></div><p className="activity-introduction">파이썬 기초부터 인공지능 서비스 개발까지.<br />수준별 스터디와 팀 프로젝트를 진행하고, 배운 내용을 공유합니다.</p></div>
        <div className="jungle-activity-grid">
          <Link to="/community/activity" className="jungle-activity jungle-activity--study"><h3>수준별 스터디</h3><span>처음 코드를 배우는 사람도, 더 깊이 공부하고 싶은 사람도 자신에게 맞는 과정에 참여합니다. 매주 함께 문제를 풀고 실습하며 배운 내용을 익힙니다.</span><b>스터디 활동 보기</b></Link>
          <Link to="/services/user" className="jungle-activity jungle-activity--project"><h3>팀 프로젝트와 공모전</h3><span>만들고 싶은 아이디어가 있다면 팀을 꾸려 직접 구현해 봅니다. 함께 만든 결과물을 발표하고, 해커톤과 경진대회에 출품하며 경험을 쌓습니다.</span><b>프로젝트 보기</b></Link>
          <Link to="/community/info" className="jungle-activity jungle-activity--connect"><h3>기술과 경험 공유</h3><span>개발하다 막힌 문제를 어떻게 풀었는지, 공부에 어떤 자료가 도움이 됐는지 서로 나눕니다. 취업이나 대학원을 준비하며 얻은 정보도 함께 공유합니다.</span><b>공유 자료 보기</b></Link>
        </div>
      </section>

      <ProjectShowcase />
      <CultureSection />
      <AchievementTimeline />
      <AlumniShowcase />
      <section className="apply-banner" aria-labelledby="apply-banner-title"><div className="apply-banner-content"><h2 id="apply-banner-title">배운 것을 넘어 직접 해내는 경험, 코알라에서 시작해요.</h2><Link to="/recruiting" className="jungle-button">8기 모집 알림 신청</Link></div></section>
    </main>
    <PublicFooter />
  </div>
}

