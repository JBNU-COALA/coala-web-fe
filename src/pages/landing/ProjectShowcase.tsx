import { useRef, useState, useEffect } from 'react'
import musicTown from '../../assets/music-town-square.png'
import withFesti from '../../assets/withfesti-app-screen.png'
import withFestiLogo from '../../assets/withfesti-app-logo.png'
import jbnuSymbol from '../../assets/jbnu-symbol.jpg'
import gayadi from '../../assets/gayadi-recommendation-screen.png'
import gayadiLogo from '../../assets/gayadi.png'
import gayadiWordmark from '../../assets/gayadi-wordmark-transparent.png'
import replantWordmark from '../../assets/replant-wordmark-transparent.png'
import replant from '../../assets/replant-growth-screen.png'
import replantLogo from '../../assets/replant.png'
import trendCore from '../../assets/trend_core.jpeg'
import trendCoreProducts from '../../assets/trend-core-products.png'
import chickadee from '../../assets/chickadee-app-screen.png'
import chickadeeAnalysis from '../../assets/chickadee-analysis-screen.png'
import './showcase.css'

const projectUrls: Record<string, string> = {
  'Music Town': 'https://music-town-official.gayadi.site',
  'withfestival': 'https://github.com/nowimhungry',
  '가야디': 'https://play.google.com/store/apps/details?id=com.doonow.gayadi&hl=ko',
  'RePlant': 'https://play.google.com/store/apps/details?id=com.anonymous.replantmobileapp&hl=ko',
  'Trend Core': 'https://github.com/NOHHYEONGJUN/shopping-web',
  'Chickadee': 'https://github.com/chickadee-project/chickadee_studio',
}

const projects = [
  { name: 'Music Town', description: '공원 버스킹을 즐기고 소통하는 메타버스 웹앱', image: musicTown, tone: 'mint', poster: false },
  { name: 'withfestival', description: '전북대학교 축제 동행 매칭 서비스', image: withFesti, tone: 'lavender', poster: true },
  { name: '가야디', description: '여행 계획부터 소중한 순간의 기록까지 함께하는 여행 서비스', image: gayadi, tone: 'sand', poster: false },
  { name: 'RePlant', description: '쉬었음 청년을 위한 성장 앱. 나만의 미션으로 성장하는 캐릭터와 함께하는 심리상담 플랫폼', image: replant, tone: 'cream', poster: true },
  { name: 'Trend Core', description: '쿠버네티스 기반의 고가용성 패션 쇼핑몰 웹 서비스', image: trendCore, tone: 'gray', poster: true },
  { name: 'Chickadee', description: '공공 웹사이트의 게시글, 댓글과 이미지에서 광고 의심 문구를 찾아 검토하는 오픈소스', image: chickadee, tone: 'blue', poster: true },
]

function WithFestiArtwork() {
  return <div className="showcase-image withfesti-promo">
    <div className="withfesti-promo-copy">
      <img className="withfesti-promo-logo" src={withFestiLogo} alt="" loading="lazy" />
      <img className="withfestival-wordmark" src="/withfestival-wordmark.svg" alt="withfestival" loading="lazy" />
      <strong>축제 같이 갈 사람,<br /><span>바로 찾아드려요.</span></strong>
      <p><span className="withfestival-university"><img src={jbnuSymbol} alt="" loading="lazy" />전북대학교</span><span>축제 동행 매칭 서비스</span></p>
    </div>
    <div className="withfesti-promo-phone">
      <span className="withfesti-phone-buttons" aria-hidden="true" />
      <div className="withfesti-phone-screen">
        <div className="withfesti-phone-status" aria-hidden="true">
          <span>9:41</span><span className="withfesti-phone-island" />
          <svg viewBox="0 0 42 12"><path d="M1 10V8m4 2V6m4 4V3m4 7V1" stroke="currentColor" strokeWidth="2" /><path d="M18 4q5-5 10 0m-8 3q3-3 6 0" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="23" cy="9" r="1" fill="currentColor" /><rect x="31" y="2" width="9" height="8" rx="2" fill="none" stroke="currentColor" /><path d="M33 4h5v4h-5zM41 5v2" fill="currentColor" stroke="currentColor" /></svg>
        </div>
        <div className="withfesti-phone-app">
          <img src={withFesti} alt="withfestival 앱의 축제 동행 매칭 홈 화면" loading="lazy" />
        </div>
        <span className="withfesti-phone-home" aria-hidden="true" />
      </div>
    </div>
  </div>
}

