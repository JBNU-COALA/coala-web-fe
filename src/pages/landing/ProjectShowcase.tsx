import { useRef, useState, useEffect } from 'react'
import musicTown from '../../assets/music_town.png'
import withFesti from '../../assets/withfesti.png'
import gayadi from '../../assets/gayadi.png'
import replant from '../../assets/replant.png'
import trendCore from '../../assets/trend_core.jpeg'
import chickadee from '../../assets/chickadee_studio.png'
import './showcase.css'

const projectUrls: Record<string, string> = {
  'Music Town': 'https://music-town-official.gayadi.site',
  'with Festi': 'https://github.com/nowimhungry',
  '가야디': 'https://play.google.com/store/apps/details?id=com.doonow.gayadi&hl=ko',
  'RePlant': 'https://play.google.com/store/apps/details?id=com.anonymous.replantmobileapp&hl=ko',
  'Trend Core': 'https://github.com/NOHHYEONGJUN/shopping-web',
  'Chickadee': 'https://github.com/chickadee-project/chickadee_studio',
}

const projects = [
  { name: 'Music Town', description: '공원 버스킹을 즐기고 소통하는 메타버스 웹앱', image: musicTown, tone: 'mint', poster: false },
  { name: 'with Festi', description: '전북대학교 축제 동행 매칭 서비스', image: withFesti, tone: 'lavender', poster: true },
  { name: '가야디', description: '여행 계획부터 소중한 순간의 기록까지 함께하는 여행 서비스', image: gayadi, tone: 'sand', poster: false },
  { name: 'RePlant', description: '쉬었음 청년을 위한 성장 앱. 나만의 미션으로 성장하는 캐릭터와 함께하는 심리상담 플랫폼', image: replant, tone: 'cream', poster: true },
  { name: 'Trend Core', description: '쿠버네티스 기반의 고가용성 패션 쇼핑몰 웹 서비스', image: trendCore, tone: 'gray', poster: true },
  { name: 'Chickadee', description: '공공 웹사이트의 게시글, 댓글과 이미지에서 광고 의심 문구를 찾아 검토하는 오픈소스', image: chickadee, tone: 'blue', poster: false },
]

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
      <div className="showcase-track" ref={track} tabIndex={0} role="region" aria-label="프로젝트 모음">{projects.map((project) => <figure key={project.name} className={`showcase-card showcase-card--${project.tone}`}><a className="showcase-project-link" href={projectUrls[project.name]} target="_blank" rel="noopener noreferrer" aria-label={`${project.name} (새 탭에서 열기)`}><div className={`showcase-image${project.poster ? ' showcase-image--poster' : ''}`}><img src={project.image} alt="" loading="lazy" /></div></a><figcaption><h3><a href={projectUrls[project.name]} target="_blank" rel="noopener noreferrer" aria-label={`${project.name} (새 탭에서 열기)`}>{project.name}</a></h3><p>{project.description}</p></figcaption></figure>)}</div>
    </div>
  </section>
}