function TrendCoreArtwork() {
  return <div className="showcase-image trendcore-promo">
    <img src={trendCore} alt="Trend Core 프로젝트 소개" loading="lazy" />
    <img src={trendCoreProducts} alt="Trend Core 쇼핑몰의 의류와 액세서리 상품 목록 화면" loading="lazy" />
  </div>
}

function ChickadeeArtwork() {
  return <div className="showcase-image chickadee-promo">
    <img src={chickadee} alt="Chickadee 검사 구성 화면" loading="lazy" />
    <img src={chickadeeAnalysis} alt="Chickadee 검사 분석과 탐색 그래프 화면" loading="lazy" />
  </div>
}

function AppScreenArtwork({ name, image, tone }: { name: string; image: string; tone: string }) {
  const isGayadi = name === '가야디'
  return <div className={`showcase-image app-screen-promo app-screen-promo--${tone}`}>
    <div className="app-promo-copy">
      <img className="app-promo-logo" src={isGayadi ? gayadiLogo : replantLogo} alt="" loading="lazy" />
      <span className="app-promo-wordmark"><img src={isGayadi ? gayadiWordmark : replantWordmark} alt={isGayadi ? 'GAYADI' : 'RePlant'} loading="lazy" /></span>
      <strong>{isGayadi ? <>어디로 갈까?<br />가야디와 떠나요.</> : <>내 속도대로,<br />다시 시작해요.</>}</strong>
      <p>{isGayadi ? <>여행지 추천부터 일정까지,<br />설레는 여행의 시작을 함께.</> : <>작은 할 일을 기록하며<br />생활의 리듬을 찾아가요.</>}</p>
    </div>
    <div className="app-screen-device">
      <span className="withfesti-phone-buttons" aria-hidden="true" />
      <div className="app-screen-display">
        <img src={image} alt={isGayadi ? '가야디의 여행지 추천과 나의 여행 화면' : 'RePlant의 캐릭터 성장과 투두리스트 화면'} loading="lazy" />
        <span className="app-screen-home" aria-hidden="true" />
      </div>
    </div>
  </div>
}

export function ProjectShowcase() {
  const track = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  useEffect(() => {
    const element = track.current
    if (!element) return
    const update = () => setEdges({ start: element.scrollLeft < 2, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 })
    update()
    element.addEventListener('scroll', update, { passive: true })
    if (typeof ResizeObserver === 'undefined') return () => element.removeEventListener('scroll', update)
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => { element.removeEventListener('scroll', update); observer.disconnect() }
  }, [])
  const move = (direction: number) => {
    const element = track.current
    if (!element) return
    const card = element.querySelector('figure')
    const gap = Number.parseFloat(window.getComputedStyle(element).columnGap) || 0
    const distance = card ? card.getBoundingClientRect().width + gap : element.clientWidth
    element.scrollBy({ left: direction * distance, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  return <section className="project-showcase" aria-labelledby="project-showcase-title">
    <div className="showcase-inner"><div className="showcase-heading"><div className="showcase-title"><p className="showcase-eyebrow">Product</p><h2 id="project-showcase-title">함께 만들어낸 결과물</h2></div><div className="showcase-controls"><button type="button" disabled={edges.start} aria-label="이전 프로젝트" onClick={() => move(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg></button><button type="button" disabled={edges.end} aria-label="다음 프로젝트" onClick={() => move(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg></button></div></div>
      <div className="showcase-track" ref={track} tabIndex={0} role="region" aria-label="프로젝트 모음">{projects.map((project) => <figure key={project.name} className={`showcase-card showcase-card--${project.tone}`}><a className="showcase-project-link" href={projectUrls[project.name]} target="_blank" rel="noopener noreferrer" aria-label={`${project.name} (새 탭에서 열기)`}><>{project.name === 'withfestival' ? <WithFestiArtwork /> : project.name === 'Trend Core' ? <TrendCoreArtwork /> : project.name === 'Chickadee' ? <ChickadeeArtwork /> : project.name === '가야디' || project.name === 'RePlant' ? <AppScreenArtwork name={project.name} image={project.image} tone={project.tone} /> : <div className={`showcase-image${project.poster ? ' showcase-image--poster' : ''}`}><img src={project.image} alt="" loading="lazy" /></div>}</></a><figcaption><h3><a href={projectUrls[project.name]} target="_blank" rel="noopener noreferrer" aria-label={`${project.name} (새 탭에서 열기)`}>{project.name}</a></h3><p>{project.description}</p></figcaption></figure>)}</div>
    </div>
  </section>
}
